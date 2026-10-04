<?php

namespace App\Models;

use App\Models\Concerns\ResolvesMedia;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Support\Str;

/**
 * A reservation of any inventory item. Lifecycle:
 *
 *   pending ──pay──▶ confirmed ──date passes──▶ completed
 *      │                 │
 *      └──expire/cancel──┴──cancel (refund if eligible)──▶ cancelled
 */
class Booking extends Model
{
    use HasFactory, ResolvesMedia;

    public const STATUSES = ['pending', 'confirmed', 'cancelled', 'completed'];

    /** Statuses that hold inventory. */
    public const ACTIVE_STATUSES = ['pending', 'confirmed'];

    protected $fillable = [
        'reference', 'user_id', 'bookable_type', 'bookable_id', 'service_type', 'item_name', 'item_image',
        'start_date', 'end_date', 'quantity', 'units', 'adults', 'children', 'details', 'unit_price', 'subtotal',
        'discount', 'tax', 'service_fee', 'total', 'currency', 'coupon_id', 'coupon_code', 'status', 'payment_status',
        'payment_method', 'contact_name', 'contact_email', 'contact_phone', 'special_requests', 'refund_amount',
        'confirmed_at', 'cancelled_at', 'cancellation_reason',
    ];

    protected $casts = [
        'details' => 'array',
        'start_date' => 'date:Y-m-d',
        'end_date' => 'date:Y-m-d',
        'unit_price' => 'float',
        'subtotal' => 'float',
        'discount' => 'float',
        'tax' => 'float',
        'service_fee' => 'float',
        'total' => 'float',
        'refund_amount' => 'float',
        'confirmed_at' => 'datetime',
        'cancelled_at' => 'datetime',
    ];

    protected $appends = ['item_image_url', 'can_cancel', 'can_pay'];

    protected static function booted(): void
    {
        static::creating(function (Booking $booking) {
            $booking->reference ??= static::generateReference();
        });
    }

    /** Human-friendly unique reference, e.g. "EG-7K3QX9PD". */
    public static function generateReference(): string
    {
        do {
            $ref = 'EG-'.strtoupper(Str::random(8));
        } while (static::where('reference', $ref)->exists());

        return $ref;
    }

    public function getRouteKeyName(): string
    {
        return 'reference';
    }

    public function getItemImageUrlAttribute(): ?string
    {
        return static::mediaUrl($this->item_image);
    }

    public function getCanCancelAttribute(): bool
    {
        return in_array($this->status, self::ACTIVE_STATUSES, true)
            && $this->start_date && $this->start_date->isFuture();
    }

    public function getCanPayAttribute(): bool
    {
        return $this->status === 'pending' && $this->payment_status === 'unpaid';
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function bookable(): MorphTo
    {
        return $this->morphTo()->withDefault();
    }

    public function coupon(): BelongsTo
    {
        return $this->belongsTo(Coupon::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    public function scopeActive($query)
    {
        return $query->whereIn('status', self::ACTIVE_STATUSES);
    }
}
