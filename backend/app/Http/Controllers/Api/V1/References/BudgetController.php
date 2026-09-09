<?php

namespace App\Http\Controllers\Api\V1\References;

use App\Models\Budget;
use App\Models\KafalaChamilaSplit;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class BudgetController extends BaseReferenceController
{
    protected string $model = Budget::class;
    protected string $entityName = 'الميزانية';

    public function index(): JsonResponse
    {
        return response()->json([
            'data' => Budget::orderByDesc('is_default')->orderBy('label')->get(),
        ]);
    }

    /**
     * Exactly one budget is the fallback the income/expense forms preselect.
     * Kafala chamila budgets are excluded: they are fed by the split rules
     * alone, so defaulting to one would quietly push unrelated money into a
     * kafala pool.
     */
    public function setDefault(Budget $budget): JsonResponse
    {
        if (in_array($budget->id, KafalaChamilaSplit::lockedBudgetIds(), true)) {
            return response()->json([
                'message' => 'لا يمكن تعيين ميزانية كفالة شاملة كميزانية افتراضية',
            ], 422);
        }

        DB::transaction(function () use ($budget) {
            Budget::where('is_default', true)->update(['is_default' => false]);
            $budget->update(['is_default' => true]);
        });

        return response()->json([
            'message' => "تم تعيين \"{$budget->label}\" كميزانية افتراضية",
            'data' => $budget->fresh(),
        ]);
    }

    protected function validateData(Request $request, ?Model $current = null): array
    {
        return $request->validate([
            'label' => ['required', 'string', 'max:255', Rule::unique('budgets', 'label')->ignore($current?->id)],
        ]);
    }

    protected function beforeDestroy(Model $item): ?JsonResponse
    {
        if ($locked = $this->rejectIfLocked($item)) {
            return $locked;
        }

        if ($item->is_default) {
            return response()->json([
                'message' => 'لا يمكن حذف الميزانية الافتراضية. عيّن ميزانية أخرى كافتراضية أولاً.',
            ], 400);
        }

        // Money already booked against a fund cannot be orphaned: the balance
        // and every report built on it would lose its anchor.
        $incomeCount = $item->incomes()->count();
        $expenseCount = $item->expenses()->count();

        if ($incomeCount > 0 || $expenseCount > 0) {
            return response()->json([
                'message' => "لا يمكن حذف هذه الميزانية لأنها مرتبطة بـ {$incomeCount} إيراد و {$expenseCount} مصروف",
            ], 400);
        }

        return null;
    }

    protected function beforeUpdate(Model $item): ?JsonResponse
    {
        return $this->rejectIfLocked($item);
    }

    /**
     * The 7 budgets a kafala chamila payment splits across are a fixed system
     * structure - see KafalaChamilaSplit. Only their percentage is editable,
     * and only through the dedicated admin-only endpoint.
     */
    private function rejectIfLocked(Model $item): ?JsonResponse
    {
        if (in_array($item->id, KafalaChamilaSplit::lockedBudgetIds(), true)) {
            return response()->json([
                'message' => 'لا يمكن تعديل أو حذف هذه الميزانية لأنها جزء من نظام توزيع الكفالة الشاملة الثابت',
            ], 403);
        }

        return null;
    }
}
