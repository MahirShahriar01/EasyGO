<?php

namespace Tests;

use App\Models\Ad;
use App\Models\AdZone;
use App\Models\Bus;
use App\Models\Destination;
use App\Models\Flight;
use App\Models\Hotel;
use App\Models\RoomType;
use App\Models\Setting;
use App\Models\User;

/**
 * Small, explicit fixtures for feature tests (faster and clearer than the full demo seeder).
 */
trait CreatesTravelData
{
    protected function customer(array $attrs = []): User
    {
        return User::factory()->create($attrs);
    }

    protected function admin(): User
    {
        return User::factory()->admin()->create();
    }

    protected function destination(string $name = 'Cox\'s Bazar'): Destination
    {
        return Destination::create(['name' => $name, 'country' => 'Bangladesh']);
    }

    protected function hotelWithRoom(array $room = []): RoomType
    {
        Setting::put(['tax_rate' => '5', 'service_fee_percent' => '2']);
        $hotel = Hotel::create([
            'destination_id' => $this->destination()->id,
            'name' => 'Test Beach Resort',
            'star_rating' => 4,
            'amenities' => ['wifi', 'pool'],
        ]);

        return $hotel->roomTypes()->create(array_merge([
            'name' => 'Deluxe',
            'price_per_night' => 10000,
            'total_rooms' => 2,
            'max_adults' => 2,
            'refundable' => true,
        ], $room));
    }

    protected function bus(): Bus
    {
        return Bus::create([
            'operator' => 'Green Line', 'from_city' => 'Dhaka', 'to_city' => 'Sylhet',
            'departure_at' => now()->addDays(3)->setTime(9, 0), 'arrival_at' => now()->addDays(3)->setTime(15, 0),
            'price' => 800, 'total_seats' => 8, 'seat_layout' => '2-2',
        ]);
    }

    protected function flight(array $attrs = []): Flight
    {
        return Flight::create(array_merge([
            'airline' => 'US-Bangla Airlines', 'airline_code' => 'BS', 'flight_number' => 'BS-141',
            'from_city' => 'Dhaka', 'from_code' => 'DAC', 'to_city' => 'Dubai', 'to_code' => 'DXB',
            'departure_at' => now()->addDays(5)->setTime(10, 0), 'arrival_at' => now()->addDays(5)->setTime(15, 30),
            'price' => 40000, 'total_seats' => 3, 'refundable' => true,
        ], $attrs));
    }

    protected function zone(string $key = 'home_top_banner', string $placement = 'banner'): AdZone
    {
        return AdZone::create(['key' => $key, 'name' => $key, 'page' => 'home', 'placement' => $placement]);
    }

    protected function ad(AdZone $zone, array $attrs = []): Ad
    {
        $ad = Ad::create(array_merge([
            'title' => 'Test ad', 'media_type' => 'image', 'media_url' => '/demo/ads/summer-sale-leaderboard.svg',
            'click_url' => 'https://example.com/offer', 'status' => 'active', 'skip_after_seconds' => 5,
        ], $attrs));
        $ad->zones()->attach($zone);

        return $ad;
    }
}
