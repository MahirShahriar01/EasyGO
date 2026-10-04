<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Payment;
use App\Services\BookingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/** Customer booking flow: quote → create (pending) → pay → manage / cancel. */
class BookingController extends Controller
{
    public function __construct(private readonly BookingService $bookings) {}

    /** Shared validation for the normalised booking line. */
    private function lineRules(): array
    {
        return [
            'service_type' => ['required', Rule::in(BookingService::SERVICES)],
            'item_id' => ['required', 'integer'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date'],
            'quantity' => ['nullable', 'integer', 'min:1', 'max:20'],
            'adults' => ['nullable', 'integer', 'min:1', 'max:40'],
            'children' => ['nullable', 'integer', 'min:0', 'max:20'],
            'seats' => ['nullable', 'array', 'max:6'],
            'seats.*' => ['string', 'max:5'],
            'passengers' => ['nullable', 'array', 'max:20'],
            'passengers.*.name' => ['required_with:passengers', 'string', 'max:100'],
            'passengers.*.passport' => ['nullable', 'string', 'max:50'],
            'coupon_code' => ['nullable', 'string', 'max:40'],
        ];
    }

    public function quote(Request $request): JsonResponse
    {
        $data = $request->validate($this->lineRules());

        return response()->json($this->bookings->quote($data, $request->user('sanctum')));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate($this->lineRules() + [
            'contact_name' => ['required', 'string', 'max:100'],
            'contact_email' => ['required', 'email', 'max:150'],
            'contact_phone' => ['required', 'string', 'max:30'],
            'special_requests' => ['nullable', 'string', 'max:1000'],
        ]);

        $booking = $this->bookings->create($request->user(), $data);

        return response()->json(['booking' => $booking, 'message' => 'Booking reserved. Complete payment to confirm.'], 201);
    }

    public function index(Request $request): JsonResponse
    {
        $query = $request->user()->bookings()->latest();

        match ($request->query('scope')) {
            'upcoming' => $query->whereIn('status', ['pending', 'confirmed'])->whereDate('start_date', '>=', today()),
            'past' => $query->where(fn ($q) => $q->where('status', 'completed')->orWhere(fn ($w) => $w->where('status', 'confirmed')->whereDate('start_date', '<', today()))),
            'cancelled' => $query->where('status', 'cancelled'),
            default => null,
        };

        $query->when($request->filled('service_type'), fn ($q) => $q->where('service_type', $request->query('service_type')));

        return response()->json($query->paginate(10)->withQueryString());
    }

    public function show(Request $request, Booking $booking): JsonResponse
    {
        $this->authorizeOwner($request, $booking);
        $booking->load('payments:id,booking_id,method,status,amount,transaction_id,paid_at,refunded_at,created_at');

        $reviewable = in_array($booking->service_type, ['hotel', 'tour', 'car'], true) && in_array($booking->status, ['confirmed', 'completed'], true);

        return response()->json([
            'booking' => $booking,
            'refund_estimate' => $booking->payment_status === 'paid' && $booking->can_cancel ? $this->bookings->refundAmount($booking) : 0,
            'can_review' => $reviewable,
            'review_target' => $reviewable ? $this->reviewTarget($booking) : null,
        ]);
    }

    public function pay(Request $request, Booking $booking): JsonResponse
    {
        $this->authorizeOwner($request, $booking);

        $data = $request->validate([
            'method' => ['required', Rule::in(Payment::METHODS)],
            'card_number' => ['required_if:method,card', 'nullable', 'string', 'max:25'],
            'card_name' => ['required_if:method,card', 'nullable', 'string', 'max:100'],
            'card_expiry' => ['required_if:method,card', 'nullable', 'string', 'regex:/^(0[1-9]|1[0-2])\/\d{2}$/'],
            'card_cvc' => ['required_if:method,card', 'nullable', 'digits_between:3,4'],
            'wallet_number' => ['required_if:method,bkash,nagad,rocket', 'nullable', 'string', 'max:20'],
            'otp' => ['required_if:method,bkash,nagad,rocket', 'nullable', 'string', 'max:6'],
        ]);

        $booking = $this->bookings->pay($booking, $data['method'], $data);

        return response()->json(['booking' => $booking, 'message' => 'Payment successful. Your booking is confirmed!']);
    }

    public function cancel(Request $request, Booking $booking): JsonResponse
    {
        $this->authorizeOwner($request, $booking);
        $data = $request->validate(['reason' => ['nullable', 'string', 'max:255']]);

        $booking = $this->bookings->cancel($booking, $data['reason'] ?? null);

        return response()->json([
            'booking' => $booking,
            'message' => $booking->refund_amount > 0 ? 'Booking cancelled. Your refund has been issued.' : 'Booking cancelled.',
        ]);
    }

    private function authorizeOwner(Request $request, Booking $booking): void
    {
        abort_unless($booking->user_id === $request->user()->id, 404);
    }

    /** @return array{type: string, id: int}|null */
    private function reviewTarget(Booking $booking): ?array
    {
        return match ($booking->service_type) {
            'hotel' => ['type' => 'hotel', 'id' => (int) ($booking->details['hotel_id'] ?? 0)],
            default => ['type' => $booking->service_type, 'id' => $booking->bookable_id],
        };
    }
}
