<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Hotel;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** Hotel search (filters, sorting, availability) and hotel details with room availability. */
class HotelController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'check_in' => ['nullable', 'date'],
            'check_out' => ['nullable', 'date', 'after:check_in'],
            'min_price' => ['nullable', 'numeric', 'min:0'],
            'max_price' => ['nullable', 'numeric', 'min:0'],
        ]);

        $query = Hotel::active()->with('destination:id,name,slug,country');

        if ($q = trim((string) $request->query('q', $request->query('destination', '')))) {
            $query->where(function ($w) use ($q) {
                $w->where('name', 'like', "%{$q}%")
                    ->orWhere('address', 'like', "%{$q}%")
                    ->orWhereHas('destination', fn ($d) => $d->where('name', 'like', "%{$q}%")->orWhere('country', 'like', "%{$q}%"));
            });
        }

        $query->when($request->filled('min_price'), fn ($q) => $q->where('min_price', '>=', $request->float('min_price')))
            ->when($request->filled('max_price'), fn ($q) => $q->where('min_price', '<=', $request->float('max_price')))
            ->when($request->filled('stars'), fn ($q) => $q->whereIn('star_rating', (array) $request->query('stars')))
            ->when($request->filled('property_type'), fn ($q) => $q->whereIn('property_type', (array) $request->query('property_type')))
            ->when($request->filled('min_rating'), fn ($q) => $q->where('avg_rating', '>=', $request->float('min_rating')));

        foreach ((array) $request->query('amenities', []) as $amenity) {
            $query->whereJsonContains('amenities', $amenity);
        }

        // Guests: only show properties with a room type big enough for one room's occupancy.
        if ($adults = $request->integer('adults')) {
            $rooms = max(1, $request->integer('rooms', 1));
            $query->whereHas('roomTypes', fn ($r) => $r->where('status', 'active')->where('max_adults', '>=', (int) ceil($adults / $rooms)));
        }

        match ($request->query('sort', 'recommended')) {
            'price_asc' => $query->orderBy('min_price'),
            'price_desc' => $query->orderByDesc('min_price'),
            'rating' => $query->orderByDesc('avg_rating'),
            'stars' => $query->orderByDesc('star_rating'),
            'newest' => $query->latest(),
            default => $query->orderByDesc('is_featured')->orderByDesc('avg_rating'),
        };

        $results = $query->paginate(min(48, $request->integer('per_page', 12)))->withQueryString();

        // With dates: flag hotels that have no room left so the UI can grey them out.
        if ($request->filled(['check_in', 'check_out'])) {
            $results->getCollection()->load('roomTypes')->each(function (Hotel $hotel) use ($request) {
                $hotel->setAttribute('available', $hotel->roomTypes->contains(
                    fn ($room) => $room->status === 'active' && $room->availableRooms($request->query('check_in'), $request->query('check_out')) > 0
                ));
                $hotel->unsetRelation('roomTypes');
            });
        }

        return response()->json($results);
    }

    public function show(Request $request, Hotel $hotel): JsonResponse
    {
        abort_unless($hotel->status === 'active', 404);

        $hotel->load(['destination', 'roomTypes' => fn ($q) => $q->where('status', 'active')->orderBy('price_per_night')]);

        $checkIn = $request->query('check_in');
        $checkOut = $request->query('check_out');

        $hotel->roomTypes->each(function ($room) use ($checkIn, $checkOut) {
            $room->setAttribute('available_rooms', $checkIn && $checkOut && $checkOut > $checkIn
                ? $room->availableRooms($checkIn, $checkOut)
                : $room->total_rooms);
        });

        return response()->json([
            'hotel' => $hotel,
            'amenity_labels' => Hotel::AMENITIES,
            'rating_breakdown' => $hotel->reviews()->approved()->selectRaw('rating, COUNT(*) as total')->groupBy('rating')->pluck('total', 'rating'),
            'similar' => Hotel::active()->with('destination:id,name,slug,country')->where('destination_id', $hotel->destination_id)->whereKeyNot($hotel->id)->take(4)->get(),
        ]);
    }
}
