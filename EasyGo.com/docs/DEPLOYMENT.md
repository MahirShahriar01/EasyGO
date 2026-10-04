# Deployment Guide

## 1. Local development

```bash
cd EasyGo.com
composer setup     # deps, .env, key, SQLite DB, migrate + seed, storage:link, npm build
composer serve     # http://127.0.0.1:8000 (64 MB upload limit for ad videos)
# or, with hot reload + scheduler:
composer dev
```

`composer serve` runs PHP's built-in server through `server.php` with `upload_max_filesize=64M` and
`post_max_size=64M`. (`php artisan serve` works too, but is limited to PHP's default 2 MB uploads.)

Reset demo data at any time: `php artisan migrate:fresh --seed`.

## 2. Docker (single host)

Files: `Dockerfile` (stages: `assets` → `vendor` → `app` PHP-FPM → `web` Nginx), `docker-compose.yml`,
`docker/nginx/default.conf`, `docker/php/easygo.ini`, `docker/entrypoint.sh`.

```bash
cd EasyGo.com
cp .env.example .env
php artisan key:generate --show     # or: docker run --rm php:8.3-cli php -r "echo 'base64:'.base64_encode(random_bytes(32));"
# put the key into .env as APP_KEY=base64:...
docker compose up -d --build
open http://localhost:8080
```

Services: `web` (Nginx :8080), `app` (PHP-FPM), `scheduler` (`schedule:work`), `queue` (`queue:work`),
`db` (MySQL 8.4). Uploaded media lives in the `uploads` volume; the database in `mysql`.

On first start the entrypoint waits for MySQL, runs migrations and — with `SEED_DEMO_DATA=true`
(default) — seeds demo data when the users table is empty. Set `SEED_DEMO_DATA=false` for real deployments.

Useful commands:
```bash
docker compose logs -f app
docker compose exec app php artisan tinker
docker compose exec app php artisan migrate --force
```

## 3. Traditional server (Ubuntu + Nginx + PHP-FPM + MySQL)

1. Install PHP 8.3 with `fpm, mysql, mbstring, intl, xml, zip, bcmath, curl`, Composer, Node 20+, MySQL 8.
2. Create the database and user:
   ```sql
   CREATE DATABASE easygo CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   CREATE USER 'easygo'@'localhost' IDENTIFIED BY 'strong-password';
   GRANT ALL ON easygo.* TO 'easygo'@'localhost';
   ```
3. Deploy the code to `/var/www/easygo` and configure `.env`:
   ```dotenv
   APP_ENV=production
   APP_DEBUG=false
   APP_URL=https://easygo.example.com
   APP_TIMEZONE=Asia/Dhaka
   DB_CONNECTION=mysql
   DB_DATABASE=easygo
   DB_USERNAME=easygo
   DB_PASSWORD=strong-password
   QUEUE_CONNECTION=database        # or redis
   CACHE_STORE=database             # or redis
   MAIL_MAILER=smtp                 # + MAIL_HOST/PORT/USERNAME/PASSWORD/FROM_ADDRESS
   ```
4. Build & optimise:
   ```bash
   composer install --no-dev --optimize-autoloader
   npm ci && npm run build
   php artisan key:generate
   php artisan migrate --force
   php artisan storage:link
   php artisan config:cache && php artisan route:cache && php artisan view:cache
   chown -R www-data:www-data storage bootstrap/cache
   ```
5. Nginx: use `docker/nginx/default.conf` as a template — set `root /var/www/easygo/public;` and
   `fastcgi_pass unix:/run/php/php8.3-fpm.sock;`. Keep `client_max_body_size 64M;`.
6. PHP: copy `docker/php/easygo.ini` into `/etc/php/8.3/fpm/conf.d/` (raises upload limits to 64 MB) and restart PHP-FPM.
7. Scheduler (cron):
   ```cron
   * * * * * cd /var/www/easygo && php artisan schedule:run >> /dev/null 2>&1
   ```
8. Queue worker (systemd or Supervisor):
   ```ini
   [program:easygo-queue]
   command=php /var/www/easygo/artisan queue:work --tries=3 --sleep=3
   user=www-data
   autorestart=true
   ```
9. HTTPS with Let's Encrypt (`certbot --nginx`).

## 4. Production checklist
- [ ] `APP_DEBUG=false`, strong `APP_KEY`, HTTPS enforced
- [ ] Demo accounts removed or passwords changed (`admin@easygo.com`, `demo@easygo.com`)
- [ ] Real SMTP configured and tested (password reset, booking confirmation)
- [ ] Real payment gateway bound (see below) and demo hints removed from the payment page
- [ ] Cron + queue worker running
- [ ] Backups for the database and `storage/app/public`
- [ ] Upload limits aligned: Nginx `client_max_body_size`, PHP `upload_max_filesize`/`post_max_size` ≥ 50 MB
- [ ] Settings reviewed: currency, tax, service fee, contact details, hold minutes

## 5. Plugging in a real payment gateway

```php
// app/Services/Payments/SslCommerzGateway.php
class SslCommerzGateway implements PaymentGateway
{
    public function name(): string { return 'sslcommerz'; }
    public function charge(float $amount, string $currency, string $method, array $payload): GatewayResult { /* call API */ }
    public function refund(string $transactionId, float $amount, string $currency): GatewayResult { /* call API */ }
}

// app/Providers/AppServiceProvider.php
$this->app->bind(PaymentGateway::class, SslCommerzGateway::class);
```
Redirect-based gateways (hosted payment pages) can return a redirect URL in `GatewayResult::$meta` and
confirm the booking from a webhook/IPN controller that calls the same confirmation logic.

## 6. Upgrading
```bash
git pull
composer install --no-dev --optimize-autoloader
npm ci && npm run build
php artisan migrate --force
php artisan optimize
php artisan queue:restart
```
