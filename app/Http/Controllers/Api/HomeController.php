<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Bus;
use App\Models\Car;
use App\Models\Destination;
use App\Models\Flight;
use App\Models\Hotel;
use App\Models\Review;
use App\Models\Setting;
use App\Models\Tour;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

/** Landing-page aggregates, public settings and location autocomplete. */
class HomeController extends Controller
{
    public function home(): JsonResponse
    {
        // Cached as plain arrays: the cache store only unserializes allow-listed classes, not Eloquent models.
        $data = Cache::remember('easygo.home', now()->addMinutes(5), function () {
            return json_decode(json_encode([
                'destinations' => Destination::active()->withCount(['hotels', 'tours'])
                    ->orderByDesc('is_featured')->orderBy('name')->take(8)->get(),
                'featured_hotels' => Hotel::active()->with('destination:id,name,slug')
                    ->orderByDesc('is_featured')->orderByDesc('avg_rating')->take(8)->get(),
                'featured_tours' => Tour::active()->with('destination:id,name,slug')
                    ->orderByDesc('is_featured')->orderByDesc('avg_rating')->take(6)->get(),
                'cars' => Car::where('status', 'active')->with('destination:id,name')->orderByDesc('avg_rating')->take(4)->get(),
                'flight_deals' => Flight::where('status', 'active')->where('departure_at', '>', now())
                    ->orderBy('price')->take(4)->get(),
                'testimonials' => Review::approved()->with('user:id,name,avatar')->where('rating', '>=', 4)
                    ->latest()->take(6)->get(['id', 'user_id', 'rating', 'title', 'comment', 'created_at']),
                'stats' => [
                    'hotels' => Hotel::active()->count(),
                    'destinations' => Destination::active()->count(),
                    'travellers' => User::where('role', 'customer')->count() + 12000,
                    'bookings' => Booking::count() + 48000,
                ],
            ]), true);
        });

        return response()->json($data);
    }

    public function settings(): JsonResponse
    {
        return response()->json(Setting::publicSettings());
    }

    /** Autocomplete for search boxes: destinations, plus flight/bus cities. */
    public function suggest(Request $request): JsonResponse
    {
        $q = trim((string) $request->query('q', ''));
        $type = $request->query('type', 'destination');

        $results = match ($type) {
            'flight' => Flight::query()
                ->selectRaw('from_city as city, from_code as code')->where('from_city', 'like', "%{$q}%")
                ->union(Flight::query()->selectRaw('to_city as city, to_code as code')->where('to_city', 'like', "%{$q}%"))
                ->get()->unique('city')->take(8)->map(fn ($r) => ['label' => "{$r->city} ({$r->code})", 'value' => $r->city])->values(),
            'bus' => Bus::query()->select('from_city as city')->where('from_city', 'like', "%{$q}%")
                ->union(Bus::query()->select('to_city as city')->where('to_city', 'like', "%{$q}%"))
                ->get()->unique('city')->take(8)->map(fn ($r) => ['label' => $r->city, 'value' => $r->city])->values(),
            default => Destination::active()->where(fn ($w) => $w->where('name', 'like', "%{$q}%")->orWhere('country', 'like', "%{$q}%"))
                ->take(8)->get(['id', 'name', 'country', 'slug'])
                ->map(fn ($d) => ['label' => "{$d->name}, {$d->country}", 'value' => $d->name, 'slug' => $d->slug]),
        };

        return response()->json($results);
    }
}
