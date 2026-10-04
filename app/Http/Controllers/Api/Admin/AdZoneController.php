<?php

namespace App\Http\Controllers\Api\Admin;

use App\Models\AdZone;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/** Placements on the customer site that ads can be assigned to. */
class AdZoneController extends CrudController
{
    protected string $model = AdZone::class;

    protected array $searchable = ['name', 'key', 'description'];

    protected array $filterable = ['page', 'placement', 'is_active'];

    protected array $sortable = ['id', 'name', 'key', 'page'];

    protected array $withCount = ['ads'];

    protected function rules(Request $request, ?Model $item = null): array
    {
        return [
            'key' => ['required', 'string', 'max:60', 'regex:/^[a-z0-9_]+$/', Rule::unique('ad_zones', 'key')->ignore($item?->id)],
            'name' => ['required', 'string', 'max:100'],
            'description' => ['nullable', 'string', 'max:255'],
            'page' => ['required', Rule::in(AdZone::PAGES)],
            'placement' => ['required', Rule::in(AdZone::PLACEMENTS)],
            'width' => ['nullable', 'integer', 'between:50,4000'],
            'height' => ['nullable', 'integer', 'between:50,4000'],
            'max_ads' => ['required', 'integer', 'between:1,10'],
            'rotation_seconds' => ['required', 'integer', 'between:3,120'],
            'is_active' => ['boolean'],
        ];
    }
}
