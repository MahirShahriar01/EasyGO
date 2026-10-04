<?php

namespace Database\Seeders;

use App\Models\Ad;
use App\Models\AdEvent;
use App\Models\Booking;
use App\Models\Bus;
use App\Models\Car;
use App\Models\ContactMessage;
use App\Models\Flight;
use App\Models\Hotel;
use App\Models\NewsletterSubscriber;
use App\Models\Payment;
use App\Models\Review;
use App\Models\Setting;
use App\Models\Tour;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

/**
 * Historical activity so dashboards, charts and account pages look alive:
 * ~90 bookings over the last 60 days, payments, reviews, wishlists,
 * contact messages, newsletter subscribers and 30 days of ad events.
 */
class ActivitySeeder extends Seeder
{
    public function run(): void
    {
        $customers = User::where('role', 'customer')->get();
        $demo = $customers->firstWhere('email', 'demo@easygo.com');
        $tax = (float) Setting::get('tax_rate', 5) / 100;
        $fee = (float) Setting::get('service_fee_percent', 2) / 100;

        for ($i = 0; $i < 90; $i++) {
            $user = $i < 8 ? $demo : $customers->random();
            $created = now()->subDays(fake()->numberBetween(0, 60))->subMinutes(fake()->numberBetween(0, 1440));
            $line = $this->randomLine($i);
            if (! $line) {
                continue;
            }

            // Past trips are completed, future ones confirmed; sprinkle cancellations & pending.
            $status = $line['start']->isPast() ? 'completed' : 'confirmed';
            $roll = fake()->numberBetween(1, 100);
            if ($roll <= 10) {
                $status = 'cancelled';
            } elseif ($roll <= 14 && $line['start']->isFuture()) {
                $status = 'pending';
            }

            $subtotal = $line['price'] * $line['units'] * $line['qty'];
            $total = round($subtotal * (1 + $tax + $fee), 2);
            $paid = in_array($status, ['confirmed', 'completed'], true);

            $booking = Booking::create([
                'user_id' => $user->id,
                'bookable_type' => $line['model']->getMorphClass(),
                'bookable_id' => $line['model']->getKey(),
                'service_type' => $line['type'],
                'item_name' => $line['name'],
                'item_image' => $line['image'],
                'start_date' => $line['start']->toDateString(),
                'end_date' => $line['end']?->toDateString(),
                'quantity' => $line['qty'],
                'units' => $line['units'],
                'adults' => $line['qty'],
                'details' => $line['details'],
                'unit_price' => $line['price'],
                'subtotal' => $subtotal,
                'tax' => round($subtotal * $tax, 2),
                'service_fee' => round($subtotal * $fee, 2),
                'total' => $total,
                'currency' => 'BDT',
                'status' => $status,
                'payment_status' => $paid ? 'paid' : ($status === 'cancelled' && fake()->boolean() ? 'refunded' : 'unpaid'),
                'payment_method' => $paid ? fake()->randomElement(['card', 'bkash', 'nagad']) : null,
                'contact_name' => $user->name,
                'contact_email' => $user->email,
                'contact_phone' => $user->phone,
                'confirmed_at' => $paid ? $created : null,
                'cancelled_at' => $status === 'cancelled' ? $created->copy()->addDay() : null,
                'cancellation_reason' => $status === 'cancelled' ? 'Change of plans' : null,
            ]);
            $booking->forceFill(['created_at' => $created, 'updated_at' => $created])->saveQuietly();

            if ($paid || $booking->payment_status === 'refunded') {
                Payment::create([
                    'booking_id' => $booking->id, 'user_id' => $user->id, 'method' => $booking->payment_method ?? 'card',
                    'gateway' => 'demo', 'transaction_id' => 'DEMO-SEED-'.strtoupper(Str::random(12)), 'amount' => $total,
                    'currency' => 'BDT', 'status' => $paid ? 'succeeded' : 'refunded', 'paid_at' => $created,
                ]);
            }
        }

        $this->reviews($customers);
        $this->engagement($customers, $demo);
        $this->adEvents();
    }

    /** @return array<string, mixed>|null */
    private function randomLine(int $i): ?array
    {
        $offset = fake()->numberBetween(-45, 40);
        $start = today()->addDays($offset);

        switch ($i % 5) {
            case 0:
            case 1:
                $hotel = Hotel::with('roomTypes')->inRandomOrder()->first();
                $room = $hotel->roomTypes->random();
                $nights = fake()->numberBetween(1, 4);

                return ['type' => 'hotel', 'model' => $room, 'name' => "{$hotel->name} — {$room->name}", 'image' => $hotel->thumbnail,
                    'start' => $start, 'end' => $start->copy()->addDays($nights), 'qty' => 1, 'units' => $nights, 'price' => $room->price_per_night,
                    'details' => ['hotel_id' => $hotel->id, 'hotel_slug' => $hotel->slug, 'room_type_id' => $room->id, 'room_name' => $room->name]];
            case 2:
                $flight = Flight::inRandomOrder()->first();

                return ['type' => 'flight', 'model' => $flight, 'name' => "{$flight->airline} {$flight->flight_number} · {$flight->from_code} → {$flight->to_code}",
                    'image' => null, 'start' => $offset > 0 ? $flight->departure_at->copy()->startOfDay() : $start, 'end' => null,
                    'qty' => fake()->numberBetween(1, 3), 'units' => 1, 'price' => $flight->price,
                    'details' => ['from' => $flight->from_city, 'to' => $flight->to_city, 'cabin_class' => $flight->cabin_class, 'departure_at' => $flight->departure_at->toIso8601String()]];
            case 3:
                $bus = Bus::inRandomOrder()->first();
                $seat = fake()->randomElement($bus->seatLabels());

                return ['type' => 'bus', 'model' => $bus, 'name' => "{$bus->operator} · {$bus->from_city} → {$bus->to_city}", 'image' => null,
                    'start' => $offset > 0 ? $bus->departure_at->copy()->startOfDay() : $start, 'end' => null, 'qty' => 1, 'units' => 1, 'price' => $bus->price,
                    'details' => ['seats' => [$seat], 'bus_type' => $bus->bus_type, 'departure_at' => $bus->departure_at->toIso8601String()]];
            default:
                if (fake()->boolean()) {
                    $tour = Tour::inRandomOrder()->first();

                    return ['type' => 'tour', 'model' => $tour, 'name' => $tour->title, 'image' => $tour->thumbnail, 'start' => $start,
                        'end' => $start->copy()->addDays($tour->duration_days - 1), 'qty' => fake()->numberBetween(1, 4), 'units' => 1,
                        'price' => $tour->effective_price, 'details' => ['tour_slug' => $tour->slug, 'duration' => "{$tour->duration_days}D / {$tour->duration_nights}N"]];
                }
                $car = Car::inRandomOrder()->first();
                $days = fake()->numberBetween(1, 5);

                return ['type' => 'car', 'model' => $car, 'name' => $car->name, 'image' => $car->thumbnail, 'start' => $start,
                    'end' => $start->copy()->addDays($days), 'qty' => 1, 'units' => $days, 'price' => $car->price_per_day,
                    'details' => ['pickup_city' => $car->destination?->name, 'transmission' => $car->transmission]];
        }
    }

    private function reviews($customers): void
    {
        $comments = [
            5 => ['Absolutely loved it! Staff were incredibly friendly and everything was spotless.', 'Exceeded every expectation — would book again in a heartbeat.', 'Perfect location, beautiful views and amazing food. Highly recommended!'],
            4 => ['Great experience overall, a few small things could be better but we were very happy.', 'Very comfortable and good value for money. Booking with EasyGo was seamless.', 'Lovely stay, clean rooms and helpful team.'],
            3 => ['Decent experience. Good for the price but nothing extraordinary.', 'Okay overall; check-in took a while but the room was fine.'],
            2 => ['Not quite as pictured. Service was slow during our visit.'],
        ];

        $targets = collect()->merge(Hotel::all())->merge(Tour::all())->merge(Car::inRandomOrder()->take(8)->get());

        foreach ($targets as $target) {
            foreach ($customers->random(min($customers->count(), fake()->numberBetween(2, 6))) as $user) {
                $rating = fake()->randomElement([5, 5, 5, 4, 4, 4, 3, 2]);
                Review::create([
                    'user_id' => $user->id,
                    'reviewable_type' => $target->getMorphClass(),
                    'reviewable_id' => $target->getKey(),
                    'rating' => $rating,
                    'title' => fake()->randomElement(['Wonderful trip', 'Great value', 'Would recommend', 'Memorable stay', 'Good experience', 'Nice but could improve']),
                    'comment' => fake()->randomElement($comments[$rating]),
                    'status' => fake()->boolean(88) ? 'approved' : 'pending',
                    'created_at' => now()->subDays(fake()->numberBetween(1, 120)),
                ]);
            }
        }
    }

    private function engagement($customers, User $demo): void
    {
        foreach (Hotel::inRandomOrder()->take(3)->get()->merge(Tour::inRandomOrder()->take(2)->get()) as $item) {
            $demo->wishlists()->create(['wishlistable_type' => $item->getMorphClass(), 'wishlistable_id' => $item->getKey()]);
        }

        $subjects = ['Refund status for my booking', 'Can I change my travel date?', 'Group booking enquiry', 'Partnership opportunity', 'Issue with payment'];
        foreach ($subjects as $k => $subject) {
            $user = $customers->random();
            ContactMessage::create([
                'user_id' => $user->id, 'name' => $user->name, 'email' => $user->email, 'subject' => $subject,
                'message' => fake()->paragraph(3), 'status' => $k < 3 ? 'new' : 'replied',
                'admin_reply' => $k < 3 ? null : 'Thanks for reaching out! We have resolved this for you.', 'replied_at' => $k < 3 ? null : now(),
            ]);
        }

        for ($i = 0; $i < 25; $i++) {
            NewsletterSubscriber::firstOrCreate(['email' => fake()->unique()->safeEmail()]);
        }
    }

    /** 30 days of impressions/clicks so the ad analytics charts are populated. */
    private function adEvents(): void
    {
        $rows = [];
        foreach (Ad::with('zones')->get() as $ad) {
            $impressions = 0;
            $clicks = 0;
            for ($d = 29; $d >= 0; $d--) {
                foreach ($ad->zones as $zone) {
                    $views = fake()->numberBetween(8, 45);
                    for ($v = 0; $v < $views; $v++) {
                        $at = now()->subDays($d)->setTime(fake()->numberBetween(0, 23), fake()->numberBetween(0, 59));
                        $device = fake()->boolean(62) ? 'mobile' : 'desktop';
                        $viewer = 'seed-'.fake()->numberBetween(1, 400);
                        $rows[] = ['ad_id' => $ad->id, 'ad_zone_id' => $zone->id, 'event' => 'impression', 'viewer_id' => $viewer, 'device' => $device, 'created_at' => $at];
                        $impressions++;
                        if (fake()->boolean(4)) {
                            $rows[] = ['ad_id' => $ad->id, 'ad_zone_id' => $zone->id, 'event' => 'click', 'viewer_id' => $viewer, 'device' => $device, 'created_at' => $at->copy()->addSeconds(6)];
                            $clicks++;
                        } elseif ($zone->placement === 'interstitial') {
                            $rows[] = ['ad_id' => $ad->id, 'ad_zone_id' => $zone->id, 'event' => fake()->randomElement(['skip', 'close', 'complete']), 'viewer_id' => $viewer, 'device' => $device, 'created_at' => $at->copy()->addSeconds(8)];
                        }
                    }
                }
            }
            $ad->forceFill(['impressions_count' => $impressions, 'clicks_count' => $clicks])->saveQuietly();
        }

        foreach (array_chunk($rows, 1000) as $chunk) {
            AdEvent::insert($chunk);
        }
    }
}
