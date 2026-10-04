# REST API Reference

* **Base URL:** `/api`
* **Format:** JSON (`Accept: application/json`). File uploads use `multipart/form-data`.
* **Auth:** Laravel Sanctum personal access tokens — `Authorization: Bearer <token>` (obtained from `/auth/login` or `/auth/register`).
* **Errors:** `401` unauthenticated · `403` forbidden/blocked · `404` not found · `422` validation (`{message, errors:{field:[…]}}`) · `429` rate limited.
* **Pagination:** list endpoints return Laravel paginators: `{data:[…], current_page, last_page, per_page, total, from, to, links…}`; use `?page=` and `?per_page=`.
* **Arrays in query strings:** `?stars[]=4&stars[]=5`.

The complete route table can be printed with `php artisan route:list --path=api`.

---

## 1. Public catalogue

| Method | Endpoint | Description |
|---|---|---|
| GET | `/home` | Landing data: destinations, featured hotels & tours, cars, flight deals, testimonials, stats (cached 5 min) |
| GET | `/settings` | Public settings (site name, currency, tax, contact, hero, timezone…) |
| GET | `/suggest?q=&type=destination\|flight\|bus` | Autocomplete suggestions `[{label, value}]` |
| GET | `/destinations` | Active destinations with hotel/tour/car counts |
| GET | `/destinations/{slug}` | Destination + hotels, tours, cars |
| GET | `/hotels` | Hotel search (below) |
| GET | `/hotels/{slug}?check_in=&check_out=` | Hotel, active room types with `available_rooms`, amenity labels, rating breakdown, similar hotels |
| GET | `/flights` | Flight search (below) — also returns `airlines` for filters |
| GET | `/flights/{id}` | Flight with `seats_available` |
| GET | `/buses` | Bus search — also returns `operators` |
| GET | `/buses/{id}` | `{bus, seats:[A1…], booked_seats:[…]}` |
| GET | `/tours` | Tour search |
| GET | `/tours/{slug}?date=` | Tour (+ `spots_left` for date) and similar tours |
| GET | `/cars` | Car search |
| GET | `/cars/{id}?pickup_date=&dropoff_date=` | Car (+ `available_units`) |
| GET | `/reviews/{hotel\|tour\|car}/{id}` | Approved reviews (paginated, 5 per page) |
| POST | `/contact` | `{name, email, subject, message}` → support inbox (5/min) |
| POST | `/newsletter` | `{email}` subscribe (5/min) |

### Search parameters
| Endpoint | Parameters | Sort values |
|---|---|---|
| `/hotels` | `q`, `check_in`, `check_out`, `adults`, `rooms`, `min_price`, `max_price`, `stars[]`, `property_type[]`, `amenities[]`, `min_rating` | `recommended`, `price_asc`, `price_desc`, `rating`, `stars`, `newest` |
| `/flights` | `from`, `to` (city or IATA code), `date`, `passengers` (1-9), `cabin`, `airlines[]`, `stops[]`, `max_price`, `refundable=1` | `price_asc`, `price_desc`, `departure`, `duration` |
| `/buses` | `from`, `to`, `date`, `bus_type[]`, `operators[]`, `max_price` | `departure`, `price_asc`, `price_desc` |
| `/tours` | `q`, `date`, `category[]`, `min_days`, `max_days`, `max_price` | `recommended`, `price_asc`, `price_desc`, `rating`, `duration` |
| `/cars` | `location`, `pickup_date`, `dropoff_date`, `car_type[]`, `transmission`, `seats`, `with_driver=1`, `max_price` | `price_asc`, `price_desc`, `rating` |

Example:
```http
GET /api/flights?from=Dhaka&to=Dubai&date=2026-10-12&passengers=2&sort=duration
```

## 2. Authentication

| Method | Endpoint | Body | Notes |
|---|---|---|---|
| POST | `/auth/register` | `name, email, phone?, password, password_confirmation` | 201 `{user, token}` |
| POST | `/auth/login` | `email, password, remember?` | `{user, token}`; token valid 1 day (30 with remember) |
| POST | `/auth/forgot-password` | `email` | Always 200 (no account enumeration) |
| POST | `/auth/reset-password` | `token, email, password, password_confirmation` | Revokes all tokens |
| POST | `/auth/logout` 🔒 | — | Revokes current token |
| GET | `/auth/me` 🔒 | — | `{user, stats:{bookings, upcoming, wishlist, unread_notifications}}` |
| PUT | `/auth/profile` 🔒 | `name, email, phone, address, city, country, date_of_birth, passport_no` | |
| POST | `/auth/avatar` 🔒 | multipart `avatar` (image ≤ 2 MB) | |
| PUT | `/auth/password` 🔒 | `current_password, password, password_confirmation` | Signs out other devices |

Auth endpoints are limited to 10 requests/minute per IP. 🔒 = requires token.

## 3. Bookings & payments

### Booking line (shared by quote and create)
| Field | Type | Used by |
|---|---|---|
| `service_type` | `hotel\|flight\|bus\|tour\|car` | all |
| `item_id` | int — RoomType / Flight / Bus / Tour / Car id | all |
| `start_date`, `end_date` | `Y-m-d` | hotel (check-in/out), car (pick-up/drop-off); tour uses `start_date` |
| `quantity` | 1-20 | rooms, passengers, travellers, cars (bus: derived from seats) |
| `adults`, `children` | int | hotel occupancy |
| `seats[]` | e.g. `["A1","A2"]`, max 6 | bus |
| `passengers[]` | `[{name, passport?}]` | flight, bus |
| `coupon_code` | string | optional |

| Method | Endpoint | Description |
|---|---|---|
| POST | `/bookings/quote` | Price & availability check (public; coupon validated against the signed-in user if a token is sent) |
| POST | `/bookings` 🔒 | Create **pending** booking. Extra fields: `contact_name, contact_email, contact_phone, special_requests?` → 201 `{booking}` |
| GET | `/bookings?scope=upcoming\|past\|cancelled&service_type=` 🔒 | My bookings (10 per page) |
| GET | `/bookings/{reference}` 🔒 | `{booking (with payments), refund_estimate, can_review, review_target}` |
| POST | `/bookings/{reference}/pay` 🔒 | Pay (below), 10/min |
| POST | `/bookings/{reference}/cancel` 🔒 | `{reason?}` → cancelled + refund per policy |

Quote response:
```json
{
  "item": {"name": "Sayeman Beach Resort — Deluxe Room", "image": "https://…", "details": {"hotel_id": 1, "room_name": "Deluxe Room"}},
  "start_date": "2026-10-14", "end_date": "2026-10-17", "quantity": 1, "units": 3,
  "unit_price": 19600, "subtotal": 58800, "discount": 1500, "service_fee": 1176, "tax": 2865,
  "total": 61341, "currency": "BDT", "coupon_code": "WELCOME10", "coupon_error": null, "pay_at_property": true
}
```

Pay request:
| `method` | Required fields |
|---|---|
| `card` | `card_number` (16 digits), `card_name`, `card_expiry` (`MM/YY`), `card_cvc` |
| `bkash`, `nagad`, `rocket` | `wallet_number` (11 digits), `otp` (6 digits) |
| `pay_at_property` | — (hotels only, if enabled) |

A declined payment returns `422 {errors:{payment:[…]}}` and the booking remains pending.

## 4. Engagement 🔒

| Method | Endpoint | Description |
|---|---|---|
| POST | `/reviews` | `{type: hotel\|tour\|car, id, rating 1-5, title?, comment}` — requires a confirmed/completed booking |
| GET | `/my-reviews` | My reviews (any status) |
| GET | `/wishlist` | Saved items `[{id, type, item}]` |
| GET | `/wishlist/keys` | `["hotel:3","tour:7"]` for heart icons |
| POST | `/wishlist/toggle` | `{type, id}` → `{saved}` |
| GET | `/notifications` | `{unread, items:[{id, data:{title, message, icon, link}, read_at}]}` |
| POST | `/notifications/{id}/read` | Mark one read |
| POST | `/notifications/read-all` | Mark all read |

## 5. Ads (public)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/ads/serve?zones[]=home_top_banner&zones[]=interstitial_global&viewer=<id>&device=desktop\|mobile` | Eligible ads per zone (120/min) |
| POST | `/ads/{ad}/events` | `{event: impression\|skip\|close\|complete, zone, viewer, device}` (240/min) |
| GET | `/ads/{ad}/click?zone=&v=&d=` *(web route, not under /api)* | Logs a click, 302 → advertiser URL |

Serve response:
```json
{
  "home_top_banner": {
    "zone": {"key": "home_top_banner", "placement": "banner", "width": 1200, "height": 250, "rotation_seconds": 7},
    "ads": [{
      "id": 1, "title": "Summer Sale", "advertiser": "EasyGo Hotels", "media_type": "image",
      "media_src": "/storage/ads/2026/10/abc.jpg", "poster_src": null, "headline": "Up to 30% off",
      "cta_label": "Book now", "has_link": true, "click_url": "https://easygo.com/ads/1/click?zone=home_top_banner",
      "open_in_new_tab": false, "closable": true, "skip_after_seconds": 5, "auto_close_seconds": null, "frequency_cap": null
    }]
  },
  "interstitial_global": null
}
```
A zone is `null` when it does not exist, is inactive, or ads are globally disabled.

## 6. Admin API 🔒 (role = admin)

Prefix `/api/admin`. All resource lists accept `q` (search), resource-specific exact filters, `sort`, `direction=asc|desc`, `page`, `per_page` (≤ 100).

| Resource | Endpoints | Filters | Sortable |
|---|---|---|---|
| Destinations | `GET/POST /destinations`, `GET/PUT/DELETE /destinations/{id}` | status | id, name, country, created_at |
| Hotels | `… /hotels` | status, destination_id, star_rating, property_type | id, name, star_rating, avg_rating, min_price |
| Room types | `… /room-types` | status, hotel_id | id, name, price_per_night |
| Flights | `… /flights` | status, cabin_class, airline | id, departure_at, price |
| Buses | `… /buses` | status, bus_type, operator | id, departure_at, price |
| Tours | `… /tours` | status, destination_id, category | id, title, price, duration_days, avg_rating |
| Cars | `… /cars` | status, destination_id, car_type, transmission | id, name, price_per_day |
| Coupons | `… /coupons` | applies_to, is_active, type | id, code, used_count, expires_at |
| Users | `… /users` (`GET /users/{id}` adds bookings & total spent) | role, status | id, name, email, last_login_at |
| Ad zones | `… /ad-zones` | page, placement, is_active | id, name, key, page |
| Ads | `… /ads` (multipart; use `POST /ads/{id}` + `_method=PUT` to update with files) | status, media_type, zone_id | id, title, impressions_count, clicks_count, starts_at, ends_at |

Other admin endpoints:

| Method | Endpoint | Description |
|---|---|---|
| GET | `/dashboard` | KPIs, 30-day series, bookings by service/status, recent bookings, top hotels |
| POST | `/uploads` | multipart `file` (image ≤ 8 MB), `folder` → `{path, url}` |
| GET | `/ads/overview?days=30` | Global ad analytics + top ads + running count |
| GET | `/ads/{id}/stats?days=7..90` | Per-ad analytics |
| POST | `/ads/{id}/toggle` | Pause / resume |
| POST | `/ads/{id}/duplicate` | Copy as draft (media duplicated) |
| GET | `/bookings` | Filters: `q, status, payment_status, service_type, from, to` |
| GET | `/bookings/export` | CSV with the same filters |
| GET | `/bookings/{reference}` | Detail with user, payments, coupon |
| PATCH | `/bookings/{reference}` | `{status?: pending\|confirmed\|completed, payment_status?: unpaid\|paid}` |
| POST | `/bookings/{reference}/cancel` | Cancel with full refund, `{reason?}` |
| GET / PATCH / DELETE | `/reviews`, `/reviews/{id}` | Moderate: `{status: approved\|rejected\|pending}` |
| GET / DELETE | `/messages`, `/messages/{id}` | Support inbox (opening marks as read) |
| POST | `/messages/{id}/reply` | `{reply}` → e-mail to sender |
| GET / DELETE | `/subscribers`, `/subscribers/{id}` | Newsletter |
| GET | `/subscribers/export` | CSV |
| GET / PUT | `/settings` | Read / update platform settings |

### Ad create/update fields
| Field | Rules |
|---|---|
| `title` | required |
| `media` | file: jpg, png, webp, gif, svg, mp4, webm, ogg; ≤ 50 MB (required on create unless `media_url`) |
| `media_url` | external URL alternative |
| `poster` | image ≤ 5 MB (videos) |
| `headline`, `cta_label`, `advertiser` | optional text |
| `click_url` | `https://…` or site-relative `/path` |
| `open_in_new_tab`, `closable` | `1`/`0` |
| `skip_after_seconds` | 0-120 |
| `auto_close_seconds` | 3-600, optional (defaults to 15 when not closable) |
| `audience` | `all\|guest\|auth` |
| `device` | `all\|desktop\|mobile` |
| `weight` | 1-10 |
| `frequency_cap`, `max_impressions`, `max_clicks` | optional positive integers |
| `starts_at`, `ends_at` | optional datetimes (`ends_at` after `starts_at`) |
| `status` | `active\|paused\|draft` |
| `zone_ids[]` | at least one existing zone id |

Example (curl):
```bash
curl -X POST https://easygo.example/api/admin/ads \
  -H "Authorization: Bearer $TOKEN" -H "Accept: application/json" \
  -F title="Eid sale video" -F media=@promo.mp4 -F skip_after_seconds=5 -F auto_close_seconds=30 \
  -F closable=1 -F audience=all -F device=mobile -F weight=8 -F frequency_cap=3 -F status=active \
  -F click_url=/tours -F "zone_ids[]=10" -F "zone_ids[]=11"
```
