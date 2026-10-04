<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Tour;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** Tour package catalogue and details. */
class TourController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Tour::active()->with('destination:id,name,slug,country');

        if ($q = trim((string) $request->query('q', $request->query('destination', '')))) {
            $query->where(fn ($w) => $w->where('title', 'like', "%{$q}%")
                ->orWhereHas('destination', fn ($d) => $d->where('name', 'like', "%{$q}%")->orWhere('country', 'like', "%{$q}%")));
        }

        $query->when($request->filled('category'), fn ($q) => $q->whereIn('category', (array) $request->query('category')))
            ->when($request->filled('max_days'), fn ($q) => $q->where('duration_days', '<=', $request->integer('max_days')))
            ->when($request->filled('min_days'), fn ($q) => $q->where('duration_days', '>=', $request->integer('min_days')))
            ->when($request->filled('max_price'), fn ($q) => $q->whereRaw('COALESCE(discount_price, price) <= ?', [$request->float('max_price')]))
            ->when($request->filled('date'), fn ($q) => $q
                ->where(fn ($w) => $w->whereNull('available_from')->orWhere('available_from', '<=', $request->query('date')))
                ->where(fn ($w) => $w->whereNull('available_to')->orWhere('available_to', '>=', $request->query('date'))));

        match ($request->query('sort', 'recommended')) {
            'price_asc' => $query->orderByRaw('COALESCE(discount_price, price) asc'),
            'price_desc' => $query->orderByRaw('COALESCE(discount_price, price) desc'),
            'rating' => $query->orderByDesc('avg_rating'),
            'duration' => $query->orderBy('duration_days'),
            default => $query->orderByDesc('is_featured')->orderByDesc('avg_rating'),
        };

        return response()->json($query->paginate(min(48, $request->integer('per_page', 12)))->withQueryString());
    }

    public function show(Request $request, Tour $tour): JsonResponse
    {
        abort_unless($tour->status === 'active', 404);
        $tour->load('destination');

        if ($date = $request->query('date')) {
            $tour->setAttribute('spots_left', $tour->spotsLeft($date));
        }

        return response()->json([
            'tour' => $tour,
            'similar' => Tour::active()->with('destination:id,name,slug,country')->whereKeyNot($tour->id)
                ->where(fn ($q) => $q->where('destination_id', $tour->destination_id)->orWhere('category', $tour->category))
                ->take(3)->get(),
        ]);
    }
}
