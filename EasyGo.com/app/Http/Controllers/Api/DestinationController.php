<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Destination;
use Illuminate\Http\JsonResponse;

class DestinationController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(
            Destination::active()->withCount(['hotels', 'tours', 'cars'])->orderByDesc('is_featured')->orderBy('name')->get()
        );
    }

    public function show(Destination $destination): JsonResponse
    {
        abort_unless($destination->status === 'active', 404);

        return response()->json([
            'destination' => $destination,
            'hotels' => $destination->hotels()->active()->with('destination:id,name,slug,country')->orderByDesc('avg_rating')->take(8)->get(),
            'tours' => $destination->tours()->active()->with('destination:id,name,slug,country')->orderByDesc('avg_rating')->take(6)->get(),
            'cars' => $destination->cars()->where('status', 'active')->with('destination:id,name,slug,country')->take(4)->get(),
        ]);
    }
}
