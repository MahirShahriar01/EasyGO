<?php

namespace Database\Seeders;

use App\Models\Coupon;
use Illuminate\Database\Seeder;

class CouponSeeder extends Seeder
{
    public function run(): void
    {
        $coupons = [
            ['WELCOME10', '10% off your first booking', 'percent', 10, 0, 1500, 'all', null, 1],
            ['SUMMER25', '25% off beach & resort hotels', 'percent', 25, 5000, 5000, 'hotel', 500, null],
            ['FLY500', 'Flat ৳500 off flights above ৳5,000', 'fixed', 500, 5000, null, 'flight', null, 3],
            ['BUS50', 'Flat ৳50 off bus tickets', 'fixed', 50, 500, null, 'bus', null, null],
            ['TOUR15', '15% off tour packages', 'percent', 15, 10000, 10000, 'tour', 200, 2],
            ['DRIVE20', '20% off car rentals', 'percent', 20, 3000, 3000, 'car', null, null],
        ];

        foreach ($coupons as [$code, $desc, $type, $value, $min, $max, $applies, $limit, $perUser]) {
            Coupon::create([
                'code' => $code,
                'description' => $desc,
                'type' => $type,
                'value' => $value,
                'min_amount' => $min,
                'max_discount' => $max,
                'applies_to' => $applies,
                'usage_limit' => $limit,
                'per_user_limit' => $perUser,
                'starts_at' => now()->subDay(),
                'expires_at' => now()->addMonths(3),
                'is_active' => true,
            ]);
        }
    }
}
