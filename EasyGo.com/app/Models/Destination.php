<?php

namespace App\Models;

use App\Models\Concerns\HasSlug;
use App\Models\Concerns\ResolvesMedia;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/** A city / region that groups hotels, tours and car-rental pickup points. */
class Destination extends Model
{
    use HasFactory, HasSlug, ResolvesMedia;

    protected $fillable = [
        'name', 'slug', 'country', 'tagline', 'description', 'image',
        'latitude', 'longitude', 'is_featured', 'status',
    ];

    protected $casts = [
        'is_featured' => 'boolean',
        'latitude' => 'float',
        'longitude' => 'float',
    ];

    protected $appends = ['image_url'];

    public function getImageUrlAttribute(): ?string
    {
        return static::mediaUrl($this->image);
    }

    public function hotels(): HasMany
    {
        return $this->hasMany(Hotel::class);
    }

    public function tours(): HasMany
    {
        return $this->hasMany(Tour::class);
    }

    public function cars(): HasMany
    {
        return $this->hasMany(Car::class);
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }
}
