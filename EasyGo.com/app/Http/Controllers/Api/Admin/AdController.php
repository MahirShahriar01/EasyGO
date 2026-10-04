<?php

namespace App\Http\Controllers\Api\Admin;

use App\Models\Ad;
use App\Services\AdService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

/**
 * Admin management of ad creatives: upload image/video media, choose zones,
 * schedule, targeting, budgets, frequency caps and skip/close timing.
 *
 * Requests are multipart/form-data so that media files can be uploaded.
 */
class AdController extends CrudController
{
    /** Max upload size in kilobytes (50 MB). Keep in sync with php.ini upload_max_filesize. */
    public const MAX_UPLOAD_KB = 51200;

    public const IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];

    public const VIDEO_MIMES = ['video/mp4', 'video/webm', 'video/ogg'];

    protected string $model = Ad::class;

    protected array $searchable = ['title', 'advertiser', 'headline'];

    protected array $filterable = ['status', 'media_type'];

    protected array $sortable = ['id', 'title', 'impressions_count', 'clicks_count', 'starts_at', 'ends_at', 'created_at'];

    protected array $with = ['zones:id,key,name,placement'];

    public function __construct(private readonly AdService $ads) {}

    public function index(Request $request): JsonResponse
    {
        $response = parent::index($request);
        $data = $response->getData(true);
        // Attach the computed delivery state ("running", "scheduled", "expired"...).
        $states = Ad::whereIn('id', collect($data['data'])->pluck('id'))->get()->mapWithKeys(fn (Ad $a) => [$a->id => $a->deliveryState()]);
        $data['data'] = collect($data['data'])->map(fn ($row) => $row + ['delivery_state' => $states[$row['id']] ?? null])->all();

        return response()->json($data);
    }

    /** Optional ?zone_id= filter shows only ads assigned to that zone. */
    protected function query(): Builder
    {
        $zoneId = request()->query('zone_id');

        return Ad::query()->when($zoneId, fn ($q) => $q->whereHas('zones', fn ($z) => $z->whereKey($zoneId)));
    }

    protected function rules(Request $request, ?Model $item = null): array
    {
        $needsMedia = ! $item && ! $request->filled('media_url');

        return [
            'title' => ['required', 'string', 'max:150'],
            'advertiser' => ['nullable', 'string', 'max:150'],
            'media' => [$needsMedia ? 'required' : 'nullable', 'file', 'max:'.self::MAX_UPLOAD_KB,
                'mimetypes:'.implode(',', array_merge(self::IMAGE_MIMES, self::VIDEO_MIMES))],
            'media_url' => ['nullable', 'url', 'max:500'],
            'media_type' => ['nullable', Rule::in(['image', 'video'])],
            'poster' => ['nullable', 'image', 'max:5120'],
            'headline' => ['nullable', 'string', 'max:150'],
            'cta_label' => ['nullable', 'string', 'max:40'],
            // Absolute http(s) URL for external advertisers, or a site-relative path ("/tours?q=Bali").
            'click_url' => ['nullable', 'string', 'max:500', 'regex:/^(https?:\/\/[^\s]+|\/[^\s]*)$/'],
            'open_in_new_tab' => ['boolean'],
            'closable' => ['boolean'],
            'skip_after_seconds' => ['required', 'integer', 'between:0,120'],
            'auto_close_seconds' => ['nullable', 'integer', 'between:3,600'],
            'audience' => ['required', Rule::in(['all', 'guest', 'auth'])],
            'device' => ['required', Rule::in(['all', 'desktop', 'mobile'])],
            'weight' => ['required', 'integer', 'between:1,10'],
            'frequency_cap' => ['nullable', 'integer', 'between:1,1000'],
            'max_impressions' => ['nullable', 'integer', 'min:1'],
            'max_clicks' => ['nullable', 'integer', 'min:1'],
            'starts_at' => ['nullable', 'date'],
            'ends_at' => ['nullable', 'date', 'after:starts_at'],
            'status' => ['required', Rule::in(['active', 'paused', 'draft'])],
            'zone_ids' => ['required', 'array', 'min:1'],
            'zone_ids.*' => ['integer', 'exists:ad_zones,id'],
        ];
    }

    protected function prepare(array $data, Request $request, ?Model $item): array
    {
        if ($request->hasFile('media')) {
            $file = $request->file('media');
            $data['media_type'] = in_array($file->getMimeType(), self::VIDEO_MIMES, true) ? 'video' : 'image';
            $data['media_path'] = $file->store('ads/'.now()->format('Y/m'), 'public');
            $data['media_url'] = null;
            $this->deleteFile($item?->media_path);
        } elseif ($request->filled('media_url') && (! $item || $request->input('media_url') !== $item->media_url)) {
            // External creative: infer type from the extension unless explicitly provided.
            $data['media_type'] = $request->input('media_type')
                ?? (preg_match('/\.(mp4|webm|ogg)(\?|$)/i', $request->input('media_url')) ? 'video' : 'image');
            $data['media_path'] = null;
            $this->deleteFile($item?->media_path);
        } elseif (! $item) {
            throw ValidationException::withMessages(['media' => 'Upload a media file or provide a media URL.']);
        } else {
            unset($data['media_type']);
        }

        if ($request->hasFile('poster')) {
            $this->deleteFile($item?->poster_path);
            $data['poster_path'] = $request->file('poster')->store('ads/posters', 'public');
        }

        // Non-closable ads must not stay forever: require auto-close for those.
        if (! ($data['closable'] ?? true) && empty($data['auto_close_seconds'])) {
            $data['auto_close_seconds'] = 15;
        }

        $data['created_by'] ??= $item?->created_by ?? $request->user()->id;
        unset($data['media'], $data['poster'], $data['zone_ids']);

        return $data;
    }

    protected function afterSave(Model $item, Request $request): void
    {
        $item->zones()->sync($request->input('zone_ids', []));
    }

    public function destroy(int $id): JsonResponse
    {
        $ad = Ad::findOrFail($id);
        $this->deleteFile($ad->media_path);
        $this->deleteFile($ad->poster_path);
        $ad->delete();

        return response()->json(['message' => 'Ad deleted.']);
    }

    /** Quick toggle between active and paused from the list view. */
    public function toggle(int $id): JsonResponse
    {
        $ad = Ad::findOrFail($id);
        $ad->update(['status' => $ad->status === 'active' ? 'paused' : 'active']);

        return response()->json(['item' => $ad->fresh($this->with), 'message' => 'Ad '.($ad->status === 'active' ? 'resumed' : 'paused').'.']);
    }

    /** Clone an ad (handy for A/B testing a new creative). */
    public function duplicate(int $id): JsonResponse
    {
        $ad = Ad::with('zones')->findOrFail($id);
        $copy = $ad->replicate(['impressions_count', 'clicks_count']);
        $copy->title = Str::limit($ad->title, 140, '').' (copy)';
        $copy->status = 'draft';

        // Copy uploaded media so deleting one ad never breaks the other.
        foreach (['media_path', 'poster_path'] as $col) {
            if ($ad->{$col} && Storage::disk('public')->exists($ad->{$col})) {
                $new = preg_replace('/(\.\w+)$/', '-'.Str::random(6).'$1', $ad->{$col});
                Storage::disk('public')->copy($ad->{$col}, $new);
                $copy->{$col} = $new;
            }
        }

        $copy->save();
        $copy->zones()->sync($ad->zones->pluck('id'));

        return response()->json(['item' => $copy->fresh($this->with), 'message' => 'Ad duplicated as draft.'], 201);
    }

    public function stats(Request $request, int $id): JsonResponse
    {
        $ad = Ad::with($this->with)->findOrFail($id);

        return response()->json([
            'ad' => $ad,
            'delivery_state' => $ad->deliveryState(),
            'stats' => $this->ads->stats($ad, min(90, max(7, $request->integer('days', 30)))),
        ]);
    }

    public function overview(Request $request): JsonResponse
    {
        return response()->json($this->ads->stats(null, min(90, max(7, $request->integer('days', 30)))) + [
            'top_ads' => Ad::orderByDesc('clicks_count')->take(5)->get(['id', 'title', 'impressions_count', 'clicks_count', 'media_type']),
            'active_ads' => Ad::deliverable()->count(),
        ]);
    }

    private function deleteFile(?string $path): void
    {
        if ($path && ! Str::startsWith($path, ['http', '/'])) {
            Storage::disk('public')->delete($path);
        }
    }
}
