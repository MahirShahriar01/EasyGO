<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

/** Platform settings editor (branding, money, contact, toggles). */
class SettingController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(Setting::allCached());
    }

    public function update(Request $request): JsonResponse
    {
        $data = $request->validate([
            'site_name' => ['sometimes', 'required', 'string', 'max:60'],
            'site_tagline' => ['sometimes', 'nullable', 'string', 'max:120'],
            'currency' => ['sometimes', 'required', 'string', 'max:5'],
            'currency_symbol' => ['sometimes', 'required', 'string', 'max:5'],
            'tax_rate' => ['sometimes', 'required', 'numeric', 'between:0,50'],
            'service_fee_percent' => ['sometimes', 'required', 'numeric', 'between:0,30'],
            'contact_email' => ['sometimes', 'nullable', 'email'],
            'contact_phone' => ['sometimes', 'nullable', 'string', 'max:40'],
            'contact_address' => ['sometimes', 'nullable', 'string', 'max:255'],
            'facebook_url' => ['sometimes', 'nullable', 'string', 'max:255'],
            'instagram_url' => ['sometimes', 'nullable', 'string', 'max:255'],
            'twitter_url' => ['sometimes', 'nullable', 'string', 'max:255'],
            'youtube_url' => ['sometimes', 'nullable', 'string', 'max:255'],
            'ads_enabled' => ['sometimes', 'in:0,1'],
            'auto_approve_reviews' => ['sometimes', 'in:0,1'],
            'pay_at_property_enabled' => ['sometimes', 'in:0,1'],
            'booking_hold_minutes' => ['sometimes', 'integer', 'between:5,1440'],
            'hero_title' => ['sometimes', 'nullable', 'string', 'max:120'],
            'hero_subtitle' => ['sometimes', 'nullable', 'string', 'max:255'],
            'hero_image' => ['sometimes', 'nullable', 'string', 'max:500'],
            'about_text' => ['sometimes', 'nullable', 'string', 'max:3000'],
        ]);

        Setting::put($data);
        Cache::forget('easygo.home');

        return response()->json(['settings' => Setting::allCached(), 'message' => 'Settings saved.']);
    }
}
