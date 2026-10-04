<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/** Promotional discount code (percentage or fixed amount) with limits and validity window. */
class Coupon extends Model
{
    use HasFactory;

    protected $fillable = [
        'code', 'description', 'type', 'value', 'min_amount', 'max_discount', 'applies_to',
        'usage_limit', 'per_user_limit', 'starts_at', 'expires_at', 'is_active',
    ];

    protected $casts = [
        'value' => 'float',
        'min_amount' => 'float',
        'max_discount' => 'float',
        'starts_at' => 'datetime',
        'expires_at' => 'datetime',
        'is_active' => 'boolean',
    ];

    public function setCodeAttribute(string $value): void
    {
        $this->attributes['code'] = strtoupper(trim($value));
    }

    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class);
    }

    /**
     * Validate the coupon for a cart. Returns an error message, or null when usable.
     */
    public function validationError(float $amount, string $serviceType, ?User $user = null): ?string
    {
        $now = now();

        return match (true) {
            ! $this->is_active => 'This coupon is not active.',
            $this->starts_at && $now->lt($this->starts_at) => 'This coupon is not valid yet.',
            $this->expires_at && $now->gt($this->expires_at) => 'This coupon has expired.',
            $this->usage_limit !== null && $this->used_count >= $this->usage_limit => 'This coupon has reached its usage limit.',
            $this->applies_to !== 'all' && $this->applies_to !== $serviceType => "This coupon is only valid for {$this->applies_to} bookings.",
            $amount < $this->min_amount => 'Minimum booking amount for this coupon is '.number_format($this->min_amount, 2).'.',
            $user && $this->per_user_limit !== null
                && $this->bookings()->where('user_id', $user->id)->where('status', '!=', 'cancelled')->count() >= $this->per_user_limit => 'You have already used this coupon the maximum number of times.',
            default => null,
        };
    }

    public function discountFor(float $amount): float
    {
        $discount = $this->type === 'percent' ? $amount * $this->value / 100 : $this->value;

        if ($this->max_discount) {
            $discount = min($discount, $this->max_discount);
        }

        return round(min($discount, $amount), 2);
    }
}
