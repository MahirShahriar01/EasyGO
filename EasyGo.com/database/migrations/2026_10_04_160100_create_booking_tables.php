<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Transactional tables: coupons, bookings, payments, reviews, wishlists and
 * customer-engagement tables (contact messages, newsletter subscribers).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('coupons', function (Blueprint $table) {
            $table->id();
            $table->string('code', 40)->unique();
            $table->string('description')->nullable();
            $table->string('type', 10)->default('percent'); // percent|fixed
            $table->decimal('value', 12, 2);
            $table->decimal('min_amount', 12, 2)->default(0);
            $table->decimal('max_discount', 12, 2)->nullable();
            $table->string('applies_to', 20)->default('all'); // all|hotel|flight|bus|tour|car
            $table->unsignedInteger('usage_limit')->nullable();
            $table->unsignedInteger('per_user_limit')->nullable();
            $table->unsignedInteger('used_count')->default(0);
            $table->dateTime('starts_at')->nullable();
            $table->dateTime('expires_at')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('bookings', function (Blueprint $table) {
            $table->id();
            $table->string('reference', 20)->unique();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            // The concrete inventory item: RoomType, Flight, Bus, Tour or Car.
            $table->morphs('bookable');
            $table->string('service_type', 20)->index(); // hotel|flight|bus|tour|car
            // Snapshots so history stays readable even if inventory is edited later.
            $table->string('item_name');
            $table->string('item_image')->nullable();
            $table->date('start_date');
            $table->date('end_date')->nullable();
            $table->unsignedSmallInteger('quantity')->default(1); // rooms | seats | travellers | cars
            $table->unsignedSmallInteger('units')->default(1);    // nights | days (1 for flights/buses/tours)
            $table->unsignedTinyInteger('adults')->default(1);
            $table->unsignedTinyInteger('children')->default(0);
            $table->json('details')->nullable(); // seats, passengers, hotel_id, etc.
            $table->decimal('unit_price', 12, 2);
            $table->decimal('subtotal', 12, 2);
            $table->decimal('discount', 12, 2)->default(0);
            $table->decimal('tax', 12, 2)->default(0);
            $table->decimal('service_fee', 12, 2)->default(0);
            $table->decimal('total', 12, 2);
            $table->string('currency', 5)->default('BDT');
            $table->foreignId('coupon_id')->nullable()->constrained()->nullOnDelete();
            $table->string('coupon_code', 40)->nullable();
            $table->string('status', 20)->default('pending')->index(); // pending|confirmed|cancelled|completed
            $table->string('payment_status', 20)->default('unpaid');  // unpaid|paid|refunded
            $table->string('payment_method', 30)->nullable();
            $table->string('contact_name');
            $table->string('contact_email');
            $table->string('contact_phone', 30)->nullable();
            $table->text('special_requests')->nullable();
            $table->decimal('refund_amount', 12, 2)->default(0);
            $table->timestamp('confirmed_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->string('cancellation_reason')->nullable();
            $table->timestamps();
        });

        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('booking_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('method', 30);             // card|bkash|nagad|rocket|pay_at_property
            $table->string('gateway', 30)->default('demo');
            $table->string('transaction_id')->nullable()->unique();
            $table->decimal('amount', 12, 2);
            $table->string('currency', 5)->default('BDT');
            $table->string('status', 20)->default('pending'); // pending|succeeded|failed|refunded
            $table->string('failure_reason')->nullable();
            $table->json('meta')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamp('refunded_at')->nullable();
            $table->timestamps();
        });

        Schema::create('reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->morphs('reviewable'); // Hotel | Tour | Car
            $table->foreignId('booking_id')->nullable()->constrained()->nullOnDelete();
            $table->unsignedTinyInteger('rating');
            $table->string('title')->nullable();
            $table->text('comment');
            $table->string('status', 20)->default('pending')->index(); // pending|approved|rejected
            $table->timestamps();
            $table->unique(['user_id', 'reviewable_type', 'reviewable_id']);
        });

        Schema::create('wishlists', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->morphs('wishlistable');
            $table->timestamps();
            $table->unique(['user_id', 'wishlistable_type', 'wishlistable_id']);
        });

        Schema::create('contact_messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name');
            $table->string('email');
            $table->string('subject');
            $table->text('message');
            $table->string('status', 20)->default('new'); // new|read|replied
            $table->text('admin_reply')->nullable();
            $table->timestamp('replied_at')->nullable();
            $table->timestamps();
        });

        Schema::create('newsletter_subscribers', function (Blueprint $table) {
            $table->id();
            $table->string('email')->unique();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('newsletter_subscribers');
        Schema::dropIfExists('contact_messages');
        Schema::dropIfExists('wishlists');
        Schema::dropIfExists('reviews');
        Schema::dropIfExists('payments');
        Schema::dropIfExists('bookings');
        Schema::dropIfExists('coupons');
    }
};
