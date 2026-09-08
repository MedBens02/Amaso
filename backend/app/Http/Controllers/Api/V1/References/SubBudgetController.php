<?php

namespace App\Http\Controllers\Api\V1\References;

use App\Models\KafalaChamilaSplit;
use App\Models\SubBudget;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class SubBudgetController extends BaseReferenceController
{
    protected string $model = SubBudget::class;
    protected string $entityName = 'الميزانية الفرعية';

    public function index(): JsonResponse
    {
        $subBudgets = SubBudget::with(['incomeCategories', 'expenseCategories'])
            ->orderBy('label')
            ->get();

        return response()->json(['data' => $subBudgets]);
    }

    protected function validateData(Request $request, ?Model $current = null): array
    {
        return $request->validate([
            'label' => ['required', 'string', 'max:255', Rule::unique('sub_budgets', 'label')->ignore($current?->id)],
        ]);
    }

    protected function beforeDestroy(Model $item): ?JsonResponse
    {
        if ($locked = $this->rejectIfLocked($item)) {
            return $locked;
        }

        $incomeCount = $item->incomeCategories()->count();
        $expenseCount = $item->expenseCategories()->count();

        if ($incomeCount > 0 || $expenseCount > 0) {
            return response()->json([
                'message' => "لا يمكن حذف هذه الميزانية الفرعية لأنها تحتوي على {$incomeCount} فئة إيراد و {$expenseCount} فئة مصروف",
            ], 400);
        }

        return null;
    }

    protected function beforeUpdate(Model $item): ?JsonResponse
    {
        return $this->rejectIfLocked($item);
    }

    /**
     * The 7 sub-budgets a kafala chamila payment splits across are a fixed
     * system structure - see KafalaChamilaSplit. Only their percentage is
     * editable, and only through the dedicated admin-only endpoint.
     */
    private function rejectIfLocked(Model $item): ?JsonResponse
    {
        if (in_array($item->id, KafalaChamilaSplit::lockedSubBudgetIds(), true)) {
            return response()->json([
                'message' => 'لا يمكن تعديل أو حذف هذه الميزانية الفرعية لأنها جزء من نظام توزيع الكفالة الشاملة الثابت',
            ], 403);
        }

        return null;
    }
}
