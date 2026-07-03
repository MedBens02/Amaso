<?php

namespace App\Http\Controllers\Api\V1\References;

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
        $incomeCount = $item->incomeCategories()->count();
        $expenseCount = $item->expenseCategories()->count();

        if ($incomeCount > 0 || $expenseCount > 0) {
            return response()->json([
                'message' => "لا يمكن حذف هذه الميزانية الفرعية لأنها تحتوي على {$incomeCount} فئة إيراد و {$expenseCount} فئة مصروف",
            ], 400);
        }

        return null;
    }
}
