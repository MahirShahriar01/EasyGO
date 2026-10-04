<?php

namespace App\Services;

use App\Models\Ad;
use App\Models\AdEvent;
use App\Models\AdZone;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Ad delivery engine.
 *
 * serve():  zone key + viewer context  →  ordered list of eligible creatives
 * record(): impression / click / skip / close / complete tracking
 * stats():  aggregated analytics for the admin panel
 */
class AdService
{
    /**
     * Pick the ads to show in a zone for the current viewer.
     *
     * @param  array{user: ?User, viewer_id: ?string, device: string}  $ctx
     * @return array{zone: array<string, mixed>, ads: array<int, array<string, mixed>>}|null
     */
    public function serve(string $zoneKey, array $ctx): ?array
    {
        if (Setting::get('ads_enabled', '1') !== '1') {
            return null;
        }

        $zone = AdZone::where('key', $zoneKey)->where('is_active', true)->first();
        if (! $zone) {
            return null;
        }

        $audiences = ['all', $ctx['user'] ? 'auth' : 'guest'];
        $devices = ['all', $ctx['device'] === 'mobile' ? 'mobile' : 'desktop'];

        $candidates = $zone->ads()
            ->deliverable()
            ->whereIn('audience', $audiences)
            ->whereIn('device', $devices)
            ->get();

        $candidates = $this->applyFrequencyCaps($candidates, $ctx);
        $picked = $this->weightedSample($candidates, max(1, $zone->max_ads));

        return [
            'zone' => [
                'key' => $zone->key,
                'placement' => $zone->placement,
                'width' => $zone->width,
                'height' => $zone->height,
                'rotation_seconds' => $zone->rotation_seconds,
            ],
            'ads' => $picked->map(fn (Ad $ad) => $this->present($ad, $zone))->values()->all(),
        ];
    }

    /** Public payload for one creative — never exposes budgets or counters. */
    public function present(Ad $ad, AdZone $zone): array
    {
        return [
            'id' => $ad->id,
            'title' => $ad->title,
            'advertiser' => $ad->advertiser,
            'media_type' => $ad->media_type,
            'media_src' => $ad->media_src,
            'poster_src' => $ad->poster_src,
            'headline' => $ad->headline,
            'cta_label' => $ad->cta_label,
            'has_link' => filled($ad->click_url),
            'click_url' => filled($ad->click_url) ? url("/ads/{$ad->id}/click?zone={$zone->key}") : null,
            'open_in_new_tab' => $ad->open_in_new_tab,
            'closable' => $ad->closable,
            'skip_after_seconds' => $ad->skip_after_seconds,
            'auto_close_seconds' => $ad->auto_close_seconds,
            'frequency_cap' => $ad->frequency_cap,
        ];
    }

    /**
     * Log an interaction and bump the denormalised counters used for budgets.
     *
     * @param  array{user: ?User, viewer_id: ?string, device: string, ip: ?string}  $ctx
     */
    public function record(Ad $ad, string $event, ?string $zoneKey, array $ctx): void
    {
        $zoneId = $zoneKey ? AdZone::where('key', $zoneKey)->value('id') : null;

        DB::transaction(function () use ($ad, $event, $zoneId, $ctx) {
            AdEvent::create([
                'ad_id' => $ad->id,
                'ad_zone_id' => $zoneId,
                'event' => $event,
                'user_id' => $ctx['user']?->id,
                'viewer_id' => $ctx['viewer_id'] ? substr($ctx['viewer_id'], 0, 64) : null,
                'ip_hash' => $ctx['ip'] ? hash('sha256', $ctx['ip'].config('app.key')) : null,
                'device' => $ctx['device'],
            ]);

            if ($event === 'impression') {
                $ad->increment('impressions_count');
            } elseif ($event === 'click') {
                $ad->increment('clicks_count');
            }
        });
    }

    /**
     * Analytics for one ad (or all ads when $ad is null) over the last N days.
     *
     * @return array<string, mixed>
     */
    public function stats(?Ad $ad = null, int $days = 30): array
    {
        $since = now()->subDays($days - 1)->startOfDay();
        // Columns are table-qualified because the by-zone query joins ad_zones (which also has created_at).
        $base = AdEvent::query()->where('ad_events.created_at', '>=', $since)->when($ad, fn ($q) => $q->where('ad_events.ad_id', $ad->id));

        $totals = (clone $base)->select('event', DB::raw('COUNT(*) as total'))->groupBy('event')->pluck('total', 'event');

        $daily = (clone $base)
            ->whereIn('event', ['impression', 'click'])
            ->select(DB::raw('DATE(created_at) as day'), 'event', DB::raw('COUNT(*) as total'))
            ->groupBy('day', 'event')
            ->get()
            ->groupBy('day');

        $series = [];
        for ($d = $since->copy(); $d->lte(today()); $d->addDay()) {
            $key = $d->toDateString();
            $rows = $daily->get($key, collect())->pluck('total', 'event');
            $series[] = ['date' => $key, 'impressions' => (int) ($rows['impression'] ?? 0), 'clicks' => (int) ($rows['click'] ?? 0)];
        }

        $byZone = (clone $base)
            ->whereIn('ad_events.event', ['impression', 'click'])
            ->leftJoin('ad_zones', 'ad_zones.id', '=', 'ad_events.ad_zone_id')
            ->select(DB::raw("COALESCE(ad_zones.name, 'Unknown') as zone"), 'ad_events.event', DB::raw('COUNT(*) as total'))
            ->groupBy('zone', 'ad_events.event')
            ->get()
            ->groupBy('zone')
            ->map(function ($rows, $zone) {
                $i = (int) $rows->firstWhere('event', 'impression')?->total;
                $c = (int) $rows->firstWhere('event', 'click')?->total;

                return ['zone' => $zone, 'impressions' => $i, 'clicks' => $c, 'ctr' => $i ? round($c / $i * 100, 2) : 0];
            })->values();

        $byDevice = (clone $base)->where('event', 'impression')
            ->select(DB::raw("COALESCE(device, 'unknown') as device"), DB::raw('COUNT(*) as total'))
            ->groupBy('device')->pluck('total', 'device');

        $impressions = (int) ($totals['impression'] ?? 0);
        $clicks = (int) ($totals['click'] ?? 0);

        return [
            'impressions' => $impressions,
            'clicks' => $clicks,
            'skips' => (int) ($totals['skip'] ?? 0),
            'closes' => (int) ($totals['close'] ?? 0),
            'completes' => (int) ($totals['complete'] ?? 0),
            'ctr' => $impressions ? round($clicks / $impressions * 100, 2) : 0,
            'unique_viewers' => (clone $base)->where('event', 'impression')->distinct()->count('viewer_id'),
            'daily' => $series,
            'by_zone' => $byZone,
            'by_device' => $byDevice,
        ];
    }

    /** Remove ads whose per-viewer daily impression cap has been reached. */
    private function applyFrequencyCaps(Collection $ads, array $ctx): Collection
    {
        $capped = $ads->filter(fn (Ad $ad) => $ad->frequency_cap);
        if ($capped->isEmpty() || (! $ctx['viewer_id'] && ! $ctx['user'])) {
            return $ads;
        }

        $seen = AdEvent::query()
            ->whereIn('ad_id', $capped->pluck('id'))
            ->where('event', 'impression')
            ->where('created_at', '>=', today())
            ->where(function ($q) use ($ctx) {
                if ($ctx['viewer_id']) {
                    $q->orWhere('viewer_id', $ctx['viewer_id']);
                }
                if ($ctx['user']) {
                    $q->orWhere('user_id', $ctx['user']->id);
                }
            })
            ->select('ad_id', DB::raw('COUNT(*) as total'))
            ->groupBy('ad_id')
            ->pluck('total', 'ad_id');

        return $ads->reject(fn (Ad $ad) => $ad->frequency_cap && ($seen[$ad->id] ?? 0) >= $ad->frequency_cap)->values();
    }

    /** Weighted random sampling without replacement (higher weight → shown more often / first). */
    private function weightedSample(Collection $ads, int $count): Collection
    {
        $pool = $ads->all();
        $picked = collect();

        while ($pool && $picked->count() < $count) {
            $total = array_sum(array_map(fn (Ad $a) => max(1, $a->weight), $pool));
            $roll = random_int(1, $total);

            foreach ($pool as $i => $ad) {
                $roll -= max(1, $ad->weight);
                if ($roll <= 0) {
                    $picked->push($ad);
                    unset($pool[$i]);
                    break;
                }
            }
        }

        return $picked;
    }
}
