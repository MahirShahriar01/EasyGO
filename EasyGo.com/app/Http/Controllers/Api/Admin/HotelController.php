<?php

namespace App\Http\Controllers\Api\Admin;

use App\Models\Hotel;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class HotelController extends CrudController
{
    protected string $model = Hotel::class;

    protected array $searchable = ['name', 'address'];

    protected array $filterable = ['status', 'destination_id', 'star_rating', 'property_type'];

    protected array $sortable = ['id', 'name', 'star_rating', 'avg_rating', 'min_price', 'created_at'];

    protected array $with = ['destination:id,name'];

    protected array $withCount = ['roomTypes'];

    protected function rules(Request $request, ?Model $item = null): array
    {
        return [
            'destination_id' => ['required', 'exists:destinations,id'],
            'name' => ['required', 'string', 'max:150'],
            'property_type' => ['required', Rule::in(Hotel::PROPERTY_TYPES)],
            'description' => ['nullable', 'string', 'max:10000'],
            'address' => ['nullable', 'string', 'max:255'],
            'star_rating' => ['required', 'integer', 'between:1,5'],
            'amenities' => ['nullable', 'array'],
            'amenities.*' => [Rule::in(array_keys(Hotel::AMENITIES))],
            'thumbnail' => $this->imageRules(),
            'images' => ['nullable', 'array', 'max:20'],
            'images.*' => ['string', 'max:500'],
            'latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180'],
            'check_in_time' => ['required', 'date_format:H:i'],
            'check_out_time' => ['required', 'date_format:H:i'],
            'policies' => ['nullable', 'string', 'max:5000'],
            'phone' => ['nullable', 'string', 'max:30'],
            'email' => ['nullable', 'email', 'max:150'],
            'is_featured' => ['boolean'],
            'status' => ['required', 'in:active,inactive'],
        ];
    }
}
