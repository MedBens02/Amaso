<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Kafil;
use App\Models\KafilSponsorship;
use App\Models\Donor;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class KafilController extends Controller
{
    /**
     * Display a listing of kafils
     */
    public function index(Request $request): JsonResponse
    {
        $query = Kafil::with(['donor', 'sponsorships.widow']);

        // Search functionality
        if ($request->has('search') && $request->search) {
            $searchTerm = $request->search;
            $query->where(function ($q) use ($searchTerm) {
                $q->where('first_name', 'like', "%{$searchTerm}%")
                  ->orWhere('last_name', 'like', "%{$searchTerm}%")
                  ->orWhere('phone', 'like', "%{$searchTerm}%")
                  ->orWhere('email', 'like', "%{$searchTerm}%");
            });
        }

        $perPage = $request->get('per_page', 15);
        $kafils = $query->paginate($perPage);

        return response()->json([
            'data' => $kafils->items(),
            'meta' => [
                'current_page' => $kafils->currentPage(),
                'last_page' => $kafils->lastPage(),
                'per_page' => $kafils->perPage(),
                'total' => $kafils->total(),
            ]
        ]);
    }

    /**
     * Store a new kafil with multiple sponsorships
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'first_name' => 'required|string|max:120',
            'last_name' => 'required|string|max:120',
            'phone' => 'nullable|string|max:30',
            'email' => 'nullable|email|max:120',
            'address' => 'nullable|string',
            'donor_id' => 'required|exists:donors,id',
            'monthly_pledge' => 'required|numeric|min:0',
        ]);

        try {
            // Create the kafil
            $kafil = Kafil::create([
                'first_name' => $request->first_name,
                'last_name' => $request->last_name,
                'phone' => $request->phone,
                'email' => $request->email,
                'address' => $request->address,
                'donor_id' => $request->donor_id,
                'monthly_pledge' => $request->monthly_pledge,
            ]);

            // Load relationships for response
            $kafil->load(['donor', 'sponsorships.widow']);

            return response()->json([
                'data' => $kafil,
                'message' => 'تم إنشاء الكفيل بنجاح'
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'خطأ في إنشاء الكفيل',
                'errors' => ['general' => [$e->getMessage()]]
            ], 422);
        }
    }

    /**
     * Display the specified kafil
     */
    public function show(Kafil $kafil): JsonResponse
    {
        $kafil->load(['donor', 'sponsorships.widow']);
        return response()->json(['data' => $kafil]);
    }

    /**
     * Update the specified kafil
     */
    public function update(Request $request, Kafil $kafil): JsonResponse
    {
        $request->validate([
            'first_name' => 'required|string|max:120',
            'last_name' => 'required|string|max:120',
            'phone' => 'nullable|string|max:30',
            'email' => 'nullable|email|max:120',
            'address' => 'nullable|string',
            'monthly_pledge' => 'required|numeric|min:0',
        ]);

        $kafil->update($request->only([
            'first_name',
            'last_name', 
            'phone',
            'email',
            'address',
            'monthly_pledge'
        ]));

        $kafil->load(['donor', 'sponsorships.widow']);
        
        return response()->json([
            'data' => $kafil,
            'message' => 'تم تحديث بيانات الكفيل بنجاح'
        ]);
    }

    /**
     * Remove the specified kafil
     */
    public function destroy(Kafil $kafil): JsonResponse
    {
        $kafil->delete();
        return response()->json(['message' => 'تم حذف الكفيل بنجاح']);
    }


    /**
     * Remove kafil status and convert back to regular donor
     */
    public function removeKafilStatus(Kafil $kafil): JsonResponse
    {
        try {
            DB::beginTransaction();

            // Delete all sponsorships first
            KafilSponsorship::where('kafil_id', $kafil->id)->delete();

            // Update the associated donor to remove kafil status
            if ($kafil->donor) {
                $kafil->donor->update([
                    'is_kafil' => false,
                    'monthly_pledge' => null
                ]);
            }

            // Delete the kafil record
            $kafil->delete();

            DB::commit();

            return response()->json([
                'message' => 'تم إلغاء حالة الكفيل وتحويله إلى متبرع عادي بنجاح'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'حدث خطأ أثناء إلغاء حالة الكفيل',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get kafils with their remaining budget for widow assignment
     */
    public function getKafilsForSponsorship(Request $request): JsonResponse
    {
        $query = Kafil::with(['donor', 'sponsorships.widow']);

        // Search functionality
        if ($request->has('search') && $request->search) {
            $searchTerm = $request->search;
            $query->where(function ($q) use ($searchTerm) {
                $q->where('first_name', 'like', "%{$searchTerm}%")
                  ->orWhere('last_name', 'like', "%{$searchTerm}%")
                  ->orWhereHas('donor', function ($donorQuery) use ($searchTerm) {
                      $donorQuery->where('first_name', 'like', "%{$searchTerm}%")
                                 ->orWhere('last_name', 'like', "%{$searchTerm}%");
                  });
            });
        }

        $kafils = $query->get()->map(function ($kafil) {
            $totalSponsored = $kafil->sponsorships->sum('amount');
            $remainingAmount = $kafil->monthly_pledge - $totalSponsored;
            
            return [
                'id' => $kafil->id,
                'name' => trim($kafil->first_name . ' ' . $kafil->last_name),
                'first_name' => $kafil->first_name,
                'last_name' => $kafil->last_name,
                'phone' => $kafil->phone,
                'monthly_pledge' => $kafil->monthly_pledge,
                'total_sponsored' => $totalSponsored,
                'remaining_amount' => $remainingAmount,
                'sponsorships_count' => $kafil->sponsorships->count(),
                'donor' => $kafil->donor ? [
                    'id' => $kafil->donor->id,
                    'name' => trim($kafil->donor->first_name . ' ' . $kafil->donor->last_name)
                ] : null,
                'sponsorships' => $kafil->sponsorships->map(function ($sponsorship) {
                    return [
                        'id' => $sponsorship->id,
                        'amount' => $sponsorship->amount,
                        'notes' => $sponsorship->notes,
                        'widow' => $sponsorship->widow ? [
                            'id' => $sponsorship->widow->id,
                            'first_name' => $sponsorship->widow->first_name,
                            'last_name' => $sponsorship->widow->last_name,
                        ] : null
                    ];
                })
            ];
        });

        return response()->json([
            'data' => $kafils
        ]);
    }

    /**
     * Create a sponsorship between a kafil and widow
     */
    public function createSponsorship(Request $request): JsonResponse
    {
        $request->validate([
            'kafil_id' => 'required|exists:kafils,id',
            'widow_id' => 'required|exists:widows,id',
            'amount' => 'required|numeric|min:0',
        ]);

        try {
            DB::beginTransaction();

            $kafil = Kafil::findOrFail($request->kafil_id);
            
            // Check if sponsorship already exists
            $existingSponsorship = KafilSponsorship::where('kafil_id', $request->kafil_id)
                ->where('widow_id', $request->widow_id)
                ->first();

            if ($existingSponsorship) {
                return response()->json([
                    'message' => 'يوجد كفالة سابقة لهذه الأرملة من نفس الكفيل'
                ], 422);
            }

            // Calculate current total sponsorships
            $totalSponsored = KafilSponsorship::where('kafil_id', $request->kafil_id)
                ->sum('amount');
            
            $newTotal = $totalSponsored + $request->amount;
            $isOverBudget = $newTotal > $kafil->monthly_pledge;

            // Create the sponsorship
            $sponsorship = KafilSponsorship::create([
                'kafil_id' => $request->kafil_id,
                'widow_id' => $request->widow_id,
                'amount' => $request->amount,
            ]);

            DB::commit();

            return response()->json([
                'data' => $sponsorship,
                'warning' => $isOverBudget ? [
                    'message' => 'تحذير: إجمالي مبالغ الكفالات يتجاوز التعهد الشهري',
                    'monthly_pledge' => $kafil->monthly_pledge,
                    'total_sponsored' => $newTotal,
                    'excess_amount' => $newTotal - $kafil->monthly_pledge
                ] : null,
                'message' => 'تم إنشاء الكفالة بنجاح'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'حدث خطأ أثناء إنشاء الكفالة',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}