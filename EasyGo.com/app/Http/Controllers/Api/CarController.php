<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Car;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** Car rental search by pickup city and dates. */
class CarController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $request->validate(['pickup_date' => ['nullable', 'date'], 'dropoff_date' => ['nullable', 'date', 'after:pickup_date']]);

        $query = Car::where('status', 'active')->with('destination:id,name,slug')
            ->when($request->filled('location'), fn ($q) => $q->whereHas('destination', fn ($d) => $d->where('name', 'like', '%'.$request->query('location').'%')))
            ->when($request->filled('car_type'), fn ($q) => $q->whereIn('car_type', (array) $request->query('car_type')))
            ->when($request->filled('transmission'), fn ($q) => $q->where('transmission', $request->query('transmission')))
            ->when($request->filled('seats'), fn ($q) => $q->where('seats', '>=', $request->integer('seats')))
            ->when($request->boolean('with_driver'), fn ($q) => $q->where('with_driver', true))
            ->when($request->filled('max_price'), fn ($q) => $q->where('price_per_day', '<=', $request->float('max_price')));

        match ($request->query('sort', 'price_asc')) {
            'price_desc' => $query->orderByDesc('price_per_day'),
            'rating' => $query->orderByDesc('avg_rating'),
            default => $query->orderBy('price_per_day'),
        };

        $cars = $query->paginate(min(48, $request->integer('per_page', 12)))->withQueryString();

        if ($request->filled(['pickup_date', 'dropoff_date'])) {
            $cars->getCollection()->each(fn (Car $car) => $car->setAttribute(
                'available', $car->availableUnits($request->query('pickup_date'), $request->query('dropoff_date')) > 0
            ));
        }

        return response()->json($cars);
    }

    public function show(Request $request, Car $car): JsonResponse
    {
        abort_unless($car->status === 'active', 404);
        $car->load('destination');

        if ($request->filled(['pickup_date', 'dropoff_date'])) {
            $car->setAttribute('available_units', $car->availableUnits($request->query('pickup_date'), $request->query('dropoff_date')));
        }

        return response()->json(['car' => $car]);
    }
}
