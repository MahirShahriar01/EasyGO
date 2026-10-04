<?php

namespace App\Models;

use App\Models\Concerns\ResolvesMedia;
use App\Models\Concerns\Reviewable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/** A rental car model available in a fleet of `quantity` vehicles at a pickup city. */
class Car extends Model
{
    use HasFactory, ResolvesMedia, Reviewable, SoftDeletes;

    public const TYPES = ['micro', 'sedan', 'suv', 'van', 'luxury'];

    protected $fillable = [
        'destination_id', 'name', 'brand', 'car_type', 'seats', 'bags', 'transmission', 'fuel_type',
        'air_conditioning', 'with_driver', 'price_per_day', 'quantity', 'thumbnail', 'images', 'features', 'status',
    ];

    protected $casts = [
        'images' => 'array',
        'features' => 'array',
        'air_conditioning' => 'boolean',
        'with_driver' => 'boolean',
        'price_per_day' => 'float',
        'avg_rating' => 'float',
        'seats' => 'integer',
        'quantity' => 'integer',
    ];

    protected $appends = ['thumbnail_url', 'image_urls'];

    public function getThumbnailUrlAttribute(): ?string
    {
        return static::mediaUrl($this->thumbnail) ?? (static::mediaUrls($this->images)[0] ?? null);
    }

    public function getImageUrlsAttribute(): array
    {
        return static::mediaUrls($this->images);
    }

    public function destination(): BelongsTo
    {
        return $this->belongsTo(Destination::class);
    }

    public function bookings(): MorphMany
    {
        return $this->morphMany(Booking::class, 'bookable');
    }

    /** Vehicles not rented out on any day of [from, to). */
    public function availableUnits(string $from, string $to): int
    {
        $booked = $this->bookings()->active()
            ->where('start_date', '<', $to)
            ->where('end_date', '>', $from)
            ->sum('quantity');

        return max(0, $this->quantity - (int) $booked);
    }
}
