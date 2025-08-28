<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Skill;
use App\Models\Illness;
use App\Models\AidType;
use App\Models\WidowIncomeCategory;
use App\Models\WidowExpenseCategory;
use App\Models\Partner;
use App\Models\OrphansEducationLevel;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ReferencesController extends Controller
{
    // Skills CRUD
    public function getSkills(): JsonResponse
    {
        $skills = Skill::orderBy('label')->get();
        return response()->json(['data' => $skills]);
    }

    public function storeSkill(Request $request): JsonResponse
    {
        $request->validate([
            'label' => 'required|string|max:255|unique:skills,label',
        ]);

        $skill = Skill::create([
            'label' => $request->label,
        ]);

        return response()->json([
            'message' => 'تم إنشاء المهارة بنجاح',
            'data' => $skill
        ], 201);
    }

    public function updateSkill(Request $request, Skill $skill): JsonResponse
    {
        $request->validate([
            'label' => 'required|string|max:255|unique:skills,label,' . $skill->id,
        ]);

        $skill->update([
            'label' => $request->label,
        ]);

        return response()->json([
            'message' => 'تم تحديث المهارة بنجاح',
            'data' => $skill
        ]);
    }

    public function destroySkill(Skill $skill): JsonResponse
    {
        try {
            return DB::transaction(function () use ($skill) {
                // Delete relationships first - use direct DB query since pivot uses widow_file_id
                DB::table('widow_skill')->where('skill_id', $skill->id)->delete();
                
                $skillName = $skill->label;
                $skill->delete();

                return response()->json([
                    'message' => "تم حذف المهارة \"{$skillName}\" بنجاح"
                ]);
            });
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'حدث خطأ أثناء حذف المهارة',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // Illnesses CRUD
    public function getIllnesses(): JsonResponse
    {
        $illnesses = Illness::orderBy('label')->get();
        return response()->json(['data' => $illnesses]);
    }

    public function storeIllness(Request $request): JsonResponse
    {
        $request->validate([
            'label' => 'required|string|max:255|unique:illnesses,label',
            'is_chronic' => 'boolean',
        ]);

        $illness = Illness::create([
            'label' => $request->label,
            'is_chronic' => $request->boolean('is_chronic', false),
        ]);

        return response()->json([
            'message' => 'تم إنشاء المرض بنجاح',
            'data' => $illness
        ], 201);
    }

    public function updateIllness(Request $request, Illness $illness): JsonResponse
    {
        $request->validate([
            'label' => 'required|string|max:255|unique:illnesses,label,' . $illness->id,
            'is_chronic' => 'boolean',
        ]);

        $illness->update([
            'label' => $request->label,
            'is_chronic' => $request->boolean('is_chronic', false),
        ]);

        return response()->json([
            'message' => 'تم تحديث المرض بنجاح',
            'data' => $illness
        ]);
    }

    public function destroyIllness(Illness $illness): JsonResponse
    {
        try {
            return DB::transaction(function () use ($illness) {
                // Delete relationships first - use direct DB query since pivot uses widow_file_id
                DB::table('widow_illness')->where('illness_id', $illness->id)->delete();
                
                $illnessName = $illness->label;
                $illness->delete();

                return response()->json([
                    'message' => "تم حذف المرض \"{$illnessName}\" بنجاح"
                ]);
            });
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'حدث خطأ أثناء حذف المرض',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // Aid Types CRUD
    public function getAidTypes(): JsonResponse
    {
        $aidTypes = AidType::orderBy('label')->get();
        return response()->json(['data' => $aidTypes]);
    }

    public function storeAidType(Request $request): JsonResponse
    {
        $request->validate([
            'label' => 'required|string|max:255|unique:aid_types,label',
        ]);

        $aidType = AidType::create([
            'label' => $request->label,
        ]);

        return response()->json([
            'message' => 'تم إنشاء نوع المساعدة بنجاح',
            'data' => $aidType
        ], 201);
    }

    public function updateAidType(Request $request, AidType $aidType): JsonResponse
    {
        $request->validate([
            'label' => 'required|string|max:255|unique:aid_types,label,' . $aidType->id,
        ]);

        $aidType->update([
            'label' => $request->label,
        ]);

        return response()->json([
            'message' => 'تم تحديث نوع المساعدة بنجاح',
            'data' => $aidType
        ]);
    }

    public function destroyAidType(AidType $aidType): JsonResponse
    {
        try {
            return DB::transaction(function () use ($aidType) {
                // Delete relationships first - use direct DB query since pivot uses widow_file_id
                DB::table('widow_aid')->where('aid_type_id', $aidType->id)->delete();
                
                $aidTypeName = $aidType->label;
                $aidType->delete();

                return response()->json([
                    'message' => "تم حذف نوع المساعدة \"{$aidTypeName}\" بنجاح"
                ]);
            });
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'حدث خطأ أثناء حذف نوع المساعدة',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // Income Categories CRUD
    public function getIncomeCategories(): JsonResponse
    {
        $categories = WidowIncomeCategory::orderBy('name')->get();
        return response()->json(['data' => $categories]);
    }

    public function storeIncomeCategory(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:255|unique:widow_income_categories,name',
        ]);

        $category = WidowIncomeCategory::create([
            'name' => $request->name,
        ]);

        return response()->json([
            'message' => 'تم إنشاء فئة الدخل بنجاح',
            'data' => $category
        ], 201);
    }

    public function updateIncomeCategory(Request $request, WidowIncomeCategory $category): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:255|unique:widow_income_categories,name,' . $category->id,
        ]);

        $category->update([
            'name' => $request->name,
        ]);

        return response()->json([
            'message' => 'تم تحديث فئة الدخل بنجاح',
            'data' => $category
        ]);
    }

    public function destroyIncomeCategory(WidowIncomeCategory $category): JsonResponse
    {
        try {
            return DB::transaction(function () use ($category) {
                // Delete related social income records
                $category->socialIncomes()->delete();
                
                $categoryName = $category->name;
                $category->delete();

                return response()->json([
                    'message' => "تم حذف فئة الدخل \"{$categoryName}\" بنجاح"
                ]);
            });
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'حدث خطأ أثناء حذف فئة الدخل',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // Expense Categories CRUD
    public function getExpenseCategories(): JsonResponse
    {
        $categories = WidowExpenseCategory::orderBy('name')->get();
        return response()->json(['data' => $categories]);
    }

    public function storeExpenseCategory(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:255|unique:widow_expense_categories,name',
        ]);

        $category = WidowExpenseCategory::create([
            'name' => $request->name,
        ]);

        return response()->json([
            'message' => 'تم إنشاء فئة المصروف بنجاح',
            'data' => $category
        ], 201);
    }

    public function updateExpenseCategory(Request $request, WidowExpenseCategory $category): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:255|unique:widow_expense_categories,name,' . $category->id,
        ]);

        $category->update([
            'name' => $request->name,
        ]);

        return response()->json([
            'message' => 'تم تحديث فئة المصروف بنجاح',
            'data' => $category
        ]);
    }

    public function destroyExpenseCategory(WidowExpenseCategory $category): JsonResponse
    {
        try {
            return DB::transaction(function () use ($category) {
                // Delete related social expense records
                $category->socialExpenses()->delete();
                
                $categoryName = $category->name;
                $category->delete();

                return response()->json([
                    'message' => "تم حذف فئة المصروف \"{$categoryName}\" بنجاح"
                ]);
            });
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'حدث خطأ أثناء حذف فئة المصروف',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // Partners CRUD
    public function getPartners(): JsonResponse
    {
        $partners = Partner::with(['field', 'subfield'])->orderBy('name')->get();
        return response()->json(['data' => $partners]);
    }

    public function storePartner(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:255|unique:partners,name',
        ]);

        $partner = Partner::create([
            'name' => $request->name,
        ]);

        return response()->json([
            'message' => 'تم إنشاء الشريك بنجاح',
            'data' => $partner
        ], 201);
    }

    public function updatePartner(Request $request, Partner $partner): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:255|unique:partners,name,' . $partner->id,
        ]);

        $partner->update([
            'name' => $request->name,
        ]);

        return response()->json([
            'message' => 'تم تحديث الشريك بنجاح',
            'data' => $partner
        ]);
    }

    public function destroyPartner(Partner $partner): JsonResponse
    {
        try {
            return DB::transaction(function () use ($partner) {
                // Delete related maouna records
                $partner->widowMaouna()->delete();
                
                $partnerName = $partner->name;
                $partner->delete();

                return response()->json([
                    'message' => "تم حذف الشريك \"{$partnerName}\" بنجاح"
                ]);
            });
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'حدث خطأ أثناء حذف الشريك',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // Education Levels CRUD
    public function getEducationLevels(): JsonResponse
    {
        $levels = OrphansEducationLevel::where('is_active', true)
            ->orderBy('sort_order')
            ->get();
        return response()->json(['data' => $levels]);
    }

    public function storeEducationLevel(Request $request): JsonResponse
    {
        $request->validate([
            'name_ar' => 'required|string|max:255|unique:orphans_education_level,name_ar',
            'name_en' => 'nullable|string|max:255',
            'sort_order' => 'integer|min:0',
            'is_active' => 'boolean',
        ]);

        $level = OrphansEducationLevel::create([
            'name_ar' => $request->name_ar,
            'name_en' => $request->name_en,
            'sort_order' => $request->input('sort_order', 0),
            'is_active' => $request->boolean('is_active', true),
        ]);

        return response()->json([
            'message' => 'تم إنشاء المرحلة التعليمية بنجاح',
            'data' => $level
        ], 201);
    }

    public function updateEducationLevel(Request $request, OrphansEducationLevel $level): JsonResponse
    {
        $request->validate([
            'name_ar' => 'required|string|max:255|unique:orphans_education_level,name_ar,' . $level->id,
            'name_en' => 'nullable|string|max:255',
            'sort_order' => 'integer|min:0',
            'is_active' => 'boolean',
        ]);

        $level->update([
            'name_ar' => $request->name_ar,
            'name_en' => $request->name_en,
            'sort_order' => $request->input('sort_order', 0),
            'is_active' => $request->boolean('is_active', true),
        ]);

        return response()->json([
            'message' => 'تم تحديث المرحلة التعليمية بنجاح',
            'data' => $level
        ]);
    }

    public function destroyEducationLevel(OrphansEducationLevel $level): JsonResponse
    {
        try {
            return DB::transaction(function () use ($level) {
                // Update orphans to remove this education level
                $level->orphans()->update(['education_level_id' => null]);
                
                $levelName = $level->name_ar;
                $level->delete();

                return response()->json([
                    'message' => "تم حذف المرحلة التعليمية \"{$levelName}\" بنجاح"
                ]);
            });
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'حدث خطأ أثناء حذف المرحلة التعليمية',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function reorderEducationLevels(Request $request): JsonResponse
    {
        $request->validate([
            'items' => 'required|array',
            'items.*.id' => 'required|integer|exists:orphans_education_level,id',
            'items.*.sort_order' => 'required|integer|min:1',
        ]);

        try {
            return DB::transaction(function () use ($request) {
                foreach ($request->items as $item) {
                    OrphansEducationLevel::where('id', $item['id'])
                        ->update(['sort_order' => $item['sort_order']]);
                }

                return response()->json([
                    'message' => 'تم تحديث ترتيب المراحل التعليمية بنجاح'
                ]);
            });
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'حدث خطأ أثناء تحديث الترتيب',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}