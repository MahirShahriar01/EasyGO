<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Inventory ("catalog") tables for every bookable vertical offered by EasyGo:
 * destinations, hotels + room types, flights, buses, tour packages and rental cars.
 *
 * Image columns store either an absolute URL (seeded demo content / CDN) or a
 * path on the "public" disk (admin uploads). Models resolve both via HasMedia.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('settings', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->text('value')->nullable();
            $table->string('group', 50)->default('general');
            $table->timestamps();
        });

        Schema::create('destinations', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('country', 100);
            $table->string('tagline')->nullable();
            $table->text('description')->nullable();
            $table->string('image')->nullable();
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();
            $table->boolean('is_featured')->default(false);
            $table->string('status', 20)->default('active');
            $table->timestamps();
        });

        Schema::create('hotels', function (Blueprint $table) {
            $table->id();
            $table->foreignId('destination_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('property_type', 30)->default('hotel'); // hotel|resort|apartment|villa|guesthouse
            $table->text('description')->nullable();
            $table->string('address')->nullable();
            $table->unsignedTinyInteger('star_rating')->default(3);
            $table->json('amenities')->nullable();
            $table->string('thumbnail')->nullable();
            $table->json('images')->nullable();
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();
            $table->string('check_in_time', 10)->default('14:00');
            $table->string('check_out_time', 10)->default('12:00');
            $table->text('policies')->nullable();
            $table->string('phone', 30)->nullable();
            $table->string('email')->nullable();
            $table->boolean('is_featured')->default(false);
            $table->string('status', 20)->default('active')->index();
            // Denormalised aggregates kept in sync by RatingService / Hotel::refreshMinPrice().
            $table->decimal('avg_rating', 3, 2)->default(0);
            $table->unsignedInteger('reviews_count')->default(0);
            $table->decimal('min_price', 12, 2)->default(0);
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('room_types', function (Blueprint $table) {
            $table->id();
            $table->foreignId('hotel_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('bed_type', 50)->nullable();
            $table->unsignedSmallInteger('size_sqm')->nullable();
            $table->unsignedTinyInteger('max_adults')->default(2);
            $table->unsignedTinyInteger('max_children')->default(0);
            $table->decimal('price_per_night', 12, 2);
            $table->unsignedSmallInteger('total_rooms')->default(1);
            $table->json('amenities')->nullable();
            $table->json('images')->nullable();
            $table->boolean('breakfast_included')->default(false);
            $table->boolean('refundable')->default(true);
            $table->string('status', 20)->default('active');
            $table->timestamps();
        });

        Schema::create('flights', function (Blueprint $table) {
            $table->id();
            $table->string('airline');
            $table->string('airline_code', 5)->nullable();
            $table->string('airline_logo')->nullable();
            $table->string('flight_number', 20);
            $table->string('from_city', 100)->index();
            $table->string('from_code', 5);
            $table->string('to_city', 100)->index();
            $table->string('to_code', 5);
            $table->dateTime('departure_at')->index();
            $table->dateTime('arrival_at');
            $table->unsignedTinyInteger('stops')->default(0);
            $table->string('cabin_class', 20)->default('economy'); // economy|premium|business|first
            $table->decimal('price', 12, 2);
            $table->unsignedSmallInteger('total_seats');
            $table->string('baggage', 100)->nullable();
            $table->boolean('refundable')->default(false);
            $table->string('status', 20)->default('active');
            $table->timestamps();
        });

        Schema::create('buses', function (Blueprint $table) {
            $table->id();
            $table->string('operator');
            $table->string('coach_no', 30)->nullable();
            $table->string('bus_type', 30)->default('AC'); // AC|Non-AC|Sleeper|Business
            $table->string('from_city', 100)->index();
            $table->string('to_city', 100)->index();
            $table->string('boarding_point')->nullable();
            $table->string('dropping_point')->nullable();
            $table->dateTime('departure_at')->index();
            $table->dateTime('arrival_at');
            $table->decimal('price', 12, 2);
            $table->unsignedSmallInteger('total_seats')->default(36);
            $table->string('seat_layout', 10)->default('2-2'); // seats left-aisle-right per row
            $table->json('amenities')->nullable();
            $table->string('status', 20)->default('active');
            $table->timestamps();
        });

        Schema::create('tours', function (Blueprint $table) {
            $table->id();
            $table->foreignId('destination_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->string('slug')->unique();
            $table->string('category', 50)->nullable(); // adventure|beach|culture|honeymoon|family
            $table->text('description')->nullable();
            $table->unsignedSmallInteger('duration_days')->default(1);
            $table->unsignedSmallInteger('duration_nights')->default(0);
            $table->decimal('price', 12, 2); // per person
            $table->decimal('discount_price', 12, 2)->nullable();
            $table->unsignedSmallInteger('max_group_size')->default(20);
            $table->json('itinerary')->nullable(); // [{day, title, description}]
            $table->json('inclusions')->nullable();
            $table->json('exclusions')->nullable();
            $table->string('thumbnail')->nullable();
            $table->json('images')->nullable();
            $table->date('available_from')->nullable();
            $table->date('available_to')->nullable();
            $table->boolean('is_featured')->default(false);
            $table->string('status', 20)->default('active')->index();
            $table->decimal('avg_rating', 3, 2)->default(0);
            $table->unsignedInteger('reviews_count')->default(0);
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('cars', function (Blueprint $table) {
            $table->id();
            $table->foreignId('destination_id')->constrained()->cascadeOnDelete(); // pickup city
            $table->string('name');
            $table->string('brand', 50)->nullable();
            $table->string('car_type', 30)->default('sedan'); // micro|sedan|suv|van|luxury
            $table->unsignedTinyInteger('seats')->default(4);
            $table->unsignedTinyInteger('bags')->default(2);
            $table->string('transmission', 20)->default('automatic');
            $table->string('fuel_type', 20)->default('petrol');
            $table->boolean('air_conditioning')->default(true);
            $table->boolean('with_driver')->default(false);
            $table->decimal('price_per_day', 12, 2);
            $table->unsignedSmallInteger('quantity')->default(1); // fleet size
            $table->string('thumbnail')->nullable();
            $table->json('images')->nullable();
            $table->json('features')->nullable();
            $table->string('status', 20)->default('active');
            $table->decimal('avg_rating', 3, 2)->default(0);
            $table->unsignedInteger('reviews_count')->default(0);
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cars');
        Schema::dropIfExists('tours');
        Schema::dropIfExists('buses');
        Schema::dropIfExists('flights');
        Schema::dropIfExists('room_types');
        Schema::dropIfExists('hotels');
        Schema::dropIfExists('destinations');
        Schema::dropIfExists('settings');
    }
};
