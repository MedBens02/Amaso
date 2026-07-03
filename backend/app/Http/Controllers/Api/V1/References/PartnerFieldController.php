<?php

namespace App\Http\Controllers\Api\V1\References;

use App\Models\PartnerField;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class PartnerFieldController extends BaseReferenceController
{
    protected string $model = PartnerField::class;
    protected string $entityName = 'مجال الشريك';

    public function index(): JsonResponse
    {
        $fields = PartnerField::with(['subfields', 'partners'])->orderBy('label')->get();

        return response()->json(['data' => $fields]);
    }

    protected function validateData(Request $request, ?Model $current = null): array
    {
        return $request->validate([
            'label' => ['required', 'string', 'max:255', Rule::unique('partner_fields', 'label')->ignore($current?->id)],
        ]);
    }

    protected function beforeDestroy(Model $item): ?JsonResponse
    {
        $subfieldCount = $item->subfields()->count();
        $partnerCount = $item->partners()->count();

        if ($subfieldCount > 0 || $partnerCount > 0) {
            return response()->json([
                'message' => "لا يمكن حذف هذا المجال لأنه يحتوي على {$subfieldCount} تخصص و {$partnerCount} شريك",
            ], 400);
        }

        return null;
    }
}
