# Test Plan & Results

## 1. Strategy

| Level | Tooling | Scope |
|---|---|---|
| Unit | PHPUnit | Pure domain logic: coupon maths, seat-label generation, demo gateway rules |
| Feature / API | PHPUnit + Laravel HTTP testing, in-memory SQLite, `RefreshDatabase` | Every API module end-to-end through HTTP: auth, search, booking, payment, refunds, reviews, wishlist, admin, ads |
| Static | Laravel Pint | PSR-12 / Laravel code style |
| Build | Vite | The SPA compiles (catches import/JSX errors) |
| E2E smoke | Playwright (headless Chromium) | Real browser: every public page, login, bus seat booking with coupon + bKash payment, interstitial skip countdown, admin pages; fails on any JS error or API 5xx |
| CI | GitHub Actions | Pint, PHPUnit, migrate + seed, frontend build on each push/PR |

Run locally:
```bash
php artisan test            # unit + feature
vendor/bin/pint --test      # style
npm run build               # frontend
```

**Latest result:** 45 tests, 227 assertions — all passing.

## 2. Test cases and requirement traceability

### Authentication — `tests/Feature/AuthTest.php`
| Test | Requirements |
|---|---|
| customer can register and receives a token | FR-AUTH-01, FR-AUTH-02 |
| registration validates password strength and uniqueness | FR-AUTH-01 |
| login with valid and invalid credentials | FR-AUTH-02, FR-AUTH-03 |
| blocked user cannot log in or use existing token | FR-AUTH-09 |
| protected routes require authentication | FR-BK-01, NFR-04 |
| profile update and password change | FR-AUTH-07, FR-AUTH-08 |
| forgot password does not reveal whether email exists | FR-AUTH-05 |

### Search — `tests/Feature/SearchTest.php`
| Test | Requirements |
|---|---|
| hotel search filters by destination, stars and price | FR-SRCH-03, FR-SRCH-10 |
| hotel is flagged unavailable when sold out for dates | FR-SRCH-04, FR-BK-05 |
| flight search matches route, date and seat availability | FR-SRCH-05 |
| bus detail exposes seat map | FR-SRCH-11 |
| home and settings endpoints (incl. cached payload shape) | FR-SRCH-01, NFR-01 |

### Booking & payment — `tests/Feature/BookingFlowTest.php`
| Test | Requirements |
|---|---|
| quote calculates price breakdown with coupon | FR-BK-02, FR-BK-03 |
| invalid coupon is reported in quote and rejected on booking | FR-BK-03 |
| full hotel flow: create, declined card, pay, cancel with refund + notifications | FR-BK-08 … FR-BK-10, FR-BK-13, FR-BK-15 |
| rooms cannot be overbooked (and back-to-back stays are allowed) | FR-BK-04, FR-BK-05 |
| bus seats are exclusive / invalid seats rejected | FR-BK-06 |
| wallet payment and pay at property (hotel only) | FR-BK-09 |
| customers cannot see other customers' bookings | FR-BK-17 |
| maintenance expires unpaid bookings and releases inventory | FR-BK-11 |
| payment is rejected after the hold expires | FR-BK-11 |
| refund policy per service | FR-BK-13 |

### Reviews, wishlist, contact — `tests/Feature/ReviewWishlistTest.php`
| Test | Requirements |
|---|---|
| only guests with a confirmed booking can review; moderation updates ratings | FR-ENG-01, FR-ENG-02, FR-ADM-07 |
| auto-approve setting publishes immediately | FR-ENG-02, FR-ADM-10 |
| wishlist toggle | FR-ENG-03 |
| contact and newsletter (deduplicated) | FR-ENG-05 |

### Administration — `tests/Feature/AdminTest.php`
| Test | Requirements |
|---|---|
| customers cannot access admin API | FR-ADM-01 |
| dashboard returns KPIs | FR-ADM-02 |
| admin can CRUD a hotel and its rooms (min price recalculated, inactive hidden) | FR-ADM-03, FR-SRCH-13 |
| admin uploads video ad and assigns zones; non-closable gets auto-close; toggle, duplicate, stats, delete removes file | FR-AD-02 … FR-AD-05, FR-AD-12, FR-AD-13 |
| ad requires media and zone and rejects bad files | FR-AD-02, FR-AD-03 |
| admin can cancel booking with full refund and export CSV | FR-ADM-05 |
| settings update is reflected publicly | FR-ADM-10 |
| admin cannot demote or delete themselves | FR-ADM-06 |

### Ad serving — `tests/Feature/AdServingTest.php`
| Test | Requirements |
|---|---|
| zone serves active ads with public fields only | FR-AD-08 |
| paused, expired, scheduled and budget-exhausted ads are not served | FR-AD-07, FR-AD-08 |
| audience and device targeting | FR-AD-06 |
| frequency cap limits impressions per viewer per day | FR-AD-07, FR-AD-11 |
| click is tracked and redirects to advertiser (absolute & relative URLs) | FR-AD-11 |
| global kill switch disables all ads | FR-AD-14 |
| multiple zones served in one request with rotation limit | FR-AD-09, NFR-01 |

### Unit — `tests/Unit/PricingAndModelsTest.php`
| Test | Requirements |
|---|---|
| percent coupon respects max discount | FR-BK-03 |
| fixed coupon never exceeds amount | FR-BK-03 |
| bus seat labels follow layout | FR-SRCH-11 |
| demo gateway rules | FR-BK-10 |

## 3. Manual / exploratory test checklist

| # | Scenario | Expected |
|---|---|---|
| M1 | Resize to 375 px wide and browse home → hotel → checkout | No horizontal scrolling; filters collapse behind *Show filters* |
| M2 | Toggle dark mode on every page | All text readable, cards and inputs themed |
| M3 | Start checkout, wait past the hold time, try to pay | “Reservation hold has expired” message; booking cancelled by scheduler |
| M4 | Create an interstitial ad with skip after 10 s, open home in a private window | Countdown from 10, then *Close*; second page load in the same session shows no popup |
| M5 | Create a non-closable video ad with auto-close 8 s | No close button; progress bar; disappears after 8 s; *complete* event counted |
| M6 | Set frequency cap 1 and reload a page with the banner twice in a new window | Second load shows no ad (or another ad) |
| M7 | Upload a 60 MB video | Rejected client-side (> 50 MB) and server-side |
| M8 | Block a signed-in customer from the admin panel | Customer's next request fails with “account suspended” and they are signed out |
| M9 | Print an e-ticket | Navigation, ads and sidebar hidden; ticket fits the page |
| M10 | Keyboard only: open gallery lightbox, navigate with ←/→, Esc | Works without a mouse |
