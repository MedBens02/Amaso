<?php

namespace App\Http\Controllers\Api\V1\References;

use App\Models\HousingType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class HousingTypeController extends BaseReferenceController
{
    protected string $model = HousingType::class;
    protected string $entityName = 'نوع السكن';

    protected function validateData(Request $request, ?Model $current = null): array
    {
        return $request->validate([
            'label' => ['required', 'string', 'max:255', Rule::unique('housing_types', 'label')->ignore($current?->id)],
        ]);
    }

    /**
     * Unlike a skill or an illness, a housing type is not something a family
     * has alongside others - it is the single answer to "where do they
     * live", and the column is not nullable. So there is nothing to delete
     * alongside it and no sensible value to leave behind: the families using
     * it have to be moved to another type first, which is a decision about
     * those families, not about this list. The database would refuse the
     * delete anyway; this says why, and how many.
     */
    protected function beforeDestroy(Model $item): ?JsonResponse
    {
        $inUse = $item->widowSocials()->count();

        if ($inUse > 0) {
            return response()->json([
                'message' => "لا يمكن حذف \"{$item->label}\": {$inUse} أسرة مسجلة بهذا النوع من السكن. غيّر نوع سكنها أولاً.",
            ], 422);
        }

        return null;
    }
}
