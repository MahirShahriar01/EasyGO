<?php

namespace App\Services;

use App\Models\Coupon;
use App\Models\Setting;
use App\Models\User;

/**
 * Computes the price breakdown shown at checkout and stored on the booking.
 *
 *   subtotal     = unit_price × units (nights/days) × quantity
 *   discount     = coupon discount on subtotal
 *   service_fee  = subtotal × service_fee_percent
 *   tax          = (subtotal − discount) × tax_rate
 *   total        = subtotal − discount + service_fee + tax
 */
class PricingService
{
    /**
     * @return array{subtotal: float, discount: float, service_fee: float, tax: float, total: float,
     *               coupon: ?Coupon, coupon_error: ?string, currency: string}
     */
    public function breakdown(float $unitPrice, int $units, int $quantity, string $serviceType, ?string $couponCode = null, ?User $user = null): array
    {
        $subtotal = round($unitPrice * max(1, $units) * max(1, $quantity), 2);
        $discount = 0.0;
        $coupon = null;
        $couponError = null;

        if (filled($couponCode)) {
            $coupon = Coupon::where('code', strtoupper(trim($couponCode)))->first();

            if (! $coupon) {
                $couponError = 'Coupon code not found.';
            } elseif ($error = $coupon->validationError($subtotal, $serviceType, $user)) {
                $couponError = $error;
                $coupon = null;
            } else {
                $discount = $coupon->discountFor($subtotal);
            }
        }

        $serviceFee = round($subtotal * (float) Setting::get('service_fee_percent', 0) / 100, 2);
        $tax = round(($subtotal - $discount) * (float) Setting::get('tax_rate', 0) / 100, 2);

        return [
            'subtotal' => $subtotal,
            'discount' => $discount,
            'service_fee' => $serviceFee,
            'tax' => $tax,
            'total' => round($subtotal - $discount + $serviceFee + $tax, 2),
            'coupon' => $coupon,
            'coupon_error' => $couponError,
            'currency' => (string) Setting::get('currency', 'BDT'),
        ];
    }
}
