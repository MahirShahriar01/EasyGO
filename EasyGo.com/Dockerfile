# syntax=docker/dockerfile:1
# =============================================================================
# EasyGo — production image (multi-stage)
#   assets : builds the React SPA with Vite
#   vendor : installs PHP dependencies (no dev packages)
#   app    : PHP-FPM runtime            -> docker compose service "app"
#   web    : Nginx serving public/ + proxying PHP to app:9000 -> service "web"
# =============================================================================

FROM node:22-alpine AS assets
WORKDIR /app
COPY package.json package-lock.json vite.config.js ./
RUN npm ci --no-audit --no-fund
COPY resources ./resources
COPY public ./public
RUN npm run build

FROM composer:2 AS vendor
WORKDIR /app
COPY composer.json composer.lock ./
RUN composer install --no-dev --no-scripts --no-interaction --prefer-dist --optimize-autoloader --ignore-platform-req=ext-*

FROM php:8.3-fpm-alpine AS app
RUN apk add --no-cache icu-dev libzip-dev oniguruma-dev bash \
    && docker-php-ext-install -j"$(nproc)" pdo_mysql intl zip bcmath opcache \
    && apk del icu-dev libzip-dev oniguruma-dev && apk add --no-cache icu-libs libzip
COPY docker/php/easygo.ini /usr/local/etc/php/conf.d/zz-easygo.ini
WORKDIR /var/www/html
COPY --chown=www-data:www-data . .
COPY --from=vendor --chown=www-data:www-data /app/vendor ./vendor
COPY --from=assets --chown=www-data:www-data /app/public/build ./public/build
RUN rm -rf public/hot node_modules tests \
    && php artisan package:discover --ansi \
    && mkdir -p storage/app/public storage/framework/{cache,sessions,views} storage/logs \
    && chown -R www-data:www-data storage bootstrap/cache
COPY docker/entrypoint.sh /usr/local/bin/easygo-entrypoint
RUN chmod +x /usr/local/bin/easygo-entrypoint
ENTRYPOINT ["easygo-entrypoint"]
CMD ["php-fpm"]

FROM nginx:1.27-alpine AS web
COPY docker/nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=app /var/www/html/public /var/www/html/public
# Uploaded media lives on a shared volume mounted at storage/app/public.
RUN ln -s /var/www/html/storage/app/public /var/www/html/public/storage
