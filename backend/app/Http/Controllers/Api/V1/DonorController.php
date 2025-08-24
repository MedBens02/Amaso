<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Donor;
use App\Models\Kafil;
use App\Models\KafilSponsorship;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class DonorController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $donors = Donor::with(['kafil.sponsorships.widow'])
            ->when($request->search, function ($query, $search) {
                return $query->where('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            })
            ->when($request->is_kafil !== null, function ($query) use ($request) {
                return $query->where('is_kafil', $request->boolean('is_kafil'));
            })
            ->orderBy('created_at', 'desc')
            ->paginate($request->per_page ?? 15);

        return response()->json([
            'data' => $donors->items(),
            'meta' => [
                'current_page' => $donors->currentPage(),
                'last_page' => $donors->lastPage(),
                'per_page' => $donors->perPage(),
                'total' => $donors->total(),
            ]
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'first_name' => 'required|string|max:120',
            'last_name' => 'required|string|max:120',
            'phone' => 'nullable|string|max:30',
            'email' => 'nullable|email|max:120',
            'address' => 'nullable|string',
            'is_kafil' => 'boolean',
            'monthly_pledge' => 'nullable|numeric|min:0',
            'widow_id' => 'nullable|exists:widows,id',
        ]);

        return DB::transaction(function () use ($validated) {
            $donor = Donor::create([
                'first_name' => $validated['first_name'],
                'last_name' => $validated['last_name'],
                'phone' => $validated['phone'] ?? null,
                'email' => $validated['email'] ?? null,
                'address' => $validated['address'] ?? null,
                'is_kafil' => $validated['is_kafil'] ?? false,
            ]);

            // If donor is kafil, create kafil record
            if ($validated['is_kafil'] ?? false) {
                $kafil = Kafil::create([
                    'donor_id' => $donor->id,
                    'first_name' => $validated['first_name'],
                    'last_name' => $validated['last_name'],
                    'phone' => $validated['phone'] ?? null,
                    'email' => $validated['email'] ?? null,
                    'address' => $validated['address'] ?? null,
                    'monthly_pledge' => $validated['monthly_pledge'] ?? null,
                ]);

                // If widow is selected, create sponsorship
                if (!empty($validated['widow_id'])) {
                    KafilSponsorship::create([
                        'kafil_id' => $kafil->id,
                        'widow_id' => $validated['widow_id'],
                        'amount' => $validated['monthly_pledge'] ?? 0,
                    ]);
                }
            }

            return response()->json([
                'message' => 'تم إنشاء المتبرع بنجاح',
                'data' => $donor->load('kafil.sponsorships.widow')
            ], 201);
        });
    }

    public function show(Donor $donor): JsonResponse
    {
        return response()->json([
            'data' => $donor->load('kafil.sponsorships.widow')
        ]);
    }

    public function update(Request $request, Donor $donor): JsonResponse
    {
        $validated = $request->validate([
            'first_name' => 'required|string|max:120',
            'last_name' => 'required|string|max:120',
            'phone' => 'nullable|string|max:30',
            'email' => 'nullable|email|max:120',
            'address' => 'nullable|string',
            'is_kafil' => 'boolean',
            'monthly_pledge' => 'nullable|numeric|min:0',
            'widow_id' => 'nullable|exists:widows,id',
        ]);

        return DB::transaction(function () use ($validated, $donor) {
            $wasKafil = $donor->is_kafil;
            $isNowKafil = $validated['is_kafil'] ?? false;

            // Update donor
            $donor->update([
                'first_name' => $validated['first_name'],
                'last_name' => $validated['last_name'],
                'phone' => $validated['phone'] ?? null,
                'email' => $validated['email'] ?? null,
                'address' => $validated['address'] ?? null,
                'is_kafil' => $isNowKafil,
            ]);

            if (!$wasKafil && $isNowKafil) {
                // Became kafil - create kafil record only if one doesn't already exist
                $existingKafil = Kafil::where('donor_id', $donor->id)->first();
                if (!$existingKafil) {
                    $kafil = Kafil::create([
                        'donor_id' => $donor->id,
                        'first_name' => $validated['first_name'],
                        'last_name' => $validated['last_name'],
                        'phone' => $validated['phone'] ?? null,
                        'email' => $validated['email'] ?? null,
                        'address' => $validated['address'] ?? null,
                        'monthly_pledge' => $validated['monthly_pledge'] ?? null,
                    ]);

                    // Create sponsorship if widow selected
                    if (!empty($validated['widow_id'])) {
                        KafilSponsorship::create([
                            'kafil_id' => $kafil->id,
                            'widow_id' => $validated['widow_id'],
                            'amount' => $validated['monthly_pledge'] ?? 0,
                        ]);
                    }
                }
            } elseif ($wasKafil && !$isNowKafil) {
                // No longer kafil - delete kafil record and sponsorships
                if ($donor->kafil) {
                    $donor->kafil->sponsorships()->delete();
                    $donor->kafil->delete();
                }
            } elseif ($wasKafil && $isNowKafil) {
                // Still kafil - update kafil record
                if ($donor->kafil) {
                    $donor->kafil->update([
                        'first_name' => $validated['first_name'],
                        'last_name' => $validated['last_name'],
                        'phone' => $validated['phone'] ?? null,
                        'email' => $validated['email'] ?? null,
                        'address' => $validated['address'] ?? null,
                        'monthly_pledge' => $validated['monthly_pledge'] ?? null,
                    ]);

                    // Update or create sponsorship
                    if (!empty($validated['widow_id'])) {
                        $donor->kafil->sponsorships()->delete();
                        KafilSponsorship::create([
                            'kafil_id' => $donor->kafil->id,
                            'widow_id' => $validated['widow_id'],
                            'amount' => $validated['monthly_pledge'] ?? 0,
                        ]);
                    } else {
                        $donor->kafil->sponsorships()->delete();
                    }
                }
            }

            return response()->json([
                'message' => 'تم تحديث المتبرع بنجاح',
                'data' => $donor->fresh()->load('kafil.sponsorships.widow')
            ]);
        });
    }

    public function destroy(Donor $donor): JsonResponse
    {
        return DB::transaction(function () use ($donor) {
            // Delete kafil record and sponsorships if exists
            if ($donor->kafil) {
                $donor->kafil->sponsorships()->delete();
                $donor->kafil->delete();
            }
            
            $donor->delete();

            return response()->json([
                'message' => 'تم حذف المتبرع بنجاح'
            ]);
        });
    }
}