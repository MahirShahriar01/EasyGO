<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Bus;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** Bus trip search and live seat map. */
class BusController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $request->validate(['date' => ['nullable', 'date']]);

        $query = Bus::where('status', 'active')->where('departure_at', '>', now())
            ->when($request->filled('from'), fn ($q) => $q->where('from_city', 'like', '%'.$request->query('from').'%'))
            ->when($request->filled('to'), fn ($q) => $q->where('to_city', 'like', '%'.$request->query('to').'%'))
            ->when($request->filled('date'), fn ($q) => $q->whereDate('departure_at', $request->query('date')))
            ->when($request->filled('bus_type'), fn ($q) => $q->whereIn('bus_type', (array) $request->query('bus_type')))
            ->when($request->filled('operators'), fn ($q) => $q->whereIn('operator', (array) $request->query('operators')))
            ->when($request->filled('max_price'), fn ($q) => $q->where('price', '<=', $request->float('max_price')));

        match ($request->query('sort', 'departure')) {
            'price_asc' => $query->orderBy('price'),
            'price_desc' => $query->orderByDesc('price'),
            default => $query->orderBy('departure_at'),
        };

        $buses = $query->paginate(min(50, $request->integer('per_page', 15)))->withQueryString();
        $buses->getCollection()->each(fn (Bus $b) => $b->setAttribute('seats_available', $b->seatsAvailable()));

        return response()->json($buses->toArray() + [
            'operators' => Bus::where('status', 'active')->distinct()->orderBy('operator')->pluck('operator'),
        ]);
    }

    public function show(Bus $bus): JsonResponse
    {
        abort_unless($bus->status === 'active', 404);

        return response()->json([
            'bus' => $bus,
            'seats' => $bus->seatLabels(),
            'booked_seats' => $bus->bookedSeats(),
        ]);
    }
}
