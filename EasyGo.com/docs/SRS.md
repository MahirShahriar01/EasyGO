# Software Requirements Specification — EasyGo

| | |
|---|---|
| **Product** | EasyGo — online travel booking platform with self-hosted advertising |
| **Version** | 1.0 |
| **Standard** | Structure adapted from IEEE 830 / ISO/IEC/IEEE 29148 |
| **Status** | Implemented (this document describes the delivered system) |

---

## 1. Introduction

### 1.1 Purpose
This document specifies the functional and non-functional requirements of EasyGo. It is intended for
developers, testers, project supervisors, administrators and future maintainers. Each requirement has an
identifier (e.g. `FR-BK-03`) referenced by the test plan in [TESTING.md](TESTING.md).

### 1.2 Scope
EasyGo is a web application where travellers search for and book **hotels, flights, bus seats, tour
packages and rental cars**, pay online and manage their trips, while administrators manage inventory,
bookings, customers, promotions and an **in-house advertising network** that displays image and video
ads in configurable zones of the customer site.

Out of scope for v1.0: real airline GDS/NDC connectivity, partner self-service portals, native mobile
apps, live production payment gateways (a sandbox gateway and an adapter interface are provided).

### 1.3 Definitions, acronyms and abbreviations
| Term | Meaning |
|---|---|
| OTA | Online Travel Agency |
| SPA | Single Page Application (the React frontend) |
| Vertical / service | One bookable product family: hotel, flight, bus, tour, car |
| Bookable | A concrete inventory item: room type, flight, bus trip, tour, car |
| Hold | Inventory reserved by an unpaid *pending* booking for a limited time |
| Zone | A named ad placement on the site (e.g. `home_top_banner`) |
| Creative | The image or video shown by an ad |
| Interstitial | Full-screen popup ad |
| Impression | One viewable display of an ad (≥ 50 % visible for banners; media loaded for interstitials) |
| CTR | Click-through rate = clicks ÷ impressions |
| Frequency cap | Max impressions of one ad per viewer per day |

### 1.4 References
Laravel 13 documentation · React 18 documentation · Bootstrap 5.3 · OWASP ASVS 4 · IAB display ad guidelines.

### 1.5 Overview
Section 2 describes the product context, users and constraints. Section 3 lists functional requirements
per module. Section 4 lists non-functional requirements. Section 5 covers external interfaces. Appendices
contain the use-case list and traceability notes. Diagrams live in [DIAGRAMS.md](DIAGRAMS.md) and the
data model in [DATABASE.md](DATABASE.md).

## 2. Overall description

### 2.1 Product perspective
EasyGo is a self-contained system: a Laravel REST API backed by a relational database, consumed by a
React SPA that contains both the customer site and the admin panel. Mail is sent through any SMTP
provider; payments go through a pluggable gateway interface. See [ARCHITECTURE.md](ARCHITECTURE.md).

### 2.2 Product functions (summary)
1. Unified search across five travel verticals with filters, sorting and availability.
2. Detail pages with galleries, maps, policies and verified reviews.
3. Checkout with coupons, taxes/fees, traveller details and multiple payment methods.
4. Booking management: e-tickets/vouchers, cancellation with policy-based refunds, reviews.
5. Customer account: profile, wishlist, notifications, password management.
6. Administration of inventory, bookings, users, reviews, coupons, messages, subscribers, settings.
7. Advertising: zones, image/video creatives, close/skip timing, targeting, caps, budgets, schedules, analytics.

### 2.3 User classes and characteristics
| Actor | Description | Access |
|---|---|---|
| **Guest** | Anonymous visitor | Browse, search, view details, contact, newsletter, sees ads targeted to guests/everyone |
| **Customer** | Registered traveller | Guest rights + book, pay, cancel, review, wishlist, notifications, profile |
| **Administrator** | Platform operator | Full back-office; can also use the customer site |
| **Scheduler** (system) | Background job | Expires unpaid holds, completes past bookings, prunes old ad events |
| **Payment gateway** (external) | Charges & refunds | Called by the booking service |
| **Mail server** (external) | Delivers e-mail | Confirmation, cancellation, welcome, password reset, support replies |

### 2.4 Operating environment
* Server: Linux, PHP 8.3+, MySQL 8 / MariaDB 10.6+ (SQLite for development), Nginx or Apache.
* Client: current Chrome, Edge, Firefox, Safari on desktop and mobile; JavaScript enabled.

### 2.5 Design and implementation constraints
* Must follow the repository's established stack: **Laravel + React + Redux + Axios + Bootstrap**.
* REST/JSON API; token authentication (Laravel Sanctum).
* Money stored as `DECIMAL(12,2)`; all times stored and displayed in the platform timezone (`APP_TIMEZONE`, default `Asia/Dhaka`).
* Uploaded media ≤ 50 MB per ad creative, ≤ 8 MB per inventory image.

### 2.6 Assumptions and dependencies
* Inventory is entered by administrators (no third-party supplier feeds in v1.0).
* An SMTP service is available in production; in development mail is written to the log.
* A cron entry (or `schedule:work`) runs the Laravel scheduler.

## 3. Functional requirements

Priority: **H** = must, **M** = should, **L** = could.

### 3.1 Authentication & account (AUTH)
| ID | Requirement | P |
|---|---|---|
| FR-AUTH-01 | Visitors can register with name, e-mail, optional phone and a password (≥ 8 chars, letters + numbers). E-mail must be unique. | H |
| FR-AUTH-02 | Users sign in with e-mail and password and receive an API token; “remember me” extends token lifetime to 30 days (else 1 day). | H |
| FR-AUTH-03 | Invalid credentials return a generic error without revealing whether the e-mail exists. | H |
| FR-AUTH-04 | Users can sign out (token revoked). | H |
| FR-AUTH-05 | Users can request a password-reset link; the response is identical whether or not the account exists. | H |
| FR-AUTH-06 | Users can reset the password with a valid token; all existing tokens are revoked. | H |
| FR-AUTH-07 | Users can update profile (name, e-mail, phone, address, city, country, date of birth, passport/NID) and upload an avatar (≤ 2 MB). | M |
| FR-AUTH-08 | Users can change password after confirming the current one; other sessions are signed out. | M |
| FR-AUTH-09 | Blocked accounts cannot sign in and any existing token is rejected and revoked. | H |
| FR-AUTH-10 | New customers receive a welcome e-mail and in-app notification. | L |

### 3.2 Search & catalogue (SRCH)
| ID | Requirement | P |
|---|---|---|
| FR-SRCH-01 | The home page offers a tabbed search widget for hotels, flights, buses, tours and cars. | H |
| FR-SRCH-02 | Location fields autocomplete from destinations / flight cities / bus cities. | M |
| FR-SRCH-03 | Hotel search filters: destination/name text, dates, guests & rooms, max price, star rating, guest rating, property type, amenities; sort by recommended, price, rating, stars. | H |
| FR-SRCH-04 | When dates are given, hotels with no available room are flagged as sold out. | H |
| FR-SRCH-05 | Flight search filters: origin, destination, date, passengers, cabin, airlines, stops, max price, refundable; sort by price, departure, duration. Only flights with enough free seats are listed. | H |
| FR-SRCH-06 | Bus search filters: origin, destination, date, coach type, operator, max fare; sort by departure or price; each result shows free seats. | H |
| FR-SRCH-07 | Tour search filters: text/destination, travel date, category, duration range, max price; sort by recommended, price, rating, duration. | H |
| FR-SRCH-08 | Car search filters: pick-up city, dates, type, transmission, minimum seats, with driver, max price; availability per date range. | H |
| FR-SRCH-09 | All filters are reflected in the URL so results can be bookmarked and shared. | M |
| FR-SRCH-10 | Detail pages show gallery, description, amenities/specifications, policies, price, availability for chosen dates, similar items and approved reviews. | H |
| FR-SRCH-11 | Bus detail shows a seat map generated from the coach layout with booked seats disabled. | H |
| FR-SRCH-12 | Destinations page lists destinations with counts; destination page lists its hotels, tours and cars. | M |
| FR-SRCH-13 | Inactive inventory is never shown to customers. | H |

### 3.3 Booking & payment (BK)
| ID | Requirement | P |
|---|---|---|
| FR-BK-01 | Booking requires a signed-in customer; guests are redirected to sign in and returned afterwards. | H |
| FR-BK-02 | The checkout shows a server-calculated quote: unit price × units (nights/days) × quantity = subtotal; − coupon discount; + service fee (% of subtotal); + tax (% of subtotal after discount). | H |
| FR-BK-03 | Coupons may be percentage or fixed, with minimum spend, maximum discount, service restriction, validity window, total usage limit and per-customer limit. Invalid coupons are explained. | H |
| FR-BK-04 | Availability is re-checked when the booking is created inside a database transaction with row locks; overbooking is impossible. | H |
| FR-BK-05 | Hotel availability counts overlapping stays only (check-out day is free for a new check-in). | H |
| FR-BK-06 | Bus seats are exclusive; at most 6 seats per booking; unknown seats are rejected. | H |
| FR-BK-07 | Flights and buses that have departed cannot be booked; tours need ≥ 1 day notice and must fall inside the availability window; group size limits apply. | H |
| FR-BK-08 | A new booking is *pending*/*unpaid* and receives a unique reference (`EG-XXXXXXXX`). | H |
| FR-BK-09 | Supported payment methods: card, bKash, Nagad, Rocket; hotels additionally support *pay at property* (configurable). | H |
| FR-BK-10 | A successful payment confirms the booking and records the transaction; a failed payment is recorded and the booking stays pending. | H |
| FR-BK-11 | Unpaid pending bookings expire after the configurable hold time (default 30 min) and release inventory. | H |
| FR-BK-12 | Confirmed bookings whose service date has passed become *completed* automatically. | M |
| FR-BK-13 | Customers can cancel pending/confirmed bookings before the start date. Refund policy: hotel — 100 % if refundable room and ≥ 24 h before check-in, else 0 %; flight — 90 % if refundable fare else 0 %; bus — 100 % if ≥ 24 h before departure else 50 %; tour — 100 % ≥ 7 days, 50 % ≥ 2 days, else 0 %; car — 100 % ≥ 24 h else 0 %. | H |
| FR-BK-14 | The estimated refund is shown before the customer confirms cancellation. | M |
| FR-BK-15 | Confirmation and cancellation trigger e-mail and in-app notifications. | H |
| FR-BK-16 | Customers can view and print an e-ticket/voucher with all booking, traveller and payment details. | H |
| FR-BK-17 | Customers can see only their own bookings. | H |

### 3.4 Engagement (ENG)
| ID | Requirement | P |
|---|---|---|
| FR-ENG-01 | Customers can review a hotel, tour or car only after a confirmed or completed booking of it; one review per item. | H |
| FR-ENG-02 | Reviews are pending until approved by an admin unless auto-approval is enabled; only approved reviews are public and counted in ratings. | H |
| FR-ENG-03 | Customers can save hotels, tours and cars to a wishlist. | M |
| FR-ENG-04 | A notification centre lists recent notifications with unread count and mark-as-read. | M |
| FR-ENG-05 | Anyone can send a contact message; anyone can subscribe to the newsletter (deduplicated by e-mail). | M |
| FR-ENG-06 | Recently viewed items are remembered locally on the device. | L |

### 3.5 Administration (ADM)
| ID | Requirement | P |
|---|---|---|
| FR-ADM-01 | Only users with role *admin* can access `/admin` and `/api/admin/*`. | H |
| FR-ADM-02 | Dashboard shows revenue (total, month, growth), bookings (total, today, pending), customers, pending reviews, new messages, running ads, 30-day revenue/booking chart, bookings by service, recent bookings, top hotels, ad performance. | H |
| FR-ADM-03 | CRUD with search, filters, sorting and pagination for destinations, hotels, room types, flights, buses, tours, cars, coupons, users and ad zones. | H |
| FR-ADM-04 | Images can be uploaded (≤ 8 MB) or referenced by URL; galleries support multiple images. | H |
| FR-ADM-05 | Booking management: filter by text, service, status, payment status, date range; view details & payments; confirm, mark paid, mark completed, cancel with full refund; export CSV. | H |
| FR-ADM-06 | User management: change role, block/unblock (blocking revokes tokens), set password. Admins cannot demote, block or delete themselves. | H |
| FR-ADM-07 | Review moderation: approve, reject, delete; ratings recalculate automatically. | H |
| FR-ADM-08 | Support inbox: read messages, reply by e-mail, delete. | M |
| FR-ADM-09 | Newsletter subscribers: list, search, delete, export CSV. | L |
| FR-ADM-10 | Settings: site name/tagline/about, hero, currency & symbol, tax %, service fee %, hold minutes, pay at property, auto-approve reviews, ads enabled, contact & social links. | H |

### 3.6 Advertising (AD)
| ID | Requirement | P |
|---|---|---|
| FR-AD-01 | Admins manage **zones** with key, name, page, placement (banner, sidebar, inline, interstitial), recommended size, number of ads in rotation, rotation interval and active flag. | H |
| FR-AD-02 | Admins create ads by **uploading an image or video** (JPG, PNG, WebP, GIF, SVG, MP4, WebM, OGG; ≤ 50 MB) or giving an external media URL; optional poster image, headline, CTA label and click-through URL (absolute or site-relative). | H |
| FR-AD-03 | Each ad is assigned to one or more zones; it is only served in those zones. | H |
| FR-AD-04 | **Close/skip timing:** an ad is either closable or not; if closable the admin selects after how many seconds (0–120) the viewer may close/skip it; the UI shows a live “You can skip in N s” countdown. | H |
| FR-AD-05 | **Auto-close:** an optional timer dismisses the ad automatically with a progress indicator; non-closable ads must auto-close (default 15 s). | H |
| FR-AD-06 | Targeting by audience (everyone, guests, signed-in) and device (all, desktop, mobile). | H |
| FR-AD-07 | Delivery controls: weight 1–10 for weighted rotation, per-viewer daily frequency cap, maximum impressions and clicks (budgets), start and end date-time, status active/paused/draft. | H |
| FR-AD-08 | Serving returns only deliverable ads (active, within schedule, within budget, matching targeting, under frequency cap) and never exposes budgets or counters. | H |
| FR-AD-09 | Banners render nothing when no ad is eligible; zones with several ads rotate as a carousel that pauses on hover. | H |
| FR-AD-10 | Interstitials appear at most once per browser session per zone and never on login, checkout or payment pages; a creative that fails to load is dismissed silently. | H |
| FR-AD-11 | Tracking: impressions (viewable), clicks (via redirect), skips, closes and video completions with zone, device, user (if any), anonymous viewer id and hashed IP. | H |
| FR-AD-12 | Analytics per ad and overall: impressions, clicks, CTR, unique viewers, skips, closes, completions, daily series, breakdown by zone and device, for 7–90 days. | H |
| FR-AD-13 | Admins can pause/resume, duplicate and delete ads; deleting removes uploaded media. | M |
| FR-AD-14 | A global setting switches all ad delivery off. | M |
| FR-AD-15 | Ad events older than 180 days are pruned daily. | L |

## 4. Non-functional requirements

| ID | Category | Requirement |
|---|---|---|
| NFR-01 | Performance | Target: search APIs respond in < 500 ms (p95) on the seeded dataset; the home payload is cached for 5 minutes; ad zones for a page are fetched in one batched request. |
| NFR-02 | Performance | The customer bundle excludes admin code (code splitting); charts are a separate chunk. |
| NFR-03 | Scalability | Stateless API (token auth) allows horizontal scaling behind a load balancer; cache/session/queue drivers are configurable (database, Redis). |
| NFR-04 | Security | Passwords hashed with bcrypt; tokens via Sanctum; role middleware on all admin routes; ownership checks on customer resources; validation on every input; mass-assignment protection. |
| NFR-05 | Security | Rate limits: auth 10/min/IP, bookings 20/min, payments 10/min, contact & newsletter 5/min, ad serving 120/min, ad events 240/min. |
| NFR-06 | Security / privacy | No full card numbers stored (only last 4 digits from the gateway); IP addresses for ad tracking stored as salted SHA-256 hashes; anonymous viewer ids carry no personal data. |
| NFR-07 | Reliability | Booking creation is transactional with row locks; ad failures never break pages; UI error boundaries isolate rendering errors. |
| NFR-08 | Usability | Responsive from 360 px phones to desktops; dark mode; inline validation messages; loading skeletons; accessible labels and keyboard support for modals, dropdowns and the lightbox. |
| NFR-09 | Maintainability | Layered architecture (controllers → services → models); generic admin CRUD base; declarative admin resource configs; PSR-12 / Laravel Pint style; inline documentation. |
| NFR-10 | Portability | Runs on SQLite, MySQL/MariaDB and PostgreSQL; Docker images provided. |
| NFR-11 | Testability | Automated feature & unit tests cover authentication, search, booking, payment, refunds, reviews, wishlist, admin and the ad system; CI on every push. |
| NFR-12 | Localization | Currency symbol/code, tax and timezone are configurable; dates formatted in the platform timezone. |

## 5. External interface requirements

### 5.1 User interfaces
Customer site (public pages, checkout, account) and admin panel (sidebar layout) — see screenshots in the
README and [USER_GUIDE.md](USER_GUIDE.md) / [ADMIN_GUIDE.md](ADMIN_GUIDE.md).

### 5.2 Software interfaces
* **REST API** — JSON over HTTPS, documented in [API.md](API.md).
* **Payment gateway** — `App\Services\Payments\PaymentGateway` (`charge`, `refund`); sandbox implementation `DemoGateway`.
* **Mail** — Laravel mailer (SMTP, SES, Postmark, log…).
* **Maps** — OpenStreetMap embed on hotel pages.

### 5.3 Communication interfaces
HTTPS; `Authorization: Bearer <token>`; ad click tracking through `GET /ads/{id}/click` (HTTP 302).

## Appendix A — Use cases

| UC | Name | Actor |
|---|---|---|
| UC-01 | Register / sign in / reset password | Guest |
| UC-02 | Search hotels, flights, buses, tours, cars | Guest, Customer |
| UC-03 | View item details and reviews | Guest, Customer |
| UC-04 | Select bus seats | Customer |
| UC-05 | Check out with coupon | Customer |
| UC-06 | Pay (card / wallet / pay at property) | Customer, Payment gateway |
| UC-07 | View & print e-ticket | Customer |
| UC-08 | Cancel booking and receive refund | Customer, Payment gateway |
| UC-09 | Write review | Customer |
| UC-10 | Manage wishlist, profile, notifications | Customer |
| UC-11 | Contact support / subscribe newsletter | Guest, Customer |
| UC-12 | View/close/skip/click ads | Guest, Customer |
| UC-13 | Manage inventory | Admin |
| UC-14 | Manage bookings & refunds | Admin, Payment gateway |
| UC-15 | Moderate reviews, reply to messages, manage users | Admin |
| UC-16 | Manage coupons & settings | Admin |
| UC-17 | Manage ad zones & ads (upload media, set skip timer) | Admin |
| UC-18 | Analyse ad performance | Admin |
| UC-19 | Expire holds / complete bookings / prune ad events | Scheduler |

Use-case and sequence diagrams: [DIAGRAMS.md](DIAGRAMS.md).

## Appendix B — Traceability
Requirements map to automated tests in `tests/Feature` and `tests/Unit`; see the matrix in [TESTING.md](TESTING.md).
