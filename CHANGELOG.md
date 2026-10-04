# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses [Semantic Versioning](https://semver.org/).

## [1.0.0] — 2026-10-04
### Added
- **EasyGo.com application** replacing the empty `EasyGo.com` submodule pointer: Laravel 13 REST API + React 18 SPA (Redux Toolkit, Bootstrap 5, Vite).
- Search, details and booking for **hotels (room types), flights, buses (interactive seat map), tour packages and rental cars**; destinations.
- Booking engine: server-side quotes, coupons, VAT and service fee, transactional inventory locking, 30-minute holds, automatic expiry/completion, per-service refund policies.
- Payments through a pluggable gateway interface with a sandbox gateway: card, bKash, Nagad, Rocket and pay-at-property.
- Customer account: dashboard, bookings, printable e-tickets/vouchers, cancellation with refund estimate, verified reviews, wishlist, notifications, profile, avatar, password change & reset.
- Admin panel: dashboard with charts, CRUD for all inventory, bookings (confirm/mark paid/cancel & refund/CSV export), users, review moderation, support inbox with e-mail replies, coupons, newsletter, settings.
- **Self-hosted advertising system**: zones, image/video uploads up to 50 MB, skip-after-N-seconds and auto-close rules, audience/device targeting, weighted rotation, frequency caps, budgets, scheduling, impression/click/skip/close/complete tracking and analytics.
- Dark mode, responsive layouts, skeleton loaders, error boundaries, image fallbacks.
- Demo seed data, 45 PHPUnit tests, Pint, GitHub Actions CI, Docker setup.
- Documentation: SRS, architecture, UML/DFD/ER diagrams, API reference, user/admin guides, deployment and testing guides.

## [0.1.0] — 2022-12-26
### Added
- Course lab projects (Laravel 7/9 + React/Redux + Axios) and initial admin work for the final-term project.
