# UML & Analysis Diagrams

All diagrams are written in [Mermaid](https://mermaid.js.org/) and render directly on GitHub.

1. [Use-case diagram](#1-use-case-diagram)
2. [Data-flow diagrams (DFD level 0 and 1)](#2-data-flow-diagrams)
3. [Class diagram (domain model)](#3-class-diagram)
4. [Sequence — search to confirmed booking](#4-sequence--search-to-confirmed-booking)
5. [Sequence — cancellation & refund](#5-sequence--cancellation--refund)
6. [Sequence — admin uploads an ad](#6-sequence--admin-uploads-a-video-ad)
7. [Activity — checkout](#7-activity--checkout)
8. [Activity — interstitial ad lifecycle](#8-activity--interstitial-ad-lifecycle)
9. [State machine — booking](#9-state-machine--booking)
10. [State machine — ad delivery state](#10-state-machine--ad-delivery-state)
11. [Component diagram](#11-component-diagram)

ER diagram: see [DATABASE.md](DATABASE.md).

---

## 1. Use-case diagram

```mermaid
flowchart LR
    Guest([👤 Guest])
    Customer([👤 Customer])
    Admin([🛡️ Admin])
    Scheduler([⏱ Scheduler])
    Gateway([💳 Payment gateway])

    subgraph EasyGo
        UC1((Register / Sign in))
        UC2((Search travel))
        UC3((View details & reviews))
        UC4((Select bus seats))
        UC5((Checkout & apply coupon))
        UC6((Pay))
        UC7((View / print e-ticket))
        UC8((Cancel & refund))
        UC9((Write review))
        UC10((Wishlist / profile / notifications))
        UC11((Contact / newsletter))
        UC12((View · skip · click ads))
        UC13((Manage inventory))
        UC14((Manage bookings))
        UC15((Moderate reviews / users / inbox))
        UC16((Coupons & settings))
        UC17((Manage zones & ads))
        UC18((Ad analytics))
        UC19((Expire holds / complete trips))
    end

    Guest --- UC1 & UC2 & UC3 & UC11 & UC12
    Customer --- UC2 & UC3 & UC4 & UC5 & UC6 & UC7 & UC8 & UC9 & UC10 & UC11 & UC12
    Admin --- UC13 & UC14 & UC15 & UC16 & UC17 & UC18
    Scheduler --- UC19
    UC6 --- Gateway
    UC8 --- Gateway
    UC14 --- Gateway
    UC5 -. include .-> UC6
    UC4 -. extend .-> UC5
```

## 2. Data-flow diagrams

### Level 0 (context)

```mermaid
flowchart LR
    T[Traveller] -- search criteria, booking & payment details --> P0((0<br/>EasyGo<br/>system))
    P0 -- results, quotes, e-tickets, notifications, ads --> T
    A[Administrator] -- inventory, settings, ad creatives, moderation --> P0
    P0 -- dashboards, reports, ad analytics, CSV --> A
    P0 -- charge / refund requests --> G[Payment gateway]
    G -- transaction results --> P0
    P0 -- e-mails --> M[Mail server]
    P0 -- click redirects --> ADV[Advertiser]
```

### Level 1

```mermaid
flowchart TB
    T[Traveller]
    A[Admin]
    G[Payment gateway]

    P1((1.0 Authenticate))
    P2((2.0 Search catalogue))
    P3((3.0 Quote & reserve))
    P4((4.0 Process payment))
    P5((5.0 Manage booking))
    P6((6.0 Serve & track ads))
    P7((7.0 Administer platform))

    D1[(D1 Users)]
    D2[(D2 Inventory)]
    D3[(D3 Bookings)]
    D4[(D4 Payments)]
    D5[(D5 Coupons & settings)]
    D6[(D6 Ads, zones, events)]
    D7[(D7 Reviews & wishlist)]

    T -->|credentials| P1 --> D1
    T -->|criteria| P2 --> D2
    D2 -->|results| T
    T -->|selection, travellers, coupon| P3
    D2 --> P3
    D5 --> P3
    P3 -->|pending booking| D3
    T -->|payment details| P4 --> G
    G --> P4 --> D4
    P4 -->|confirm| D3
    T -->|cancel, review| P5
    P5 --> D3 & D4 & D7
    P5 -->|refund| G
    T -->|page view, events| P6
    D6 --> P6 -->|creatives| T
    P6 -->|impressions, clicks| D6
    A --> P7
    P7 --> D1 & D2 & D3 & D5 & D6 & D7
```

## 3. Class diagram

```mermaid
classDiagram
    direction LR
    class User {
        +id
        +name
        +email
        +role : customer|admin
        +status : active|blocked
        +isAdmin() bool
        +isBlocked() bool
    }
    class Destination { +name +slug +country +image +is_featured }
    class Hotel { +name +slug +star_rating +amenities[] +images[] +min_price +avg_rating +refreshMinPrice() +refreshRating() }
    class RoomType { +name +price_per_night +total_rooms +max_adults +refundable +availableRooms(in, out) int }
    class Flight { +airline +flight_number +from_code +to_code +departure_at +price +total_seats +seatsAvailable() int }
    class Bus { +operator +bus_type +seat_layout +total_seats +seatLabels() +bookedSeats() }
    class Tour { +title +duration_days +price +discount_price +itinerary[] +spotsLeft(date) int }
    class Car { +name +car_type +price_per_day +quantity +availableUnits(from, to) int }
    class Booking {
        +reference
        +service_type
        +status : pending|confirmed|cancelled|completed
        +payment_status : unpaid|paid|refunded
        +start_date +end_date +quantity +units
        +subtotal +discount +tax +service_fee +total
        +details json
        +can_cancel +can_pay
    }
    class Payment { +method +gateway +transaction_id +amount +status }
    class Coupon { +code +type +value +max_discount +applies_to +validationError() +discountFor(amount) }
    class Review { +rating +comment +status }
    class Wishlist
    class AdZone { +key +page +placement +max_ads +rotation_seconds }
    class Ad {
        +media_type : image|video
        +media_path / media_url
        +closable +skip_after_seconds +auto_close_seconds
        +audience +device +weight +frequency_cap
        +max_impressions +max_clicks +starts_at +ends_at
        +ctr +deliveryState()
    }
    class AdEvent { +event +viewer_id +ip_hash +device }

    class BookingService { +prepare() +quote() +create() +pay() +cancel() +refundAmount() +maintain() }
    class PricingService { +breakdown() }
    class AdService { +serve() +record() +stats() }
    class PaymentGateway { <<interface>> +charge() +refund() }
    class DemoGateway

    Destination "1" --> "*" Hotel
    Destination "1" --> "*" Tour
    Destination "1" --> "*" Car
    Hotel "1" --> "*" RoomType
    User "1" --> "*" Booking
    Booking "*" --> "1" RoomType : bookable
    Booking "*" --> "1" Flight : bookable
    Booking "*" --> "1" Bus : bookable
    Booking "*" --> "1" Tour : bookable
    Booking "*" --> "1" Car : bookable
    Booking "1" --> "*" Payment
    Booking "*" --> "0..1" Coupon
    User "1" --> "*" Review
    Review "*" --> "1" Hotel : reviewable
    User "1" --> "*" Wishlist
    Ad "*" -- "*" AdZone
    Ad "1" --> "*" AdEvent
    BookingService ..> PricingService
    BookingService ..> PaymentGateway
    DemoGateway ..|> PaymentGateway
    AdService ..> Ad
```

## 4. Sequence — search to confirmed booking

```mermaid
sequenceDiagram
    autonumber
    actor C as Customer
    participant UI as React SPA
    participant API as Laravel API
    participant BS as BookingService
    participant PS as PricingService
    participant GW as PaymentGateway
    participant DB as Database

    C->>UI: search hotels (dest, dates, guests)
    UI->>API: GET /api/hotels?q&check_in&check_out
    API->>DB: filter + availability
    API-->>UI: paginated results
    C->>UI: open hotel, choose room, Reserve
    UI->>API: POST /api/bookings/quote
    API->>BS: quote(input)
    BS->>DB: availableRooms(in, out)
    BS->>PS: breakdown(price, nights, rooms, coupon)
    API-->>UI: subtotal, discount, fee, tax, total
    C->>UI: contact details + coupon, Continue
    UI->>API: POST /api/bookings
    API->>BS: create(user, input)
    BS->>DB: transaction: SELECT … FOR UPDATE, re-check, INSERT booking (pending)
    API-->>UI: 201 {reference}
    C->>UI: pay with bKash (wallet + OTP)
    UI->>API: POST /api/bookings/{ref}/pay
    API->>BS: pay(booking, method, payload)
    BS->>GW: charge(total, currency, method, payload)
    GW-->>BS: success + transaction id
    BS->>DB: INSERT payment, booking → confirmed/paid
    BS-->>C: BookingConfirmed (mail + notification)
    API-->>UI: 200 confirmed
    UI-->>C: confirmation page (+ interstitial ad)
```

## 5. Sequence — cancellation & refund

```mermaid
sequenceDiagram
    autonumber
    actor C as Customer
    participant UI as React SPA
    participant API as BookingController
    participant BS as BookingService
    participant GW as PaymentGateway
    participant DB as Database
    C->>UI: open booking
    UI->>API: GET /api/bookings/{ref}
    API->>BS: refundAmount(booking)
    API-->>UI: booking + refund_estimate
    C->>UI: Cancel booking (reason)
    UI->>API: POST /api/bookings/{ref}/cancel
    API->>BS: cancel(booking, reason)
    BS->>BS: policy → refund amount
    alt paid and refund > 0
        BS->>GW: refund(transaction_id, amount)
        GW-->>BS: refund id
        BS->>DB: payment → refunded
    end
    BS->>DB: booking → cancelled, coupon usage −1
    BS-->>C: BookingCancelled (mail + notification)
    API-->>UI: cancelled + refund amount
```

## 6. Sequence — admin uploads a video ad

```mermaid
sequenceDiagram
    autonumber
    actor A as Admin
    participant F as AdForm (React)
    participant API as Admin\AdController
    participant FS as Public storage
    participant DB as Database
    A->>F: drop promo.mp4, choose zones, skip after 5 s, auto-close 30 s, cap 3/day
    F->>F: client check (type, ≤ 50 MB), live preview
    F->>API: POST /api/admin/ads (multipart, progress)
    API->>API: validate (mimetypes, sizes, zones, schedule)
    API->>FS: store ads/YYYY/MM/xxxx.mp4
    API->>DB: INSERT ads (media_type = video)
    API->>DB: sync ad_ad_zone
    API-->>F: 201 Created
    F-->>A: redirect to Ads list
```

## 7. Activity — checkout

```mermaid
flowchart TD
    S([Start: Reserve clicked]) --> L{Signed in?}
    L -- No --> Login[Sign in / register] --> Q
    L -- Yes --> Q[Request quote]
    Q --> AV{Available?}
    AV -- No --> Err[Show reason<br/>choose again] --> E1([End])
    AV -- Yes --> Form[Enter contact & traveller details]
    Form --> CP{Coupon entered?}
    CP -- Yes --> VC{Valid?}
    VC -- No --> Msg[Show coupon error] --> Form
    VC -- Yes --> Disc[Apply discount] --> Terms
    CP -- No --> Terms{Terms accepted?}
    Terms -- No --> Form
    Terms -- Yes --> Create[Create pending booking<br/>lock inventory]
    Create --> Hold[Start hold timer]
    Hold --> Pay{Payment method}
    Pay -- Card / wallet --> Charge[Charge gateway]
    Charge --> OK{Success?}
    OK -- No --> Retry[Show error] --> Pay
    OK -- Yes --> Confirm[Confirm booking<br/>send notifications]
    Pay -- Pay at property --> Confirm
    Hold -. timeout .-> Expire[Expire booking<br/>release inventory] --> E2([End])
    Confirm --> Done([Confirmation page])
```

## 8. Activity — interstitial ad lifecycle

```mermaid
flowchart TD
    A([Page loads]) --> B{Allowed page?<br/>not login/checkout/payment}
    B -- No --> Z([No ad])
    B -- Yes --> C{Shown this session?}
    C -- Yes --> Z
    C -- No --> D[GET /api/ads/serve zone]
    D --> E{Eligible ad?<br/>active · scheduled · budget · audience · device · cap}
    E -- No --> Z
    E -- Yes --> F[Render overlay]
    F --> G{Media loaded?}
    G -- No --> Z
    G -- Yes --> H[Track impression]
    H --> I{closable?}
    I -- No --> J[Wait auto_close_seconds] --> K[Track complete] --> Y([Dismissed])
    I -- Yes --> L[Countdown skip_after_seconds]
    L --> M{Viewer action}
    M -- Click CTA --> N[GET /ads/id/click → 302 advertiser]
    M -- Skip/close --> O[Track skip or close] --> Y
    M -- Auto-close reached --> K
```

## 9. State machine — booking

```mermaid
stateDiagram-v2
    [*] --> Pending: create (inventory held)
    Pending --> Confirmed: payment succeeded / pay at property
    Pending --> Cancelled: customer cancels
    Pending --> Cancelled: hold expired (scheduler)
    Confirmed --> Cancelled: cancel (refund per policy)
    Confirmed --> Completed: service date passed (scheduler) / admin
    Cancelled --> [*]
    Completed --> [*]

    state Confirmed {
        [*] --> Paid
        [*] --> Unpaid: pay at property
        Unpaid --> Paid: admin marks paid
    }
```

## 10. State machine — ad delivery state

```mermaid
stateDiagram-v2
    [*] --> Draft
    Draft --> Active: publish
    Active --> Paused: toggle
    Paused --> Active: toggle
    state Active {
        [*] --> Scheduled: now < starts_at
        Scheduled --> Running: starts_at reached
        Running --> BudgetReached: impressions ≥ max or clicks ≥ max
        Running --> Expired: now > ends_at
    }
    Active --> [*]: delete
    Paused --> [*]: delete
    Draft --> [*]: delete
```

## 11. Component diagram

```mermaid
flowchart LR
    subgraph Frontend [React SPA]
        CS[Customer pages]
        AP[Admin panel]
        ADC[Ad components]
        ST[Redux store]
    end
    subgraph Backend [Laravel]
        AUTH[Auth API]
        CAT[Catalogue API]
        BKG[Booking API]
        ENG[Engagement API]
        ADS[Ad serving API]
        ADM[Admin API]
        SVC[Services]
        NOTI[Notifications]
        SCH[Scheduler]
    end
    DB[(Database)]
    FS[(Storage)]
    CS --> AUTH & CAT & BKG & ENG
    ADC --> ADS
    AP --> ADM
    AUTH & CAT & BKG & ENG & ADS & ADM --> SVC --> DB
    ADM --> FS
    SVC --> NOTI
    SCH --> SVC
```
