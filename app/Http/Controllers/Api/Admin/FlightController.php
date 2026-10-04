<?php

namespace App\Http\Controllers\Api\Admin;

use App\Models\Flight;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class FlightController extends CrudController
{
    protected string $model = Flight::class;

    protected array $searchable = ['airline', 'flight_number', 'from_city', 'to_city', 'from_code', 'to_code'];

    protected array $filterable = ['status', 'cabin_class', 'airline'];

    protected array $sortable = ['id', 'departure_at', 'price', 'created_at'];

    protected function rules(Request $request, ?Model $item = null): array
    {
        return [
            'airline' => ['required', 'string', 'max:100'],
            'airline_code' => ['nullable', 'string', 'max:5'],
            'airline_logo' => $this->imageRules(),
            'flight_number' => ['required', 'string', 'max:20'],
            'from_city' => ['required', 'string', 'max:100'],
            'from_code' => ['required', 'string', 'size:3'],
            'to_city' => ['required', 'string', 'max:100', 'different:from_city'],
            'to_code' => ['required', 'string', 'size:3'],
            'departure_at' => ['required', 'date'],
            'arrival_at' => ['required', 'date', 'after:departure_at'],
            'stops' => ['required', 'integer', 'between:0,3'],
            'cabin_class' => ['required', Rule::in(Flight::CABINS)],
            'price' => ['required', 'numeric', 'min:0'],
            'total_seats' => ['required', 'integer', 'min:1', 'max:900'],
            'baggage' => ['nullable', 'string', 'max:100'],
            'refundable' => ['boolean'],
            'status' => ['required', 'in:active,inactive'],
        ];
    }

    protected function prepare(array $data, Request $request, ?Model $item): array
    {
        $data['from_code'] = strtoupper($data['from_code']);
        $data['to_code'] = strtoupper($data['to_code']);

        return $data;
    }
}
