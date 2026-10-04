<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Self-hosted advertising system (AdMob-style, but fully controlled by the admin).
 *
 *  ad_zones  – named placements on the customer site (e.g. "home_top", "interstitial").
 *  ads       – an image or video creative with schedule, targeting, caps and skip rules.
 *  ad_ad_zone– which zones an ad may be served in (many-to-many).
 *  ad_events – raw impression / click / skip / close / complete log used for analytics,
 *              frequency capping and budget (max impressions / clicks) enforcement.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ad_zones', function (Blueprint $table) {
            $table->id();
            $table->string('key', 60)->unique();            // used by <AdSlot zone="..."> on the frontend
            $table->string('name');
            $table->string('description')->nullable();
            $table->string('page', 30)->default('global');  // home|search|detail|checkout|account|global
            $table->string('placement', 20)->default('banner'); // banner|sidebar|inline|interstitial
            $table->unsignedSmallInteger('width')->nullable();  // recommended creative size (px)
            $table->unsignedSmallInteger('height')->nullable();
            $table->unsignedTinyInteger('max_ads')->default(1); // >1 renders a rotating carousel
            $table->unsignedSmallInteger('rotation_seconds')->default(8);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('ads', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('advertiser')->nullable();
            $table->string('media_type', 10);            // image|video
            $table->string('media_path')->nullable();    // uploaded file on the public disk
            $table->string('media_url')->nullable();     // OR an external URL
            $table->string('poster_path')->nullable();   // optional poster image for videos
            $table->string('headline')->nullable();
            $table->string('cta_label', 40)->nullable();
            $table->string('click_url')->nullable();
            $table->boolean('open_in_new_tab')->default(true);
            // Close / skip behaviour (interstitial & video creatives).
            $table->boolean('closable')->default(true);
            $table->unsignedSmallInteger('skip_after_seconds')->default(5);   // 0 = closable immediately
            $table->unsignedSmallInteger('auto_close_seconds')->nullable();  // null = stays until closed
            // Targeting.
            $table->string('audience', 10)->default('all'); // all|guest|auth
            $table->string('device', 10)->default('all');   // all|desktop|mobile
            // Delivery controls.
            $table->unsignedTinyInteger('weight')->default(5);              // 1-10 weighted rotation
            $table->unsignedSmallInteger('frequency_cap')->nullable();      // max impressions / viewer / day
            $table->unsignedInteger('max_impressions')->nullable();
            $table->unsignedInteger('max_clicks')->nullable();
            $table->dateTime('starts_at')->nullable();
            $table->dateTime('ends_at')->nullable();
            $table->string('status', 10)->default('active')->index(); // active|paused|draft
            // Denormalised counters for fast admin listing and budget checks.
            $table->unsignedBigInteger('impressions_count')->default(0);
            $table->unsignedBigInteger('clicks_count')->default(0);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('ad_ad_zone', function (Blueprint $table) {
            $table->foreignId('ad_id')->constrained()->cascadeOnDelete();
            $table->foreignId('ad_zone_id')->constrained()->cascadeOnDelete();
            $table->primary(['ad_id', 'ad_zone_id']);
        });

        Schema::create('ad_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ad_id')->constrained()->cascadeOnDelete();
            $table->foreignId('ad_zone_id')->nullable()->constrained()->nullOnDelete();
            $table->string('event', 12);                 // impression|click|skip|close|complete
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('viewer_id', 64)->nullable(); // anonymous browser id from the SPA
            $table->string('ip_hash', 64)->nullable();   // SHA-256, never the raw IP
            $table->string('device', 10)->nullable();
            $table->timestamp('created_at')->useCurrent();
            $table->index(['ad_id', 'event', 'created_at']);
            $table->index(['viewer_id', 'ad_id', 'event']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ad_events');
        Schema::dropIfExists('ad_ad_zone');
        Schema::dropIfExists('ads');
        Schema::dropIfExists('ad_zones');
    }
};
