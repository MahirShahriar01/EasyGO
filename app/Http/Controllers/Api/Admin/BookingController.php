<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Services\BookingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

/** Back-office booking management: search, inspect, status changes, cancel & refund, CSV export. */
class BookingController extends Controller
{
    public function __construct(private readonly BookingService $bookings) {}

    private function filtered(Request $request)
    {
        return Booking::with('user:id,name,email')
            ->when($request->filled('q'), fn ($q) => $q->where(fn ($w) => $w
                ->where('reference', 'like', '%'.$request->query('q').'%')
                ->orWhere('contact_name', 'like', '%'.$request->query('q').'%')
                ->orWhere('contact_email', 'like', '%'.$request->query('q').'%')
                ->orWhere('item_name', 'like', '%'.$request->query('q').'%')))
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->query('status')))
            ->when($request->filled('payment_status'), fn ($q) => $q->where('payment_status', $request->query('payment_status')))
            ->when($request->filled('service_type'), fn ($q) => $q->where('service_type', $request->query('service_type')))
            ->when($request->filled('from'), fn ($q) => $q->whereDate('created_at', '>=', $request->query('from')))
            ->when($request->filled('to'), fn ($q) => $q->whereDate('created_at', '<=', $request->query('to')))
            ->latest();
    }

    public function index(Request $request): JsonResponse
    {
        return response()->json($this->filtered($request)->paginate(min(100, $request->integer('per_page', 15)))->withQueryString());
    }

    public function show(Booking $booking): JsonResponse
    {
        return response()->json($booking->load(['user', 'payments', 'coupon:id,code']));
    }

    /** Manual status override (e.g. mark completed, confirm an offline payment). */
    public function update(Request $request, Booking $booking): JsonResponse
    {
        $data = $request->validate([
            'status' => ['sometimes', 'in:pending,confirmed,completed'],
            'payment_status' => ['sometimes', 'in:unpaid,paid'],
        ]);

        if (($data['status'] ?? null) === 'confirmed' && ! $booking->confirmed_at) {
            $data['confirmed_at'] = now();
        }

        $booking->forceFill($data)->save();

        return response()->json(['booking' => $booking->fresh(), 'message' => 'Booking updated.']);
    }

    /** Cancel on behalf of the customer with a full refund of any payment. */
    public function cancel(Request $request, Booking $booking): JsonResponse
    {
        $data = $request->validate(['reason' => ['nullable', 'string', 'max:255']]);

        return response()->json([
            'booking' => $this->bookings->cancel($booking, $data['reason'] ?? null, byAdmin: true),
            'message' => 'Booking cancelled and refunded.',
        ]);
    }

    public function export(Request $request): StreamedResponse
    {
        $query = $this->filtered($request);

        return response()->streamDownload(function () use ($query) {
            $out = fopen('php://output', 'w');
            fputcsv($out, ['Reference', 'Created', 'Customer', 'Email', 'Service', 'Item', 'Start', 'End', 'Qty', 'Total', 'Currency', 'Status', 'Payment']);
            $query->chunk(500, function ($rows) use ($out) {
                foreach ($rows as $b) {
                    fputcsv($out, [
                        $b->reference, $b->created_at->toDateTimeString(), $b->contact_name, $b->contact_email, $b->service_type,
                        $b->item_name, $b->start_date?->toDateString(), $b->end_date?->toDateString(), $b->quantity,
                        $b->total, $b->currency, $b->status, $b->payment_status,
                    ]);
                }
            });
            fclose($out);
        }, 'easygo-bookings-'.now()->format('Ymd-His').'.csv', ['Content-Type' => 'text/csv']);
    }
}
