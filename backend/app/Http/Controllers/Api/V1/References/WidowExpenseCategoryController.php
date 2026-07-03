<?php

namespace App\Http\Controllers\Api\V1\References;

use App\Models\WidowExpenseCategory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class WidowExpenseCategoryController extends BaseReferenceController
{
    protected string $model = WidowExpenseCategory::class;
    protected string $entityName = 'فئة المصروف';
    protected string $labelColumn = 'name';
    protected string $orderBy = 'name';

    protected function validateData(Request $request, ?Model $current = null): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:255', Rule::unique('widow_expense_categories', 'name')->ignore($current?->id)],
        ]);
    }

    protected function beforeDestroy(Model $item): ?JsonResponse
    {
        $item->socialExpenses()->delete();

        return null;
    }
}
