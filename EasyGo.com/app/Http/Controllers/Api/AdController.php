<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Ad;
use App\Models\AdEvent;
use App\Services\AdService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/**
 * Public ad delivery endpoints used by <AdSlot> / <InterstitialAd> in the SPA.
 */
class AdController extends Controller
{
    public function __construct(private readonly AdService $ads) {}

    /** GET /api/ads/serve?zones[]=home_top&zones[]=interstitial_global&viewer=…&device=mobile */
    public function serve(Request $request): JsonResponse
    {
        $data = $request->validate([
            'zones' => ['required', 'array', 'max:12'],
            'zones.*' => ['string', 'max:60'],
            'viewer' => ['nullable', 'string', 'max:64'],
            'device' => ['nullable', Rule::in(['desktop', 'mobile'])],
        ]);

        $ctx = $this->context($request, $data['viewer'] ?? null, $data['device'] ?? null);
        $out = [];

        foreach (array_unique($data['zones']) as $key) {
            $out[$key] = $this->ads->serve($key, $ctx);
        }

        return response()->json($out);
    }

    /** POST /api/ads/{ad}/events  {event, zone, viewer, device} */
    public function event(Request $request, Ad $ad): JsonResponse
    {
        $data = $request->validate([
            'event' => ['required', Rule::in(array_diff(AdEvent::EVENTS, ['click']))],
            'zone' => ['nullable', 'string', 'max:60'],
            'viewer' => ['nullable', 'string', 'max:64'],
            'device' => ['nullable', Rule::in(['desktop', 'mobile'])],
        ]);

        $this->ads->record($ad, $data['event'], $data['zone'] ?? null, $this->context($request, $data['viewer'] ?? null, $data['device'] ?? null));

        return response()->json(['ok' => true]);
    }

    /** GET /ads/{ad}/click?zone=…&v=… — logs the click, then redirects to the advertiser. */
    public function click(Request $request, Ad $ad): RedirectResponse
    {
        abort_if(blank($ad->click_url), 404);

        $this->ads->record($ad, 'click', $request->query('zone'), $this->context($request, $request->query('v'), $request->query('d')));

        // Site-relative targets stay on EasyGo; absolute URLs leave to the advertiser.
        return str_starts_with($ad->click_url, '/') && ! str_starts_with($ad->click_url, '//')
            ? redirect($ad->click_url)
            : redirect()->away($ad->click_url);
    }

    /** @return array{user: mixed, viewer_id: ?string, device: string, ip: ?string} */
    private function context(Request $request, ?string $viewer, ?string $device): array
    {
        $device ??= preg_match('/Mobile|Android|iPhone|iPad/i', (string) $request->userAgent()) ? 'mobile' : 'desktop';

        return [
            'user' => $request->user('sanctum'),
            'viewer_id' => $viewer,
            'device' => $device === 'mobile' ? 'mobile' : 'desktop',
            'ip' => $request->ip(),
        ];
    }
}
