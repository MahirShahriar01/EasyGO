<?php

/*
| Development router for PHP's built-in server with raised upload limits
| (needed for 50 MB ad videos). Used by `composer serve`:
|
|   php -d upload_max_filesize=64M -d post_max_size=64M -S 127.0.0.1:8000 -t public server.php
*/
chdir(__DIR__.'/public');

return require __DIR__.'/vendor/laravel/framework/src/Illuminate/Foundation/resources/server.php';
