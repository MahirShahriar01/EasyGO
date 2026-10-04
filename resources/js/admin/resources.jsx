/**
 * Declarative admin resource definitions consumed by <ResourcePage>.
 * Each entry describes the table columns, filters and form fields for one entity.
 */
import { Link } from 'react-router-dom';
import Img from '../components/common/Img';
import { date, dateTime, money, titleCase } from '../utils/format';
import { StatusBadge } from './components/AdminUI';
import { previewUrl } from './components/MediaInput';

const STATUS = [['active', 'Active'], ['inactive', 'Inactive']];
const statusField = { name: 'status', label: 'Status', type: 'select', options: STATUS, required: true, col: 'col-md-6' };
const featuredField = { name: 'is_featured', label: 'Featured', type: 'switch', switchLabel: 'Show on home page', col: 'col-md-6' };
const thumb = (path) => <Img src={previewUrl(path)} alt="" className="table-thumb" />;
const destinationSelect = { name: 'destination_id', label: 'Destination', type: 'async-select', endpoint: '/admin/destinations', required: true, col: 'col-md-6' };

export const AMENITY_OPTIONS = [
    ['wifi', 'Free Wi-Fi'], ['pool', 'Swimming pool'], ['parking', 'Free parking'], ['spa', 'Spa'], ['gym', 'Fitness centre'],
    ['restaurant', 'Restaurant'], ['bar', 'Bar'], ['ac', 'Air conditioning'], ['airport_shuttle', 'Airport shuttle'],
    ['room_service', '24h room service'], ['beach', 'Beachfront'], ['pet_friendly', 'Pet friendly'], ['family_rooms', 'Family rooms'], ['breakfast', 'Breakfast'],
];

export const destinations = {
    title: 'Destinations', singular: 'destination', icon: 'mdi-map-marker-radius', endpoint: '/admin/destinations',
    defaults: { status: 'active', is_featured: false },
    filters: [{ key: 'status', label: 'Status', options: STATUS }],
    columns: [
        { key: 'image', label: '', render: (r) => thumb(r.image) },
        { key: 'name', label: 'Name', sortable: true, render: (r) => <><div className="fw-semibold">{r.name}</div><div className="small text-soft">{r.tagline}</div></> },
        { key: 'country', label: 'Country', sortable: true },
        { key: 'hotels_count', label: 'Hotels' },
        { key: 'tours_count', label: 'Tours' },
        { key: 'cars_count', label: 'Cars' },
        { key: 'is_featured', label: 'Featured', render: (r) => (r.is_featured ? <i className="mdi mdi-star text-warning" /> : '—') },
        { key: 'status', label: 'Status', render: (r) => <StatusBadge value={r.status} /> },
    ],
    fields: [
        { name: 'name', label: 'Name', required: true, col: 'col-md-6' },
        { name: 'country', label: 'Country', required: true, col: 'col-md-6' },
        { name: 'tagline', label: 'Tagline' },
        { name: 'description', label: 'Description', type: 'textarea' },
        { name: 'image', label: 'Cover image', type: 'image', folder: 'destinations' },
        { name: 'latitude', label: 'Latitude', type: 'number', col: 'col-md-6' },
        { name: 'longitude', label: 'Longitude', type: 'number', col: 'col-md-6' },
        featuredField, statusField,
    ],
};

export const hotels = {
    title: 'Hotels', singular: 'hotel', icon: 'mdi-office-building', endpoint: '/admin/hotels',
    defaults: { status: 'active', property_type: 'hotel', star_rating: 3, check_in_time: '14:00', check_out_time: '12:00', amenities: [], images: [], is_featured: false },
    filters: [
        { key: 'status', label: 'Status', options: STATUS },
        { key: 'star_rating', label: 'Stars', options: [5, 4, 3, 2, 1].map((s) => [s, `${s} stars`]) },
        { key: 'property_type', label: 'Type', options: ['hotel', 'resort', 'apartment', 'villa', 'guesthouse'].map((t) => [t, titleCase(t)]) },
    ],
    columns: [
        { key: 'thumb', label: '', render: (r) => thumb(r.thumbnail || r.images?.[0]) },
        { key: 'name', label: 'Hotel', sortable: true, render: (r) => <><div className="fw-semibold">{r.name}</div><div className="small text-soft">{r.destination?.name} · {titleCase(r.property_type)}</div></> },
        { key: 'star_rating', label: 'Stars', sortable: true, render: (r) => <span className="text-warning">{'★'.repeat(r.star_rating)}</span> },
        { key: 'min_price', label: 'From', sortable: true, render: (r) => money(r.min_price) },
        { key: 'room_types_count', label: 'Rooms' },
        { key: 'avg_rating', label: 'Rating', sortable: true, render: (r) => `${Number(r.avg_rating).toFixed(1)} (${r.reviews_count})` },
        { key: 'status', label: 'Status', render: (r) => <StatusBadge value={r.status} /> },
    ],
    rowActions: (r) => (
        <>
            <Link to={`/admin/hotels/${r.id}/rooms`} className="btn btn-sm btn-outline-primary me-1" title="Manage room types"><i className="mdi mdi-bed" /> Rooms</Link>
            <a href={`/hotels/${r.slug}`} target="_blank" rel="noreferrer" className="btn btn-sm btn-light me-1" title="View on site"><i className="mdi mdi-open-in-new" /></a>
        </>
    ),
    fields: [
        { name: 'name', label: 'Hotel name', required: true, col: 'col-md-8' },
        { name: 'star_rating', label: 'Stars', type: 'select', options: [5, 4, 3, 2, 1].map((s) => [s, `${s} ★`]), required: true, col: 'col-md-4' },
        destinationSelect,
        { name: 'property_type', label: 'Property type', type: 'select', options: ['hotel', 'resort', 'apartment', 'villa', 'guesthouse'].map((t) => [t, titleCase(t)]), required: true, col: 'col-md-6' },
        { name: 'address', label: 'Address' },
        { name: 'description', label: 'Description', type: 'textarea', rows: 5 },
        { name: 'amenities', label: 'Amenities', type: 'checklist', options: AMENITY_OPTIONS },
        { name: 'thumbnail', label: 'Thumbnail', type: 'image', folder: 'hotels', help: 'Optional — the first gallery image is used when empty.' },
        { name: 'images', label: 'Photo gallery', type: 'gallery', folder: 'hotels' },
        { name: 'check_in_time', label: 'Check-in time', type: 'time', required: true, col: 'col-md-3' },
        { name: 'check_out_time', label: 'Check-out time', type: 'time', required: true, col: 'col-md-3' },
        { name: 'latitude', label: 'Latitude', type: 'number', col: 'col-md-3' },
        { name: 'longitude', label: 'Longitude', type: 'number', col: 'col-md-3' },
        { name: 'phone', label: 'Phone', col: 'col-md-6' },
        { name: 'email', label: 'Reservations e-mail', type: 'email', col: 'col-md-6' },
        { name: 'policies', label: 'Policies', type: 'textarea' },
        featuredField, statusField,
    ],
};

export const roomTypes = {
    title: 'Room types', singular: 'room type', icon: 'mdi-bed', endpoint: '/admin/room-types',
    defaults: { status: 'active', max_adults: 2, max_children: 0, total_rooms: 5, refundable: true, breakfast_included: false, amenities: [], images: [] },
    columns: [
        { key: 'img', label: '', render: (r) => thumb(r.images?.[0]) },
        { key: 'name', label: 'Room', sortable: true, render: (r) => <><div className="fw-semibold">{r.name}</div><div className="small text-soft">{r.bed_type} · {r.size_sqm} m²</div></> },
        { key: 'occupancy', label: 'Occupancy', render: (r) => `${r.max_adults} + ${r.max_children}` },
        { key: 'price_per_night', label: 'Price / night', sortable: true, render: (r) => money(r.price_per_night) },
        { key: 'total_rooms', label: 'Inventory' },
        { key: 'refundable', label: 'Policy', render: (r) => (r.refundable ? <span className="text-success small">Refundable</span> : <span className="text-danger small">Non-refundable</span>) },
        { key: 'status', label: 'Status', render: (r) => <StatusBadge value={r.status} /> },
    ],
    fields: [
        { name: 'hotel_id', label: 'Hotel', type: 'async-select', endpoint: '/admin/hotels', required: true },
        { name: 'name', label: 'Room name', required: true, col: 'col-md-6' },
        { name: 'bed_type', label: 'Bed type', col: 'col-md-6' },
        { name: 'description', label: 'Description', type: 'textarea', rows: 3 },
        { name: 'price_per_night', label: 'Price per night', type: 'number', required: true, col: 'col-md-4' },
        { name: 'total_rooms', label: 'Number of rooms', type: 'number', required: true, col: 'col-md-4' },
        { name: 'size_sqm', label: 'Size (m²)', type: 'number', col: 'col-md-4' },
        { name: 'max_adults', label: 'Max adults', type: 'number', required: true, col: 'col-md-6' },
        { name: 'max_children', label: 'Max children', type: 'number', required: true, col: 'col-md-6' },
        { name: 'amenities', label: 'Room amenities', type: 'tags', placeholder: 'Wi-Fi, Smart TV…' },
        { name: 'images', label: 'Photos', type: 'gallery', folder: 'rooms' },
        { name: 'breakfast_included', label: 'Breakfast', type: 'switch', switchLabel: 'Breakfast included', col: 'col-md-6' },
        { name: 'refundable', label: 'Cancellation', type: 'switch', switchLabel: 'Free cancellation', col: 'col-md-6' },
        statusField,
    ],
};

export const flights = {
    title: 'Flights', singular: 'flight', icon: 'mdi-airplane', endpoint: '/admin/flights', defaultSort: 'departure_at',
    labelKey: 'flight_number',
    defaults: { status: 'active', cabin_class: 'economy', stops: 0, total_seats: 180, refundable: false },
    filters: [
        { key: 'status', label: 'Status', options: STATUS },
        { key: 'cabin_class', label: 'Cabin', options: [['economy', 'Economy'], ['premium', 'Premium'], ['business', 'Business'], ['first', 'First']] },
    ],
    columns: [
        { key: 'flight_number', label: 'Flight', render: (r) => <><div className="fw-semibold">{r.flight_number}</div><div className="small text-soft">{r.airline}</div></> },
        { key: 'route', label: 'Route', render: (r) => `${r.from_code} → ${r.to_code}` },
        { key: 'departure_at', label: 'Departure', sortable: true, render: (r) => dateTime(r.departure_at) },
        { key: 'cabin_class', label: 'Cabin', render: (r) => titleCase(r.cabin_class) },
        { key: 'price', label: 'Fare', sortable: true, render: (r) => money(r.price) },
        { key: 'total_seats', label: 'Seats' },
        { key: 'status', label: 'Status', render: (r) => <StatusBadge value={r.status} /> },
    ],
    fields: [
        { name: 'airline', label: 'Airline', required: true, col: 'col-md-6' },
        { name: 'airline_code', label: 'IATA code', col: 'col-md-3' },
        { name: 'flight_number', label: 'Flight no.', required: true, col: 'col-md-3' },
        { name: 'from_city', label: 'From city', required: true, col: 'col-md-8' },
        { name: 'from_code', label: 'Airport', required: true, col: 'col-md-4', placeholder: 'DAC' },
        { name: 'to_city', label: 'To city', required: true, col: 'col-md-8' },
        { name: 'to_code', label: 'Airport', required: true, col: 'col-md-4', placeholder: 'CXB' },
        { name: 'departure_at', label: 'Departure', type: 'datetime', required: true, col: 'col-md-6' },
        { name: 'arrival_at', label: 'Arrival', type: 'datetime', required: true, col: 'col-md-6' },
        { name: 'cabin_class', label: 'Cabin', type: 'select', options: [['economy', 'Economy'], ['premium', 'Premium economy'], ['business', 'Business'], ['first', 'First']], required: true, col: 'col-md-4' },
        { name: 'stops', label: 'Stops', type: 'number', required: true, col: 'col-md-4', min: 0, max: 3 },
        { name: 'total_seats', label: 'Seats', type: 'number', required: true, col: 'col-md-4' },
        { name: 'price', label: 'Fare per traveller', type: 'number', required: true, col: 'col-md-6' },
        { name: 'baggage', label: 'Baggage allowance', col: 'col-md-6' },
        { name: 'airline_logo', label: 'Airline logo', type: 'image', folder: 'airlines' },
        { name: 'refundable', label: 'Fare rules', type: 'switch', switchLabel: 'Refundable fare', col: 'col-md-6' },
        statusField,
    ],
};

export const buses = {
    title: 'Buses', singular: 'bus trip', icon: 'mdi-bus', endpoint: '/admin/buses', defaultSort: 'departure_at', labelKey: 'operator',
    defaults: { status: 'active', bus_type: 'AC', seat_layout: '2-2', total_seats: 40, amenities: [] },
    filters: [
        { key: 'status', label: 'Status', options: STATUS },
        { key: 'bus_type', label: 'Type', options: ['AC', 'Non-AC', 'Sleeper', 'Business'].map((t) => [t, t]) },
    ],
    columns: [
        { key: 'operator', label: 'Operator', render: (r) => <><div className="fw-semibold">{r.operator}</div><div className="small text-soft">{r.coach_no} · {r.bus_type}</div></> },
        { key: 'route', label: 'Route', render: (r) => `${r.from_city} → ${r.to_city}` },
        { key: 'departure_at', label: 'Departure', sortable: true, render: (r) => dateTime(r.departure_at) },
        { key: 'price', label: 'Fare', sortable: true, render: (r) => money(r.price) },
        { key: 'total_seats', label: 'Seats', render: (r) => `${r.total_seats} (${r.seat_layout})` },
        { key: 'status', label: 'Status', render: (r) => <StatusBadge value={r.status} /> },
    ],
    fields: [
        { name: 'operator', label: 'Operator', required: true, col: 'col-md-6' },
        { name: 'coach_no', label: 'Coach no.', col: 'col-md-3' },
        { name: 'bus_type', label: 'Type', type: 'select', options: ['AC', 'Non-AC', 'Sleeper', 'Business'].map((t) => [t, t]), required: true, col: 'col-md-3' },
        { name: 'from_city', label: 'From', required: true, col: 'col-md-6' },
        { name: 'to_city', label: 'To', required: true, col: 'col-md-6' },
        { name: 'boarding_point', label: 'Boarding point', col: 'col-md-6' },
        { name: 'dropping_point', label: 'Dropping point', col: 'col-md-6' },
        { name: 'departure_at', label: 'Departure', type: 'datetime', required: true, col: 'col-md-6' },
        { name: 'arrival_at', label: 'Arrival', type: 'datetime', required: true, col: 'col-md-6' },
        { name: 'price', label: 'Fare per seat', type: 'number', required: true, col: 'col-md-4' },
        { name: 'total_seats', label: 'Total seats', type: 'number', required: true, col: 'col-md-4' },
        { name: 'seat_layout', label: 'Seat layout', type: 'select', options: [['2-2', '2 + 2'], ['1-2', '1 + 2'], ['2-1', '2 + 1'], ['2-3', '2 + 3'], ['1-1', '1 + 1']], required: true, col: 'col-md-4' },
        { name: 'amenities', label: 'Amenities', type: 'tags', placeholder: 'Air conditioning, Charging port…' },
        statusField,
    ],
};

export const tours = {
    title: 'Tour packages', singular: 'tour', icon: 'mdi-island', endpoint: '/admin/tours', labelKey: 'title',
    defaults: { status: 'active', duration_days: 3, duration_nights: 2, max_group_size: 15, itinerary: [], inclusions: [], exclusions: [], images: [], is_featured: false },
    filters: [
        { key: 'status', label: 'Status', options: STATUS },
        { key: 'category', label: 'Category', options: ['adventure', 'beach', 'culture', 'honeymoon', 'family', 'wildlife'].map((c) => [c, titleCase(c)]) },
    ],
    columns: [
        { key: 'thumb', label: '', render: (r) => thumb(r.thumbnail || r.images?.[0]) },
        { key: 'title', label: 'Tour', sortable: true, render: (r) => <><div className="fw-semibold">{r.title}</div><div className="small text-soft">{r.destination?.name} · {titleCase(r.category || '')}</div></> },
        { key: 'duration_days', label: 'Duration', sortable: true, render: (r) => `${r.duration_days}D/${r.duration_nights}N` },
        { key: 'price', label: 'Price', sortable: true, render: (r) => <>{r.discount_price ? <><s className="text-soft small">{money(r.price)}</s> {money(r.discount_price)}</> : money(r.price)}</> },
        { key: 'avg_rating', label: 'Rating', sortable: true, render: (r) => `${Number(r.avg_rating).toFixed(1)} (${r.reviews_count})` },
        { key: 'status', label: 'Status', render: (r) => <StatusBadge value={r.status} /> },
    ],
    fields: [
        { name: 'title', label: 'Title', required: true },
        destinationSelect,
        { name: 'category', label: 'Category', type: 'select', options: ['adventure', 'beach', 'culture', 'honeymoon', 'family', 'wildlife'].map((c) => [c, titleCase(c)]), col: 'col-md-6' },
        { name: 'description', label: 'Description', type: 'textarea', rows: 5 },
        { name: 'duration_days', label: 'Days', type: 'number', required: true, col: 'col-md-3' },
        { name: 'duration_nights', label: 'Nights', type: 'number', required: true, col: 'col-md-3' },
        { name: 'max_group_size', label: 'Max group', type: 'number', required: true, col: 'col-md-6' },
        { name: 'price', label: 'Price per person', type: 'number', required: true, col: 'col-md-6' },
        { name: 'discount_price', label: 'Discounted price', type: 'number', col: 'col-md-6', help: 'Leave empty for no discount.' },
        { name: 'available_from', label: 'Available from', type: 'date', col: 'col-md-6' },
        { name: 'available_to', label: 'Available to', type: 'date', col: 'col-md-6' },
        { name: 'itinerary', label: 'Itinerary', type: 'itinerary' },
        { name: 'inclusions', label: 'Inclusions', type: 'tags' },
        { name: 'exclusions', label: 'Exclusions', type: 'tags' },
        { name: 'thumbnail', label: 'Thumbnail', type: 'image', folder: 'tours' },
        { name: 'images', label: 'Gallery', type: 'gallery', folder: 'tours' },
        featuredField, statusField,
    ],
};

export const cars = {
    title: 'Rental cars', singular: 'car', icon: 'mdi-car', endpoint: '/admin/cars',
    defaults: { status: 'active', car_type: 'sedan', seats: 4, bags: 2, transmission: 'automatic', fuel_type: 'petrol', quantity: 3, air_conditioning: true, with_driver: false, features: [], images: [] },
    filters: [
        { key: 'status', label: 'Status', options: STATUS },
        { key: 'car_type', label: 'Type', options: ['micro', 'sedan', 'suv', 'van', 'luxury'].map((t) => [t, titleCase(t)]) },
    ],
    columns: [
        { key: 'thumb', label: '', render: (r) => thumb(r.thumbnail || r.images?.[0]) },
        { key: 'name', label: 'Car', sortable: true, render: (r) => <><div className="fw-semibold">{r.name}</div><div className="small text-soft">{r.destination?.name} · {titleCase(r.car_type)}</div></> },
        { key: 'seats', label: 'Seats' },
        { key: 'transmission', label: 'Gearbox', render: (r) => titleCase(r.transmission) },
        { key: 'price_per_day', label: 'Per day', sortable: true, render: (r) => money(r.price_per_day) },
        { key: 'quantity', label: 'Fleet' },
        { key: 'status', label: 'Status', render: (r) => <StatusBadge value={r.status} /> },
    ],
    fields: [
        { name: 'name', label: 'Model name', required: true, col: 'col-md-8' },
        { name: 'brand', label: 'Brand', col: 'col-md-4' },
        destinationSelect,
        { name: 'car_type', label: 'Type', type: 'select', options: ['micro', 'sedan', 'suv', 'van', 'luxury'].map((t) => [t, titleCase(t)]), required: true, col: 'col-md-6' },
        { name: 'seats', label: 'Seats', type: 'number', required: true, col: 'col-md-3' },
        { name: 'bags', label: 'Bags', type: 'number', required: true, col: 'col-md-3' },
        { name: 'transmission', label: 'Transmission', type: 'select', options: [['automatic', 'Automatic'], ['manual', 'Manual']], required: true, col: 'col-md-3' },
        { name: 'fuel_type', label: 'Fuel', type: 'select', options: ['petrol', 'diesel', 'hybrid', 'electric', 'cng'].map((f) => [f, titleCase(f)]), required: true, col: 'col-md-3' },
        { name: 'price_per_day', label: 'Price per day', type: 'number', required: true, col: 'col-md-6' },
        { name: 'quantity', label: 'Fleet size', type: 'number', required: true, col: 'col-md-6' },
        { name: 'air_conditioning', label: 'A/C', type: 'switch', switchLabel: 'Air conditioning', col: 'col-md-6' },
        { name: 'with_driver', label: 'Driver', type: 'switch', switchLabel: 'Comes with driver', col: 'col-md-6' },
        { name: 'features', label: 'Features', type: 'tags' },
        { name: 'thumbnail', label: 'Thumbnail', type: 'image', folder: 'cars' },
        { name: 'images', label: 'Gallery', type: 'gallery', folder: 'cars' },
        statusField,
    ],
};

export const coupons = {
    title: 'Coupons', singular: 'coupon', icon: 'mdi-ticket-percent-outline', endpoint: '/admin/coupons', labelKey: 'code',
    defaults: { type: 'percent', applies_to: 'all', is_active: true, min_amount: 0 },
    filters: [{ key: 'applies_to', label: 'Service', options: ['all', 'hotel', 'flight', 'bus', 'tour', 'car'].map((s) => [s, titleCase(s)]) }],
    columns: [
        { key: 'code', label: 'Code', sortable: true, render: (r) => <><code className="fw-bold fs-6">{r.code}</code><div className="small text-soft">{r.description}</div></> },
        { key: 'value', label: 'Discount', render: (r) => (r.type === 'percent' ? `${r.value}%${r.max_discount ? ` (max ${money(r.max_discount)})` : ''}` : money(r.value)) },
        { key: 'applies_to', label: 'Applies to', render: (r) => titleCase(r.applies_to) },
        { key: 'used_count', label: 'Used', sortable: true, render: (r) => `${r.used_count}${r.usage_limit ? ` / ${r.usage_limit}` : ''}` },
        { key: 'expires_at', label: 'Expires', sortable: true, render: (r) => (r.expires_at ? date(r.expires_at) : 'Never') },
        { key: 'is_active', label: 'Status', render: (r) => <StatusBadge value={r.is_active} /> },
    ],
    fields: [
        { name: 'code', label: 'Code', required: true, col: 'col-md-6', placeholder: 'SUMMER25' },
        { name: 'applies_to', label: 'Applies to', type: 'select', options: ['all', 'hotel', 'flight', 'bus', 'tour', 'car'].map((s) => [s, titleCase(s)]), required: true, col: 'col-md-6' },
        { name: 'description', label: 'Description' },
        { name: 'type', label: 'Type', type: 'select', options: [['percent', 'Percentage'], ['fixed', 'Fixed amount']], required: true, col: 'col-md-4' },
        { name: 'value', label: 'Value', type: 'number', required: true, col: 'col-md-4' },
        { name: 'max_discount', label: 'Max discount', type: 'number', col: 'col-md-4' },
        { name: 'min_amount', label: 'Minimum spend', type: 'number', col: 'col-md-4' },
        { name: 'usage_limit', label: 'Total uses', type: 'number', col: 'col-md-4' },
        { name: 'per_user_limit', label: 'Uses per customer', type: 'number', col: 'col-md-4' },
        { name: 'starts_at', label: 'Starts', type: 'datetime', col: 'col-md-6' },
        { name: 'expires_at', label: 'Expires', type: 'datetime', col: 'col-md-6' },
        { name: 'is_active', label: 'Active', type: 'switch', switchLabel: 'Coupon is active' },
    ],
};

export const users = {
    title: 'Users', singular: 'user', icon: 'mdi-account-group', endpoint: '/admin/users',
    defaults: { role: 'customer', status: 'active' },
    filters: [
        { key: 'role', label: 'Role', options: [['customer', 'Customer'], ['admin', 'Admin']] },
        { key: 'status', label: 'Status', options: [['active', 'Active'], ['blocked', 'Blocked']] },
    ],
    columns: [
        { key: 'name', label: 'User', sortable: true, render: (r) => <div className="d-flex align-items-center gap-2"><img src={r.avatar_url} alt="" width="36" height="36" className="rounded-circle" /><div><div className="fw-semibold">{r.name}</div><div className="small text-soft">{r.email}</div></div></div> },
        { key: 'phone', label: 'Phone' },
        { key: 'role', label: 'Role', render: (r) => <span className={`badge ${r.role === 'admin' ? 'text-bg-dark' : 'text-bg-light'} text-capitalize`}>{r.role}</span> },
        { key: 'bookings_count', label: 'Bookings' },
        { key: 'last_login_at', label: 'Last login', sortable: true, render: (r) => (r.last_login_at ? dateTime(r.last_login_at) : '—') },
        { key: 'status', label: 'Status', render: (r) => <StatusBadge value={r.status} /> },
    ],
    fields: [
        { name: 'name', label: 'Name', required: true, col: 'col-md-6' },
        { name: 'email', label: 'E-mail', type: 'email', required: true, col: 'col-md-6' },
        { name: 'phone', label: 'Phone', col: 'col-md-6' },
        { name: 'password', label: 'Password', type: 'password', col: 'col-md-6', help: 'Leave empty to keep the current password.' },
        { name: 'city', label: 'City', col: 'col-md-6' },
        { name: 'country', label: 'Country', col: 'col-md-6' },
        { name: 'role', label: 'Role', type: 'select', options: [['customer', 'Customer'], ['admin', 'Administrator']], required: true, col: 'col-md-6' },
        { name: 'status', label: 'Status', type: 'select', options: [['active', 'Active'], ['blocked', 'Blocked']], required: true, col: 'col-md-6', help: 'Blocked users are signed out and cannot log in.' },
    ],
};

export const adZones = {
    title: 'Ad zones', singular: 'ad zone', icon: 'mdi-view-grid-plus-outline', endpoint: '/admin/ad-zones',
    subtitle: 'Placements on the customer site where ads can appear',
    defaults: { page: 'global', placement: 'banner', max_ads: 1, rotation_seconds: 8, is_active: true },
    filters: [{ key: 'placement', label: 'Placement', options: ['banner', 'sidebar', 'inline', 'interstitial'].map((p) => [p, titleCase(p)]) }],
    columns: [
        { key: 'name', label: 'Zone', sortable: true, render: (r) => <><div className="fw-semibold">{r.name}</div><code className="small">{r.key}</code></> },
        { key: 'page', label: 'Page', sortable: true, render: (r) => titleCase(r.page) },
        { key: 'placement', label: 'Placement', render: (r) => <span className="badge text-bg-light">{titleCase(r.placement)}</span> },
        { key: 'size', label: 'Size', render: (r) => (r.width ? `${r.width}×${r.height}` : '—') },
        { key: 'max_ads', label: 'Rotation', render: (r) => (r.max_ads > 1 ? `${r.max_ads} ads / ${r.rotation_seconds}s` : 'Single') },
        { key: 'ads_count', label: 'Ads', render: (r) => <Link to={`/admin/ads?zone_id=${r.id}`}>{r.ads_count}</Link> },
        { key: 'is_active', label: 'Status', render: (r) => <StatusBadge value={r.is_active} /> },
    ],
    fields: [
        { name: 'name', label: 'Name', required: true, col: 'col-md-6' },
        { name: 'key', label: 'Key', required: true, col: 'col-md-6', help: 'Used in code: <AdSlot zone="key" />. Lowercase letters, numbers, underscores.' },
        { name: 'description', label: 'Description' },
        { name: 'page', label: 'Page', type: 'select', options: ['global', 'home', 'search', 'detail', 'checkout', 'account'].map((p) => [p, titleCase(p)]), required: true, col: 'col-md-6' },
        { name: 'placement', label: 'Placement', type: 'select', options: ['banner', 'sidebar', 'inline', 'interstitial'].map((p) => [p, titleCase(p)]), required: true, col: 'col-md-6' },
        { name: 'width', label: 'Recommended width (px)', type: 'number', col: 'col-md-6' },
        { name: 'height', label: 'Recommended height (px)', type: 'number', col: 'col-md-6' },
        { name: 'max_ads', label: 'Ads in rotation', type: 'number', required: true, col: 'col-md-6', min: 1, max: 10 },
        { name: 'rotation_seconds', label: 'Rotate every (s)', type: 'number', required: true, col: 'col-md-6', min: 3, max: 120 },
        { name: 'is_active', label: 'Active', type: 'switch', switchLabel: 'Zone is active' },
    ],
};
