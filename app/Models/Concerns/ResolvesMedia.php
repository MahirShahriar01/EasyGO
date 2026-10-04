<?php

namespace App\Models\Concerns;

use Illuminate\Support\Facades\Storage;

/**
 * Turns a stored media reference into a browser-usable URL.
 *
 * A reference can be an absolute URL (seeded demo data, CDN), a root-relative
 * path ("/images/...") shipped in public/, or a path on the "public" disk
 * created by an admin upload ("uploads/hotels/abc.jpg").
 */
trait ResolvesMedia
{
    public static function mediaUrl(?string $path): ?string
    {
        if (blank($path)) {
            return null;
        }

        if (str_starts_with($path, 'http://') || str_starts_with($path, 'https://') || str_starts_with($path, '/')) {
            return $path;
        }

        return Storage::disk('public')->url($path);
    }

    /**
     * @param  array<int, string>|null  $paths
     * @return array<int, string>
     */
    public static function mediaUrls(?array $paths): array
    {
        return array_values(array_filter(array_map(fn ($p) => static::mediaUrl($p), $paths ?? [])));
    }
}
