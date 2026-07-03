<?php

namespace App\Http\Controllers\Api\V1\References;

use App\Http\Controllers\Controller;
use App\Models\ExpenseCategory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AccountingExpenseCategoryController extends Controller
{
    public function index(): JsonResponse
    {
        $categories = ExpenseCategory::with('subBudget')
            ->where('id', '!=', ExpenseCategory::DELETED_CATEGORY_ID)
            ->orderBy('label')
            ->get();

        return response()->json(['data' => $categories]);
    }

    public function store(Request $request): JsonResponse
    {
        $category = ExpenseCategory::create($this->validateCategory($request));
        $category->load('subBudget');

        return response()->json([
            'message' => 'تم إنشاء فئة المصروف بنجاح',
            'data' => $category,
        ], 201);
    }

    public function update(Request $request, ExpenseCategory $category): JsonResponse
    {
        $category->update($this->validateCategory($request));
        $category->load('subBudget');

        return response()->json([
            'message' => 'تم تحديث فئة المصروف بنجاح',
            'data' => $category,
        ]);
    }

    public function destroy(ExpenseCategory $category): JsonResponse
    {
        return DB::transaction(function () use ($category) {
            $label = $category->label;
            $expenseCount = $category->expenses()->count();

            // The model's deleting hook reassigns related expenses to the default category.
            $category->delete();

            $message = $expenseCount > 0
                ? "تم حذف فئة المصروف \"{$label}\" بنجاح. تم تحويل {$expenseCount} مصروف إلى الفئة الافتراضية."
                : "تم حذف فئة المصروف \"{$label}\" بنجاح";

            return response()->json(['message' => $message]);
        });
    }

    public function relatedCount(ExpenseCategory $category): JsonResponse
    {
        return response()->json([
            'data' => [
                'category_id' => $category->id,
                'category_label' => $category->label,
                'related_expenses_count' => $category->expenses()->count(),
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
