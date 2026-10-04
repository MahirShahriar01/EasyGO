<?php

use App\Http\Controllers\Api\AdController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web routes
|--------------------------------------------------------------------------
| The customer site and admin panel are a single React SPA. Every non-API
| path renders the SPA shell; React Router handles the rest client-side.
*/

// Ad click tracking: logs the click then 302-redirects to the advertiser URL.
Route::get('/ads/{ad}/click', [AdController::class, 'click'])->middleware('throttle:60,1')->name('ads.click');

// Named route used by Laravel's password-reset notification.
Route::view('/reset-password/{token}', 'app')->name('password.reset');

Route::view('/{any?}', 'app')->where('any', '^(?!api|storage|build|up).*$')->name('spa');
