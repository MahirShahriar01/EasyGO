# EasyGO

**EasyGo** — an all-in-one travel booking platform (hotels, flights, buses, tour packages and car rental)
with a fully controlled, self-hosted advertising system. Built with Laravel 13, React 18, Redux Toolkit and
Bootstrap 5.

➡️ **The application lives in [`EasyGo.com/`](EasyGo.com/) — start with its [README](EasyGo.com/README.md).**

[![CI](https://github.com/MahirShahriar01/EasyGO/actions/workflows/ci.yml/badge.svg)](https://github.com/MahirShahriar01/EasyGO/actions/workflows/ci.yml)

## Repository layout

| Path | Contents |
|---|---|
| [`EasyGo.com/`](EasyGo.com/) | **The EasyGo booking platform** (Laravel API + React SPA, admin panel, ad system, tests, Docker) |
| [`EasyGo.com/docs/`](EasyGo.com/docs/) | SRS, architecture, UML/DFD/ER diagrams, API reference, user & admin guides, deployment, testing |
| `API handaling AXIOs/`, `API laraval/`, `JSX Validation/`, `Mail Validation/` | Earlier course labs (Laravel 7 + React/Redux + Axios) that established the project's stack |
| `lab4task/` | Laravel 9 lab exercise (registration form validation) |
| `.github/workflows/ci.yml` | Continuous integration for `EasyGo.com/` |

## Quick start

```bash
cd EasyGo.com
composer setup   # installs, configures, migrates & seeds demo data, builds the frontend
composer serve   # http://127.0.0.1:8000
```

Demo logins: `admin@easygo.com` / `password123` (admin) · `demo@easygo.com` / `password123` (customer).

## Documentation

* [Software Requirements Specification](EasyGo.com/docs/SRS.md)
* [Architecture](EasyGo.com/docs/ARCHITECTURE.md) · [Diagrams](EasyGo.com/docs/DIAGRAMS.md) · [Database](EasyGo.com/docs/DATABASE.md)
* [API reference](EasyGo.com/docs/API.md) · [Advertising system](EasyGo.com/docs/ADVERTISING.md)
* [User guide](EasyGo.com/docs/USER_GUIDE.md) · [Admin guide](EasyGo.com/docs/ADMIN_GUIDE.md)
* [Deployment](EasyGo.com/docs/DEPLOYMENT.md) · [Testing](EasyGo.com/docs/TESTING.md)
* [Contributing](CONTRIBUTING.md) · [Changelog](CHANGELOG.md) · [Security](SECURITY.md)

## License

[MIT](LICENSE)
