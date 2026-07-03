<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Beneficiary;
use App\Models\BeneficiaryGroup;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class BeneficiaryGroupController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = BeneficiaryGroup::query();

        if ($search = $request->search) {
            $query->where(function ($q) use ($search) {
                $q->where('label', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        $groups = $query->latest()->paginate($request->get('per_page', 15));

        return response()->json([
            'data' => $groups->items(),
            'meta' => [
                'current_page' => $groups->currentPage(),
                'last_page' => $groups->lastPage(),
                'per_page' => $groups->perPage(),
                'total' => $groups->total(),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:120|unique:beneficiary_groups,label',
            'description' => 'nullable|string',
            'beneficiary_ids' => 'required|array|min:1',
            'beneficiary_ids.*' => 'exists:beneficiaries,id',
        ]);

        $group = DB::transaction(function () use ($request) {
            $group = BeneficiaryGroup::create([
                'label' => $request->name,
                'description' => $request->description,
            ]);

            $group->syncBeneficiaries($request->beneficiary_ids);

            return $group;
        });

        $group->load(['beneficiaries.widow', 'beneficiaries.orphan']);

        return response()->json([
            'data' => $group,
            'message' => 'تم إنشاء المجموعة بنجاح',
        ], 201);
    }

    public function show(BeneficiaryGroup $beneficiaryGroup): JsonResponse
    {
        $beneficiaryGroup->load(['beneficiaries.widow', 'beneficiaries.orphan']);

        return response()->json(['data' => $beneficiaryGroup]);
    }

    public function update(Request $request, BeneficiaryGroup $beneficiaryGroup): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:120|unique:beneficiary_groups,label,' . $beneficiaryGroup->id,
            'description' => 'nullable|string',
            'beneficiary_ids' => 'sometimes|array',
            'beneficiary_ids.*' => 'exists:beneficiaries,id',
        ]);

        DB::transaction(function () use ($request, $beneficiaryGroup) {
            $beneficiaryGroup->update([
                'label' => $request->name,
                'description' => $request->description,
            ]);

            if ($request->has('beneficiary_ids')) {
                $beneficiaryGroup->syncBeneficiaries($request->beneficiary_ids);
            }
        });

        $beneficiaryGroup->load(['beneficiaries.widow', 'beneficiaries.orphan']);

        return response()->json([
            'data' => $beneficiaryGroup,
            'message' => 'تم تحديث المجموعة بنجاح',
        ]);
    }

    public function destroy(BeneficiaryGroup $beneficiaryGroup): JsonResponse
    {
        DB::transaction(function () use ($beneficiaryGroup) {
            $beneficiaryGroup->beneficiaries()->detach();
            $beneficiaryGroup->delete();
        });

        return response()->json(['message' => 'تم حذف المجموعة بنجاح']);
    }

    public function getMembers(BeneficiaryGroup $beneficiaryGroup): JsonResponse
    {
        $members = $beneficiaryGroup->beneficiaries()
            ->with(['widow', 'orphan'])
            ->get();

        return response()->json(['data' => $members]);
    }

    public function addMembers(Request $request, BeneficiaryGroup $beneficiaryGroup): JsonResponse
    {
        $request->validate([
            'beneficiary_ids' => 'required|array|min:1',
            'beneficiary_ids.*' => 'exists:beneficiaries,id',
        ]);

        $beneficiaryGroup->addBeneficiaries($request->beneficiary_ids);

        return response()->json([
            'message' => 'تم إضافة الأعضاء بنجاح',
            'members_count' => $beneficiaryGroup->members_count,
        ]);
    }

    public function removeMember(BeneficiaryGroup $beneficiaryGroup, Beneficiary $beneficiary): JsonResponse
    {
        $beneficiaryGroup->removeBeneficiaries([$beneficiary->id]);

        return response()->json([
            'message' => 'تم حذف العضو بنجاح',
            'members_count' => $beneficiaryGroup->members_count,
        ]);
    }

    /**
     * List beneficiaries (widows and orphans) for selection UIs.
     */
    public function getBeneficiaries(Request $request): JsonResponse
    {
        $query = Beneficiary::with(['widow', 'orphan']);

        if (in_array($request->type, ['Widow', 'Orphan'])) {
            $query->where('type', $request->type);
        }

        if ($search = $request->search) {
            $query->where(function ($q) use ($search) {
                $q->whereHas('widow', function ($widow) use ($search) {
                    $widow->where('first_name', 'like', "%{$search}%")
                        ->orWhere('last_name', 'like', "%{$search}%");
                })->orWhereHas('orphan', function ($orphan) use ($search) {
                    $orphan->where('first_name', 'like', "%{$search}%")
                        ->orWhere('last_name', 'like', "%{$search}%");
                });
            });
        }

        $beneficiaries = $query->paginate($request->get('per_page', 100));

        return response()->json([
            'data' => $beneficiaries->items(),
            'meta' => [
                'current_page' => $beneficiaries->currentPage(),
                'last_page' => $beneficiaries->lastPage(),
                'per_page' => $beneficiaries->perPage(),
                'total' => $beneficiaries->total(),
            ],
        ]);
    }
}
