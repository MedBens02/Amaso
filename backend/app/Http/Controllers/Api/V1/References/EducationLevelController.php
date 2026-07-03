<?php

namespace App\Http\Controllers\Api\V1\References;

use App\Http\Controllers\Controller;
use App\Models\OrphansEducationLevel;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class EducationLevelController extends Controller
{
    public function index(): JsonResponse
    {
        $levels = OrphansEducationLevel::where('is_active', true)
            ->orderBy('sort_order')
            ->get();

        return response()->json(['data' => $levels]);
    }

    public function store(Request $request): JsonResponse
    {
        $level = OrphansEducationLevel::create($this->validateLevel($request));

        return response()->json([
            'message' => 'تم إنشاء المرحلة التعليمية بنجاح',
            'data' => $level,
        ], 201);
    }

    public function update(Request $request, OrphansEducationLevel $level): JsonResponse
    {
        $level->update($this->validateLevel($request, $level->id));

        return response()->json([
            'message' => 'تم تحديث المرحلة التعليمية بنجاح',
            'data' => $level,
        ]);
    }

    public function destroy(OrphansEducationLevel $level): JsonResponse
    {
        return DB::transaction(function () use ($level) {
            $level->orphans()->update(['education_level_id' => null]);

            $name = $level->name_ar;
            $level->delete();

            return response()->json([
                'message' => "تم حذف المرحلة التعليمية \"{$name}\" بنجاح",
            ]);
        });
    }

    public function reorder(Request $request): JsonResponse
    {
        $request->validate([
            'items' => ['required', 'array'],
            'items.*.id' => ['required', 'integer', 'exists:orphans_education_level,id'],
            'items.*.sort_order' => ['required', 'integer', 'min:1'],
        ]);

        DB::transaction(function () use ($request) {
            foreach ($request->items as $item) {
                OrphansEducationLevel::where('id', $item['id'])
                    ->update(['sort_order' => $item['sort_order']]);
            }
        });

        return response()->json([
            'message' => 'تم تحديث ترتيب المراحل التعليمية بنجاح',
        ]);
    }

    private function validateLevel(Request $request, ?int $ignoreId = null): array
    {
        $validated = $request->validate([
            'name_ar' => ['required', 'string', 'max:255', Rule::unique('orphans_education_level', 'name_ar')->ignore($ignoreId)],
            'name_en' => ['nullable', 'string', 'max:255'],
            'sort_order' => ['integer', 'min:0'],
            'is_active' => ['boolean'],
        ]);

        $validated['sort_order'] = $request->input('sort_order', 0);
        $validated['is_active'] = $request->boolean('is_active', true);

        return $validated;
    }
}
