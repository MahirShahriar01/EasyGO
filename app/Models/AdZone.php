<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

/**
 * A named placement on the customer site. The frontend renders
 * <AdSlot zone="home_top" /> and the server picks eligible ads for that key.
 */
class AdZone extends Model
{
    public const PLACEMENTS = ['banner', 'sidebar', 'inline', 'interstitial'];

    public const PAGES = ['global', 'home', 'search', 'detail', 'checkout', 'account'];

    protected $fillable = [
        'key', 'name', 'description', 'page', 'placement', 'width', 'height',
        'max_ads', 'rotation_seconds', 'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'max_ads' => 'integer',
        'rotation_seconds' => 'integer',
        'width' => 'integer',
        'height' => 'integer',
    ];

    public function ads(): BelongsToMany
    {
        return $this->belongsToMany(Ad::class);
    }
}
