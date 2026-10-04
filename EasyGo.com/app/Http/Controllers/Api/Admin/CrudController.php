<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Generic REST controller for admin-managed resources.
 *
 * Subclasses declare the model class and validation rules; this base class
 * provides paginated listing with search / exact filters / safe sorting,
 * plus create, read, update and delete. Hooks (prepare, afterSave) allow
 * resource-specific behaviour without duplicating the plumbing.
 */
abstract class CrudController extends Controller
{
    /** @var class-string<Model> */
    protected string $model;

    /** Columns matched with LIKE by the ?q= search box. */
    protected array $searchable = ['name'];

    /** Query params matched exactly, e.g. ?status=active. */
    protected array $filterable = ['status'];

    /** Columns the client may sort by. */
    protected array $sortable = ['id', 'created_at'];

    /** Relations eager-loaded for index & show. */
    protected array $with = [];

    /** Relation counts added to the index. */
    protected array $withCount = [];

    abstract protected function rules(Request $request, ?Model $item = null): array;

    protected function query(): Builder
    {
        return $this->model::query();
    }

    public function index(Request $request): JsonResponse
    {
        $query = $this->query()->with($this->with)->withCount($this->withCount);

        if ($q = trim((string) $request->query('q', ''))) {
            $query->where(function (Builder $w) use ($q) {
                foreach ($this->searchable as $column) {
                    $w->orWhere($column, 'like', "%{$q}%");
                }
            });
        }

        foreach ($this->filterable as $column) {
            if ($request->filled($column)) {
                $query->where($column, $request->query($column));
            }
        }

        $sort = in_array($request->query('sort'), $this->sortable, true) ? $request->query('sort') : 'id';
        $direction = $request->query('direction') === 'asc' ? 'asc' : 'desc';

        return response()->json(
            $query->orderBy($sort, $direction)->paginate(min(100, max(5, $request->integer('per_page', 15))))->withQueryString()
        );
    }

    public function show(int $id): JsonResponse
    {
        return response()->json($this->query()->with($this->with)->findOrFail($id));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->prepare($request->validate($this->rules($request)), $request, null);
        $item = $this->model::create($data);
        $this->afterSave($item, $request);

        return response()->json(['item' => $item->fresh($this->with), 'message' => 'Created successfully.'], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $item = $this->query()->findOrFail($id);
        $data = $this->prepare($request->validate($this->rules($request, $item)), $request, $item);
        $item->update($data);
        $this->afterSave($item, $request);

        return response()->json(['item' => $item->fresh($this->with), 'message' => 'Saved successfully.']);
    }

    public function destroy(int $id): JsonResponse
    {
        $this->query()->findOrFail($id)->delete();

        return response()->json(['message' => 'Deleted successfully.']);
    }

    /** Transform validated data before persisting (e.g. defaults, file paths). */
    protected function prepare(array $data, Request $request, ?Model $item): array
    {
        return $data;
    }

    /** Side effects after create/update (e.g. sync relations). */
    protected function afterSave(Model $item, Request $request): void {}

    /** Common rules for image fields that accept a URL or an uploaded path. */
    protected function imageRules(): array
    {
        return ['nullable', 'string', 'max:500'];
    }
}
