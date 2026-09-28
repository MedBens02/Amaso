<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Budget;
use App\Models\ExpenseCategory;
use App\Models\IncomeCategory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Which categories a fund is offered.
 *
 * Choosing a budget on the income or expense form narrows the category list
 * to the ones that fund is actually used for, which is the hierarchy the
 * association works in: a fund, and the things it pays for.
 *
 * A link rather than ownership. The same category sits under as many funds
 * as it is genuinely used from and is still one category, so a report
 * totalling "سلة غذائية" sees one row instead of one per fund - which is the
 * duplication that made the original budget_id worth removing.
 */
class BudgetCategoryController extends Controller
{
    /** What is attached to this fund, and what else could be. */
    public function show(Budget $budget): JsonResponse
    {
        return response()->json([
            'data' => [
                'budget' => $budget,
                'income_category_ids' => $budget->incomeCategories()->pluck('income_categories.id'),
                'expense_category_ids' => $budget->expenseCategories()->pluck('expense_categories.id'),
            ],
        ]);
    }

    /**
     * Replace a fund's lists.
     *
     * Both sides in one call and both replaced wholesale, because what is
     * being saved is the fund's list rather than one category's membership -
     * and a half-applied list is a fund offering the wrong choices.
     */
    public function update(Request $request, Budget $budget): JsonResponse
    {
        $validated = $request->validate([
            'income_category_ids' => ['present', 'array'],
            'income_category_ids.*' => ['integer', 'exists:income_categories,id'],
            'expense_category_ids' => ['present', 'array'],
            'expense_category_ids.*' => ['integer', 'exists:expense_categories,id'],
        ], [
            'income_category_ids.*.exists' => 'إحدى فئات الإيراد غير موجودة',
            'expense_category_ids.*.exists' => 'إحدى فئات المصروف غير موجودة',
        ]);

        DB::transaction(function () use ($budget, $validated) {
            $budget->incomeCategories()->sync($validated['income_category_ids']);
            $budget->expenseCategories()->sync($validated['expense_category_ids']);
        });

        $income = count($validated['income_category_ids']);
        $expense = count($validated['expense_category_ids']);

        return response()->json([
            'message' => $income === 0 && $expense === 0
                // Saying so out loud, because an empty list does the opposite
                // of what emptying a list looks like it should do.
                ? "لم تُحدَّد فئات لـ \"{$budget->label}\"، لذلك ستظهر جميع الفئات عند اختيارها"
                : "تم حفظ فئات \"{$budget->label}\": {$income} إيراد و{$expense} مصروف",
            'data' => [
                'income_category_ids' => $validated['income_category_ids'],
                'expense_category_ids' => $validated['expense_category_ids'],
            ],
        ]);
    }

    /**
     * Every fund's lists at once, for the screen that manages them and for
     * the forms that filter on them.
     *
     * One query per side rather than one per budget: this is read on every
     * income and expense form, and fifteen funds would otherwise be thirty
     * round trips before anybody can pick a category.
     */
    public function index(): JsonResponse
    {
        return response()->json([
            'data' => [
                'income' => $this->grouped('budget_income_category'),
                'expense' => $this->grouped('budget_expense_category'),
            ],
        ]);
    }

    /**
     * @return object budget id => category ids
     *
     * Cast to an object so the shape never changes. An empty PHP array
     * encodes as `[]` and a filled one as `{...}`, which would hand the
     * client a list one day and a map the next - and the client indexes it
     * by budget id.
     */
    private function grouped(string $pivot): object
    {
        return (object) DB::table($pivot)
            ->select('budget_id', 'category_id')
            ->get()
            ->groupBy('budget_id')
            ->map(fn ($rows) => $rows->pluck('category_id')->values()->all())
            ->all();
    }
}
