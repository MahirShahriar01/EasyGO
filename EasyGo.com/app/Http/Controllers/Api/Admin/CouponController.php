<?php

namespace App\Http\Controllers\Api\Admin;

use App\Models\Coupon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CouponController extends CrudController
{
    protected string $model = Coupon::class;

    protected array $searchable = ['code', 'description'];

    protected array $filterable = ['applies_to', 'is_active', 'type'];

    protected array $sortable = ['id', 'code', 'used_count', 'expires_at', 'created_at'];

    protected function rules(Request $request, ?Model $item = null): array
    {
        return [
            'code' => ['required', 'string', 'max:40', 'alpha_dash', Rule::unique('coupons', 'code')->ignore($item?->id)],
            'description' => ['nullable', 'string', 'max:255'],
            'type' => ['required', 'in:percent,fixed'],
            'value' => ['required', 'numeric', 'min:0', $request->input('type') === 'percent' ? 'max:100' : 'max:10000000'],
            'min_amount' => ['nullable', 'numeric', 'min:0'],
            'max_discount' => ['nullable', 'numeric', 'min:0'],
            'applies_to' => ['required', 'in:all,hotel,flight,bus,tour,car'],
            'usage_limit' => ['nullable', 'integer', 'min:1'],
            'per_user_limit' => ['nullable', 'integer', 'min:1'],
            'starts_at' => ['nullable', 'date'],
            'expires_at' => ['nullable', 'date', 'after:starts_at'],
            'is_active' => ['boolean'],
        ];
    }

    protected function prepare(array $data, Request $request, ?Model $item): array
    {
        $data['min_amount'] ??= 0;

        return $data;
    }
}
