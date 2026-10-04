<?php

namespace App\Services\Payments;

/** Immutable outcome of a gateway call. */
final class GatewayResult
{
    /** @param array<string, mixed> $meta */
    public function __construct(
        public readonly bool $success,
        public readonly ?string $transactionId = null,
        public readonly ?string $message = null,
        public readonly array $meta = [],
    ) {}

    /** @param array<string, mixed> $meta */
    public static function ok(string $transactionId, array $meta = []): self
    {
        return new self(true, $transactionId, null, $meta);
    }

    public static function fail(string $message): self
    {
        return new self(false, null, $message);
    }
}
