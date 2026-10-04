<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** A single charge or refund attempt against a booking through a payment gateway. */
class Payment extends Model
{
    public const METHODS = ['card', 'bkash', 'nagad', 'rocket', 'pay_at_property'];

    protected $fillable = [
        'booking_id', 'user_id', 'method', 'gateway', 'transaction_id', 'amount', 'currency',
        'status', 'failure_reason', 'meta', 'paid_at', 'refunded_at',
    ];

    protected $casts = [
        'amount' => 'float',
        'meta' => 'array',
        'paid_at' => 'datetime',
        'refunded_at' => 'datetime',
    ];

    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
