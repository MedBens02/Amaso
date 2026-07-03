<?php

namespace App\Http\Controllers\Api\V1\References;

use App\Http\Controllers\Controller;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Shared CRUD for simple lookup tables (a single label plus optional extras).
 * Subclasses declare the model, the Arabic entity name used in messages,
 * the validation rules, and an optional beforeDestroy hook for cleaning up
 * or guarding against dependent records.
 */
abstract class BaseReferenceController extends Controller
{
    /** @var class-string<Model> */
    protected string $model;

    /** Arabic singular used in success messages, e.g. "المهارة". */
    protected string $entityName;

    protected string $labelColumn = 'label';
    protected string $orderBy = 'label';

    public function index(): JsonResponse
    {
        return response()->json(['data' => $this->model::orderBy($this->orderBy)->get()]);
    }

    public function store(Request $request): JsonResponse
    {
        $item = $this->model::create($this->validateData($request));

        return response()->json([
            'message' => "تم إنشاء {$this->entityName} بنجاح",
            'data' => $item,
        ], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $item = $this->model::findOrFail($id);
        $item->update($this->validateData($request, $item));

        return response()->json([
            'message' => "تم تحديث {$this->entityName} بنجاح",
            'data' => $item,
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $item = $this->model::findOrFail($id);

        return DB::transaction(function () use ($item) {
            if ($abort = $this->beforeDestroy($item)) {
                return $abort;
            }

            $label = $item->{$this->labelColumn};
            $item->delete();

            return response()->json([
                'message' => "تم حذف {$this->entityName} \"{$label}\" بنجاح",
            ]);
        });
    }

    /** Validate the request and return the attributes to persist. */
    abstract protected function validateData(Request $request, ?Model $current = null): array;

    /** Clean up dependents, or return a response to abort the delete. */
    protected function beforeDestroy(Model $item): ?JsonResponse
    {
        return null;
    }
}
