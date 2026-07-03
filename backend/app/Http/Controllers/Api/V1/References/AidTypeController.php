<?php

namespace App\Http\Controllers\Api\V1\References;

use App\Models\AidType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class AidTypeController extends BaseReferenceController
{
    protected string $model = AidType::class;
    protected string $entityName = 'نوع المساعدة';

    protected function validateData(Request $request, ?Model $current = null): array
    {
        return $request->validate([
            'label' => ['required', 'string', 'max:255', Rule::unique('aid_types', 'label')->ignore($current?->id)],
        ]);
    }

    protected function beforeDestroy(Model $item): ?JsonResponse
    {
        DB::table('widow_aid')->where('aid_type_id', $item->id)->delete();

        return null;
    }
}
