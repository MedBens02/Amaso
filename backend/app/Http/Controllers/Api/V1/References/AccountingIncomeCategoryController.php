<?php

namespace App\Http\Controllers\Api\V1\References;

use App\Http\Controllers\Controller;
use App\Models\IncomeCategory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AccountingIncomeCategoryController extends Controller
{
    public function index(): JsonResponse
    {
        $categories = IncomeCategory::with('subBudget')
            ->where('id', '!=', IncomeCategory::DELETED_CATEGORY_ID)
            ->orderBy('label')
            ->get();

        return response()->json(['data' => $categories]);
    }

    public function store(Request $request): JsonResponse
    {
        $category = IncomeCategory::create($this->validateCategory($request));
        $category->load('subBudget');

        return response()->json([
            'message' => 'تم إنشاء فئة الإيراد بنجاح',
            'data' => $category,
        ], 201);
    }

    public function update(Request $request, IncomeCategory $category): JsonResponse
    {
        $category->update($this->validateCategory($request));
        $category->load('subBudget');

        return response()->json([
            'message' => 'تم تحديث فئة الإيراد بنجاح',
            'data' => $category,
        ]);
    }

    public function destroy(IncomeCategory $category): JsonResponse
    {
        return DB::transaction(function () use ($category) {
            $label = $category->label;
            $incomeCount = $category->incomes()->count();

            // The model's deleting hook reassigns related incomes to the default category.
            $category->delete();

            $message = $incomeCount > 0
                ? "تم حذف فئة الإيراد \"{$label}\" بنجاح. تم تحويل {$incomeCount} إيراد إلى الفئة الافتراضية."
                : "تم حذف فئة الإيراد \"{$label}\" بنجاح";

            return response()->json(['message' => $message]);
        });
    }

    public function relatedCount(IncomeCategory $category): JsonResponse
    {
        return response()->json([
            'data' => [
                'category_id' => $category->id,
                'category_label' => $category->label,
                'related_incomes_count' => $category->incomes()->count(),
            ],
        ]);
    }

    private function validateCategory(Request $request): array
    {
        return $request->validate([
            'label' => ['required', 'string', 'max:255'],
            'sub_budget_id' => ['required', 'integer', 'exists:sub_budgets,id'],
        ]);
    }
}
