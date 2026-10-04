<?php

namespace Database\Seeders;

use App\Models\Ad;
use App\Models\AdZone;
use Illuminate\Database\Seeder;

/**
 * Default ad placements used by the SPA plus a set of demo campaigns.
 * Zone keys are referenced in the React code (<AdSlot zone="...">), so
 * renaming a key requires updating the frontend too.
 */
class AdSeeder extends Seeder
{
    public function run(): void
    {
        // [key, name, description, page, placement, w, h, max_ads, rotation]
        $zones = [
            ['home_top_banner', 'Home — below hero', 'Wide banner directly under the search hero', 'home', 'banner', 1200, 250, 3, 7],
            ['home_mid_banner', 'Home — between sections', 'Leaderboard between destinations and hotels', 'home', 'banner', 1200, 250, 2, 10],
            ['search_top', 'Search results — top', 'Banner above search results (all verticals)', 'search', 'banner', 970, 150, 1, 10],
            ['search_inline', 'Search results — in-feed', 'Native card inserted between result items', 'search', 'inline', 728, 200, 1, 10],
            ['search_sidebar', 'Search results — sidebar', 'Skyscraper below the filter panel', 'search', 'sidebar', 300, 600, 1, 10],
            ['detail_sidebar', 'Detail page — sidebar', 'Rectangle next to hotel / tour / car details', 'detail', 'sidebar', 300, 250, 2, 8],
            ['checkout_bottom', 'Checkout — below summary', 'Small banner under the price summary', 'checkout', 'sidebar', 300, 250, 1, 10],
            ['account_banner', 'My account — top', 'Banner on the customer dashboard', 'account', 'banner', 1200, 150, 1, 10],
            ['footer_banner', 'Global — above footer', 'Site-wide banner just above the footer', 'global', 'banner', 1200, 150, 2, 12],
            ['interstitial_global', 'Global — interstitial popup', 'Full-screen popup shown once per session on page load', 'global', 'interstitial', 640, 800, 1, 10],
            ['interstitial_booking_success', 'Booking confirmed — interstitial', 'Popup on the booking confirmation page', 'checkout', 'interstitial', 640, 800, 1, 10],
        ];

        $z = [];
        foreach ($zones as [$key, $name, $desc, $page, $placement, $w, $h, $max, $rot]) {
            $z[$key] = AdZone::create([
                'key' => $key, 'name' => $name, 'description' => $desc, 'page' => $page, 'placement' => $placement,
                'width' => $w, 'height' => $h, 'max_ads' => $max, 'rotation_seconds' => $rot,
            ]);
        }

        // [title, advertiser, media, type, headline, cta, url, zones, closable, skip, auto_close, weight, cap]
        $ads = [
            ['Summer Sale — Beach Resorts', 'EasyGo Hotels', '/demo/ads/summer-sale-leaderboard.svg', 'image', 'Up to 30% off beach resorts', 'Book now', '/hotels?q=Cox', ['home_top_banner', 'home_mid_banner'], true, 0, null, 8, null],
            ['Dhaka → Dubai Flash Fare', 'EasyGo Flights', '/demo/ads/fly-dubai-leaderboard.svg', 'image', 'Fly to Dubai from ৳38,999', 'Grab the deal', '/flights?from=Dhaka&to=Dubai', ['home_top_banner', 'search_top'], true, 0, null, 6, null],
            ['AC Bus Discount', 'EasyGo Bus', '/demo/ads/bus-deal-banner.svg', 'image', '৳50 off AC buses', 'Find buses', '/buses', ['search_top', 'home_mid_banner'], true, 0, null, 5, null],
            ['Members save 10%', 'EasyGo', '/demo/ads/hotel-sidebar.svg', 'image', 'Sign in & save 10%', 'Join free', '/register', ['search_sidebar'], true, 0, null, 5, null],
            ['Car rental from ৳2,500', 'EasyGo Cars', '/demo/ads/car-rental-rect.svg', 'image', 'Rent a car', 'Rent now', '/cars', ['detail_sidebar', 'checkout_bottom'], true, 0, null, 5, null],
            ['Travel insurance', 'SafeTrip Insurance (demo)', '/demo/ads/travel-insurance-inline.svg', 'image', 'Travel insurance from ৳199', 'Learn more', 'https://example.com/insurance', ['search_inline', 'account_banner'], true, 0, null, 5, null],
            ['Get the EasyGo app', 'EasyGo', '/demo/ads/footer-app-banner.svg', 'image', 'Book faster on the app', 'Download', 'https://example.com/app', ['footer_banner'], true, 0, null, 5, null],
            ['Maldives Water Villa — Popup', 'EasyGo Holidays', '/demo/ads/interstitial-maldives.svg', 'image', 'Maldives 4D/3N from ৳1,19,999', 'Explore package', '/tours?q=Maldives', ['interstitial_global'], true, 5, 20, 5, 2],
        ];

        foreach ($ads as [$title, $adv, $media, $type, $headline, $cta, $url, $zoneKeys, $closable, $skip, $auto, $weight, $cap]) {
            $ad = Ad::create([
                'title' => $title, 'advertiser' => $adv, 'media_type' => $type, 'media_url' => $media,
                'headline' => $headline, 'cta_label' => $cta, 'click_url' => $url,
                'open_in_new_tab' => str_starts_with($url, 'http'), 'closable' => $closable, 'skip_after_seconds' => $skip,
                'auto_close_seconds' => $auto, 'weight' => $weight, 'frequency_cap' => $cap, 'status' => 'active',
                'starts_at' => now()->subDays(30), 'ends_at' => now()->addMonths(3),
            ]);
            $ad->zones()->sync(collect($zoneKeys)->map(fn ($k) => $z[$k]->id));
        }

        // A skippable video ad (AdMob-style "skip in 5s") using a CC0 sample clip.
        $video = Ad::create([
            'title' => 'Discover Bali — Video', 'advertiser' => 'EasyGo Holidays', 'media_type' => 'video',
            'media_url' => 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
            'headline' => 'Bali Honeymoon Bliss — 6D/5N', 'cta_label' => 'View package', 'click_url' => '/tours?q=Bali',
            'open_in_new_tab' => false, 'closable' => true, 'skip_after_seconds' => 5, 'auto_close_seconds' => 30,
            'weight' => 4, 'frequency_cap' => 3, 'status' => 'active', 'starts_at' => now()->subDays(30), 'ends_at' => now()->addMonths(3),
        ]);
        $video->zones()->sync([$z['interstitial_booking_success']->id, $z['interstitial_global']->id]);
    }
}
