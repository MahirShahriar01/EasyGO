<?php

namespace App\Models;

use App\Models\Concerns\ResolvesMedia;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphMany;

/** A sellable room category inside a Hotel, with its own inventory count. */
class RoomType extends Model
{
    use HasFactory, ResolvesMedia;

    protected $fillable = [
        'hotel_id', 'name', 'description', 'bed_type', 'size_sqm', 'max_adults', 'max_children',
        'price_per_night', 'total_rooms', 'amenities', 'images', 'breakfast_included', 'refundable', 'status',
    ];

    protected $casts = [
        'amenities' => 'array',
        'images' => 'array',
        'breakfast_included' => 'boolean',
        'refundable' => 'boolean',
        'price_per_night' => 'float',
        'total_rooms' => 'integer',
        'max_adults' => 'integer',
        'max_children' => 'integer',
    ];

    protected $appends = ['image_urls'];

    protected static function booted(): void
    {
        // Any price/status change can move the hotel's "from" price.
        static::saved(fn (RoomType $room) => $room->hotel?->refreshMinPrice());
        static::deleted(fn (RoomType $room) => $room->hotel?->refreshMinPrice());
    }

    public function getImageUrlsAttribute(): array
    {
        return static::mediaUrls($this->images);
    }

    public function hotel(): BelongsTo
    {
        return $this->belongsTo(Hotel::class);
    }

    public function bookings(): MorphMany
    {
        return $this->morphMany(Booking::class, 'bookable');
    }

    /**
     * Rooms still free for every night in [checkIn, checkOut).
     * Two stays overlap when existing.start < new.end AND existing.end > new.start.
     */
    public function availableRooms(string $checkIn, string $checkOut, ?int $ignoreBookingId = null): int
    {
        $booked = $this->bookings()
            ->active()
            ->when($ignoreBookingId, fn ($q) => $q->whereKeyNot($ignoreBookingId))
            ->where('start_date', '<', $checkOut)
            ->where('end_date', '>', $checkIn)
            ->sum('quantity');

        return max(0, $this->total_rooms - (int) $booked);
    }
}
