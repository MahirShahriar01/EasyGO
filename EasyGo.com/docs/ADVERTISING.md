# Advertising System

EasyGo ships its own ad server, so the platform owner controls every ad that appears on the site — the
creative, where it shows, who sees it, how often, for how long and **after how many seconds the viewer is
allowed to close or skip it** — without depending on a third-party network.

![Ads manager](screenshots/admin-ads.png)

## 1. Concepts

| Concept | Description |
|---|---|
| **Zone** | A named placement in the UI (`home_top_banner`, `interstitial_global`…). Has a page, placement type, recommended size and rotation settings. |
| **Ad** | A creative (image or video) + rules. Can run in many zones. |
| **Placement types** | `banner` (wide, in page flow), `sidebar` (rectangle/skyscraper), `inline` (inside a results list), `interstitial` (full-screen popup) |
| **Event** | `impression`, `click`, `skip`, `close`, `complete` |

## 2. Built-in zones

| Key | Where | Placement | Size |
|---|---|---|---|
| `home_top_banner` | Home, under the search hero (rotates up to 3 ads) | banner | 1200×250 |
| `home_mid_banner` | Home, between sections | banner | 1200×250 |
| `search_top` | Top of every results page | banner | 970×150 |
| `search_inline` | Inside results after the 4th/6th item | inline | 728×200 |
| `search_sidebar` | Under the filter panel (desktop) | sidebar | 300×600 |
| `detail_sidebar` | Hotel / tour / car / bus detail pages | sidebar | 300×250 |
| `checkout_bottom` | Under the price summary at checkout | sidebar | 300×250 |
| `account_banner` | Top of “My account” pages | banner | 1200×150 |
| `footer_banner` | Every page, above the footer | banner | 1200×150 |
| `interstitial_global` | Full-screen popup ~2.5 s after landing (once per session, never on login/checkout/payment) | interstitial | 640×800 |
| `interstitial_booking_success` | Popup on the booking-confirmed page | interstitial | 640×800 |

Add more in **Admin → Ad zones**, then place `<AdSlot zone="your_key" />` (or `<InterstitialAd zone="your_key" />`) in a React page.

## 3. Creating an ad (Admin → Ads → New ad)

1. **Basics** — internal title, advertiser, status (*active*, *paused*, *draft*).
2. **Creative** — drag & drop or pick a file:
   * Images: JPG, PNG, WebP, GIF, SVG · Videos: MP4, WebM, OGG · max **50 MB** (upload progress shown)
   * Or paste an external media URL
   * Optional poster image (shown before a video loads), headline and button label (used on interstitials)
   * Click-through URL: external `https://…` or internal `/tours?q=Bali`; choose whether it opens in a new tab
3. **Zones** — tick every placement where the ad may appear.
4. **Close & skip behaviour**
   * *Viewer can close / skip* — on/off
   * *Allow closing after N seconds* — slider 0–60 s with presets (Immediately, 3, 5, 10, 15, 30). The viewer sees **“You can skip in N s”** counting down; afterwards the button turns into **Skip ad** (video) or **Close**.
   * *Auto-close after N seconds* — optional; shows a progress bar and dismisses the ad. Non-closable ads must auto-close (15 s default) so a viewer can never be trapped.
5. **Targeting, delivery & schedule**
   * Audience: everyone / guests only / signed-in users only
   * Device: all / desktop only / mobile only
   * Rotation weight 1–10 (higher = shown more often and first in carousels)
   * Frequency cap: max impressions per viewer per day
   * Budgets: max impressions and/or max clicks (ad stops when reached)
   * Start and end date-time
6. **Live preview** — toggle banner vs. interstitial rendering before publishing.

![Create ad](screenshots/admin-ad-new.png)

Other actions on the list: **pause/resume**, **analytics**, **edit**, **duplicate** (A/B test a variant; copies media, saved as draft), **delete** (removes uploaded files).

## 4. Delivery algorithm

For each requested zone (`AdService::serve`):

1. Global kill-switch `ads_enabled` must be on and the zone active.
2. Candidate ads = ads attached to the zone that are **deliverable**:
   `status = active` ∧ `starts_at ≤ now ≤ ends_at` (when set) ∧ `impressions_count < max_impressions` ∧ `clicks_count < max_clicks`.
3. Targeting: `audience ∈ {all, guest|auth}` and `device ∈ {all, desktop|mobile}`.
4. Frequency cap: drop ads whose impressions today for this viewer id (or user id) ≥ `frequency_cap`.
5. **Weighted random sampling without replacement** up to the zone's `max_ads`.
6. Only public fields are returned — budgets and counters stay server-side.

## 5. Frontend behaviour

| Component | Behaviour |
|---|---|
| `AdSlot` | Renders nothing if no ad. Carousel for multiple ads (rotation interval from the zone, pauses on hover, dots). Close button available after `skip_after_seconds`; a closed ad stays hidden for the rest of the browser session. Auto-close supported. Broken media is dropped from the rotation. |
| `InterstitialAd` | Full-screen overlay; once per session per zone; skip countdown; video autoplays muted with unmute button; *Skip ad* vs *Close* depending on whether the video finished; Escape closes once allowed; auto-close progress bar; dismissed silently if the media fails to load. |
| `adApi` | Batches all zones mounted within 25 ms into one `GET /api/ads/serve` request; fire-and-forget event tracking; adds viewer id and device to click URLs. |

## 6. Tracking & analytics

| Event | When it is recorded |
|---|---|
| `impression` | Banner ≥ 50 % in viewport (IntersectionObserver), once per mount; interstitial when its media has loaded |
| `click` | Server-side, via `GET /ads/{id}/click` before redirecting |
| `skip` | Interstitial dismissed before a video finished |
| `close` | Banner or interstitial dismissed after the content was seen |
| `complete` | Video ended or auto-close reached |

**Admin → Ads → Analytics** shows impressions, clicks, CTR, unique viewers, skips, closes, completions,
a daily trend (7/30/60/90 days), a by-zone breakdown with CTR and a device split. The dashboard shows the
30-day totals for all ads.

![Ad analytics](screenshots/admin-ad-stats.png)

## 7. Privacy & abuse protection
* Viewer ids are random UUIDs stored in the browser — no personal data.
* IPs are stored only as `sha256(ip + APP_KEY)`.
* Serving (120/min) and event (240/min) endpoints are rate limited.
* Raw events are pruned after 180 days (`ads:prune`); aggregate counters are kept on the ad.

## 8. Recommended creative specs
| Placement | Size (px) | Notes |
|---|---|---|
| Leaderboard banner | 1200×250 or 1200×150 | Keep text left, ≤ 150 KB images |
| Search top | 970×150 | |
| In-feed | 728×200 | |
| Sidebar | 300×250, 300×600 | |
| Interstitial | 640×800 (portrait) | Video: MP4 H.264, ≤ 30 s, ≤ 10 MB recommended |
