<?php

namespace App\Http\Controllers\Api\V1\References;

use App\Http\Controllers\Controller;
use App\Models\Partner;
use App\Models\PartnerSubfield;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class PartnerController extends Controller
{
    public function index(): JsonResponse
    {
        $partners = Partner::with(['field', 'subfield'])->orderBy('name')->get();

        return response()->json(['data' => $partners]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $this->validatePartner($request);

        if ($abort = $this->rejectMismatchedSubfield($validated)) {
            return $abort;
        }

        $partner = Partner::create($this->partnerAttributes($validated));
        $partner->load(['field', 'subfield']);

        return response()->json([
            'message' => 'تم إنشاء الشريك بنجاح',
            'data' => $partner,
        ], 201);
    }

    public function update(Request $request, Partner $partner): JsonResponse
    {
        $validated = $this->validatePartner($request, $partner->id);

        if ($abort = $this->rejectMismatchedSubfield($validated)) {
            return $abort;
        }

        $partner->update($this->partnerAttributes($validated));
        $partner->load(['field', 'subfield']);

        return response()->json([
            'message' => 'تم تحديث الشريك بنجاح',
            'data' => $partner,
        ]);
    }

    public function destroy(Partner $partner): JsonResponse
    {
        return DB::transaction(function () use ($partner) {
            $partner->widowMaouna()->delete();

            $name = $partner->name;
            $partner->delete();

            return response()->json([
                'message' => "تم حذف الشريك \"{$name}\" بنجاح",
            ]);
        });
    }

    private function validatePartner(Request $request, ?int $ignoreId = null): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:255', Rule::unique('partners', 'name')->ignore($ignoreId)],
            'phone' => ['nullable', 'string', 'max:20'],
            'email' => ['nullable', 'email', 'max:255'],
            'address' => ['nullable', 'string', 'max:500'],
            'field_id' => ['nullable', 'integer', 'exists:partner_fields,id'],
            'subfield_id' => ['nullable', 'integer', 'exists:partner_subfields,id'],
        ]);
    }

    private function rejectMismatchedSubfield(array $validated): ?JsonResponse
    {
        if (!empty($validated['subfield_id']) && !empty($validated['field_id'])) {
            $subfield = PartnerSubfield::find($validated['subfield_id']);
            if (!$subfield || $subfield->field_id != $validated['field_id']) {
                return response()->json([
                    'message' => 'التخصص المحدد لا ينتمي للمجال المختار',
                ], 422);
            }
        }

        return null;
    }

    private function partnerAttributes(array $validated): array
    {
        return [
            'name' => $validated['name'],
            'phone' => $validated['phone'] ?? null,
            'email' => $validated['email'] ?? null,
            'address' => $validated['address'] ?? null,
            'field_id' => $validated['field_id'] ?? null,
            'subfield_id' => $validated['subfield_id'] ?? null,
        ];
    }
}
