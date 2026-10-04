<?php

namespace Tests\Unit;

use App\Models\Bus;
use App\Models\Coupon;
use App\Services\Payments\DemoGateway;
use PHPUnit\Framework\TestCase;

class PricingAndModelsTest extends TestCase
{
    public function test_percent_coupon_respects_max_discount(): void
    {
        $coupon = new Coupon(['type' => 'percent', 'value' => 25, 'max_discount' => 1000]);
        $this->assertSame(1000.0, $coupon->discountFor(10000));
        $this->assertSame(250.0, $coupon->discountFor(1000));
    }

    public function test_fixed_coupon_never_exceeds_amount(): void
    {
        $coupon = new Coupon(['type' => 'fixed', 'value' => 500]);
        $this->assertSame(300.0, $coupon->discountFor(300));
    }

    public function test_bus_seat_labels_follow_layout(): void
    {
        $bus = new Bus(['total_seats' => 6, 'seat_layout' => '1-2']);
        $this->assertSame(['A1', 'A2', 'A3', 'B1', 'B2', 'B3'], $bus->seatLabels());
    }

    public function test_demo_gateway_rules(): void
    {
        $gw = new DemoGateway;
        $this->assertTrue($gw->charge(100, 'BDT', 'card', ['card_number' => '4242424242424242'])->success);
        $this->assertFalse($gw->charge(100, 'BDT', 'card', ['card_number' => '4242424242420002'])->success);
        $this->assertFalse($gw->charge(100, 'BDT', 'bkash', ['wallet_number' => '0171', 'otp' => '123456'])->success);
        $this->assertTrue($gw->charge(100, 'BDT', 'bkash', ['wallet_number' => '01711111111', 'otp' => '123456'])->success);
    }
}
