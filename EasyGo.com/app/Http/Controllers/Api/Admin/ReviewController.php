<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Review;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** Review moderation queue. */
class ReviewController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Review::with(['user:id,name,email', 'reviewable'])
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->query('status')))
            ->when($request->filled('rating'), fn ($q) => $q->where('rating', $request->integer('rating')))
            ->when($request->filled('q'), fn ($q) => $q->where(fn ($w) => $w->where('comment', 'like', '%'.$request->query('q').'%')->orWhere('title', 'like', '%'.$request->query('q').'%')))
            ->latest();

        $page = $query->paginate(15)->withQueryString();
        $page->getCollection()->transform(fn (Review $r) => $r->setAttribute('target', [
            'type' => $r->reviewable_type,
            'name' => $r->reviewable?->name ?? $r->reviewable?->title,
        ])->unsetRelation('reviewable'));

        return response()->json($page);
    }

    public function update(Request $request, Review $review): JsonResponse
    {
        $data = $request->validate(['status' => ['required', 'in:pending,approved,rejected']]);
        $review->update($data);

        return response()->json(['message' => 'Review '.$data['status'].'.']);
    }

    public function destroy(Review $review): JsonResponse
    {
        $review->delete();

        return response()->json(['message' => 'Review deleted.']);
    }
}
