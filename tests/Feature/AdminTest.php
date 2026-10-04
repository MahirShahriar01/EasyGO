<?php

namespace Tests\Feature;

use App\Models\Ad;
use App\Models\Booking;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class AdminTest extends TestCase
{
    public function test_customers_cannot_access_admin_api(): void
    {
        $this->getJson('/api/admin/dashboard')->assertUnauthorized();
        $this->actingAs($this->customer(), 'sanctum')->getJson('/api/admin/dashboard')->assertForbidden();
    }

    public function test_dashboard_returns_kpis(): void
    {
        $this->actingAs($this->admin(), 'sanctum')->getJson('/api/admin/dashboard')
            ->assertOk()->assertJsonStructure(['kpis' => ['revenue_total', 'bookings_total', 'ad_ctr_30d'], 'series', 'by_service', 'recent_bookings']);
    }

    public function test_admin_can_crud_a_hotel_and_its_rooms(): void
    {
        $this->actingAs($this->admin(), 'sanctum');
        $destination = $this->destination();

        $hotelId = $this->postJson('/api/admin/hotels', [
            'destination_id' => $destination->id, 'name' => 'Admin Hotel', 'property_type' => 'resort', 'star_rating' => 5,
            'check_in_time' => '14:00', 'check_out_time' => '11:00', 'status' => 'active', 'amenities' => ['wifi'],
        ])->assertCreated()->json('item.id');

        $this->postJson('/api/admin/room-types', [
            'hotel_id' => $hotelId, 'name' => 'Suite', 'price_per_night' => 9000, 'total_rooms' => 3,
            'max_adults' => 2, 'max_children' => 1, 'status' => 'active',
        ])->assertCreated();

        $this->getJson('/api/admin/hotels?q=Admin')->assertOk()->assertJsonPath('data.0.min_price', 9000)->assertJsonPath('data.0.room_types_count', 1);
        $this->putJson("/api/admin/hotels/{$hotelId}", ['destination_id' => $destination->id, 'name' => 'Renamed', 'property_type' => 'hotel',
            'star_rating' => 4, 'check_in_time' => '14:00', 'check_out_time' => '11:00', 'status' => 'inactive'])->assertOk();
        $this->getJson('/api/hotels/admin-hotel')->assertNotFound(); // inactive hotels are hidden publicly
        $this->deleteJson("/api/admin/hotels/{$hotelId}")->assertOk();
    }

    public function test_admin_uploads_video_ad_and_assigns_zones(): void
    {
        Storage::fake('public');
        $this->actingAs($this->admin(), 'sanctum');
        $zone = $this->zone();
        $popup = $this->zone('interstitial_global', 'interstitial');

        $id = $this->post('/api/admin/ads', [
            'title' => 'Video promo', 'media' => UploadedFile::fake()->create('promo.mp4', 2048, 'video/mp4'),
            'skip_after_seconds' => 10, 'closable' => '1', 'audience' => 'all', 'device' => 'all', 'weight' => 7,
            'status' => 'active', 'zone_ids' => [$zone->id, $popup->id], 'click_url' => '/tours',
        ], ['Accept' => 'application/json'])->assertCreated()->json('item.id');

        $ad = Ad::with('zones')->find($id);
        $this->assertSame('video', $ad->media_type);
        $this->assertCount(2, $ad->zones);
        Storage::disk('public')->assertExists($ad->media_path);

        // Non-closable without auto-close gets a safe 15s default.
        $this->post("/api/admin/ads/{$id}", ['_method' => 'PUT', 'title' => 'Video promo', 'closable' => '0', 'skip_after_seconds' => 0,
            'audience' => 'all', 'device' => 'mobile', 'weight' => 7, 'status' => 'active', 'zone_ids' => [$popup->id]], ['Accept' => 'application/json'])->assertOk();
        $this->assertSame(15, $ad->fresh()->auto_close_seconds);
        $this->assertCount(1, $ad->fresh()->zones);

        $this->postJson("/api/admin/ads/{$id}/toggle")->assertOk();
        $this->assertSame('paused', $ad->fresh()->status);
        $this->postJson("/api/admin/ads/{$id}/duplicate")->assertCreated()->assertJsonPath('item.status', 'draft');
        $this->getJson("/api/admin/ads/{$id}/stats")->assertOk()->assertJsonStructure(['stats' => ['impressions', 'clicks', 'ctr', 'daily', 'by_zone']]);

        $path = $ad->media_path;
        $this->deleteJson("/api/admin/ads/{$id}")->assertOk();
        Storage::disk('public')->assertMissing($path);
    }

    public function test_ad_requires_media_and_zone_and_rejects_bad_files(): void
    {
        Storage::fake('public');
        $this->actingAs($this->admin(), 'sanctum');

        $this->postJson('/api/admin/ads', ['title' => 'x', 'skip_after_seconds' => 5, 'audience' => 'all', 'device' => 'all', 'weight' => 5, 'status' => 'active'])
            ->assertUnprocessable()->assertJsonValidationErrors(['media', 'zone_ids']);

        $this->post('/api/admin/ads', ['title' => 'x', 'media' => UploadedFile::fake()->create('virus.exe', 10, 'application/octet-stream'),
            'skip_after_seconds' => 5, 'audience' => 'all', 'device' => 'all', 'weight' => 5, 'status' => 'active', 'zone_ids' => [$this->zone()->id]],
            ['Accept' => 'application/json'])->assertUnprocessable()->assertJsonValidationErrors('media');
    }

    public function test_admin_can_cancel_booking_with_full_refund_and_export_csv(): void
    {
        $room = $this->hotelWithRoom();
        $customer = $this->customer();
        $ref = $this->actingAs($customer, 'sanctum')->postJson('/api/bookings', [
            'service_type' => 'hotel', 'item_id' => $room->id, 'start_date' => now()->addDays(3)->toDateString(), 'end_date' => now()->addDays(4)->toDateString(),
            'contact_name' => 'A', 'contact_email' => 'a@a.com', 'contact_phone' => '1',
        ])->json('booking.reference');
        $this->postJson("/api/bookings/{$ref}/pay", ['method' => 'card', 'card_number' => '4242424242424242', 'card_name' => 'A', 'card_expiry' => '12/29', 'card_cvc' => '123']);

        $this->actingAs($this->admin(), 'sanctum')->postJson("/api/admin/bookings/{$ref}/cancel")->assertOk();
        $booking = Booking::firstWhere('reference', $ref);
        $this->assertSame('cancelled', $booking->status);
        $this->assertEquals($booking->total, $booking->refund_amount);

        $this->get('/api/admin/bookings/export')->assertOk()->assertHeader('content-type', 'text/csv; charset=utf-8');
    }

    public function test_settings_update_is_reflected_publicly(): void
    {
        $this->actingAs($this->admin(), 'sanctum')->putJson('/api/admin/settings', ['site_name' => 'GoBD', 'tax_rate' => 7.5])->assertOk();
        $this->getJson('/api/settings')->assertJsonPath('site_name', 'GoBD')->assertJsonPath('tax_rate', '7.5');
    }

    public function test_admin_cannot_demote_or_delete_themselves(): void
    {
        $admin = $this->admin();
        $this->actingAs($admin, 'sanctum')->putJson("/api/admin/users/{$admin->id}", [
            'name' => $admin->name, 'email' => $admin->email, 'role' => 'customer', 'status' => 'blocked',
        ])->assertOk();
        $this->assertTrue($admin->fresh()->isAdmin());
        $this->deleteJson("/api/admin/users/{$admin->id}")->assertStatus(422);
    }
}
