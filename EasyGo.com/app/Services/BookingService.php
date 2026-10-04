<?php

namespace App\Services;

use App\Models\Booking;
use App\Models\Bus;
use App\Models\Car;
use App\Models\Flight;
use App\Models\Payment;
use App\Models\RoomType;
use App\Models\Setting;
use App\Models\Tour;
use App\Models\User;
use App\Notifications\BookingCancelled;
use App\Notifications\BookingConfirmed;
use App\Services\Payments\PaymentGateway;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Core booking domain logic shared by every vertical:
 * availability checks, price quotes, reservation, payment, cancellation/refund
 * and lifecycle maintenance (expiry & completion).
 *
 * Normalised booking input (see BookingController for validation):
 *  service_type  hotel|flight|bus|tour|car
 *  item_id       RoomType / Flight / Bus / Tour / Car id
 *  start_date    check-in | tour date | pickup date (ignored for flight/bus)
 *  end_date      check-out | drop-off date (hotel/car only)
 *  quantity      rooms | passengers | travellers | cars (bus: derived from seats)
 *  adults, children, seats[] (bus), passengers[] (flight/bus traveller names)
 */
class BookingService
{
    public const SERVICES = ['hotel', 'flight', 'bus', 'tour', 'car'];

    public function __construct(
        private readonly PricingService $pricing,
        private readonly PaymentGateway $gateway,
    ) {}

    /**
     * Resolve the inventory item, check availability and return the booking line.
     *
     * @param  array<string, mixed>  $input
     * @return array<string, mixed>
     *
     * @throws ValidationException
     */
    public function prepare(array $input, bool $lock = false): array
    {
        $type = $input['service_type'];
        $quantity = max(1, (int) ($input['quantity'] ?? 1));

        return match ($type) {
            'hotel' => $this->prepareHotel($this->find(RoomType::class, $input['item_id'], $lock), $input, $quantity),
            'flight' => $this->prepareFlight($this->find(Flight::class, $input['item_id'], $lock), $input, $quantity),
            'bus' => $this->prepareBus($this->find(Bus::class, $input['item_id'], $lock), $input),
            'tour' => $this->prepareTour($this->find(Tour::class, $input['item_id'], $lock), $input, $quantity),
            'car' => $this->prepareCar($this->find(Car::class, $input['item_id'], $lock), $input, $quantity),
            default => throw ValidationException::withMessages(['service_type' => 'Unsupported service type.']),
        };
    }

    /**
     * Price preview for the checkout page (no inventory is held).
     *
     * @param  array<string, mixed>  $input
     * @return array<string, mixed>
     */
    public function quote(array $input, ?User $user): array
    {
        $line = $this->prepare($input);
        $price = $this->pricing->breakdown($line['unit_price'], $line['units'], $line['quantity'], $input['service_type'], $input['coupon_code'] ?? null, $user);

        return [
            'item' => [
                'name' => $line['item_name'],
                'image' => Booking::mediaUrl($line['item_image']),
                'details' => $line['details'],
            ],
            'start_date' => $line['start_date'],
            'end_date' => $line['end_date'],
            'quantity' => $line['quantity'],
            'units' => $line['units'],
            'unit_price' => $line['unit_price'],
            'subtotal' => $price['subtotal'],
            'discount' => $price['discount'],
            'service_fee' => $price['service_fee'],
            'tax' => $price['tax'],
            'total' => $price['total'],
            'currency' => $price['currency'],
            'coupon_code' => $price['coupon']?->code,
            'coupon_error' => $price['coupon_error'],
            'pay_at_property' => $input['service_type'] === 'hotel' && Setting::get('pay_at_property_enabled') === '1',
        ];
    }

    /**
     * Create a pending booking. Runs in a transaction with row locks so two
     * customers cannot both take the last room/seat.
     *
     * @param  array<string, mixed>  $input
     */
    public function create(User $user, array $input): Booking
    {
        return DB::transaction(function () use ($user, $input) {
            $line = $this->prepare($input, lock: true);
            $price = $this->pricing->breakdown($line['unit_price'], $line['units'], $line['quantity'], $input['service_type'], $input['coupon_code'] ?? null, $user);

            if (filled($input['coupon_code'] ?? null) && $price['coupon_error']) {
                throw ValidationException::withMessages(['coupon_code' => $price['coupon_error']]);
            }

            /** @var Model $bookable */
            $bookable = $line['bookable'];

            $booking = Booking::create([
                'user_id' => $user->id,
                'bookable_type' => $bookable->getMorphClass(),
                'bookable_id' => $bookable->getKey(),
                'service_type' => $input['service_type'],
                'item_name' => $line['item_name'],
                'item_image' => $line['item_image'],
                'start_date' => $line['start_date'],
                'end_date' => $line['end_date'],
                'quantity' => $line['quantity'],
                'units' => $line['units'],
                'adults' => (int) ($input['adults'] ?? $line['quantity']),
                'children' => (int) ($input['children'] ?? 0),
                'details' => $line['details'],
                'unit_price' => $line['unit_price'],
                'subtotal' => $price['subtotal'],
                'discount' => $price['discount'],
                'service_fee' => $price['service_fee'],
                'tax' => $price['tax'],
                'total' => $price['total'],
                'currency' => $price['currency'],
                'coupon_id' => $price['coupon']?->id,
                'coupon_code' => $price['coupon']?->code,
                'status' => 'pending',
                'payment_status' => 'unpaid',
                'contact_name' => $input['contact_name'],
                'contact_email' => $input['contact_email'],
                'contact_phone' => $input['contact_phone'] ?? null,
                'special_requests' => $input['special_requests'] ?? null,
            ]);

            $price['coupon']?->increment('used_count');

            return $booking;
        });
    }

    /**
     * Pay for a pending booking through the configured gateway.
     *
     * @param  array<string, mixed>  $payload
     *
     * @throws ValidationException when the charge fails
     */
    public function pay(Booking $booking, string $method, array $payload = []): Booking
    {
        if (! $booking->can_pay) {
            throw ValidationException::withMessages(['booking' => 'This booking cannot be paid.']);
        }

        // The hold window is enforced here too, not only by the scheduler.
        if ($booking->created_at->lt(now()->subMinutes((int) Setting::get('booking_hold_minutes', 30)))) {
            throw ValidationException::withMessages(['booking' => 'Your reservation hold has expired. Please book again.']);
        }

        // Hotels may be reserved now and paid at the property.
        if ($method === 'pay_at_property') {
            if ($booking->service_type !== 'hotel' || Setting::get('pay_at_property_enabled') !== '1') {
                throw ValidationException::withMessages(['method' => 'Pay at property is not available for this booking.']);
            }

            $booking->payments()->create([
                'user_id' => $booking->user_id, 'method' => $method, 'gateway' => 'offline',
                'amount' => $booking->total, 'currency' => $booking->currency, 'status' => 'pending',
            ]);

            return $this->confirm($booking, $method);
        }

        $result = $this->gateway->charge($booking->total, $booking->currency, $method, $payload);

        $payment = $booking->payments()->create([
            'user_id' => $booking->user_id,
            'method' => $method,
            'gateway' => $this->gateway->name(),
            'transaction_id' => $result->transactionId,
            'amount' => $booking->total,
            'currency' => $booking->currency,
            'status' => $result->success ? 'succeeded' : 'failed',
            'failure_reason' => $result->message,
            'meta' => $result->meta,
            'paid_at' => $result->success ? now() : null,
        ]);

        if (! $result->success) {
            throw ValidationException::withMessages(['payment' => $result->message ?? 'Payment failed.']);
        }

        $booking->payment_status = 'paid';

        return $this->confirm($booking, $method, $payment);
    }

    private function confirm(Booking $booking, string $method, ?Payment $payment = null): Booking
    {
        $booking->forceFill([
            'status' => 'confirmed',
            'payment_method' => $method,
            'confirmed_at' => now(),
        ])->save();

        $booking->user->notify(new BookingConfirmed($booking));

        return $booking->fresh();
    }

    /**
     * Cancel a booking and refund according to the vertical's policy.
     */
    public function cancel(Booking $booking, ?string $reason = null, bool $byAdmin = false): Booking
    {
        if (! in_array($booking->status, Booking::ACTIVE_STATUSES, true)) {
            throw ValidationException::withMessages(['booking' => 'Only pending or confirmed bookings can be cancelled.']);
        }
        if (! $byAdmin && ! $booking->can_cancel) {
            throw ValidationException::withMessages(['booking' => 'This booking can no longer be cancelled online.']);
        }

        return DB::transaction(function () use ($booking, $reason, $byAdmin) {
            $refund = 0.0;

            if ($booking->payment_status === 'paid') {
                $refund = $byAdmin ? $booking->total : $this->refundAmount($booking);
                $payment = $booking->payments()->where('status', 'succeeded')->latest()->first();

                if ($refund > 0 && $payment) {
                    $result = $this->gateway->refund((string) $payment->transaction_id, $refund, $booking->currency);
                    $payment->update([
                        'status' => 'refunded',
                        'refunded_at' => now(),
                        'meta' => array_merge($payment->meta ?? [], ['refund_id' => $result->transactionId, 'refund_amount' => $refund]),
                    ]);
                    $booking->payment_status = 'refunded';
                }
            }

            $booking->forceFill([
                'status' => 'cancelled',
                'cancelled_at' => now(),
                'cancellation_reason' => $reason ?: ($byAdmin ? 'Cancelled by EasyGo support' : 'Cancelled by customer'),
                'refund_amount' => $refund,
            ])->save();

            if ($booking->coupon_id) {
                $booking->coupon()->where('used_count', '>', 0)->decrement('used_count');
            }

            $booking->user->notify(new BookingCancelled($booking));

            return $booking->fresh();
        });
    }

    /**
     * Refund policy per vertical (customer-initiated cancellation of a paid booking):
     *  hotel  – refundable room & ≥ 24h before check-in → 100%, otherwise 0%
     *  flight – refundable fare → 90% (10% airline fee), non-refundable → 0%
     *  bus    – ≥ 24h before departure → 100%, otherwise 50%
     *  tour   – ≥ 7 days → 100%, ≥ 2 days → 50%, otherwise 0%
     *  car    – ≥ 24h before pickup → 100%, otherwise 0%
     */
    public function refundAmount(Booking $booking): float
    {
        $hoursLeft = now()->diffInHours(Carbon::parse($booking->start_date), false);
        $bookable = $booking->bookable;

        $ratio = match ($booking->service_type) {
            'hotel' => ($bookable->refundable ?? true) && $hoursLeft >= 24 ? 1.0 : 0.0,
            'flight' => ($bookable->refundable ?? false) ? 0.9 : 0.0,
            'bus' => $hoursLeft >= 24 ? 1.0 : 0.5,
            'tour' => $hoursLeft >= 24 * 7 ? 1.0 : ($hoursLeft >= 48 ? 0.5 : 0.0),
            'car' => $hoursLeft >= 24 ? 1.0 : 0.0,
            default => 0.0,
        };

        return round($booking->total * $ratio, 2);
    }

    /**
     * Housekeeping run by the scheduler:
     *  - unpaid pending bookings older than the hold window are cancelled (inventory released)
     *  - confirmed bookings whose end/start date has passed become completed
     *
     * @return array{expired: int, completed: int}
     */
    public function maintain(): array
    {
        $holdMinutes = (int) Setting::get('booking_hold_minutes', 30);
        $expired = 0;

        Booking::where('status', 'pending')
            ->where('payment_status', 'unpaid')
            ->where('created_at', '<', now()->subMinutes($holdMinutes))
            ->each(function (Booking $b) use (&$expired) {
                $b->forceFill([
                    'status' => 'cancelled',
                    'cancelled_at' => now(),
                    'cancellation_reason' => 'Payment not received within the hold period',
                ])->save();
                $b->coupon()->where('used_count', '>', 0)->decrement('used_count');
                $expired++;
            });

        $completed = Booking::where('status', 'confirmed')
            ->whereRaw('COALESCE(end_date, start_date) < ?', [now()->toDateString()])
            ->update(['status' => 'completed']);

        return ['expired' => $expired, 'completed' => $completed];
    }

    // ---------------------------------------------------------------------
    // Per-vertical preparation
    // ---------------------------------------------------------------------

    /**
     * @template T of Model
     *
     * @param  class-string<T>  $class
     * @return T
     */
    private function find(string $class, mixed $id, bool $lock): Model
    {
        $item = $class::query()->when($lock, fn ($q) => $q->lockForUpdate())->find($id);

        if (! $item || ($item->status ?? 'active') !== 'active') {
            throw ValidationException::withMessages(['item_id' => 'The selected item is not available.']);
        }

        return $item;
    }

    /** @return array<string, mixed> */
    private function line(Model $bookable, string $name, ?string $image, string $start, ?string $end, int $qty, int $units, float $unitPrice, array $details): array
    {
        return [
            'bookable' => $bookable,
            'item_name' => $name,
            'item_image' => $image,
            'start_date' => $start,
            'end_date' => $end,
            'quantity' => $qty,
            'units' => $units,
            'unit_price' => $unitPrice,
            'details' => $details,
        ];
    }

    /** @return array{0: Carbon, 1: Carbon, 2: int} */
    private function dateRange(array $input, string $label): array
    {
        if (empty($input['start_date']) || empty($input['end_date'])) {
            throw ValidationException::withMessages(['start_date' => "Please choose {$label} dates."]);
        }

        $start = Carbon::parse($input['start_date'])->startOfDay();
        $end = Carbon::parse($input['end_date'])->startOfDay();

        if ($start->lt(today())) {
            throw ValidationException::withMessages(['start_date' => 'Start date cannot be in the past.']);
        }
        if ($end->lte($start)) {
            throw ValidationException::withMessages(['end_date' => 'End date must be after the start date.']);
        }

        return [$start, $end, (int) $start->diffInDays($end)];
    }

    private function prepareHotel(RoomType $room, array $input, int $rooms): array
    {
        [$in, $out, $nights] = $this->dateRange($input, 'check-in and check-out');
        $adults = (int) ($input['adults'] ?? 1);
        $children = (int) ($input['children'] ?? 0);

        if ($adults > $room->max_adults * $rooms || $children > max($room->max_children, 0) * $rooms + $rooms) {
            throw ValidationException::withMessages(['adults' => "Too many guests for {$rooms} × {$room->name}. Add another room."]);
        }

        $available = $room->availableRooms($in->toDateString(), $out->toDateString());
        if ($available < $rooms) {
            throw ValidationException::withMessages(['quantity' => $available
                ? "Only {$available} room(s) left for these dates."
                : 'This room is sold out for the selected dates.']);
        }

        $hotel = $room->hotel;

        return $this->line($room, "{$hotel->name} — {$room->name}", $hotel->thumbnail ?? ($room->images[0] ?? null),
            $in->toDateString(), $out->toDateString(), $rooms, $nights, $room->price_per_night, [
                'hotel_id' => $hotel->id,
                'hotel_slug' => $hotel->slug,
                'room_type_id' => $room->id,
                'room_name' => $room->name,
                'check_in_time' => $hotel->check_in_time,
                'check_out_time' => $hotel->check_out_time,
                'address' => $hotel->address,
                'refundable' => $room->refundable,
                'breakfast_included' => $room->breakfast_included,
            ]);
    }

    private function prepareFlight(Flight $flight, array $input, int $passengers): array
    {
        if ($flight->departure_at->isPast()) {
            throw ValidationException::withMessages(['item_id' => 'This flight has already departed.']);
        }
        if ($flight->seatsAvailable() < $passengers) {
            throw ValidationException::withMessages(['quantity' => 'Not enough seats left on this flight.']);
        }

        return $this->line($flight, "{$flight->airline} {$flight->flight_number} · {$flight->from_code} → {$flight->to_code}", $flight->airline_logo,
            $flight->departure_at->toDateString(), null, $passengers, 1, $flight->price, [
                'from' => "{$flight->from_city} ({$flight->from_code})",
                'to' => "{$flight->to_city} ({$flight->to_code})",
                'departure_at' => $flight->departure_at->toIso8601String(),
                'arrival_at' => $flight->arrival_at->toIso8601String(),
                'cabin_class' => $flight->cabin_class,
                'baggage' => $flight->baggage,
                'refundable' => $flight->refundable,
                'passengers' => array_values($input['passengers'] ?? []),
            ]);
    }

    private function prepareBus(Bus $bus, array $input): array
    {
        $seats = array_values(array_unique($input['seats'] ?? []));

        if (! $seats) {
            throw ValidationException::withMessages(['seats' => 'Please select at least one seat.']);
        }
        if (count($seats) > 6) {
            throw ValidationException::withMessages(['seats' => 'You can book up to 6 seats at once.']);
        }
        if ($bus->departure_at->isPast()) {
            throw ValidationException::withMessages(['item_id' => 'This bus has already departed.']);
        }
        if ($invalid = array_diff($seats, $bus->seatLabels())) {
            throw ValidationException::withMessages(['seats' => 'Invalid seat(s): '.implode(', ', $invalid)]);
        }
        if ($taken = array_intersect($seats, $bus->bookedSeats())) {
            throw ValidationException::withMessages(['seats' => 'Seat(s) already booked: '.implode(', ', $taken)]);
        }

        return $this->line($bus, "{$bus->operator} · {$bus->from_city} → {$bus->to_city}", null,
            $bus->departure_at->toDateString(), null, count($seats), 1, $bus->price, [
                'seats' => $seats,
                'bus_type' => $bus->bus_type,
                'coach_no' => $bus->coach_no,
                'departure_at' => $bus->departure_at->toIso8601String(),
                'arrival_at' => $bus->arrival_at->toIso8601String(),
                'boarding_point' => $bus->boarding_point,
                'dropping_point' => $bus->dropping_point,
                'passengers' => array_values($input['passengers'] ?? []),
            ]);
    }

    private function prepareTour(Tour $tour, array $input, int $travellers): array
    {
        if (empty($input['start_date'])) {
            throw ValidationException::withMessages(['start_date' => 'Please choose a departure date.']);
        }

        $date = Carbon::parse($input['start_date'])->startOfDay();

        if ($date->lt(today()->addDay())) {
            throw ValidationException::withMessages(['start_date' => 'Tours must be booked at least one day in advance.']);
        }
        if (($tour->available_from && $date->lt($tour->available_from)) || ($tour->available_to && $date->gt($tour->available_to))) {
            throw ValidationException::withMessages(['start_date' => 'This tour does not run on the selected date.']);
        }

        $left = $tour->spotsLeft($date->toDateString());
        if ($left < $travellers) {
            throw ValidationException::withMessages(['quantity' => $left ? "Only {$left} spot(s) left on this date." : 'This departure is fully booked.']);
        }

        return $this->line($tour, $tour->title, $tour->thumbnail ?? ($tour->images[0] ?? null),
            $date->toDateString(), $date->copy()->addDays(max(0, $tour->duration_days - 1))->toDateString(),
            $travellers, 1, $tour->effective_price, [
                'duration' => "{$tour->duration_days}D / {$tour->duration_nights}N",
                'destination' => $tour->destination?->name,
                'tour_slug' => $tour->slug,
            ]);
    }

    private function prepareCar(Car $car, array $input, int $cars): array
    {
        [$from, $to, $days] = $this->dateRange($input, 'pick-up and drop-off');

        $available = $car->availableUnits($from->toDateString(), $to->toDateString());
        if ($available < $cars) {
            throw ValidationException::withMessages(['quantity' => $available ? "Only {$available} car(s) available." : 'No cars available for these dates.']);
        }

        return $this->line($car, $car->name, $car->thumbnail ?? ($car->images[0] ?? null),
            $from->toDateString(), $to->toDateString(), $cars, $days, $car->price_per_day, [
                'pickup_city' => $car->destination?->name,
                'transmission' => $car->transmission,
                'seats' => $car->seats,
                'with_driver' => $car->with_driver,
            ]);
    }
}
