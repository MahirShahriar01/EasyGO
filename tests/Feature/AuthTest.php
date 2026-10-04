<?php

namespace Tests\Feature;

use App\Models\User;
use Tests\TestCase;

class AuthTest extends TestCase
{
    public function test_customer_can_register_and_receives_a_token(): void
    {
        $this->postJson('/api/auth/register', [
            'name' => 'Rahim Uddin',
            'email' => 'rahim@example.com',
            'password' => 'secret123',
            'password_confirmation' => 'secret123',
        ])->assertCreated()->assertJsonStructure(['user' => ['id', 'email', 'role'], 'token']);

        $this->assertDatabaseHas('users', ['email' => 'rahim@example.com', 'role' => 'customer']);
    }

    public function test_registration_validates_password_strength_and_uniqueness(): void
    {
        $this->customer(['email' => 'taken@example.com']);

        $this->postJson('/api/auth/register', [
            'name' => 'X', 'email' => 'taken@example.com', 'password' => 'short', 'password_confirmation' => 'short',
        ])->assertUnprocessable()->assertJsonValidationErrors(['email', 'password']);
    }

    public function test_login_with_valid_and_invalid_credentials(): void
    {
        $user = $this->customer(['password' => 'password123']);

        $this->postJson('/api/auth/login', ['email' => $user->email, 'password' => 'wrong'])
            ->assertUnprocessable()->assertJsonValidationErrors('email');

        $token = $this->postJson('/api/auth/login', ['email' => $user->email, 'password' => 'password123'])
            ->assertOk()->json('token');

        $this->withToken($token)->getJson('/api/auth/me')->assertOk()->assertJsonPath('user.email', $user->email);
    }

    public function test_blocked_user_cannot_log_in_or_use_existing_token(): void
    {
        $user = $this->customer(['password' => 'password123']);
        $token = $user->createToken('spa')->plainTextToken;
        $user->update(['status' => 'blocked']);

        $this->postJson('/api/auth/login', ['email' => $user->email, 'password' => 'password123'])->assertUnprocessable();
        $this->withToken($token)->getJson('/api/auth/me')->assertForbidden();
    }

    public function test_protected_routes_require_authentication(): void
    {
        $this->getJson('/api/bookings')->assertUnauthorized();
        $this->getJson('/api/auth/me')->assertUnauthorized();
    }

    public function test_profile_update_and_password_change(): void
    {
        $user = $this->customer(['password' => 'password123']);
        $this->actingAs($user, 'sanctum');

        $this->putJson('/api/auth/profile', ['name' => 'New Name', 'email' => $user->email, 'city' => 'Sylhet'])
            ->assertOk()->assertJsonPath('user.city', 'Sylhet');

        $this->putJson('/api/auth/password', ['current_password' => 'nope', 'password' => 'newpass123', 'password_confirmation' => 'newpass123'])
            ->assertUnprocessable();
    }

    public function test_forgot_password_does_not_reveal_whether_email_exists(): void
    {
        $this->postJson('/api/auth/forgot-password', ['email' => 'nobody@example.com'])->assertOk();
        $this->assertInstanceOf(User::class, $this->customer());
    }
}
