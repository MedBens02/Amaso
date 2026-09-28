<?php

namespace App\Http\Controllers\Api\V1\References;

use App\Http\Controllers\Controller;
use App\Models\EducationLevelGradeComponent;
use App\Models\OrphansEducationLevel;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class EducationLevelController extends Controller
{
    /**
     * Every level, active or not.
     *
     * This is the management list, and it used to hide the inactive ones -
     * which meant switching a level off removed it from the only screen
     * that can switch it back on. The dropdowns that offer a level to pick
     * read `orphans-education-levels`, which does filter on active; this
     * one shows what there is to manage.
     */
    public function index(): JsonResponse
    {
        $levels = OrphansEducationLevel::with('gradeComponents')
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get();

        return response()->json(['data' => $levels]);
    }

    /**
     * Replace a level's marking scheme in one go.
     *
     * The whole set at once rather than a row at a time, because the thing
     * being saved is not a component - it is the scheme, and a scheme is only
     * valid as a whole. Saving one row at a time would mean passing through
     * states where the weights do not add up to 100, and the screen would
     * have to decide whether to warn about a total that is halfway through
     * being edited.
     */
    public function saveComponents(Request $request, OrphansEducationLevel $level): JsonResponse
    {
        $validated = $request->validate([
            'components' => ['required', 'array', 'min:1', 'max:20'],
            'components.*.label' => ['required', 'string', 'max:120'],
            'components.*.weight' => ['required', 'numeric', 'min:0', 'max:100'],
        ], [
            'components.required' => 'نظام الاحتساب يحتاج مكوّناً واحداً على الأقل',
            'components.min' => 'نظام الاحتساب يحتاج مكوّناً واحداً على الأقل',
            'components.*.label.required' => 'اسم المكوّن مطلوب',
            'components.*.weight.required' => 'معامل المكوّن مطلوب',
            'components.*.weight.max' => 'المعامل لا يتجاوز 100%',
        ]);

        $labels = array_map(fn ($component) => trim($component['label']), $validated['components']);

        if (count($labels) !== count(array_unique($labels))) {
            throw ValidationException::withMessages([
                'components' => ['لا يمكن تكرار اسم المكوّن في المستوى نفسه'],
            ]);
        }

        // To the centime of a percent, because 100/3 is 33.33 three times and
        // a scheme that adds to 99.99 is a scheme somebody mistyped.
        $total = round(array_sum(array_column($validated['components'], 'weight')), 2);

        if (abs($total - 100) > 0.001) {
            throw ValidationException::withMessages([
                'components' => ["مجموع المعاملات يجب أن يساوي 100% (المجموع الحالي {$total}%)"],
            ]);
        }

        DB::transaction(function () use ($level, $validated) {
            $level->gradeComponents()->delete();

            foreach ($validated['components'] as $index => $component) {
                $level->gradeComponents()->create([
                    'label' => trim($component['label']),
                    'weight' => $component['weight'],
                    'sort_order' => $index,
                ]);
            }
        });

        return response()->json([
            'message' => "تم حفظ نظام احتساب \"{$level->name_ar}\"",
            'data' => $level->fresh('gradeComponents')->gradeComponents,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $level = OrphansEducationLevel::create($this->validateLevel($request));

        // A level with no scheme has no way to work out a year's mark, so a
        // new one starts on the ordinary two semesters and is re-weighted
        // from the same screen if it needs to be.
        EducationLevelGradeComponent::ensureDefaultFor([$level->id]);

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
