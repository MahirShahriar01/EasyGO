<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Cache;

/**
 * Seeds a complete demo marketplace:
 *   php artisan migrate:fresh --seed
 *
 * Demo logins (change in production!):
 *   admin@easygo.com / password123   (administrator)
 *   demo@easygo.com  / password123   (customer)
 */
class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            SettingSeeder::class,
            UserSeeder::class,
            CatalogSeeder::class,
            TransportSeeder::class,
            CouponSeeder::class,
            AdSeeder::class,
            ActivitySeeder::class,
        ]);

        Cache::flush();
    }
}
