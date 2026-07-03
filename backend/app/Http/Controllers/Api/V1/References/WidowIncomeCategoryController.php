<?php

namespace App\Http\Controllers\Api\V1\References;

use App\Models\WidowIncomeCategory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class WidowIncomeCategoryController extends BaseReferenceController
{
    protected string $model = WidowIncomeCategory::class;
    protected string $entityName = 'فئة الدخل';
    protected string $labelColumn = 'name';
    protected string $orderBy = 'name';

    protected function validateData(Request $request, ?Model $current = null): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:255', Rule::unique('widow_income_categories', 'name')->ignore($current?->id)],
        ]);
    }

    protected function beforeDestroy(Model $item): ?JsonResponse
    {
        $item->socialIncomes()->delete();

        return null;
    }
}
