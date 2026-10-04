# Contributing to EasyGo

Thanks for helping improve EasyGo!

## Workflow
1. Create a branch from `master`: `feature/<short-name>` or `fix/<short-name>`.
2. Set up locally: `composer setup`.
3. Make focused commits with clear messages (imperative mood, e.g. “Add seat hold timer”).
4. Before pushing run:
   ```bash
   vendor/bin/pint            # PHP code style (Laravel preset)
   php artisan test           # all tests must pass
   npm run build              # frontend must compile
   ```
5. Open a pull request describing **what** changed, **why**, and **how it was tested** (screenshots for UI changes).

## Conventions
* **Backend:** controllers stay thin (validation + response); business rules go in `app/Services`. New admin resources extend `Api\Admin\CrudController`. Add a feature test for every new endpoint or rule.
* **Frontend:** functional components + hooks; page data via `useApi`, global state via Redux slices; filters in the URL via `useQueryState`. New admin CRUD screens should be a config entry in `resources/js/admin/resources.jsx`.
* **Styling:** extend `resources/scss/app.scss` (Bootstrap variables and utility-first classes); support dark mode.
* **Database:** never edit a released migration — add a new one. Keep seeders realistic.
* **Docs:** update `docs/` (API, SRS requirement IDs, diagrams) together with behaviour changes.

## Reporting bugs
Open an issue with steps to reproduce, expected vs. actual behaviour, browser/OS and screenshots or logs (`storage/logs/laravel.log`).
