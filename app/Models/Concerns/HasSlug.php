<?php

namespace App\Models\Concerns;

use Illuminate\Support\Str;

/**
 * Generates a unique, URL-friendly slug from the model's title/name on create.
 * The source column is configured with the $slugSource property (default "name").
 */
trait HasSlug
{
    protected static function bootHasSlug(): void
    {
        static::saving(function ($model) {
            if (filled($model->slug)) {
                return;
            }

            $source = $model->slugSource ?? 'name';
            $base = Str::slug((string) $model->{$source}) ?: Str::lower(Str::random(6));
            $slug = $base;
            $i = 2;

            while (static::withoutGlobalScopes()->where('slug', $slug)->when($model->exists, fn ($q) => $q->whereKeyNot($model->getKey()))->exists()) {
                $slug = $base.'-'.$i++;
            }

            $model->slug = $slug;
        });
    }

    public function getRouteKeyName(): string
    {
        return 'slug';
    }
}
