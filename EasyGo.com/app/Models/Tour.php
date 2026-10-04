<?php

namespace App\Models;

use App\Models\Concerns\HasSlug;
use App\Models\Concerns\ResolvesMedia;
use App\Models\Concerns\Reviewable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/** A packaged guided tour sold per person for a chosen departure date. */
class Tour extends Model
{
    use HasFactory, HasSlug, ResolvesMedia, Reviewable, SoftDeletes;

    public const CATEGORIES = ['adventure', 'beach', 'culture', 'honeymoon', 'family', 'wildlife'];

    protected string $slugSource = 'title';

    protected $fillable = [
        'destination_id', 'title', 'slug', 'category', 'description', 'duration_days', 'duration_nights',
        'price', 'discount_price', 'max_group_size', 'itinerary', 'inclusions', 'exclusions', 'thumbnail',
        'images', 'available_from', 'available_to', 'is_featured', 'status',
    ];

    protected $casts = [
        'itinerary' => 'array',
        'inclusions' => 'array',
        'exclusions' => 'array',
        'images' => 'array',
        'is_featured' => 'boolean',
        'price' => 'float',
        'discount_price' => 'float',
        'avg_rating' => 'float',
        'available_from' => 'date:Y-m-d',
        'available_to' => 'date:Y-m-d',
    ];

    protected $appends = ['thumbnail_url', 'image_urls', 'effective_price'];

    public function getThumbnailUrlAttribute(): ?string
    {
        return static::mediaUrl($this->thumbnail) ?? (static::mediaUrls($this->images)[0] ?? null);
    }

    public function getImageUrlsAttribute(): array
    {
        return static::mediaUrls($this->images);
    }

    /** Price actually charged per traveller (discount wins when set and lower). */
    public function getEffectivePriceAttribute(): float
    {
        return $this->discount_price && $this->discount_price < $this->price
            ? (float) $this->discount_price
            : (float) $this->price;
    }

    public function destination(): BelongsTo
    {
        return $this->belongsTo(Destination::class);
    }

    public function bookings(): MorphMany
    {
        return $this->morphMany(Booking::class, 'bookable');
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function spotsLeft(string $date): int
    {
        $booked = $this->bookings()->active()->whereDate('start_date', $date)->sum('quantity');

        return max(0, $this->max_group_size - (int) $booked);
    }
}
