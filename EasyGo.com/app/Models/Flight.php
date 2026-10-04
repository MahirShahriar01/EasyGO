<?php

namespace App\Models;

use App\Models\Concerns\ResolvesMedia;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphMany;

/** A scheduled one-way flight leg with a fixed seat inventory for one cabin class. */
class Flight extends Model
{
    use HasFactory, ResolvesMedia;

    public const CABINS = ['economy', 'premium', 'business', 'first'];

    protected $fillable = [
        'airline', 'airline_code', 'airline_logo', 'flight_number', 'from_city', 'from_code', 'to_city', 'to_code',
        'departure_at', 'arrival_at', 'stops', 'cabin_class', 'price', 'total_seats', 'baggage', 'refundable', 'status',
    ];

    protected $casts = [
        'departure_at' => 'datetime',
        'arrival_at' => 'datetime',
        'price' => 'float',
        'refundable' => 'boolean',
        'stops' => 'integer',
        'total_seats' => 'integer',
    ];

    protected $appends = ['duration_minutes', 'airline_logo_url'];

    public function getDurationMinutesAttribute(): int
    {
        return $this->departure_at && $this->arrival_at
            ? (int) $this->departure_at->diffInMinutes($this->arrival_at)
            : 0;
    }

    public function getAirlineLogoUrlAttribute(): ?string
    {
        return static::mediaUrl($this->airline_logo);
    }

    public function bookings(): MorphMany
    {
        return $this->morphMany(Booking::class, 'bookable');
    }

    public function seatsAvailable(): int
    {
        return max(0, $this->total_seats - (int) $this->bookings()->active()->sum('quantity'));
    }
}
