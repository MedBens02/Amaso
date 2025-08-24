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
            'sponsorships' => 'required|array|min:1',
            'sponsorships.*.widow_id' => 'required|exists:widows,id',
            'sponsorships.*.amount' => 'required|numeric|min:0.01',
        ]);

        // Validate that sponsorship amounts don't exceed monthly pledge
        $totalSponsorshipAmount = array_sum(array_column($request->sponsorships, 'amount'));
        if ($totalSponsorshipAmount > $request->monthly_pledge) {
            throw ValidationException::withMessages([
                'sponsorships' => ['إجمالي مبالغ الكفالات يتجاوز التعهد الشهري']
            ]);
        }

        // Check for duplicate widow sponsorships
        $widowIds = array_column($request->sponsorships, 'widow_id');
        if (count($widowIds) !== count(array_unique($widowIds))) {
            throw ValidationException::withMessages([
                'sponsorships' => ['لا يمكن كفالة نفس الأرملة أكثر من مرة']
            ]);
        }

        // Check if any of these widows are already sponsored by this kafil
        $existingSponsorships = KafilSponsorship::whereIn('widow_id', $widowIds)->exists();
        if ($existingSponsorships) {
            throw ValidationException::withMessages([
                'sponsorships' => ['إحدى الأرامل المختارة مكفولة بالفعل']
            ]);
        }

        DB::beginTransaction();
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

            // Create the sponsorships
            foreach ($request->sponsorships as $sponsorship) {
                KafilSponsorship::create([
                    'kafil_id' => $kafil->id,
                    'widow_id' => $sponsorship['widow_id'],
                    'amount' => $sponsorship['amount'],
                ]);
            }

            DB::commit();

            // Load relationships for response
            $kafil->load(['donor', 'sponsorships.widow']);

            return response()->json([
                'data' => $kafil,
                'message' => 'تم إنشاء الكفيل والكفالات بنجاح'
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
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

        // Check if new monthly pledge can cover existing sponsorships
        $existingSponsorshipTotal = $kafil->total_sponsorship_amount;
        if ($request->monthly_pledge < $existingSponsorshipTotal) {
            throw ValidationException::withMessages([
                'monthly_pledge' => ['التعهد الشهري الجديد أقل من مجموع الكفالات الحالية']
            ]);
        }

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
     * Add a new sponsorship to an existing kafil
     */
    public function addSponsorship(Request $request, Kafil $kafil): JsonResponse
    {
        $request->validate([
            'widow_id' => 'required|exists:widows,id',
            'amount' => 'required|numeric|min:0.01',
        ]);

        // Check if kafil can afford this new sponsorship
        if (!$kafil->canAffordSponsorship($request->amount)) {
            throw ValidationException::withMessages([
                'amount' => ['مبلغ الكفالة يتجاوز المبلغ المتاح من التعهد الشهري']
            ]);
        }

        // Check if widow is already sponsored by this kafil
        if ($kafil->sponsorships()->where('widow_id', $request->widow_id)->exists()) {
            throw ValidationException::withMessages([
                'widow_id' => ['هذه الأرملة مكفولة بالفعل من قبل هذا الكفيل']
            ]);
        }

        $sponsorship = KafilSponsorship::create([
            'kafil_id' => $kafil->id,
            'widow_id' => $request->widow_id,
            'amount' => $request->amount,
        ]);

        $sponsorship->load('widow');

        return response()->json([
            'data' => $sponsorship,
            'message' => 'تم إضافة الكفالة بنجاح'
        ], 201);
    }

    /**
     * Update a sponsorship for a kafil
     */
    public function updateSponsorship(Request $request, Kafil $kafil, KafilSponsorship $sponsorship): JsonResponse
    {
        if ($sponsorship->kafil_id !== $kafil->id) {
            return response()->json(['message' => 'الكفالة غير مرتبطة بهذا الكفيل'], 404);
        }

        $request->validate([
            'widow_id' => 'sometimes|exists:widows,id',
            'amount' => 'sometimes|numeric|min:0.01',
        ]);

        // Calculate what the new total would be after this update
        $currentAmount = $sponsorship->amount;
        $newAmount = $request->get('amount', $currentAmount);
        $amountDifference = $newAmount - $currentAmount;

        // Check if kafil can afford the new amount
        if ($amountDifference > 0 && $kafil->remaining_pledge_amount < $amountDifference) {
            throw ValidationException::withMessages([
                'amount' => ['مبلغ الكفالة الجديد يتجاوز المبلغ المتاح من التعهد الشهري']
            ]);
        }

        // If changing widow, check if new widow is already sponsored by this kafil
        if ($request->has('widow_id') && $request->widow_id !== $sponsorship->widow_id) {
            if ($kafil->sponsorships()->where('widow_id', $request->widow_id)->exists()) {
                throw ValidationException::withMessages([
                    'widow_id' => ['هذه الأرملة مكفولة بالفعل من قبل هذا الكفيل']
                ]);
            }
        }

        $sponsorship->update($request->only(['widow_id', 'amount']));
        $sponsorship->load('widow');

        return response()->json([
            'data' => $sponsorship,
            'message' => 'تم تحديث الكفالة بنجاح'
        ]);
    }

    /**
     * Remove a sponsorship from a kafil
     */
    public function removeSponsorship(Kafil $kafil, KafilSponsorship $sponsorship): JsonResponse
    {
        if ($sponsorship->kafil_id !== $kafil->id) {
            return response()->json(['message' => 'الكفالة غير مرتبطة بهذا الكفيل'], 404);
        }

        $sponsorship->delete();

        return response()->json(['message' => 'تم حذف الكفالة بنجاح']);
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
}