<?php

namespace App\Http\Controllers\Api\V1\References;

use App\Models\Illness;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class IllnessController extends BaseReferenceController
{
    protected string $model = Illness::class;
    protected string $entityName = 'المرض';

    protected function validateData(Request $request, ?Model $current = null): array
    {
        $validated = $request->validate([
            'label' => ['required', 'string', 'max:255', Rule::unique('illnesses', 'label')->ignore($current?->id)],
            'is_chronic' => ['boolean'],
        ]);
        $validated['is_chronic'] = $request->boolean('is_chronic', false);

        return $validated;
    }

    protected function beforeDestroy(Model $item): ?JsonResponse
    {
        DB::table('widow_illness')->where('illness_id', $item->id)->delete();

        return null;
    }
}
