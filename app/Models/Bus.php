<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphMany;

/**
 * A scheduled coach trip. Customers pick individual seats on a seat map;
 * seat labels are generated from the layout (rows A, B, C... × columns 1..n).
 */
class Bus extends Model
{
    use HasFactory;

    public const TYPES = ['AC', 'Non-AC', 'Sleeper', 'Business'];

    protected $fillable = [
        'operator', 'coach_no', 'bus_type', 'from_city', 'to_city', 'boarding_point', 'dropping_point',
        'departure_at', 'arrival_at', 'price', 'total_seats', 'seat_layout', 'amenities', 'status',
    ];

    protected $casts = [
        'departure_at' => 'datetime',
        'arrival_at' => 'datetime',
        'price' => 'float',
        'total_seats' => 'integer',
        'amenities' => 'array',
    ];

    protected $appends = ['duration_minutes'];

    public function getDurationMinutesAttribute(): int
    {
        return $this->departure_at && $this->arrival_at
            ? (int) $this->departure_at->diffInMinutes($this->arrival_at)
            : 0;
    }

    public function bookings(): MorphMany
    {
        return $this->morphMany(Booking::class, 'bookable');
    }

    /** @return array<int, string> e.g. ["A1","A2","A3","A4","B1",...] */
    public function seatLabels(): array
    {
        [$left, $right] = array_map('intval', explode('-', $this->seat_layout.'-0'));
        $perRow = max(1, $left + $right);
        $labels = [];

        for ($i = 0; $i < $this->total_seats; $i++) {
            $labels[] = chr(65 + intdiv($i, $perRow)).(($i % $perRow) + 1);
        }

        return $labels;
    }

    /** @return array<int, string> seats held by pending or confirmed bookings */
    public function bookedSeats(): array
    {
        return $this->bookings()->active()->get(['details'])
            ->flatMap(fn ($b) => $b->details['seats'] ?? [])
            ->values()
            ->all();
    }

    public function seatsAvailable(): int
    {
        return max(0, $this->total_seats - count($this->bookedSeats()));
    }
}
