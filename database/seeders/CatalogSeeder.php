<?php

namespace Database\Seeders;

use App\Models\Car;
use App\Models\Destination;
use App\Models\Hotel;
use App\Models\Tour;
use Illuminate\Database\Seeder;

/**
 * Destinations, hotels (+ room types), tour packages and rental cars.
 * Photos are royalty-free Unsplash URLs; the SPA falls back to a local
 * placeholder if an image cannot be loaded (e.g. offline demos).
 */
class CatalogSeeder extends Seeder
{
    private function img(string $id, int $w = 1200): string
    {
        return "https://images.unsplash.com/{$id}?auto=format&fit=crop&w={$w}&q=75";
    }

    public function run(): void
    {
        $destinations = [
            ['Cox\'s Bazar', 'Bangladesh', 'The world\'s longest natural sea beach', 'photo-1507525428034-b723cf961d3e', 21.4272, 92.0058, true],
            ['Sylhet', 'Bangladesh', 'Tea gardens, waterfalls and rolling hills', 'photo-1470770841072-f978cf4d019e', 24.8949, 91.8687, true],
            ['Bandarban', 'Bangladesh', 'Clouds, hill tribes and mountain trails', 'photo-1506905925346-21bda4d32df4', 22.1953, 92.2184, true],
            ['Sundarbans', 'Bangladesh', 'Home of the Royal Bengal Tiger', 'photo-1448375240586-882707db888b', 21.9497, 89.1833, false],
            ['Dhaka', 'Bangladesh', 'The vibrant capital on the Buriganga', 'photo-1477959858617-67f85cf4f1df', 23.8103, 90.4125, false],
            ['Dubai', 'United Arab Emirates', 'Skyscrapers, desert safaris and souks', 'photo-1512453979798-5ea266f8880c', 25.2048, 55.2708, true],
            ['Bangkok', 'Thailand', 'Temples, street food and floating markets', 'photo-1508009603885-50cf7c579365', 13.7563, 100.5018, true],
            ['Bali', 'Indonesia', 'Island of the gods — beaches & rice terraces', 'photo-1537996194471-e657df975ab4', -8.3405, 115.0920, true],
            ['Maldives', 'Maldives', 'Overwater villas on turquoise lagoons', 'photo-1514282401047-d79a71a590e8', 3.2028, 73.2207, true],
            ['Singapore', 'Singapore', 'Garden city of the future', 'photo-1525625293386-3f8f99389edd', 1.3521, 103.8198, false],
            ['Kathmandu', 'Nepal', 'Gateway to the Himalayas', 'photo-1544735716-392fe2489ffa', 27.7172, 85.3240, false],
            ['Kuala Lumpur', 'Malaysia', 'Twin towers and tropical rainforest', 'photo-1596422846543-75c6fc197f07', 3.1390, 101.6869, false],
        ];

        $dest = [];
        foreach ($destinations as [$name, $country, $tagline, $photo, $lat, $lng, $featured]) {
            $dest[$name] = Destination::create([
                'name' => $name,
                'country' => $country,
                'tagline' => $tagline,
                'description' => "{$name} is one of the most loved destinations on EasyGo. {$tagline}. Discover handpicked stays, guided tours and convenient transport — all bookable in a few clicks.",
                'image' => $this->img($photo),
                'latitude' => $lat,
                'longitude' => $lng,
                'is_featured' => $featured,
            ]);
        }

        $this->hotels($dest);
        $this->tours($dest);
        $this->cars($dest);
    }

    /** @param array<string, Destination> $dest */
    private function hotels(array $dest): void
    {
        $hotelPhotos = [
            'photo-1566073771259-6a8506099945', 'photo-1551882547-ff40c63fe5fa', 'photo-1542314831-068cd1dbfeeb',
            'photo-1520250497591-112f2f40a3f4', 'photo-1571896349842-33c89424de2d', 'photo-1564501049412-61c2a3083791',
            'photo-1445019980597-93fa8acb246c', 'photo-1496417263034-38ec4f0b665a', 'photo-1584132967334-10e028bd69f7',
            'photo-1578683010236-d716f9a3f461', 'photo-1590381105924-c72589b9ef3f', 'photo-1561501900-3701fa6a0864',
        ];
        $roomPhotos = [
            'photo-1582719478250-c89cae4dc85b', 'photo-1611892440504-42a792e24d32', 'photo-1590490360182-c33d57733427',
            'photo-1618773928121-c32242e63f39', 'photo-1631049307264-da0ec9d70304', 'photo-1595576508898-0ad5c879a061',
        ];

        // [name, destination, type, stars, base price (BDT/night), featured, amenities]
        $hotels = [
            ['Sayeman Beach Resort', 'Cox\'s Bazar', 'resort', 5, 14500, true, ['wifi', 'pool', 'spa', 'restaurant', 'beach', 'gym', 'ac', 'room_service']],
            ['Ocean Paradise Hotel', 'Cox\'s Bazar', 'hotel', 5, 11800, true, ['wifi', 'pool', 'restaurant', 'bar', 'ac', 'parking', 'gym']],
            ['Seagull Bay Inn', 'Cox\'s Bazar', 'hotel', 3, 4200, false, ['wifi', 'restaurant', 'ac', 'parking']],
            ['Long Beach Suites', 'Cox\'s Bazar', 'apartment', 4, 7800, false, ['wifi', 'ac', 'family_rooms', 'beach', 'parking']],
            ['Grand Sylhet Hotel & Resort', 'Sylhet', 'resort', 5, 13500, true, ['wifi', 'pool', 'spa', 'restaurant', 'gym', 'ac', 'airport_shuttle']],
            ['Tea Valley Eco Lodge', 'Sylhet', 'guesthouse', 3, 3900, false, ['wifi', 'restaurant', 'parking', 'pet_friendly', 'breakfast']],
            ['Nazimgarh Garden Retreat', 'Sylhet', 'resort', 4, 9200, false, ['wifi', 'pool', 'restaurant', 'spa', 'ac']],
            ['Sairu Hill Resort', 'Bandarban', 'resort', 4, 9800, true, ['wifi', 'restaurant', 'ac', 'parking', 'family_rooms']],
            ['Cloud Nine Cottages', 'Bandarban', 'villa', 3, 5200, false, ['restaurant', 'parking', 'breakfast']],
            ['Mangrove Eco Resort', 'Sundarbans', 'guesthouse', 3, 4800, false, ['restaurant', 'breakfast', 'parking']],
            ['Pan Pacific Sonargaon', 'Dhaka', 'hotel', 5, 16500, false, ['wifi', 'pool', 'gym', 'spa', 'restaurant', 'bar', 'airport_shuttle', 'room_service']],
            ['Gulshan Boutique Hotel', 'Dhaka', 'hotel', 4, 7600, false, ['wifi', 'restaurant', 'ac', 'gym', 'airport_shuttle']],
            ['Burj Marina Hotel', 'Dubai', 'hotel', 5, 28500, true, ['wifi', 'pool', 'spa', 'gym', 'restaurant', 'bar', 'beach', 'room_service']],
            ['Deira Creek Inn', 'Dubai', 'hotel', 3, 8900, false, ['wifi', 'ac', 'restaurant', 'airport_shuttle']],
            ['Riverside Siam Hotel', 'Bangkok', 'hotel', 4, 7400, true, ['wifi', 'pool', 'restaurant', 'bar', 'gym', 'ac']],
            ['Sukhumvit Urban Stay', 'Bangkok', 'apartment', 3, 4600, false, ['wifi', 'ac', 'gym', 'family_rooms']],
            ['Ubud Jungle Villas', 'Bali', 'villa', 5, 18900, true, ['wifi', 'pool', 'spa', 'restaurant', 'breakfast', 'airport_shuttle']],
            ['Seminyak Beach Resort', 'Bali', 'resort', 4, 12400, false, ['wifi', 'pool', 'beach', 'bar', 'restaurant', 'spa']],
            ['Coral Lagoon Water Villas', 'Maldives', 'resort', 5, 45000, true, ['wifi', 'pool', 'spa', 'beach', 'restaurant', 'bar', 'room_service', 'airport_shuttle']],
            ['Marina Bay View Hotel', 'Singapore', 'hotel', 5, 26500, false, ['wifi', 'pool', 'gym', 'restaurant', 'bar', 'spa']],
            ['Thamel Heritage Hotel', 'Kathmandu', 'hotel', 3, 4300, false, ['wifi', 'restaurant', 'breakfast', 'airport_shuttle']],
            ['KLCC Skyline Suites', 'Kuala Lumpur', 'apartment', 4, 8800, false, ['wifi', 'pool', 'gym', 'ac', 'family_rooms', 'parking']],
        ];

        $roomTemplates = [
            ['Standard Room', 'Queen bed', 24, 2, 1, 1.0, 12, false, true],
            ['Deluxe Room', 'King bed', 32, 2, 2, 1.35, 10, true, true],
            ['Family Suite', '2 Queen beds', 48, 4, 2, 1.9, 6, true, true],
            ['Executive Suite', 'King bed + lounge', 60, 3, 1, 2.6, 4, true, false],
        ];

        foreach ($hotels as $i => [$name, $destName, $type, $stars, $base, $featured, $amenities]) {
            $d = $dest[$destName];
            $photos = array_map(fn ($k) => $this->img($hotelPhotos[($i + $k) % count($hotelPhotos)]), [0, 1, 2, 3]);

            $hotel = Hotel::create([
                'destination_id' => $d->id,
                'name' => $name,
                'property_type' => $type,
                'description' => "{$name} offers a memorable {$stars}-star stay in {$destName}. Guests enjoy thoughtfully designed rooms, warm hospitality and easy access to the area's top attractions. "
                    .'Whether you are travelling for business, a family holiday or a romantic getaway, our team makes every moment effortless.',
                'address' => fake()->streetAddress().", {$destName}, {$d->country}",
                'star_rating' => $stars,
                'amenities' => $amenities,
                'thumbnail' => $photos[0],
                'images' => $photos,
                'latitude' => $d->latitude + fake()->randomFloat(4, -0.03, 0.03),
                'longitude' => $d->longitude + fake()->randomFloat(4, -0.03, 0.03),
                'policies' => "Check-in from 14:00, check-out until 12:00.\nValid photo ID required at check-in.\nNo smoking in rooms.\nChildren of all ages are welcome.",
                'phone' => '+880 1'.fake()->numerify('###-######'),
                'email' => 'reservations@'.str($name)->slug()->replace('-', '').'.com',
                'is_featured' => $featured,
            ]);

            $count = $stars >= 5 ? 4 : 3;
            foreach (array_slice($roomTemplates, 0, $count) as $j => [$room, $bed, $size, $adults, $kids, $mult, $qty, $breakfast, $refundable]) {
                $hotel->roomTypes()->create([
                    'name' => $room,
                    'description' => "Comfortable {$room} with {$bed}, ensuite bathroom, smart TV and complimentary toiletries.",
                    'bed_type' => $bed,
                    'size_sqm' => $size,
                    'max_adults' => $adults,
                    'max_children' => $kids,
                    'price_per_night' => round($base * $mult / 100) * 100,
                    'total_rooms' => $qty,
                    'amenities' => ['Wi-Fi', 'Air conditioning', 'Smart TV', 'Mini fridge', 'Tea & coffee maker'],
                    'images' => [$this->img($roomPhotos[($i + $j) % count($roomPhotos)], 900)],
                    'breakfast_included' => $breakfast,
                    'refundable' => $refundable,
                ]);
            }
        }
    }

    /** @param array<string, Destination> $dest */
    private function tours(array $dest): void
    {
        $tours = [
            ['Cox\'s Bazar & Saint Martin\'s Island Escape', 'Cox\'s Bazar', 'beach', 4, 3, 18500, 15900, 'photo-1507525428034-b723cf961d3e', true],
            ['Sylhet Tea Trails & Ratargul Swamp Forest', 'Sylhet', 'adventure', 3, 2, 12500, null, 'photo-1470770841072-f978cf4d019e', true],
            ['Bandarban Nilgiri & Boga Lake Trek', 'Bandarban', 'adventure', 4, 3, 14900, 13500, 'photo-1506905925346-21bda4d32df4', true],
            ['Sundarbans Mangrove Cruise Safari', 'Sundarbans', 'wildlife', 3, 2, 16500, null, 'photo-1448375240586-882707db888b', false],
            ['Old Dhaka Heritage Food Walk', 'Dhaka', 'culture', 1, 0, 2500, 1990, 'photo-1477959858617-67f85cf4f1df', false],
            ['Dubai Desert Safari & City Highlights', 'Dubai', 'family', 5, 4, 85000, 79900, 'photo-1512453979798-5ea266f8880c', true],
            ['Bangkok & Pattaya Explorer', 'Bangkok', 'family', 5, 4, 62000, null, 'photo-1508009603885-50cf7c579365', false],
            ['Bali Honeymoon Bliss', 'Bali', 'honeymoon', 6, 5, 118000, 109000, 'photo-1537996194471-e657df975ab4', true],
            ['Maldives Water Villa Retreat', 'Maldives', 'honeymoon', 4, 3, 135000, 119999, 'photo-1514282401047-d79a71a590e8', true],
            ['Singapore Family Fun Pack', 'Singapore', 'family', 4, 3, 89000, null, 'photo-1525625293386-3f8f99389edd', false],
            ['Kathmandu & Pokhara Himalayan Discovery', 'Kathmandu', 'culture', 6, 5, 58000, 52000, 'photo-1544735716-392fe2489ffa', false],
        ];

        foreach ($tours as [$title, $destName, $cat, $days, $nights, $price, $discount, $photo, $featured]) {
            $itinerary = [];
            for ($d = 1; $d <= $days; $d++) {
                $itinerary[] = [
                    'day' => $d,
                    'title' => match (true) {
                        $d === 1 => "Arrival in {$destName} & welcome dinner",
                        $d === $days => 'Breakfast, leisure time & departure',
                        default => fake()->randomElement(['Guided sightseeing tour', 'Nature excursion & local lunch', 'Cultural experience & markets', 'Adventure day & sunset point']),
                    },
                    'description' => fake()->sentence(18),
                ];
            }

            Tour::create([
                'destination_id' => $dest[$destName]->id,
                'title' => $title,
                'category' => $cat,
                'description' => "Experience the very best of {$destName} on this {$days}-day guided journey. Expert local guides, comfortable stays and carefully planned days let you relax and soak it all in.",
                'duration_days' => $days,
                'duration_nights' => $nights,
                'price' => $price,
                'discount_price' => $discount,
                'max_group_size' => fake()->randomElement([12, 15, 20, 25]),
                'itinerary' => $itinerary,
                'inclusions' => ['Accommodation', 'Daily breakfast', 'Professional guide', 'All transfers', 'Entrance fees'],
                'exclusions' => ['Personal expenses', 'Travel insurance', 'Tips', 'Visa fees'],
                'thumbnail' => $this->img($photo),
                'images' => [$this->img($photo), $this->img('photo-1469854523086-cc02fe5d8800'), $this->img('photo-1476514525535-07fb3b4ae5f1')],
                'available_from' => today()->toDateString(),
                'available_to' => today()->addMonths(6)->toDateString(),
                'is_featured' => $featured,
            ]);
        }
    }

    /** @param array<string, Destination> $dest */
    private function cars(array $dest): void
    {
        $cars = [
            ['Toyota Axio', 'Toyota', 'sedan', 4, 2, 'automatic', 'cng', 3500, false, 'photo-1549317661-bd32c8ce0db2'],
            ['Toyota Noah', 'Toyota', 'van', 7, 4, 'automatic', 'petrol', 5500, true, 'photo-1559416523-140ddc3d238c'],
            ['Toyota Prado', 'Toyota', 'suv', 7, 4, 'automatic', 'diesel', 9500, true, 'photo-1519641471654-76ce0107ad1b'],
            ['Honda Vezel', 'Honda', 'suv', 5, 3, 'automatic', 'hybrid', 6200, false, 'photo-1533473359331-0135ef1b58bf'],
            ['Suzuki Swift', 'Suzuki', 'micro', 4, 1, 'manual', 'petrol', 2500, false, 'photo-1494976388531-d1058494cdd8'],
            ['Mercedes-Benz E-Class', 'Mercedes-Benz', 'luxury', 4, 3, 'automatic', 'petrol', 18000, true, 'photo-1503376780353-7e6692767b70'],
            ['Toyota Hiace', 'Toyota', 'van', 12, 8, 'manual', 'diesel', 7500, true, 'photo-1559416523-140ddc3d238c'],
        ];

        foreach (['Dhaka', 'Cox\'s Bazar', 'Sylhet', 'Dubai', 'Bangkok'] as $k => $city) {
            foreach ($cars as $i => [$name, $brand, $type, $seats, $bags, $trans, $fuel, $price, $driver, $photo]) {
                if (($i + $k) % 3 === 2) {
                    continue; // vary fleet per city
                }

                Car::create([
                    'destination_id' => $dest[$city]->id,
                    'name' => $name,
                    'brand' => $brand,
                    'car_type' => $type,
                    'seats' => $seats,
                    'bags' => $bags,
                    'transmission' => $trans,
                    'fuel_type' => $fuel,
                    'air_conditioning' => true,
                    'with_driver' => $driver,
                    'price_per_day' => in_array($city, ['Dubai', 'Bangkok'], true) ? round($price * 1.4, -2) : $price,
                    'quantity' => fake()->numberBetween(2, 6),
                    'thumbnail' => $this->img($photo, 900),
                    'images' => [$this->img($photo, 1200)],
                    'features' => array_values(array_filter(['Air conditioning', 'Bluetooth audio', $driver ? 'Professional driver' : 'Self drive', 'Unlimited mileage', 'GPS navigation'])),
                ]);
            }
        }
    }
}
