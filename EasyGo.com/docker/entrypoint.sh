#!/usr/bin/env bash
# EasyGo container bootstrap: waits for the database, runs migrations,
# optionally seeds demo data, then starts the given command (php-fpm, schedule:work...).
set -euo pipefail
cd /var/www/html

if [ -z "${APP_KEY:-}" ]; then
  echo "APP_KEY is not set. Generate one with: docker compose run --rm app php artisan key:generate --show" >&2
  exit 1
fi

if [ "${DB_CONNECTION:-sqlite}" != "sqlite" ]; then
  echo "Waiting for database ${DB_HOST}:${DB_PORT:-3306}..."
  for i in $(seq 1 60); do
    php -r 'try { new PDO("mysql:host=".getenv("DB_HOST").";port=".(getenv("DB_PORT") ?: 3306), getenv("DB_USERNAME"), getenv("DB_PASSWORD")); exit(0);} catch (Exception $e) { exit(1);}' && break
    sleep 2
  done
fi

if [ "${RUN_MIGRATIONS:-true}" = "true" ]; then
  php artisan migrate --force
  if [ "${SEED_DEMO_DATA:-false}" = "true" ] && [ "$(php artisan tinker --execute='echo App\Models\User::count();' 2>/dev/null | tail -n1)" = "0" ]; then
    php artisan db:seed --force
  fi
fi

php artisan storage:link --force >/dev/null 2>&1 || true
php artisan config:cache
php artisan route:cache
php artisan view:cache
chown -R www-data:www-data storage bootstrap/cache

exec "$@"
