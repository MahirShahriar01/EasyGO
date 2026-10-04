<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Car;
use App\Models\Hotel;
use App\Models\Tour;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/** Saved hotels, tours and cars. */
class WishlistController extends Controller
{
    private const TYPES = ['hotel' => Hotel::class, 'tour' => Tour::class, 'car' => Car::class];

    public function index(Request $request): JsonResponse
    {
        $items = $request->user()->wishlists()->with(['wishlistable' => fn ($m) => $m->with('destination:id,name,slug,country')])->latest()->get()
            ->filter(fn ($w) => $w->wishlistable)
            ->map(fn ($w) => ['id' => $w->id, 'type' => $w->wishlistable_type, 'item' => $w->wishlistable])
            ->values();

        return response()->json($items);
    }

    /** Compact list of "type:id" keys so the UI can render filled hearts. */
    public function keys(Request $request): JsonResponse
    {
        return response()->json(
            $request->user()->wishlists()->get(['wishlistable_type', 'wishlistable_id'])
                ->map(fn ($w) => "{$w->wishlistable_type}:{$w->wishlistable_id}")
        );
    }

    public function toggle(Request $request): JsonResponse
    {
        $data = $request->validate([
            'type' => ['required', Rule::in(array_keys(self::TYPES))],
            'id' => ['required', 'integer'],
        ]);

        $model = self::TYPES[$data['type']]::findOrFail($data['id']);
        $existing = $request->user()->wishlists()
            ->where('wishlistable_type', $model->getMorphClass())
            ->where('wishlistable_id', $model->getKey())
            ->first();

        if ($existing) {
            $existing->delete();

            return response()->json(['saved' => false, 'message' => 'Removed from your wishlist.']);
        }

        $request->user()->wishlists()->create([
            'wishlistable_type' => $model->getMorphClass(),
            'wishlistable_id' => $model->getKey(),
        ]);

        return response()->json(['saved' => true, 'message' => 'Saved to your wishlist.']);
    }
}
