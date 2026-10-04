<?php

namespace App\Models;

use App\Models\Concerns\ResolvesMedia;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * An image or video advertisement creative.
 *
 * Delivery rules (enforced by App\Services\AdService):
 *  - status = active and now() within [starts_at, ends_at]
 *  - audience (all/guest/auth) and device (all/desktop/mobile) targeting
 *  - global budget: impressions_count < max_impressions, clicks_count < max_clicks
 *  - per-viewer frequency_cap impressions per day
 *  - weighted random rotation by `weight`
 *
 * Close behaviour: when `closable`, the viewer may dismiss the ad after
 * `skip_after_seconds`; `auto_close_seconds` dismisses it automatically.
 */
class Ad extends Model
{
    use HasFactory, ResolvesMedia;

    protected $fillable = [
        'title', 'advertiser', 'media_type', 'media_path', 'media_url', 'poster_path', 'headline', 'cta_label',
        'click_url', 'open_in_new_tab', 'closable', 'skip_after_seconds', 'auto_close_seconds', 'audience', 'device',
        'weight', 'frequency_cap', 'max_impressions', 'max_clicks', 'starts_at', 'ends_at', 'status', 'created_by',
    ];

    protected $casts = [
        'open_in_new_tab' => 'boolean',
        'closable' => 'boolean',
        'skip_after_seconds' => 'integer',
        'auto_close_seconds' => 'integer',
        'weight' => 'integer',
        'frequency_cap' => 'integer',
        'max_impressions' => 'integer',
        'max_clicks' => 'integer',
        'impressions_count' => 'integer',
        'clicks_count' => 'integer',
        'starts_at' => 'datetime',
        'ends_at' => 'datetime',
    ];

    protected $appends = ['media_src', 'poster_src', 'ctr'];

    /** Final URL of the creative (uploaded file wins over external URL). */
    public function getMediaSrcAttribute(): ?string
    {
        return static::mediaUrl($this->media_path) ?? $this->media_url;
    }

    public function getPosterSrcAttribute(): ?string
    {
        return static::mediaUrl($this->poster_path);
    }

    /** Click-through rate in percent. */
    public function getCtrAttribute(): float
    {
        return $this->impressions_count > 0
            ? round($this->clicks_count / $this->impressions_count * 100, 2)
            : 0.0;
    }

    public function zones(): BelongsToMany
    {
        return $this->belongsToMany(AdZone::class);
    }

    public function events(): HasMany
    {
        return $this->hasMany(AdEvent::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /** Ads that are switched on, inside their schedule and still within budget. */
    public function scopeDeliverable($query)
    {
        $now = now();

        return $query->where('status', 'active')
            ->where(fn ($q) => $q->whereNull('starts_at')->orWhere('starts_at', '<=', $now))
            ->where(fn ($q) => $q->whereNull('ends_at')->orWhere('ends_at', '>=', $now))
            ->where(fn ($q) => $q->whereNull('max_impressions')->orWhereColumn('impressions_count', '<', 'max_impressions'))
            ->where(fn ($q) => $q->whereNull('max_clicks')->orWhereColumn('clicks_count', '<', 'max_clicks'));
    }

    /** Human readable delivery state for the admin list. */
    public function deliveryState(): string
    {
        $now = now();

        return match (true) {
            $this->status !== 'active' => $this->status,
            $this->starts_at && $this->starts_at->isAfter($now) => 'scheduled',
            $this->ends_at && $this->ends_at->isBefore($now) => 'expired',
            $this->max_impressions && $this->impressions_count >= $this->max_impressions => 'budget_reached',
            $this->max_clicks && $this->clicks_count >= $this->max_clicks => 'budget_reached',
            default => 'running',
        };
    }
}
