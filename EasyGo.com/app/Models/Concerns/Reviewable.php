<?php

namespace App\Models\Concerns;

use App\Models\Review;
use App\Models\Wishlist;
use Illuminate\Database\Eloquent\Relations\MorphMany;

/**
 * Shared behaviour for inventory that customers can review and wishlist
 * (hotels, tours and cars). Keeps the denormalised avg_rating/reviews_count fresh.
 */
trait Reviewable
{
    public function reviews(): MorphMany
    {
        return $this->morphMany(Review::class, 'reviewable');
    }

    public function wishlists(): MorphMany
    {
        return $this->morphMany(Wishlist::class, 'wishlistable');
    }

    /** Recalculate rating aggregates from approved reviews only. */
    public function refreshRating(): void
    {
        $approved = $this->reviews()->where('status', 'approved');

        $this->forceFill([
            'avg_rating' => round((float) $approved->avg('rating'), 2),
            'reviews_count' => $approved->count(),
        ])->saveQuietly();
    }
}
