<?php

namespace App\Http\Controllers\Api\V1\References;

use App\Http\Controllers\Controller;
use App\Models\PartnerSubfield;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PartnerSubfieldController extends Controller
{
    public function index(): JsonResponse
    {
        $subfields = PartnerSubfield::with(['field', 'partners'])->orderBy('label')->get();

        return response()->json(['data' => $subfields]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'field_id' => ['required', 'integer', 'exists:partner_fields,id'],
            'label' => ['required', 'string', 'max:255'],
        ]);

        if ($abort = $this->rejectDuplicateLabel($validated['field_id'], $validated['label'])) {
            return $abort;
        }

        $subfield = PartnerSubfield::create($validated);
        $subfield->load('field');

        return response()->json([
            'message' => 'تم إنشاء تخصص الشريك بنجاح',
            'data' => $subfield,
        ], 201);
    }

    public function update(Request $request, PartnerSubfield $subfield): JsonResponse
    {
        $validated = $request->validate([
            'field_id' => ['required', 'integer', 'exists:partner_fields,id'],
            'label' => ['required', 'string', 'max:255'],
        ]);

        if ($abort = $this->rejectDuplicateLabel($validated['field_id'], $validated['label'], $subfield->id)) {
            return $abort;
        }

        $subfield->update($validated);
        $subfield->load('field');

        return response()->json([
            'message' => 'تم تحديث تخصص الشريك بنجاح',
            'data' => $subfield,
        ]);
    }

    public function destroy(PartnerSubfield $subfield): JsonResponse
    {
        return DB::transaction(function () use ($subfield) {
            $partnerCount = $subfield->partners()->count();

            if ($partnerCount > 0) {
                return response()->json([
                    'message' => "لا يمكن حذف هذا التخصص لأنه يحتوي على {$partnerCount} شريك",
                ], 400);
            }

            $label = $subfield->label;
            $subfield->delete();

            return response()->json([
                'message' => "تم حذف تخصص الشريك \"{$label}\" بنجاح",
            ]);
        });
    }

    private function rejectDuplicateLabel(int $fieldId, string $label, ?int $ignoreId = null): ?JsonResponse
    {
        $exists = PartnerSubfield::where('field_id', $fieldId)
            ->where('label', $label)
            ->when($ignoreId, fn ($q) => $q->where('id', '!=', $ignoreId))
            ->exists();

        if ($exists) {
            return response()->json([
                'message' => 'يوجد بالفعل تخصص بهذا الاسم في نفس المجال',
            ], 422);
        }

        return null;
    }
}
