<?php

namespace Tests\Feature;

use App\Models\Setting;
use Tests\TestCase;

class AdServingTest extends TestCase
{
    public function test_zone_serves_active_ads_with_public_fields_only(): void
    {
        $zone = $this->zone();
        $ad = $this->ad($zone, ['max_impressions' => 1000]);

        $this->getJson('/api/ads/serve?zones[]=home_top_banner&viewer=v1')
            ->assertOk()
            ->assertJsonPath('home_top_banner.ads.0.id', $ad->id)
            ->assertJsonPath('home_top_banner.ads.0.skip_after_seconds', 5)
            ->assertJsonMissingPath('home_top_banner.ads.0.max_impressions');
    }

    public function test_paused_expired_scheduled_and_budget_exhausted_ads_are_not_served(): void
    {
        $zone = $this->zone();
        $this->ad($zone, ['status' => 'paused']);
        $this->ad($zone, ['ends_at' => now()->subDay()]);
        $this->ad($zone, ['starts_at' => now()->addDay()]);
        $exhausted = $this->ad($zone, ['max_impressions' => 5]);
        $exhausted->forceFill(['impressions_count' => 5])->save();

        $this->getJson('/api/ads/serve?zones[]=home_top_banner')->assertOk()->assertJsonCount(0, 'home_top_banner.ads');
    }

    public function test_audience_and_device_targeting(): void
    {
        $zone = $this->zone();
        $this->ad($zone, ['title' => 'members', 'audience' => 'auth']);
        $this->ad($zone, ['title' => 'mobile', 'device' => 'mobile']);

        $this->getJson('/api/ads/serve?zones[]=home_top_banner&device=desktop')->assertJsonCount(0, 'home_top_banner.ads');
        $this->getJson('/api/ads/serve?zones[]=home_top_banner&device=mobile')->assertJsonPath('home_top_banner.ads.0.title', 'mobile');
        $this->actingAs($this->customer(), 'sanctum')
            ->getJson('/api/ads/serve?zones[]=home_top_banner&device=desktop')->assertJsonPath('home_top_banner.ads.0.title', 'members');
    }

    public function test_frequency_cap_limits_impressions_per_viewer_per_day(): void
    {
        $zone = $this->zone();
        $ad = $this->ad($zone, ['frequency_cap' => 2]);

        foreach ([1, 2] as $_) {
            $this->postJson("/api/ads/{$ad->id}/events", ['event' => 'impression', 'zone' => 'home_top_banner', 'viewer' => 'abc'])->assertOk();
        }

        $this->getJson('/api/ads/serve?zones[]=home_top_banner&viewer=abc')->assertJsonCount(0, 'home_top_banner.ads');
        $this->getJson('/api/ads/serve?zones[]=home_top_banner&viewer=someone-else')->assertJsonCount(1, 'home_top_banner.ads');
        $this->assertSame(2, $ad->fresh()->impressions_count);
    }

    public function test_click_is_tracked_and_redirects_to_advertiser(): void
    {
        $zone = $this->zone();
        $external = $this->ad($zone);
        $internal = $this->ad($zone, ['click_url' => '/tours?q=Bali']);

        $this->get("/ads/{$external->id}/click?zone=home_top_banner&v=x")->assertRedirect('https://example.com/offer');
        $this->get("/ads/{$internal->id}/click?zone=home_top_banner")->assertRedirect('/tours?q=Bali');

        $this->assertSame(1, $external->fresh()->clicks_count);
        $this->assertDatabaseHas('ad_events', ['ad_id' => $external->id, 'event' => 'click', 'ad_zone_id' => $zone->id]);
    }

    public function test_global_kill_switch_disables_all_ads(): void
    {
        $this->ad($this->zone());
        Setting::put(['ads_enabled' => '0']);

        $this->getJson('/api/ads/serve?zones[]=home_top_banner')->assertOk()->assertJsonPath('home_top_banner', null);
    }

    public function test_multiple_zones_are_served_in_one_request_with_rotation_limit(): void
    {
        $banner = $this->zone();
        $banner->update(['max_ads' => 2]);
        $popup = $this->zone('interstitial_global', 'interstitial');
        foreach (range(1, 3) as $i) {
            $this->ad($banner, ['title' => "b{$i}"]);
        }
        $this->ad($popup, ['closable' => false, 'auto_close_seconds' => 10]);

        $this->getJson('/api/ads/serve?zones[]=home_top_banner&zones[]=interstitial_global')
            ->assertOk()
            ->assertJsonCount(2, 'home_top_banner.ads')
            ->assertJsonPath('interstitial_global.zone.placement', 'interstitial')
            ->assertJsonPath('interstitial_global.ads.0.closable', false);
    }
}
