<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        User::create([
            'name' => 'EasyGo Admin',
            'email' => 'admin@easygo.com',
            'password' => 'password123',
            'role' => User::ROLE_ADMIN,
            'phone' => '+8801700000000',
            'city' => 'Dhaka',
            'country' => 'Bangladesh',
            'email_verified_at' => now(),
        ]);

        User::create([
            'name' => 'Demo Traveller',
            'email' => 'demo@easygo.com',
            'password' => 'password123',
            'role' => User::ROLE_CUSTOMER,
            'phone' => '+8801811111111',
            'city' => 'Dhaka',
            'country' => 'Bangladesh',
            'email_verified_at' => now(),
        ]);

        User::factory(14)->create();
    }
}
