<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\Coupon;
use App\Notifications\BookingCancelled;
use App\Notifications\BookingConfirmed;
use App\Services\BookingService;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class BookingFlowTest extends TestCase
{
    private function hotelPayload(int $roomId, array $extra = []): array
    {
        return array_merge([
            'service_type' => 'hotel', 'item_id' => $roomId,
            'start_date' => now()->addDays(10)->toDateString(), 'end_date' => now()->addDays(13)->toDateString(),
            'quantity' => 1, 'adults' => 2,
            'contact_name' => 'Demo', 'contact_email' => 'demo@example.com', 'contact_phone' => '01700000000',
        ], $extra);
    }

    public function test_quote_calculates_price_breakdown_with_coupon(): void
    {
        $room = $this->hotelWithRoom();
        Coupon::create(['code' => 'SAVE10', 'type' => 'percent', 'value' => 10, 'max_discount' => 2000, 'applies_to' => 'all']);

        // 3 nights × 10,000 = 30,000; 10% capped at 2,000; fee 2% of subtotal = 600; tax 5% of 28,000 = 1,400
        $this->postJson('/api/bookings/quote', $this->hotelPayload($room->id, ['coupon_code' => 'save10']))
            ->assertOk()
            ->assertJson(['units' => 3, 'subtotal' => 30000, 'discount' => 2000, 'service_fee' => 600, 'tax' => 1400, 'total' => 30000, 'coupon_code' => 'SAVE10']);
    }

    public function test_invalid_coupon_is_reported_in_quote_and_rejected_on_booking(): void
    {
        $room = $this->hotelWithRoom();
        Coupon::create(['code' => 'FLY', 'type' => 'fixed', 'value' => 500, 'applies_to' => 'flight']);

        $this->postJson('/api/bookings/quote', $this->hotelPayload($room->id, ['coupon_code' => 'FLY']))
            ->assertOk()->assertJsonPath('discount', 0)->assertJsonPath('coupon_error', 'This coupon is only valid for flight bookings.');

        $this->actingAs($this->customer(), 'sanctum')
            ->postJson('/api/bookings', $this->hotelPayload($room->id, ['coupon_code' => 'FLY']))
            ->assertUnprocessable()->assertJsonValidationErrors('coupon_code');
    }

    public function test_full_hotel_flow_create_pay_and_cancel_with_refund(): void
    {
        Notification::fake();
        $user = $this->customer();
        $room = $this->hotelWithRoom();
        $this->actingAs($user, 'sanctum');

        $ref = $this->postJson('/api/bookings', $this->hotelPayload($room->id))
            ->assertCreated()->assertJsonPath('booking.status', 'pending')->json('booking.reference');

        // Declined card leaves the booking pending and records a failed payment.
        $this->postJson("/api/bookings/{$ref}/pay", ['method' => 'card', 'card_number' => '4242424242420002', 'card_name' => 'Demo', 'card_expiry' => '12/29', 'card_cvc' => '123'])
            ->assertUnprocessable()->assertJsonValidationErrors('payment');
        $this->assertDatabaseHas('payments', ['status' => 'failed']);

        $this->postJson("/api/bookings/{$ref}/pay", ['method' => 'card', 'card_number' => '4242 4242 4242 4242', 'card_name' => 'Demo', 'card_expiry' => '12/29', 'card_cvc' => '123'])
            ->assertOk()->assertJsonPath('booking.status', 'confirmed')->assertJsonPath('booking.payment_status', 'paid');
        Notification::assertSentTo($user, BookingConfirmed::class);

        $this->getJson("/api/bookings/{$ref}")->assertOk()->assertJsonPath('refund_estimate', fn ($v) => $v > 0)->assertJsonPath('can_review', true);

        $this->postJson("/api/bookings/{$ref}/cancel", ['reason' => 'Plans changed'])
            ->assertOk()->assertJsonPath('booking.status', 'cancelled')->assertJsonPath('booking.payment_status', 'refunded');
        Notification::assertSentTo($user, BookingCancelled::class);
    }

    public function test_rooms_cannot_be_overbooked(): void
    {
        $room = $this->hotelWithRoom(['total_rooms' => 1]);
        $this->actingAs($this->customer(), 'sanctum')->postJson('/api/bookings', $this->hotelPayload($room->id))->assertCreated();

        $this->actingAs($this->customer(), 'sanctum')->postJson('/api/bookings', $this->hotelPayload($room->id))
            ->assertUnprocessable()->assertJsonValidationErrors('quantity');

        // A stay that starts on the other guest's check-out day does not overlap.
        $this->actingAs($this->customer(), 'sanctum')->postJson('/api/bookings', $this->hotelPayload($room->id, [
            'start_date' => now()->addDays(13)->toDateString(), 'end_date' => now()->addDays(14)->toDateString(),
        ]))->assertCreated();
    }

    public function test_bus_seats_are_exclusive(): void
    {
        $bus = $this->bus();
        $payload = ['service_type' => 'bus', 'item_id' => $bus->id, 'contact_name' => 'A', 'contact_email' => 'a@a.com', 'contact_phone' => '1'];

        $this->actingAs($this->customer(), 'sanctum')->postJson('/api/bookings', $payload + ['seats' => ['A1', 'A2']])
            ->assertCreated()->assertJsonPath('booking.quantity', 2);
        $this->actingAs($this->customer(), 'sanctum')->postJson('/api/bookings', $payload + ['seats' => ['A2']])
            ->assertUnprocessable()->assertJsonValidationErrors('seats');
        $this->actingAs($this->customer(), 'sanctum')->postJson('/api/bookings', $payload + ['seats' => ['Z9']])
            ->assertUnprocessable();
        $this->getJson("/api/buses/{$bus->id}")->assertJsonPath('booked_seats', ['A1', 'A2']);
    }

    public function test_wallet_payment_and_pay_at_property(): void
    {
        $room = $this->hotelWithRoom();
        $this->actingAs($this->customer(), 'sanctum');

        $ref = $this->postJson('/api/bookings', $this->hotelPayload($room->id))->json('booking.reference');
        $this->postJson("/api/bookings/{$ref}/pay", ['method' => 'bkash', 'wallet_number' => '01711111111', 'otp' => '000000'])->assertUnprocessable();
        $this->postJson("/api/bookings/{$ref}/pay", ['method' => 'pay_at_property'])
            ->assertOk()->assertJsonPath('booking.status', 'confirmed')->assertJsonPath('booking.payment_status', 'unpaid');

        $flightRef = $this->postJson('/api/bookings', ['service_type' => 'flight', 'item_id' => $this->flight()->id, 'quantity' => 1,
            'passengers' => [['name' => 'Demo']], 'contact_name' => 'A', 'contact_email' => 'a@a.com', 'contact_phone' => '1'])->json('booking.reference');
        $this->postJson("/api/bookings/{$flightRef}/pay", ['method' => 'pay_at_property'])->assertUnprocessable();
        $this->postJson("/api/bookings/{$flightRef}/pay", ['method' => 'nagad', 'wallet_number' => '01711111111', 'otp' => '123456'])->assertOk();
    }

    public function test_customers_cannot_see_other_customers_bookings(): void
    {
        $room = $this->hotelWithRoom();
        $ref = $this->actingAs($this->customer(), 'sanctum')->postJson('/api/bookings', $this->hotelPayload($room->id))->json('booking.reference');

        $this->actingAs($this->customer(), 'sanctum')->getJson("/api/bookings/{$ref}")->assertNotFound();
    }

    public function test_maintenance_expires_unpaid_bookings_and_releases_inventory(): void
    {
        $room = $this->hotelWithRoom(['total_rooms' => 1]);
        $this->actingAs($this->customer(), 'sanctum')->postJson('/api/bookings', $this->hotelPayload($room->id))->assertCreated();
        Booking::query()->update(['created_at' => now()->subHour()]);

        $result = app(BookingService::class)->maintain();

        $this->assertSame(1, $result['expired']);
        $this->assertSame(1, $room->availableRooms(now()->addDays(10)->toDateString(), now()->addDays(13)->toDateString()));
    }

    public function test_payment_is_rejected_after_hold_expires(): void
    {
        $room = $this->hotelWithRoom();
        $this->actingAs($this->customer(), 'sanctum');
        $ref = $this->postJson('/api/bookings', $this->hotelPayload($room->id))->json('booking.reference');
        Booking::where('reference', $ref)->update(['created_at' => now()->subMinutes(31)]);

        $this->postJson("/api/bookings/{$ref}/pay", ['method' => 'pay_at_property'])
            ->assertUnprocessable()->assertJsonValidationErrors('booking');
    }

    public function test_refund_policy_per_service(): void
    {
        $service = app(BookingService::class);
        $make = fn (string $type, int $days, $bookable) => new Booking([
            'service_type' => $type, 'total' => 1000, 'start_date' => now()->addDays($days)->toDateString(),
            'bookable_type' => $bookable->getMorphClass(), 'bookable_id' => $bookable->id,
        ]);

        $this->assertSame(1000.0, $service->refundAmount($make('hotel', 5, $this->hotelWithRoom())));
        $this->assertSame(0.0, $service->refundAmount($make('hotel', 5, $this->hotelWithRoom(['refundable' => false]))));
        $this->assertSame(900.0, $service->refundAmount($make('flight', 5, $this->flight())));
        $this->assertSame(500.0, $service->refundAmount($make('bus', 0, $this->bus())));
    }
}
