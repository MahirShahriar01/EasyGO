<?php

namespace App\Http\Controllers\Api\Admin;

use App\Models\Car;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CarController extends CrudController
{
    protected string $model = Car::class;

    protected array $searchable = ['name', 'brand'];

    protected array $filterable = ['status', 'destination_id', 'car_type', 'transmission'];

    protected array $sortable = ['id', 'name', 'price_per_day', 'created_at'];

    protected array $with = ['destination:id,name'];

    protected function rules(Request $request, ?Model $item = null): array
    {
        return [
            'destination_id' => ['required', 'exists:destinations,id'],
            'name' => ['required', 'string', 'max:100'],
            'brand' => ['nullable', 'string', 'max:50'],
            'car_type' => ['required', Rule::in(Car::TYPES)],
            'seats' => ['required', 'integer', 'between:1,50'],
            'bags' => ['required', 'integer', 'between:0,20'],
            'transmission' => ['required', 'in:automatic,manual'],
            'fuel_type' => ['required', 'in:petrol,diesel,hybrid,electric,cng'],
            'air_conditioning' => ['boolean'],
            'with_driver' => ['boolean'],
            'price_per_day' => ['required', 'numeric', 'min:0'],
            'quantity' => ['required', 'integer', 'between:0,1000'],
            'thumbnail' => $this->imageRules(),
            'images' => ['nullable', 'array', 'max:10'],
            'images.*' => ['string', 'max:500'],
            'features' => ['nullable', 'array'],
            'features.*' => ['string', 'max:60'],
            'status' => ['required', 'in:active,inactive'],
        ];
    }
}
