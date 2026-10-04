<?php

use App\Http\Controllers\Api;
use App\Http\Controllers\Api\Admin;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| EasyGo REST API  (prefix: /api)
|--------------------------------------------------------------------------
| Public catalogue + search endpoints, authenticated customer endpoints
| (Sanctum bearer tokens) and the /api/admin back-office API.
| Full reference: docs/API.md
*/

// ---- Public ---------------------------------------------------------------
Route::get('/home', [Api\HomeController::class, 'home']);
Route::get('/settings', [Api\HomeController::class, 'settings']);
Route::get('/suggest', [Api\HomeController::class, 'suggest'])->middleware('throttle:60,1');

Route::get('/destinations', [Api\DestinationController::class, 'index']);
Route::get('/destinations/{destination}', [Api\DestinationController::class, 'show']);
Route::get('/hotels', [Api\HotelController::class, 'index']);
Route::get('/hotels/{hotel}', [Api\HotelController::class, 'show']);
Route::get('/flights', [Api\FlightController::class, 'index']);
Route::get('/flights/{flight}', [Api\FlightController::class, 'show']);
Route::get('/buses', [Api\BusController::class, 'index']);
Route::get('/buses/{bus}', [Api\BusController::class, 'show']);
Route::get('/tours', [Api\TourController::class, 'index']);
Route::get('/tours/{tour}', [Api\TourController::class, 'show']);
Route::get('/cars', [Api\CarController::class, 'index']);
Route::get('/cars/{car}', [Api\CarController::class, 'show']);
Route::get('/reviews/{type}/{id}', [Api\ReviewController::class, 'index'])->whereNumber('id');

Route::post('/bookings/quote', [Api\BookingController::class, 'quote'])->middleware('throttle:60,1');
Route::post('/contact', [Api\ContactController::class, 'store'])->middleware('throttle:5,1');
Route::post('/newsletter', [Api\ContactController::class, 'subscribe'])->middleware('throttle:5,1');

// Ads: serving + tracking
Route::get('/ads/serve', [Api\AdController::class, 'serve'])->middleware('throttle:120,1');
Route::post('/ads/{ad}/events', [Api\AdController::class, 'event'])->middleware('throttle:240,1');

// ---- Auth -----------------------------------------------------------------
Route::prefix('auth')->middleware('throttle:auth')->group(function () {
    Route::post('/register', [Api\AuthController::class, 'register']);
    Route::post('/login', [Api\AuthController::class, 'login']);
    Route::post('/forgot-password', [Api\AuthController::class, 'forgotPassword']);
    Route::post('/reset-password', [Api\AuthController::class, 'resetPassword']);
});

// ---- Authenticated customer ----------------------------------------------
Route::middleware(['auth:sanctum', 'active'])->group(function () {
    Route::post('/auth/logout', [Api\AuthController::class, 'logout']);
    Route::get('/auth/me', [Api\AuthController::class, 'me']);
    Route::put('/auth/profile', [Api\AuthController::class, 'updateProfile']);
    Route::post('/auth/avatar', [Api\AuthController::class, 'uploadAvatar']);
    Route::put('/auth/password', [Api\AuthController::class, 'changePassword']);

    Route::get('/bookings', [Api\BookingController::class, 'index']);
    Route::post('/bookings', [Api\BookingController::class, 'store'])->middleware('throttle:20,1');
    Route::get('/bookings/{booking}', [Api\BookingController::class, 'show']);
    Route::post('/bookings/{booking}/pay', [Api\BookingController::class, 'pay'])->middleware('throttle:10,1');
    Route::post('/bookings/{booking}/cancel', [Api\BookingController::class, 'cancel']);

    Route::get('/wishlist', [Api\WishlistController::class, 'index']);
    Route::get('/wishlist/keys', [Api\WishlistController::class, 'keys']);
    Route::post('/wishlist/toggle', [Api\WishlistController::class, 'toggle']);

    Route::get('/my-reviews', [Api\ReviewController::class, 'mine']);
    Route::post('/reviews', [Api\ReviewController::class, 'store'])->middleware('throttle:10,1');

    Route::get('/notifications', [Api\NotificationController::class, 'index']);
    Route::post('/notifications/read-all', [Api\NotificationController::class, 'markAllRead']);
    Route::post('/notifications/{id}/read', [Api\NotificationController::class, 'markRead']);
});

// ---- Admin back-office ----------------------------------------------------
Route::prefix('admin')->middleware(['auth:sanctum', 'active', 'admin'])->group(function () {
    Route::get('/dashboard', Admin\DashboardController::class);
    Route::post('/uploads', [Admin\UploadController::class, 'store']);

    $crud = fn (string $uri, string $controller) => Route::apiResource($uri, $controller)->parameters([$uri => 'id']);
    $crud('destinations', Admin\DestinationController::class);
    $crud('hotels', Admin\HotelController::class);
    $crud('room-types', Admin\RoomTypeController::class);
    $crud('flights', Admin\FlightController::class);
    $crud('buses', Admin\BusController::class);
    $crud('tours', Admin\TourController::class);
    $crud('cars', Admin\CarController::class);
    $crud('coupons', Admin\CouponController::class);
    $crud('users', Admin\UserController::class);
    $crud('ad-zones', Admin\AdZoneController::class);

    Route::get('/ads/overview', [Admin\AdController::class, 'overview']);
    Route::post('/ads/{id}/toggle', [Admin\AdController::class, 'toggle']);
    Route::post('/ads/{id}/duplicate', [Admin\AdController::class, 'duplicate']);
    Route::get('/ads/{id}/stats', [Admin\AdController::class, 'stats']);
    $crud('ads', Admin\AdController::class);

    Route::get('/bookings/export', [Admin\BookingController::class, 'export']);
    Route::get('/bookings', [Admin\BookingController::class, 'index']);
    Route::get('/bookings/{booking}', [Admin\BookingController::class, 'show']);
    Route::patch('/bookings/{booking}', [Admin\BookingController::class, 'update']);
    Route::post('/bookings/{booking}/cancel', [Admin\BookingController::class, 'cancel']);

    Route::get('/reviews', [Admin\ReviewController::class, 'index']);
    Route::patch('/reviews/{review}', [Admin\ReviewController::class, 'update']);
    Route::delete('/reviews/{review}', [Admin\ReviewController::class, 'destroy']);

    Route::get('/messages', [Admin\MessageController::class, 'index']);
    Route::get('/messages/{message}', [Admin\MessageController::class, 'show']);
    Route::post('/messages/{message}/reply', [Admin\MessageController::class, 'reply']);
    Route::delete('/messages/{message}', [Admin\MessageController::class, 'destroy']);

    Route::get('/subscribers/export', [Admin\SubscriberController::class, 'export']);
    Route::get('/subscribers', [Admin\SubscriberController::class, 'index']);
    Route::delete('/subscribers/{subscriber}', [Admin\SubscriberController::class, 'destroy']);

    Route::get('/settings', [Admin\SettingController::class, 'index']);
    Route::put('/settings', [Admin\SettingController::class, 'update']);
});
