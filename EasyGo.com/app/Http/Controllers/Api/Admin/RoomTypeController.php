<?php

namespace App\Http\Controllers\Api\Admin;

use App\Models\RoomType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;

/** Room types are managed per hotel: ?hotel_id= filters the list. */
class RoomTypeController extends CrudController
{
    protected string $model = RoomType::class;

    protected array $filterable = ['status', 'hotel_id'];

    protected array $sortable = ['id', 'name', 'price_per_night', 'created_at'];

    protected array $with = ['hotel:id,name'];

    protected function rules(Request $request, ?Model $item = null): array
    {
        return [
            'hotel_id' => ['required', 'exists:hotels,id'],
            'name' => ['required', 'string', 'max:100'],
            'description' => ['nullable', 'string', 'max:3000'],
            'bed_type' => ['nullable', 'string', 'max:50'],
            'size_sqm' => ['nullable', 'integer', 'min:5', 'max:2000'],
            'max_adults' => ['required', 'integer', 'between:1,20'],
            'max_children' => ['required', 'integer', 'between:0,10'],
            'price_per_night' => ['required', 'numeric', 'min:0'],
            'total_rooms' => ['required', 'integer', 'min:0', 'max:5000'],
            'amenities' => ['nullable', 'array'],
            'amenities.*' => ['string', 'max:50'],
            'images' => ['nullable', 'array', 'max:10'],
            'images.*' => ['string', 'max:500'],
            'breakfast_included' => ['boolean'],
            'refundable' => ['boolean'],
            'status' => ['required', 'in:active,inactive'],
        ];
    }
}
