<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Flight;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** One-way flight search with airline/stops/price/time filters. */
class FlightController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $request->validate(['date' => ['nullable', 'date'], 'passengers' => ['nullable', 'integer', 'min:1', 'max:9']]);

        $query = Flight::where('status', 'active')->where('departure_at', '>', now());

        $query->when($request->filled('from'), fn ($q) => $q->where(fn ($w) => $w->where('from_city', 'like', '%'.$request->query('from').'%')->orWhere('from_code', $request->query('from'))))
            ->when($request->filled('to'), fn ($q) => $q->where(fn ($w) => $w->where('to_city', 'like', '%'.$request->query('to').'%')->orWhere('to_code', $request->query('to'))))
            ->when($request->filled('date'), fn ($q) => $q->whereDate('departure_at', $request->query('date')))
            ->when($request->filled('cabin'), fn ($q) => $q->where('cabin_class', $request->query('cabin')))
            ->when($request->filled('airlines'), fn ($q) => $q->whereIn('airline', (array) $request->query('airlines')))
            ->when($request->filled('stops'), fn ($q) => $q->whereIn('stops', (array) $request->query('stops')))
            ->when($request->filled('max_price'), fn ($q) => $q->where('price', '<=', $request->float('max_price')))
            ->when($request->boolean('refundable'), fn ($q) => $q->where('refundable', true));

        // Seats left = capacity − seats held by pending/confirmed bookings (computed in SQL so pagination stays accurate).
        $passengers = max(1, $request->integer('passengers', 1));
        $query->withSum(['bookings as booked_seats' => fn ($b) => $b->active()], 'quantity')
            ->whereRaw(
                'total_seats - (select coalesce(sum(quantity), 0) from bookings where bookings.bookable_type = ? and bookings.bookable_id = flights.id and bookings.status in (?, ?)) >= ?',
                ['flight', 'pending', 'confirmed', $passengers]
            );

        $durationSql = match ($query->getConnection()->getDriverName()) {
            'sqlite' => '(julianday(arrival_at) - julianday(departure_at))',
            'pgsql' => 'EXTRACT(EPOCH FROM (arrival_at - departure_at))',
            default => 'TIMESTAMPDIFF(MINUTE, departure_at, arrival_at)',
        };

        match ($request->query('sort', 'price_asc')) {
            'price_desc' => $query->orderByDesc('price'),
            'departure' => $query->orderBy('departure_at'),
            'duration' => $query->orderByRaw("{$durationSql} asc"),
            default => $query->orderBy('price'),
        };

        $flights = $query->paginate(min(50, $request->integer('per_page', 15)))->withQueryString();
        $flights->getCollection()->each(fn (Flight $f) => $f->setAttribute('seats_available', $f->total_seats - (int) $f->booked_seats));

        return response()->json($flights->toArray() + [
            'airlines' => Flight::where('status', 'active')->distinct()->orderBy('airline')->pluck('airline'),
        ]);
    }

    public function show(Flight $flight): JsonResponse
    {
        abort_unless($flight->status === 'active', 404);
        $flight->setAttribute('seats_available', $flight->seatsAvailable());

        return response()->json($flight);
    }
}
