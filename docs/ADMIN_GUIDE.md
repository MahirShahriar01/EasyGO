# Administrator Guide

Sign in with an administrator account (demo: `admin@easygo.com` / `password123`). You are taken to
**/admin**. The sidebar groups every module; on small screens open it with ☰. *View website* opens the
customer site in a new tab.

## Dashboard
* KPI cards: revenue this month (with growth vs. last month), total bookings (today / pending), customers, ad impressions & CTR.
* Alerts: reviews awaiting moderation, new support messages, unpaid pending bookings — click to jump there.
* Charts: revenue & bookings for 30 days, bookings by service, ad impressions vs. clicks.
* Recent bookings and top-rated hotels.

## Working with lists
Every management screen offers: a search box, filter dropdowns, clickable column headers for sorting,
pagination, **New …** to create, ✏️ to edit (a side panel opens) and 🗑 to delete (with confirmation).
Validation errors are shown next to the fields.

**Images:** click *Upload* (JPG/PNG/WebP/GIF ≤ 8 MB) or paste an image URL. Galleries accept several
images; the first one is the cover. Remove with ×.

## Inventory
| Module | Tips |
|---|---|
| **Destinations** | Featured destinations appear first on the home page. Latitude/longitude are optional. |
| **Hotels** | Choose destination, property type, stars and amenities. Click **Rooms** on a hotel to manage its room types — the hotel's “from” price updates automatically from the cheapest active room. |
| **Room types** | Price per night, number of rooms (inventory), occupancy, breakfast and refundable policy. |
| **Flights** | One record per flight/date/cabin. Times are in the platform timezone. Seats = inventory. |
| **Buses** | Choose a seat layout (2+2, 1+2…) and total seats — the seat map is generated automatically. |
| **Tours** | Use the itinerary builder (*Add day*), inclusions/exclusions tags, availability window and optional discounted price. |
| **Cars** | Fleet size = how many identical cars can be rented at the same time. |

Set *Status = Inactive* to hide an item without deleting it. Deleting hotels, tours or cars is a soft delete; past bookings stay intact.

## Bookings
* Filter by reference/name/e-mail, service, status, payment status and creation date range.
* **Export CSV** downloads the filtered list.
* Open a booking to see details, travellers, special requests and payment transactions. Actions:
  * **Confirm** a pending booking (e.g. after an offline payment)
  * **Mark paid** (pay-at-property bookings once the guest has paid)
  * **Mark completed**
  * **Cancel & refund** — cancels and refunds the full amount; the customer is e-mailed.

## Customers
* **Users** — edit details, set a new password, change role (customer/admin) or **block** (signs the user out everywhere). You cannot demote, block or delete your own account.
* **Reviews** — approve, reject or delete. Only approved reviews are public and count towards ratings. Turn on *Publish reviews without moderation* in Settings to skip this step.
* **Messages** — contact-form inbox. Opening a message marks it read; **Send reply by e-mail** answers the customer.

## Marketing
* **Coupons** — percentage or fixed amount; optional max discount, minimum spend, service restriction, total uses, uses per customer and validity window. Usage is counted automatically and released if a booking is cancelled or expires.
* **Subscribers** — newsletter list with search, delete and CSV export.

## Advertising
* **Ad zones** — placements on the site. Edit names, recommended sizes, how many ads rotate and how fast; deactivate a zone to hide all its ads.
* **Ads** — create image/video ads, assign zones, set the **skip/close timer**, auto-close, audience, device, weight, frequency cap, budgets and schedule. Pause/resume, duplicate, view analytics or delete from the list.

Full walkthrough: [ADVERTISING.md](ADVERTISING.md).

## Settings
| Tab | Settings |
|---|---|
| General | Site name, tagline, about text, home hero title/subtitle/background |
| Money & bookings | Currency code & symbol, tax/VAT %, service fee %, unpaid hold minutes, pay at property, auto-approve reviews |
| Advertising | Global ad on/off switch |
| Contact & social | Support e-mail/phone/address, Facebook, Instagram, X, YouTube |

Changes apply immediately to the customer site.

## Daily checklist
1. Check the dashboard alerts (pending reviews, messages, unpaid bookings).
2. Review ads that are *scheduled*, *expired* or *budget reached*.
3. Export bookings for accounting when needed.
