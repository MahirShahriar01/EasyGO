<?php

namespace App\Http\Controllers\Api\Admin;

use App\Models\Tour;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class TourController extends CrudController
{
    protected string $model = Tour::class;

    protected array $searchable = ['title'];

    protected array $filterable = ['status', 'destination_id', 'category'];

    protected array $sortable = ['id', 'title', 'price', 'duration_days', 'avg_rating', 'created_at'];

    protected array $with = ['destination:id,name'];

    protected function rules(Request $request, ?Model $item = null): array
    {
        return [
            'destination_id' => ['required', 'exists:destinations,id'],
            'title' => ['required', 'string', 'max:150'],
            'category' => ['nullable', Rule::in(Tour::CATEGORIES)],
            'description' => ['nullable', 'string', 'max:10000'],
            'duration_days' => ['required', 'integer', 'between:1,60'],
            'duration_nights' => ['required', 'integer', 'between:0,60'],
            'price' => ['required', 'numeric', 'min:0'],
            'discount_price' => ['nullable', 'numeric', 'min:0', 'lt:price'],
            'max_group_size' => ['required', 'integer', 'between:1,500'],
            'itinerary' => ['nullable', 'array'],
            'itinerary.*.day' => ['required', 'integer', 'min:1'],
            'itinerary.*.title' => ['required', 'string', 'max:150'],
            'itinerary.*.description' => ['nullable', 'string', 'max:2000'],
            'inclusions' => ['nullable', 'array'],
            'inclusions.*' => ['string', 'max:150'],
            'exclusions' => ['nullable', 'array'],
            'exclusions.*' => ['string', 'max:150'],
            'thumbnail' => $this->imageRules(),
            'images' => ['nullable', 'array', 'max:20'],
            'images.*' => ['string', 'max:500'],
            'available_from' => ['nullable', 'date'],
            'available_to' => ['nullable', 'date', 'after_or_equal:available_from'],
            'is_featured' => ['boolean'],
            'status' => ['required', 'in:active,inactive'],
        ];
    }
}
