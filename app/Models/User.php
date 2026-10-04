<?php

namespace App\Models;

use App\Models\Concerns\ResolvesMedia;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

/**
 * A platform account. Customers book travel; admins manage the platform
 * through the /admin panel (guarded by the "admin" middleware).
 */
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable, ResolvesMedia;

    public const ROLE_CUSTOMER = 'customer';

    public const ROLE_ADMIN = 'admin';

    protected $fillable = [
        'name', 'email', 'password', 'phone', 'avatar', 'role', 'status',
        'address', 'city', 'country', 'date_of_birth', 'passport_no', 'last_login_at',
    ];

    protected $hidden = ['password', 'remember_token'];

    protected $appends = ['avatar_url'];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'last_login_at' => 'datetime',
            'date_of_birth' => 'date:Y-m-d',
            'password' => 'hashed',
        ];
    }

    public function isAdmin(): bool
    {
        return $this->role === self::ROLE_ADMIN;
    }

    public function isBlocked(): bool
    {
        return $this->status === 'blocked';
    }

    public function getAvatarUrlAttribute(): string
    {
        // Fallback: generated initials avatar (no external request needed).
        return static::mediaUrl($this->avatar)
            ?? 'data:image/svg+xml;utf8,'.rawurlencode(
                '<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96"><rect width="96" height="96" rx="48" fill="#0d6efd"/>'
                .'<text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="40" fill="#fff">'
                .e(mb_strtoupper(mb_substr($this->name ?? '?', 0, 1))).'</text></svg>'
            );
    }

    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class);
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class);
    }

    public function wishlists(): HasMany
    {
        return $this->hasMany(Wishlist::class);
    }
}
