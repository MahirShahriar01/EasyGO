<?php

namespace App\Providers;

use App\Models\Ad;
use App\Models\Bus;
use App\Models\Car;
use App\Models\Flight;
use App\Models\Hotel;
use App\Models\RoomType;
use App\Models\Tour;
use App\Models\User;
use App\Services\Payments\DemoGateway;
use App\Services\Payments\PaymentGateway;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        // Swap DemoGateway for a real provider adapter in production (see docs/ARCHITECTURE.md).
        $this->app->bind(PaymentGateway::class, DemoGateway::class);
    }

    public function boot(): void
    {
        // Short, stable type names in polymorphic columns (bookable_type, reviewable_type...).
        Relation::enforceMorphMap([
            'user' => User::class,
            'hotel' => Hotel::class,
            'room_type' => RoomType::class,
            'flight' => Flight::class,
            'bus' => Bus::class,
            'tour' => Tour::class,
            'car' => Car::class,
            'ad' => Ad::class,
        ]);

        // Password-reset e-mails link to the SPA page instead of a Blade form.
        ResetPassword::createUrlUsing(
            fn (User $user, string $token) => url('/reset-password/'.$token.'?email='.urlencode($user->email))
        );

        RateLimiter::for('auth', fn (Request $request) => Limit::perMinute(10)->by($request->ip()));
    }
}
