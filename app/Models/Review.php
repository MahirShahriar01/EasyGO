<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

/** Verified-guest review of a hotel, tour or car. Moderated by admins before publication. */
class Review extends Model
{
    use HasFactory;

    protected $fillable = ['user_id', 'reviewable_type', 'reviewable_id', 'booking_id', 'rating', 'title', 'comment', 'status'];

    protected $casts = ['rating' => 'integer'];

    protected static function booted(): void
    {
        // Keep the parent's rating aggregate correct whenever moderation state changes.
        static::saved(fn (Review $r) => $r->reviewable?->refreshRating());
        static::deleted(fn (Review $r) => $r->reviewable?->refreshRating());
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function reviewable(): MorphTo
    {
        return $this->morphTo();
    }

    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }
}
