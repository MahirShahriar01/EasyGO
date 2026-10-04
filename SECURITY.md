# Security Policy

## Reporting a vulnerability
Please **do not open a public issue**. E-mail the maintainer (see the GitHub profile of the repository owner)
with a description, reproduction steps and impact. You will receive an acknowledgement within 72 hours.

## Built-in protections
* Passwords hashed with bcrypt; API tokens via Laravel Sanctum with expiry; tokens revoked on logout, password reset and account blocking.
* Role middleware on all `/api/admin/*` routes; ownership checks on customer bookings.
* Validation on every endpoint, whitelisted sort columns, mass-assignment protection.
* Rate limits on authentication, booking, payment, contact, newsletter and ad endpoints.
* Upload MIME/size validation; files stored under generated names.
* No raw card data stored; ad tracking stores salted IP hashes only.

## Deployment hardening
See the production checklist in [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md#4-production-checklist):
disable debug, enforce HTTPS, remove demo accounts, configure a real payment gateway and keep dependencies updated
(`composer audit`, `npm audit`).
