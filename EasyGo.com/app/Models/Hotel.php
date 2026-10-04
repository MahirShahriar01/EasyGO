<?php

namespace App\Models;

use App\Models\Concerns\HasSlug;
use App\Models\Concerns\ResolvesMedia;
use App\Models\Concerns\Reviewable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/** A property (hotel, resort, apartment...) that offers one or more RoomTypes. */
class Hotel extends Model
{
    use HasFactory, HasSlug, ResolvesMedia, Reviewable, SoftDeletes;

    public const PROPERTY_TYPES = ['hotel', 'resort', 'apartment', 'villa', 'guesthouse'];

    public const AMENITIES = [
        'wifi' => 'Free Wi-Fi', 'pool' => 'Swimming pool', 'parking' => 'Free parking', 'spa' => 'Spa',
        'gym' => 'Fitness centre', 'restaurant' => 'Restaurant', 'bar' => 'Bar', 'ac' => 'Air conditioning',
        'airport_shuttle' => 'Airport shuttle', 'room_service' => '24h room service', 'beach' => 'Beachfront',
        'pet_friendly' => 'Pet friendly', 'family_rooms' => 'Family rooms', 'breakfast' => 'Breakfast available',
    ];

    protected $fillable = [
        'destination_id', 'name', 'slug', 'property_type', 'description', 'address', 'star_rating',
        'amenities', 'thumbnail', 'images', 'latitude', 'longitude', 'check_in_time', 'check_out_time',
        'policies', 'phone', 'email', 'is_featured', 'status',
    ];

    protected $casts = [
        'amenities' => 'array',
        'images' => 'array',
        'is_featured' => 'boolean',
        'star_rating' => 'integer',
        'avg_rating' => 'float',
        'min_price' => 'float',
        'latitude' => 'float',
        'longitude' => 'float',
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

    public function roomTypes(): HasMany
    {
        return $this->hasMany(RoomType::class);
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    /** Keep the cheapest active room price cached for fast "from ৳X" listings and price filters. */
    public function refreshMinPrice(): void
    {
        $this->forceFill([
            'min_price' => (float) $this->roomTypes()->where('status', 'active')->min('price_per_night'),
        ])->saveQuietly();
    }
}
