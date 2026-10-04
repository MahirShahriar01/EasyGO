<?php

namespace App\Services\Payments;

/**
 * Contract every payment provider adapter implements.
 *
 * Production integrations (Stripe, SSLCommerz, bKash PGW, Nagad...) only need a
 * new class implementing this interface and a binding in AppServiceProvider.
 */
interface PaymentGateway
{
    public function name(): string;

    /**
     * @param  array<string, mixed>  $payload  method-specific data (card / wallet details)
     */
    public function charge(float $amount, string $currency, string $method, array $payload): GatewayResult;

    public function refund(string $transactionId, float $amount, string $currency): GatewayResult;
}
