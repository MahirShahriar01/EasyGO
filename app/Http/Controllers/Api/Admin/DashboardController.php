<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Ad;
use App\Models\AdEvent;
use App\Models\Booking;
use App\Models\ContactMessage;
use App\Models\Hotel;
use App\Models\Review;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

/** KPIs and chart series for the admin dashboard. */
class DashboardController extends Controller
{
    public function __invoke(): JsonResponse
    {
        $paid = Booking::where('payment_status', 'paid');
        $monthStart = now()->startOfMonth();
        $lastMonthStart = now()->subMonthNoOverflow()->startOfMonth();

        $revenueThisMonth = (float) (clone $paid)->where('created_at', '>=', $monthStart)->sum('total');
        $revenueLastMonth = (float) (clone $paid)->whereBetween('created_at', [$lastMonthStart, $monthStart])->sum('total');

        // Revenue + bookings per day for the last 30 days.
        $since = now()->subDays(29)->startOfDay();
        $daily = Booking::where('created_at', '>=', $since)
            ->select(DB::raw('DATE(created_at) as day'), DB::raw('COUNT(*) as bookings'),
                DB::raw("SUM(CASE WHEN payment_status = 'paid' THEN total ELSE 0 END) as revenue"))
            ->groupBy('day')->get()->keyBy('day');

        $series = [];
        for ($d = $since->copy(); $d->lte(today()); $d->addDay()) {
            $row = $daily->get($d->toDateString());
            $series[] = ['date' => $d->toDateString(), 'bookings' => (int) ($row->bookings ?? 0), 'revenue' => (float) ($row->revenue ?? 0)];
        }

        $impressions = AdEvent::where('event', 'impression')->where('created_at', '>=', $since)->count();
        $clicks = AdEvent::where('event', 'click')->where('created_at', '>=', $since)->count();

        return response()->json([
            'kpis' => [
                'revenue_total' => (float) (clone $paid)->sum('total'),
                'revenue_month' => $revenueThisMonth,
                'revenue_growth' => $revenueLastMonth > 0 ? round(($revenueThisMonth - $revenueLastMonth) / $revenueLastMonth * 100, 1) : null,
                'bookings_total' => Booking::count(),
                'bookings_pending' => Booking::where('status', 'pending')->count(),
                'bookings_today' => Booking::whereDate('created_at', today())->count(),
                'customers' => User::where('role', 'customer')->count(),
                'new_customers_month' => User::where('role', 'customer')->where('created_at', '>=', $monthStart)->count(),
                'hotels' => Hotel::count(),
                'reviews_pending' => Review::where('status', 'pending')->count(),
                'messages_new' => ContactMessage::where('status', 'new')->count(),
                'ads_running' => Ad::deliverable()->count(),
                'ad_impressions_30d' => $impressions,
                'ad_ctr_30d' => $impressions ? round($clicks / $impressions * 100, 2) : 0,
            ],
            'series' => $series,
            'by_service' => Booking::where('status', '!=', 'cancelled')
                ->select('service_type', DB::raw('COUNT(*) as bookings'), DB::raw('SUM(total) as revenue'))
                ->groupBy('service_type')->get(),
            'by_status' => Booking::select('status', DB::raw('COUNT(*) as total'))->groupBy('status')->pluck('total', 'status'),
            'recent_bookings' => Booking::with('user:id,name')->latest()->take(8)->get(),
            'top_hotels' => Hotel::orderByDesc('avg_rating')->orderByDesc('reviews_count')->take(5)
                ->get(['id', 'name', 'slug', 'avg_rating', 'reviews_count', 'min_price', 'thumbnail', 'images']),
        ]);
    }
}
