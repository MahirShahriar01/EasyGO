<?php

use App\Models\AdEvent;
use App\Services\BookingService;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

/*
| bookings:maintain — releases inventory held by unpaid bookings after the
| hold window and marks past stays/trips as completed.
| Production: run `php artisan schedule:work` (or a cron calling schedule:run).
*/
Artisan::command('bookings:maintain', function (BookingService $bookings) {
    $result = $bookings->maintain();
    $this->info("Expired {$result['expired']} pending booking(s); completed {$result['completed']}.");
})->purpose('Expire unpaid bookings and complete past ones');

Schedule::command('bookings:maintain')->everyFiveMinutes()->withoutOverlapping();

// Keep the ad event log lean: raw events older than 180 days are pruned.
Artisan::command('ads:prune {--days=180}', function () {
    $deleted = AdEvent::where('created_at', '<', now()->subDays((int) $this->option('days')))->delete();
    $this->info("Pruned {$deleted} ad event(s).");
})->purpose('Delete old ad tracking events');

Schedule::command('ads:prune')->daily();
