<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

/**
 * Key/value store for admin-editable platform settings (site name, currency,
 * tax rate, contact details, social links, feature toggles...).
 */
class Setting extends Model
{
    protected $fillable = ['key', 'value', 'group'];

    /** Settings that are safe to expose to the public SPA. */
    public const PUBLIC_KEYS = [
        'site_name', 'site_tagline', 'currency', 'currency_symbol', 'tax_rate', 'service_fee_percent',
        'contact_email', 'contact_phone', 'contact_address', 'facebook_url', 'instagram_url',
        'twitter_url', 'youtube_url', 'ads_enabled', 'hero_title', 'hero_subtitle', 'hero_image',
        'pay_at_property_enabled', 'about_text', 'booking_hold_minutes',
    ];

    public const DEFAULTS = [
        'site_name' => 'EasyGo',
        'site_tagline' => 'Travel made easy',
        'currency' => 'BDT',
        'currency_symbol' => '৳',
        'tax_rate' => '5',
        'service_fee_percent' => '2',
        'contact_email' => 'support@easygo.com',
        'contact_phone' => '+880 1700-000000',
        'contact_address' => 'Gulshan Avenue, Dhaka 1212, Bangladesh',
        'facebook_url' => '#',
        'instagram_url' => '#',
        'twitter_url' => '#',
        'youtube_url' => '#',
        'ads_enabled' => '1',
        'auto_approve_reviews' => '0',
        'pay_at_property_enabled' => '1',
        'booking_hold_minutes' => '30',
        'hero_title' => 'Find your next stay, flight & adventure',
        'hero_subtitle' => 'Hotels, flights, buses, tours and car rentals — all in one place, at the best price.',
        'hero_image' => 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1920&q=80',
        'about_text' => 'EasyGo is an all-in-one travel booking platform that helps travellers discover and book hotels, flights, buses, tour packages and rental cars with transparent pricing and instant confirmation.',
    ];

    private const CACHE_KEY = 'easygo.settings';

    /** @return array<string, string|null> */
    public static function allCached(): array
    {
        return Cache::rememberForever(self::CACHE_KEY, function () {
            return array_merge(self::DEFAULTS, static::query()->pluck('value', 'key')->all());
        });
    }

    public static function get(string $key, mixed $default = null): mixed
    {
        return static::allCached()[$key] ?? $default;
    }

    /** @param array<string, mixed> $values */
    public static function put(array $values): void
    {
        foreach ($values as $key => $value) {
            static::updateOrCreate(['key' => $key], ['value' => is_bool($value) ? (int) $value : $value]);
        }
        Cache::forget(self::CACHE_KEY);
    }

    /** @return array<string, string|null> */
    public static function publicSettings(): array
    {
        // The platform timezone lets the SPA render departure times as local wall-clock times.
        return array_intersect_key(static::allCached(), array_flip(self::PUBLIC_KEYS)) + ['timezone' => config('app.timezone')];
    }
}
