<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\V1\StoreKafilRequest;
use App\Http\Requests\V1\StoreSponsorshipRequest;
use App\Http\Requests\V1\UpdateKafilRequest;
use App\Models\Kafil;
use App\Services\KafilService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class KafilController extends Controller
{
    public function __construct(private readonly KafilService $kafils)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $query = Kafil::with(['donor', 'sponsorships.widow']);

        if ($search = $request->search) {
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $kafils = $query->paginate($request->get('per_page', 15));

        return response()->json([
            'data' => $kafils->items(),
            'meta' => [
                'current_page' => $kafils->currentPage(),
                'last_page' => $kafils->lastPage(),
                'per_page' => $kafils->perPage(),
                'total' => $kafils->total(),
            ],
        ]);
    }

    public function store(StoreKafilRequest $request): JsonResponse
    {
        $kafil = Kafil::create($request->validated());
        $kafil->load(['donor', 'sponsorships.widow']);

        return response()->json([
            'data' => $kafil,
            'message' => 'تم إنشاء الكفيل بنجاح',
        ], 201);
    }

    public function show(Kafil $kafil): JsonResponse
    {
        $kafil->load(['donor', 'sponsorships.widow']);

        return response()->json(['data' => $kafil]);
    }

    public function update(UpdateKafilRequest $request, Kafil $kafil): JsonResponse
    {
        $kafil->update($request->validated());
        $kafil->load(['donor', 'sponsorships.widow']);

        return response()->json([
            'data' => $kafil,
            'message' => 'تم تحديث بيانات الكفيل بنجاح',
        ]);
    }

    public function destroy(Kafil $kafil): JsonResponse
    {
        $kafil->delete();

        return response()->json(['message' => 'تم حذف الكفيل بنجاح']);
    }

    /**
     * Remove kafil status and convert back to a regular donor.
     */
    public function removeKafilStatus(Kafil $kafil): JsonResponse
    {
        $this->kafils->removeKafilStatus($kafil);

        return response()->json([
            'message' => 'تم إلغاء حالة الكفيل وتحويله إلى متبرع عادي بنجاح',
        ]);
    }

    /**
     * List kafils with their remaining budget, for the widow-assignment UI.
     */
    public function getKafilsForSponsorship(Request $request): JsonResponse
    {
        $query = Kafil::with(['donor', 'sponsorships.widow']);

        if ($search = $request->search) {
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhereHas('donor', function ($donor) use ($search) {
                        $donor->where('first_name', 'like', "%{$search}%")
                            ->orWhere('last_name', 'like', "%{$search}%");
                    });
            });
        }

        $kafils = $query->get()->map(function ($kafil) {
            $totalSponsored = $kafil->sponsorships->sum('amount');

            return [
                'id' => $kafil->id,
                'name' => trim($kafil->first_name . ' ' . $kafil->last_name),
                'first_name' => $kafil->first_name,
                'last_name' => $kafil->last_name,
                'phone' => $kafil->phone,
                'monthly_pledge' => $kafil->monthly_pledge,
                'total_sponsored' => $totalSponsored,
                'remaining_amount' => $kafil->monthly_pledge - $totalSponsored,
                'sponsorships_count' => $kafil->sponsorships->count(),
                'donor' => $kafil->donor ? [
                    'id' => $kafil->donor->id,
                    'name' => trim($kafil->donor->first_name . ' ' . $kafil->donor->last_name),
                ] : null,
                'sponsorships' => $kafil->sponsorships->map(fn ($sponsorship) => [
                    'id' => $sponsorship->id,
                    'amount' => $sponsorship->amount,
                    'notes' => $sponsorship->notes,
                    'widow' => $sponsorship->widow ? [
                        'id' => $sponsorship->widow->id,
                        'first_name' => $sponsorship->widow->first_name,
                        'last_name' => $sponsorship->widow->last_name,
                    ] : null,
                ]),
            ];
        });

        return response()->json(['data' => $kafils]);
    }

    /**
     * Create a sponsorship between a kafil and a widow.
     */
    public function createSponsorship(StoreSponsorshipRequest $request): JsonResponse
    {
        $result = $this->kafils->createSponsorship($request->validated());

        return response()->json([
            'data' => $result['sponsorship'],
            'warning' => $result['warning'],
            'message' => 'تم إنشاء الكفالة بنجاح',
        ]);
    }
}
