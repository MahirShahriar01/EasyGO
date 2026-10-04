<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** Raw ad interaction log row (impression, click, skip, close, complete). */
class AdEvent extends Model
{
    public const EVENTS = ['impression', 'click', 'skip', 'close', 'complete'];

    public const UPDATED_AT = null;

    protected $fillable = ['ad_id', 'ad_zone_id', 'event', 'user_id', 'viewer_id', 'ip_hash', 'device'];

    public function ad(): BelongsTo
    {
        return $this->belongsTo(Ad::class);
    }

    public function zone(): BelongsTo
    {
        return $this->belongsTo(AdZone::class, 'ad_zone_id');
    }
}
