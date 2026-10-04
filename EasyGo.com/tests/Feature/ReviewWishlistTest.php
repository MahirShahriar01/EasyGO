<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\Setting;
use Tests\TestCase;

class ReviewWishlistTest extends TestCase
{
    public function test_only_guests_with_a_confirmed_booking_can_review(): void
    {
        $room = $this->hotelWithRoom();
        $hotel = $room->hotel;
        $user = $this->customer();
        $this->actingAs($user, 'sanctum');
        $payload = ['type' => 'hotel', 'id' => $hotel->id, 'rating' => 5, 'comment' => 'Wonderful stay, would return!'];

        $this->postJson('/api/reviews', $payload)->assertUnprocessable();

        Booking::create([
            'user_id' => $user->id, 'bookable_type' => 'room_type', 'bookable_id' => $room->id, 'service_type' => 'hotel',
            'item_name' => 'x', 'start_date' => now()->subDays(3), 'end_date' => now()->subDay(), 'unit_price' => 1, 'subtotal' => 1,
            'total' => 1, 'status' => 'completed', 'contact_name' => 'x', 'contact_email' => 'x@x.com',
        ]);

        $id = $this->postJson('/api/reviews', $payload)->assertCreated()->assertJsonPath('review.status', 'pending')->json('review.id');
        $this->postJson('/api/reviews', $payload)->assertUnprocessable(); // one review per item

        // Pending reviews do not count until approved by an admin.
        $this->assertSame(0, $hotel->fresh()->reviews_count);
        $this->actingAs($this->admin(), 'sanctum')->patchJson("/api/admin/reviews/{$id}", ['status' => 'approved'])->assertOk();
        $this->assertSame(1, $hotel->fresh()->reviews_count);
        $this->assertEquals(5.0, $hotel->fresh()->avg_rating);
        $this->getJson("/api/reviews/hotel/{$hotel->id}")->assertJsonPath('total', 1);
    }

    public function test_auto_approve_setting_publishes_immediately(): void
    {
        Setting::put(['auto_approve_reviews' => '1']);
        $room = $this->hotelWithRoom();
        $user = $this->customer();
        Booking::create([
            'user_id' => $user->id, 'bookable_type' => 'room_type', 'bookable_id' => $room->id, 'service_type' => 'hotel', 'item_name' => 'x',
            'start_date' => now()->addDay(), 'unit_price' => 1, 'subtotal' => 1, 'total' => 1, 'status' => 'confirmed', 'contact_name' => 'x', 'contact_email' => 'x@x.com',
        ]);

        $this->actingAs($user, 'sanctum')->postJson('/api/reviews', ['type' => 'hotel', 'id' => $room->hotel_id, 'rating' => 4, 'comment' => 'Really nice place to stay'])
            ->assertCreated()->assertJsonPath('review.status', 'approved');
    }

    public function test_wishlist_toggle(): void
    {
        $hotel = $this->hotelWithRoom()->hotel;
        $this->actingAs($this->customer(), 'sanctum');

        $this->postJson('/api/wishlist/toggle', ['type' => 'hotel', 'id' => $hotel->id])->assertJsonPath('saved', true);
        $this->getJson('/api/wishlist/keys')->assertJson(["hotel:{$hotel->id}"]);
        $this->getJson('/api/wishlist')->assertJsonPath('0.item.name', $hotel->name);
        $this->postJson('/api/wishlist/toggle', ['type' => 'hotel', 'id' => $hotel->id])->assertJsonPath('saved', false);
    }

    public function test_contact_and_newsletter(): void
    {
        $this->postJson('/api/contact', ['name' => 'A', 'email' => 'a@a.com', 'subject' => 'Hi', 'message' => 'I need help with my booking'])->assertCreated();
        $this->postJson('/api/newsletter', ['email' => 'News@Example.com'])->assertOk();
        $this->postJson('/api/newsletter', ['email' => 'news@example.com'])->assertOk();
        $this->assertDatabaseCount('newsletter_subscribers', 1);
    }
}
