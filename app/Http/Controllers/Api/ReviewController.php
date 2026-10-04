<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Car;
use App\Models\Hotel;
use App\Models\Review;
use App\Models\RoomType;
use App\Models\Setting;
use App\Models\Tour;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

/** Verified reviews: only customers with a confirmed/completed booking may review. */
class ReviewController extends Controller
{
    private const TYPES = ['hotel' => Hotel::class, 'tour' => Tour::class, 'car' => Car::class];

    public function index(Request $request, string $type, int $id): JsonResponse
    {
        $model = $this->resolve($type, $id);

        return response()->json(
            $model->reviews()->approved()->with('user:id,name,avatar,country')->latest()->paginate(5)
        );
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'type' => ['required', Rule::in(array_keys(self::TYPES))],
            'id' => ['required', 'integer'],
            'rating' => ['required', 'integer', 'between:1,5'],
            'title' => ['nullable', 'string', 'max:120'],
            'comment' => ['required', 'string', 'min:10', 'max:2000'],
        ]);

        $user = $request->user();
        $model = $this->resolve($data['type'], $data['id']);
        $booking = $this->eligibleBooking($user->id, $data['type'], $model);

        if (! $booking) {
            throw ValidationException::withMessages(['rating' => 'You can review only after a confirmed booking.']);
        }
        if ($model->reviews()->where('user_id', $user->id)->exists()) {
            throw ValidationException::withMessages(['rating' => 'You have already reviewed this.']);
        }

        $review = $model->reviews()->create([
            'user_id' => $user->id,
            'booking_id' => $booking->id,
            'rating' => $data['rating'],
            'title' => $data['title'] ?? null,
            'comment' => $data['comment'],
            'status' => Setting::get('auto_approve_reviews') === '1' ? 'approved' : 'pending',
        ]);

        return response()->json([
            'review' => $review,
            'message' => $review->status === 'approved' ? 'Thanks! Your review is live.' : 'Thanks! Your review will appear after moderation.',
        ], 201);
    }

    public function mine(Request $request): JsonResponse
    {
        return response()->json($request->user()->reviews()->with('reviewable')->latest()->paginate(10));
    }

    private function resolve(string $type, int $id): Model
    {
        abort_unless(isset(self::TYPES[$type]), 404);

        return self::TYPES[$type]::findOrFail($id);
    }

    private function eligibleBooking(int $userId, string $type, Model $model): ?Booking
    {
        $query = Booking::where('user_id', $userId)->whereIn('status', ['confirmed', 'completed']);

        if ($type === 'hotel') {
            return $query->where('bookable_type', (new RoomType)->getMorphClass())
                ->whereIn('bookable_id', $model->roomTypes()->pluck('id'))->latest()->first();
        }

        return $query->where('bookable_type', $model->getMorphClass())->where('bookable_id', $model->getKey())->latest()->first();
    }
}
