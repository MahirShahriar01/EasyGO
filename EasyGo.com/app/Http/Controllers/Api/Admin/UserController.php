<?php

namespace App\Http\Controllers\Api\Admin;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

/** Customer & admin account management (roles, blocking, password resets). */
class UserController extends CrudController
{
    protected string $model = User::class;

    protected array $searchable = ['name', 'email', 'phone'];

    protected array $filterable = ['role', 'status'];

    protected array $sortable = ['id', 'name', 'email', 'last_login_at', 'created_at'];

    protected array $withCount = ['bookings'];

    protected function rules(Request $request, ?Model $item = null): array
    {
        return [
            'name' => ['required', 'string', 'max:100'],
            'email' => ['required', 'email', 'max:150', Rule::unique('users', 'email')->ignore($item?->id)],
            'phone' => ['nullable', 'string', 'max:30'],
            'role' => ['required', Rule::in([User::ROLE_CUSTOMER, User::ROLE_ADMIN])],
            'status' => ['required', Rule::in(['active', 'blocked'])],
            'city' => ['nullable', 'string', 'max:100'],
            'country' => ['nullable', 'string', 'max:100'],
            'password' => [$item ? 'nullable' : 'required', Password::min(8)],
        ];
    }

    protected function prepare(array $data, Request $request, ?Model $item): array
    {
        if (empty($data['password'])) {
            unset($data['password']);
        }

        // Prevent an admin from locking themselves out.
        if ($item && $item->id === $request->user()->id) {
            $data['role'] = User::ROLE_ADMIN;
            $data['status'] = 'active';
        }

        return $data;
    }

    protected function afterSave(Model $item, Request $request): void
    {
        if ($item->status === 'blocked') {
            $item->tokens()->delete();
        }
    }

    public function show(int $id): JsonResponse
    {
        $user = User::withCount(['bookings', 'reviews', 'wishlists'])->findOrFail($id);

        return response()->json([
            'user' => $user,
            'bookings' => $user->bookings()->latest()->take(10)->get(),
            'total_spent' => (float) $user->bookings()->where('payment_status', 'paid')->sum('total'),
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        abort_if($id === request()->user()->id, 422, 'You cannot delete your own account.');

        return parent::destroy($id);
    }
}
