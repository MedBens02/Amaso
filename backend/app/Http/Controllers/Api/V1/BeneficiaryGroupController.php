<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\BeneficiaryGroup;
use App\Models\Beneficiary;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class BeneficiaryGroupController extends Controller
{
    /**
     * Display a listing of beneficiary groups
     */
    public function index(Request $request): JsonResponse
    {
        $query = BeneficiaryGroup::query();

        // Search functionality
        if ($request->has('search') && $request->search) {
            $searchTerm = $request->search;
            $query->where(function ($q) use ($searchTerm) {
                $q->where('label', 'like', "%{$searchTerm}%")
                  ->orWhere('description', 'like', "%{$searchTerm}%");
            });
        }

        $perPage = $request->get('per_page', 15);
        $groups = $query->latest()->paginate($perPage);

        return response()->json([
            'data' => $groups->items(),
            'meta' => [
                'current_page' => $groups->currentPage(),
                'last_page' => $groups->lastPage(),
                'per_page' => $groups->perPage(),
                'total' => $groups->total(),
            ]
        ]);
    }

    /**
     * Store a new beneficiary group
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:120|unique:beneficiary_groups,label',
            'description' => 'nullable|string',
            'beneficiary_ids' => 'required|array|min:1',
            'beneficiary_ids.*' => 'exists:beneficiaries,id',
        ]);

        try {
            DB::beginTransaction();

            // Create the group
            $group = BeneficiaryGroup::create([
                'label' => $request->name,
                'description' => $request->description,
            ]);

            // Add beneficiaries to the group
            $group->syncBeneficiaries($request->beneficiary_ids);

            DB::commit();

            // Load the group with beneficiaries
            $group->load(['beneficiaries.widow', 'beneficiaries.orphan']);

            return response()->json([
                'data' => $group,
                'message' => 'تم إنشاء المجموعة بنجاح'
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'خطأ في إنشاء المجموعة',
                'errors' => ['general' => [$e->getMessage()]]
            ], 422);
        }
    }

    /**
     * Display the specified beneficiary group
     */
    public function show(BeneficiaryGroup $beneficiaryGroup): JsonResponse
    {
        $beneficiaryGroup->load(['beneficiaries.widow', 'beneficiaries.orphan']);
        return response()->json(['data' => $beneficiaryGroup]);
    }

    /**
     * Update the specified beneficiary group
     */
    public function update(Request $request, BeneficiaryGroup $beneficiaryGroup): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:120|unique:beneficiary_groups,label,' . $beneficiaryGroup->id,
            'description' => 'nullable|string',
            'beneficiary_ids' => 'sometimes|array',
            'beneficiary_ids.*' => 'exists:beneficiaries,id',
        ]);

        try {
            DB::beginTransaction();

            $beneficiaryGroup->update([
                'label' => $request->name,
                'description' => $request->description
            ]);

            // Update beneficiaries if provided
            if ($request->has('beneficiary_ids')) {
                $beneficiaryGroup->syncBeneficiaries($request->beneficiary_ids);
            }

            DB::commit();

            $beneficiaryGroup->load(['beneficiaries.widow', 'beneficiaries.orphan']);

            return response()->json([
                'data' => $beneficiaryGroup,
                'message' => 'تم تحديث المجموعة بنجاح'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'خطأ في تحديث المجموعة',
                'errors' => ['general' => [$e->getMessage()]]
            ], 422);
        }
    }

    /**
     * Remove the specified beneficiary group
     */
    public function destroy(BeneficiaryGroup $beneficiaryGroup): JsonResponse
    {
        try {
            DB::beginTransaction();

            // Remove all members first
            $beneficiaryGroup->beneficiaries()->detach();
            
            // Delete the group
            $beneficiaryGroup->delete();

            DB::commit();

            return response()->json(['message' => 'تم حذف المجموعة بنجاح']);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'خطأ في حذف المجموعة',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get members of a specific group
     */
    public function getMembers(BeneficiaryGroup $beneficiaryGroup): JsonResponse
    {
        $members = $beneficiaryGroup->beneficiaries()
            ->with(['widow', 'orphan'])
            ->get();

        return response()->json(['data' => $members]);
    }

    /**
     * Add members to a group
     */
    public function addMembers(Request $request, BeneficiaryGroup $beneficiaryGroup): JsonResponse
    {
        $request->validate([
            'beneficiary_ids' => 'required|array|min:1',
            'beneficiary_ids.*' => 'exists:beneficiaries,id',
        ]);

        try {
            $beneficiaryGroup->addBeneficiaries($request->beneficiary_ids);

            return response()->json([
                'message' => 'تم إضافة الأعضاء بنجاح',
                'members_count' => $beneficiaryGroup->members_count
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'خطأ في إضافة الأعضاء',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove a specific member from a group
     */
    public function removeMember(BeneficiaryGroup $beneficiaryGroup, Beneficiary $beneficiary): JsonResponse
    {
        try {
            $beneficiaryGroup->removeBeneficiaries([$beneficiary->id]);

            return response()->json([
                'message' => 'تم حذف العضو بنجاح',
                'members_count' => $beneficiaryGroup->members_count
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'خطأ في حذف العضو',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get all beneficiaries for selection
     */
    public function getBeneficiaries(Request $request): JsonResponse
    {
        $query = Beneficiary::with(['widow', 'orphan']);

        // Filter by type if provided
        if ($request->has('type') && in_array($request->type, ['Widow', 'Orphan'])) {
            $query->where('type', $request->type);
        }

        // Search functionality
        if ($request->has('search') && $request->search) {
            $searchTerm = $request->search;
            $query->where(function ($q) use ($searchTerm) {
                $q->whereHas('widow', function ($widowQuery) use ($searchTerm) {
                    $widowQuery->where('first_name', 'like', "%{$searchTerm}%")
                               ->orWhere('last_name', 'like', "%{$searchTerm}%");
                })->orWhereHas('orphan', function ($orphanQuery) use ($searchTerm) {
                    $orphanQuery->where('first_name', 'like', "%{$searchTerm}%")
                                ->orWhere('last_name', 'like', "%{$searchTerm}%");
                });
            });
        }

        $perPage = $request->get('per_page', 100); // Higher limit for selection
        $beneficiaries = $query->paginate($perPage);

        return response()->json([
            'data' => $beneficiaries->items(),
            'meta' => [
                'current_page' => $beneficiaries->currentPage(),
                'last_page' => $beneficiaries->lastPage(),
                'per_page' => $beneficiaries->perPage(),
                'total' => $beneficiaries->total(),
            ]
        ]);
    }
}