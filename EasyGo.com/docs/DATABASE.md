# Database Design

Migrations: `database/migrations/`. Engine-agnostic (MySQL/MariaDB, PostgreSQL, SQLite).
Money columns are `DECIMAL(12,2)`; JSON columns hold arrays/objects; timestamps use `APP_TIMEZONE`.

## 1. Entity–relationship diagram

```mermaid
erDiagram
    USERS ||--o{ BOOKINGS : makes
    USERS ||--o{ REVIEWS : writes
    USERS ||--o{ WISHLISTS : saves
    USERS ||--o{ PAYMENTS : pays
    USERS ||--o{ CONTACT_MESSAGES : sends
    USERS ||--o{ PERSONAL_ACCESS_TOKENS : "authenticates with"
    USERS ||--o{ NOTIFICATIONS : receives
    USERS ||--o{ ADS : creates

    DESTINATIONS ||--o{ HOTELS : contains
    DESTINATIONS ||--o{ TOURS : offers
    DESTINATIONS ||--o{ CARS : "pick-up for"
    HOTELS ||--o{ ROOM_TYPES : has

    ROOM_TYPES ||--o{ BOOKINGS : "bookable (room_type)"
    FLIGHTS ||--o{ BOOKINGS : "bookable (flight)"
    BUSES ||--o{ BOOKINGS : "bookable (bus)"
    TOURS ||--o{ BOOKINGS : "bookable (tour)"
    CARS ||--o{ BOOKINGS : "bookable (car)"
    COUPONS |o--o{ BOOKINGS : "discounts"
    BOOKINGS ||--o{ PAYMENTS : "paid by"
    BOOKINGS |o--o{ REVIEWS : "verifies"

    HOTELS ||--o{ REVIEWS : "reviewable"
    TOURS ||--o{ REVIEWS : "reviewable"
    CARS ||--o{ REVIEWS : "reviewable"
    HOTELS ||--o{ WISHLISTS : "wishlistable"
    TOURS ||--o{ WISHLISTS : "wishlistable"
    CARS ||--o{ WISHLISTS : "wishlistable"

    ADS }o--o{ AD_ZONES : "ad_ad_zone"
    ADS ||--o{ AD_EVENTS : logs
    AD_ZONES |o--o{ AD_EVENTS : "occurs in"

    USERS {
        bigint id PK
        string name
        string email UK
        string password
        string role "customer|admin"
        string status "active|blocked"
        string phone
        string avatar
        string city
        string country
        date date_of_birth
        string passport_no
        timestamp last_login_at
    }
    DESTINATIONS {
        bigint id PK
        string name
        string slug UK
        string country
        string image
        decimal latitude
        decimal longitude
        bool is_featured
        string status
    }
    HOTELS {
        bigint id PK
        bigint destination_id FK
        string name
        string slug UK
        string property_type
        tinyint star_rating
        json amenities
        json images
        string check_in_time
        string check_out_time
        decimal avg_rating
        int reviews_count
        decimal min_price
        string status
        timestamp deleted_at
    }
    ROOM_TYPES {
        bigint id PK
        bigint hotel_id FK
        string name
        decimal price_per_night
        smallint total_rooms
        tinyint max_adults
        tinyint max_children
        bool breakfast_included
        bool refundable
        string status
    }
    FLIGHTS {
        bigint id PK
        string airline
        string flight_number
        string from_city
        string from_code
        string to_city
        string to_code
        datetime departure_at
        datetime arrival_at
        tinyint stops
        string cabin_class
        decimal price
        smallint total_seats
        bool refundable
    }
    BUSES {
        bigint id PK
        string operator
        string bus_type
        string from_city
        string to_city
        datetime departure_at
        datetime arrival_at
        decimal price
        smallint total_seats
        string seat_layout
        json amenities
    }
    TOURS {
        bigint id PK
        bigint destination_id FK
        string title
        string slug UK
        string category
        smallint duration_days
        decimal price
        decimal discount_price
        smallint max_group_size
        json itinerary
        date available_from
        date available_to
    }
    CARS {
        bigint id PK
        bigint destination_id FK
        string name
        string car_type
        tinyint seats
        string transmission
        bool with_driver
        decimal price_per_day
        smallint quantity
    }
    COUPONS {
        bigint id PK
        string code UK
        string type "percent|fixed"
        decimal value
        decimal min_amount
        decimal max_discount
        string applies_to
        int usage_limit
        int per_user_limit
        int used_count
        datetime starts_at
        datetime expires_at
        bool is_active
    }
    BOOKINGS {
        bigint id PK
        string reference UK
        bigint user_id FK
        string bookable_type
        bigint bookable_id
        string service_type
        string item_name
        date start_date
        date end_date
        smallint quantity
        smallint units
        json details
        decimal subtotal
        decimal discount
        decimal tax
        decimal service_fee
        decimal total
        bigint coupon_id FK
        string status
        string payment_status
        decimal refund_amount
    }
    PAYMENTS {
        bigint id PK
        bigint booking_id FK
        bigint user_id FK
        string method
        string gateway
        string transaction_id UK
        decimal amount
        string status
        json meta
    }
    REVIEWS {
        bigint id PK
        bigint user_id FK
        string reviewable_type
        bigint reviewable_id
        bigint booking_id FK
        tinyint rating
        text comment
        string status
    }
    WISHLISTS {
        bigint id PK
        bigint user_id FK
        string wishlistable_type
        bigint wishlistable_id
    }
    AD_ZONES {
        bigint id PK
        string key UK
        string name
        string page
        string placement
        smallint width
        smallint height
        tinyint max_ads
        smallint rotation_seconds
        bool is_active
    }
    ADS {
        bigint id PK
        string title
        string media_type "image|video"
        string media_path
        string media_url
        string click_url
        bool closable
        smallint skip_after_seconds
        smallint auto_close_seconds
        string audience
        string device
        tinyint weight
        smallint frequency_cap
        int max_impressions
        int max_clicks
        datetime starts_at
        datetime ends_at
        string status
        bigint impressions_count
        bigint clicks_count
        bigint created_by FK
    }
    AD_EVENTS {
        bigint id PK
        bigint ad_id FK
        bigint ad_zone_id FK
        string event
        bigint user_id FK
        string viewer_id
        string ip_hash
        string device
        timestamp created_at
    }
    CONTACT_MESSAGES {
        bigint id PK
        bigint user_id FK
        string email
        string subject
        text message
        string status
        text admin_reply
    }
    NEWSLETTER_SUBSCRIBERS {
        bigint id PK
        string email UK
        bool is_active
    }
    SETTINGS {
        bigint id PK
        string key UK
        text value
    }
    PERSONAL_ACCESS_TOKENS {
        bigint id PK
        string tokenable_type
        bigint tokenable_id
        string token UK
        timestamp expires_at
    }
    NOTIFICATIONS {
        uuid id PK
        string notifiable_type
        bigint notifiable_id
        text data
        timestamp read_at
    }
```

## 2. Polymorphic type names

`Relation::enforceMorphMap` stores short, stable names in `*_type` columns:

| Value | Model |
|---|---|
| `user` | `App\Models\User` |
| `hotel` | `App\Models\Hotel` |
| `room_type` | `App\Models\RoomType` |
| `flight` | `App\Models\Flight` |
| `bus` | `App\Models\Bus` |
| `tour` | `App\Models\Tour` |
| `car` | `App\Models\Car` |
| `ad` | `App\Models\Ad` |

## 3. Data dictionary (key tables)

### bookings
| Column | Type | Notes |
|---|---|---|
| reference | varchar(20) unique | `EG-` + 8 random uppercase chars; used in URLs |
| bookable_type / bookable_id | morph | Inventory item (see §2) |
| service_type | varchar(20) | `hotel`, `flight`, `bus`, `tour`, `car` |
| item_name / item_image | varchar | Snapshot at booking time |
| start_date / end_date | date | Check-in/out, pick-up/drop-off, travel date (end null for flight/bus) |
| quantity | smallint | Rooms, passengers, seats, travellers or cars |
| units | smallint | Nights (hotel) or days (car); 1 otherwise |
| details | json | e.g. `{hotel_id, room_name, check_in_time}`, `{seats:[…], boarding_point}`, `{passengers:[{name, passport}]}` |
| unit_price … total | decimal(12,2) | Price breakdown (see PricingService) |
| status | varchar(20) | `pending` → `confirmed` → `completed`, or `cancelled` |
| payment_status | varchar(20) | `unpaid`, `paid`, `refunded` |
| refund_amount | decimal | Amount returned on cancellation |

### ads
| Column | Type | Notes |
|---|---|---|
| media_type | varchar(10) | `image` or `video` (detected from uploaded MIME type) |
| media_path / media_url | varchar | Uploaded file on the public disk **or** external URL |
| closable | bool | Viewer may dismiss the ad |
| skip_after_seconds | smallint | Delay before the close/skip button activates (0 = immediately) |
| auto_close_seconds | smallint null | Automatic dismissal; forced to 15 s for non-closable ads |
| audience | varchar | `all`, `guest`, `auth` |
| device | varchar | `all`, `desktop`, `mobile` |
| weight | tinyint | 1–10, weighted random rotation |
| frequency_cap | smallint null | Max impressions per viewer per day |
| max_impressions / max_clicks | int null | Lifetime budgets |
| impressions_count / clicks_count | bigint | Denormalised counters (budget checks, list view) |

### ad_events
| Column | Notes |
|---|---|
| event | `impression`, `click`, `skip`, `close`, `complete` |
| viewer_id | Anonymous browser id from localStorage (frequency capping, unique viewers) |
| ip_hash | `sha256(ip + APP_KEY)` — raw IPs are never stored |
| Indexes | `(ad_id, event, created_at)` for analytics, `(viewer_id, ad_id, event)` for frequency caps |

### settings (key/value)
`site_name`, `site_tagline`, `currency`, `currency_symbol`, `tax_rate`, `service_fee_percent`,
`booking_hold_minutes`, `pay_at_property_enabled`, `auto_approve_reviews`, `ads_enabled`, `hero_*`,
`about_text`, `contact_*`, social URLs. Cached forever and invalidated on save.

## 4. Integrity & concurrency
* Foreign keys cascade on delete for owned data (rooms of a hotel, bookings of a user) and null-out for optional links (coupon, booking on review).
* Booking creation locks the inventory row (`SELECT … FOR UPDATE`) inside a transaction and re-checks availability.
* Unique constraints: one review per user per item; one wishlist entry per user per item; unique codes/slugs/references.
* Soft deletes on hotels, tours and cars keep historical bookings intact.
