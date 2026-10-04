<?php

namespace Database\Seeders;

use App\Models\Bus;
use App\Models\Flight;
use Illuminate\Database\Seeder;

/** Flight and bus schedules for the next 45 days (bulk inserted for speed). */
class TransportSeeder extends Seeder
{
    private const DAYS = 45;

    public function run(): void
    {
        $this->flights();
        $this->buses();
    }

    private function flights(): void
    {
        $cities = [
            'DAC' => 'Dhaka', 'CGP' => 'Chattogram', 'CXB' => 'Cox\'s Bazar', 'ZYL' => 'Sylhet', 'JSR' => 'Jashore',
            'DXB' => 'Dubai', 'BKK' => 'Bangkok', 'SIN' => 'Singapore', 'KUL' => 'Kuala Lumpur', 'KTM' => 'Kathmandu',
            'MLE' => 'Malé', 'DPS' => 'Bali (Denpasar)',
        ];

        // [from, to, minutes, base fare, airlines (name => code)]
        $routes = [
            ['DAC', 'CXB', 65, 5200, ['US-Bangla Airlines' => 'BS', 'Biman Bangladesh Airlines' => 'BG', 'Novoair' => 'VQ']],
            ['DAC', 'CGP', 55, 4300, ['US-Bangla Airlines' => 'BS', 'Biman Bangladesh Airlines' => 'BG', 'Air Astra' => '2A']],
            ['DAC', 'ZYL', 50, 4100, ['US-Bangla Airlines' => 'BS', 'Novoair' => 'VQ']],
            ['DAC', 'JSR', 45, 3900, ['Novoair' => 'VQ', 'US-Bangla Airlines' => 'BS']],
            ['DAC', 'DXB', 330, 38999, ['Emirates' => 'EK', 'Biman Bangladesh Airlines' => 'BG']],
            ['DAC', 'BKK', 155, 21500, ['Thai Airways' => 'TG', 'US-Bangla Airlines' => 'BS']],
            ['DAC', 'SIN', 270, 29900, ['Singapore Airlines' => 'SQ', 'Biman Bangladesh Airlines' => 'BG']],
            ['DAC', 'KUL', 235, 24500, ['Malaysia Airlines' => 'MH', 'US-Bangla Airlines' => 'BS']],
            ['DAC', 'KTM', 75, 14900, ['Biman Bangladesh Airlines' => 'BG', 'US-Bangla Airlines' => 'BS']],
            ['DAC', 'MLE', 240, 34500, ['US-Bangla Airlines' => 'BS']],
            ['KUL', 'DPS', 185, 15500, ['Malaysia Airlines' => 'MH']],
        ];

        $rows = [];
        $now = now();

        foreach ($routes as [$from, $to, $minutes, $fare, $airlines]) {
            foreach ([[$from, $to], [$to, $from]] as [$a, $b]) {
                for ($day = 1; $day <= self::DAYS; $day++) {
                    foreach ($airlines as $airline => $code) {
                        foreach (fake()->randomElements([7, 10, 13, 16, 19, 21], 2) as $hour) {
                            $dep = today()->addDays($day)->setTime($hour, fake()->randomElement([0, 15, 30, 45]));
                            $stops = $minutes > 200 && fake()->boolean(25) ? 1 : 0;
                            $duration = $minutes + ($stops ? 120 : 0) + fake()->numberBetween(-5, 15);
                            $business = $minutes > 150 && fake()->boolean(20);

                            $rows[] = [
                                'airline' => $airline,
                                'airline_code' => $code,
                                'airline_logo' => null,
                                'flight_number' => $code.'-'.fake()->numberBetween(101, 999),
                                'from_city' => $cities[$a],
                                'from_code' => $a,
                                'to_city' => $cities[$b],
                                'to_code' => $b,
                                'departure_at' => $dep,
                                'arrival_at' => $dep->copy()->addMinutes($duration),
                                'stops' => $stops,
                                'cabin_class' => $business ? 'business' : 'economy',
                                'price' => round($fare * ($business ? 2.8 : 1) * fake()->randomFloat(2, 0.85, 1.3), -1),
                                'total_seats' => $minutes > 150 ? 180 : 72,
                                'baggage' => $minutes > 150 ? '30 kg checked + 7 kg cabin' : '20 kg checked + 7 kg cabin',
                                'refundable' => fake()->boolean(40),
                                'status' => 'active',
                                'created_at' => $now,
                                'updated_at' => $now,
                            ];
                        }
                    }
                }
            }
        }

        foreach (array_chunk($rows, 500) as $chunk) {
            Flight::insert($chunk);
        }
    }

    private function buses(): void
    {
        $operators = ['Green Line Paribahan', 'Shohagh Paribahan', 'Hanif Enterprise', 'Ena Transport', 'Shyamoli Paribahan', 'Saintmartin Hyundai'];

        // [from, to, minutes, base fare]
        $routes = [
            ['Dhaka', 'Cox\'s Bazar', 600, 1500],
            ['Dhaka', 'Chattogram', 330, 900],
            ['Dhaka', 'Sylhet', 330, 850],
            ['Dhaka', 'Khulna', 360, 950],
            ['Dhaka', 'Bandarban', 540, 1200],
            ['Chattogram', 'Cox\'s Bazar', 240, 600],
            ['Dhaka', 'Rajshahi', 360, 800],
        ];

        $points = [
            'Dhaka' => 'Arambagh / Kalabagan counter', 'Cox\'s Bazar' => 'Kolatoli bus stand', 'Chattogram' => 'GEC circle counter',
            'Sylhet' => 'Kadamtali bus terminal', 'Khulna' => 'Sonadanga terminal', 'Bandarban' => 'Bandarban bus stand', 'Rajshahi' => 'Shiroil terminal',
        ];

        $rows = [];
        $now = now();

        foreach ($routes as [$from, $to, $minutes, $fare]) {
            foreach ([[$from, $to], [$to, $from]] as [$a, $b]) {
                for ($day = 1; $day <= self::DAYS; $day++) {
                    foreach (fake()->randomElements($operators, 3) as $operator) {
                        $type = fake()->randomElement(['AC', 'AC', 'Non-AC', 'Sleeper', 'Business']);
                        $dep = today()->addDays($day)->setTime(fake()->randomElement([7, 9, 14, 21, 22, 23]), fake()->randomElement([0, 30]));
                        $mult = ['AC' => 1.0, 'Non-AC' => 0.6, 'Sleeper' => 1.8, 'Business' => 1.5][$type];

                        $rows[] = [
                            'operator' => $operator,
                            'coach_no' => strtoupper(fake()->bothify('??-###')),
                            'bus_type' => $type,
                            'from_city' => $a,
                            'to_city' => $b,
                            'boarding_point' => $points[$a],
                            'dropping_point' => $points[$b],
                            'departure_at' => $dep,
                            'arrival_at' => $dep->copy()->addMinutes($minutes + fake()->numberBetween(0, 45)),
                            'price' => round($fare * $mult, -1),
                            'total_seats' => in_array($type, ['Sleeper', 'Business'], true) ? 30 : 40,
                            'seat_layout' => in_array($type, ['Sleeper', 'Business'], true) ? '1-2' : '2-2',
                            'amenities' => json_encode($type === 'Non-AC' ? ['Reclining seats', 'Water bottle'] : ['Air conditioning', 'Reclining seats', 'Water bottle', 'Charging port', 'Blanket']),
                            'status' => 'active',
                            'created_at' => $now,
                            'updated_at' => $now,
                        ];
                    }
                }
            }
        }

        foreach (array_chunk($rows, 500) as $chunk) {
            Bus::insert($chunk);
        }
    }
}
