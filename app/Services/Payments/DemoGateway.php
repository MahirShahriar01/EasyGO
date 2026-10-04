<?php

namespace App\Services\Payments;

use Illuminate\Support\Str;

/**
 * Sandbox gateway used in development, demos and tests. No money moves.
 *
 * Test rules:
 *  - card:   any 16-digit number passes Luhn-free validation, except numbers
 *            ending in "0002" which are declined (to demo failure handling).
 *  - wallets (bKash / Nagad / Rocket): 11-digit wallet number + 6-digit OTP;
 *            OTP "000000" is rejected.
 */
class DemoGateway implements PaymentGateway
{
    public function name(): string
    {
        return 'demo';
    }

    public function charge(float $amount, string $currency, string $method, array $payload): GatewayResult
    {
        if ($method === 'card') {
            $number = preg_replace('/\D/', '', (string) ($payload['card_number'] ?? ''));

            if (strlen($number) !== 16) {
                return GatewayResult::fail('Card number must be 16 digits.');
            }
            if (str_ends_with($number, '0002')) {
                return GatewayResult::fail('Your card was declined by the issuing bank.');
            }

            return GatewayResult::ok('DEMO-CARD-'.strtoupper(Str::random(12)), [
                'card_last4' => substr($number, -4),
                'card_holder' => $payload['card_name'] ?? null,
            ]);
        }

        $wallet = preg_replace('/\D/', '', (string) ($payload['wallet_number'] ?? ''));
        $otp = (string) ($payload['otp'] ?? '');

        if (strlen($wallet) !== 11) {
            return GatewayResult::fail('Wallet number must be 11 digits.');
        }
        if (! preg_match('/^\d{6}$/', $otp) || $otp === '000000') {
            return GatewayResult::fail('Invalid OTP. Please try again.');
        }

        return GatewayResult::ok('DEMO-'.strtoupper($method).'-'.strtoupper(Str::random(10)), [
            'wallet' => substr($wallet, 0, 3).'*****'.substr($wallet, -3),
        ]);
    }

    public function refund(string $transactionId, float $amount, string $currency): GatewayResult
    {
        return GatewayResult::ok('REFUND-'.strtoupper(Str::random(10)), ['original' => $transactionId]);
    }
}
