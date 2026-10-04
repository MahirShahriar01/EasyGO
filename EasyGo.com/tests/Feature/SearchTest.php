<?php

namespace Tests\Feature;

use App\Models\Booking;
use Tests\TestCase;

class SearchTest extends TestCase
{
    public function test_hotel_search_filters_by_destination_stars_and_price(): void
    {
        $room = $this->hotelWithRoom();

        $this->getJson('/api/hotels?q=Cox')->assertOk()->assertJsonPath('total', 1)
            ->assertJsonPath('data.0.min_price', 10000);
        $this->getJson('/api/hotels?q=Paris')->assertOk()->assertJsonPath('total', 0);
        $this->getJson('/api/hotels?stars[]=5')->assertOk()->assertJsonPath('total', 0);
        $this->getJson('/api/hotels?max_price=5000')->assertOk()->assertJsonPath('total', 0);
        $this->getJson('/api/hotels?amenities[]=pool')->assertOk()->assertJsonPath('total', 1);

        $this->getJson('/api/hotels/'.$room->hotel->slug)->assertOk()
            ->assertJsonPath('hotel.room_types.0.available_rooms', 2);
    }

    public function test_hotel_is_flagged_unavailable_when_sold_out_for_dates(): void
    {
        $room = $this->hotelWithRoom(['total_rooms' => 1]);
        $in = now()->addDays(10)->toDateString();
        $out = now()->addDays(12)->toDateString();

        Booking::create([
            'user_id' => $this->customer()->id, 'bookable_type' => 'room_type', 'bookable_id' => $room->id, 'service_type' => 'hotel',
            'item_name' => 'x', 'start_date' => $in, 'end_date' => $out, 'unit_price' => 1, 'subtotal' => 1, 'total' => 1,
            'status' => 'confirmed', 'contact_name' => 'x', 'contact_email' => 'x@x.com',
        ]);

        $this->getJson("/api/hotels?check_in={$in}&check_out={$out}")->assertOk()->assertJsonPath('data.0.available', false);
    }

    public function test_flight_search_matches_route_date_and_seat_availability(): void
    {
        $flight = $this->flight();
        $date = $flight->departure_at->toDateString();

        $this->getJson("/api/flights?from=Dhaka&to=Dubai&date={$date}")->assertOk()->assertJsonPath('total', 1)
            ->assertJsonPath('data.0.seats_available', 3)->assertJsonPath('data.0.duration_minutes', 330);
        $this->getJson("/api/flights?from=Dhaka&to=Dubai&date={$date}&passengers=4")->assertOk()->assertJsonPath('total', 0);
        $this->getJson('/api/flights?from=Dhaka&to=Bangkok')->assertOk()->assertJsonPath('total', 0);
        $this->getJson('/api/flights?sort=duration')->assertOk();
    }

    public function test_bus_detail_exposes_seat_map(): void
    {
        $bus = $this->bus();

        $this->getJson("/api/buses/{$bus->id}")->assertOk()
            ->assertJsonPath('seats', ['A1', 'A2', 'A3', 'A4', 'B1', 'B2', 'B3', 'B4'])
            ->assertJsonPath('booked_seats', []);
    }

    public function test_home_and_settings_endpoints(): void
    {
        $this->hotelWithRoom();

        $this->getJson('/api/home')->assertOk()->assertJsonStructure(['destinations', 'featured_hotels', 'stats']);
        // second call is served from cache and must keep the same shape
        $this->getJson('/api/home')->assertOk()->assertJsonIsArray('featured_hotels');
        $this->getJson('/api/settings')->assertOk()->assertJsonStructure(['site_name', 'currency_symbol', 'timezone']);
    }
}
