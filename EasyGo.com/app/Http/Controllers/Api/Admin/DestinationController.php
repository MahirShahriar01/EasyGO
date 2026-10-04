<?php

namespace App\Http\Controllers\Api\Admin;

use App\Models\Destination;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;

class DestinationController extends CrudController
{
    protected string $model = Destination::class;

    protected array $searchable = ['name', 'country'];

    protected array $sortable = ['id', 'name', 'country', 'created_at'];

    protected array $withCount = ['hotels', 'tours', 'cars'];

    protected function rules(Request $request, ?Model $item = null): array
    {
        return [
            'name' => ['required', 'string', 'max:100'],
            'country' => ['required', 'string', 'max:100'],
            'tagline' => ['nullable', 'string', 'max:150'],
            'description' => ['nullable', 'string', 'max:5000'],
            'image' => $this->imageRules(),
            'latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180'],
            'is_featured' => ['boolean'],
            'status' => ['required', 'in:active,inactive'],
        ];
    }
}
