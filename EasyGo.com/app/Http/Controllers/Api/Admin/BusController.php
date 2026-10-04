<?php

namespace App\Http\Controllers\Api\Admin;

use App\Models\Bus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class BusController extends CrudController
{
    protected string $model = Bus::class;

    protected array $searchable = ['operator', 'coach_no', 'from_city', 'to_city'];

    protected array $filterable = ['status', 'bus_type', 'operator'];

    protected array $sortable = ['id', 'departure_at', 'price', 'created_at'];

    protected function rules(Request $request, ?Model $item = null): array
    {
        return [
            'operator' => ['required', 'string', 'max:100'],
            'coach_no' => ['nullable', 'string', 'max:30'],
            'bus_type' => ['required', Rule::in(Bus::TYPES)],
            'from_city' => ['required', 'string', 'max:100'],
            'to_city' => ['required', 'string', 'max:100', 'different:from_city'],
            'boarding_point' => ['nullable', 'string', 'max:150'],
            'dropping_point' => ['nullable', 'string', 'max:150'],
            'departure_at' => ['required', 'date'],
            'arrival_at' => ['required', 'date', 'after:departure_at'],
            'price' => ['required', 'numeric', 'min:0'],
            'total_seats' => ['required', 'integer', 'min:4', 'max:80'],
            'seat_layout' => ['required', Rule::in(['1-1', '1-2', '2-1', '2-2', '2-3'])],
            'amenities' => ['nullable', 'array'],
            'amenities.*' => ['string', 'max:50'],
            'status' => ['required', 'in:active,inactive'],
        ];
    }
}
