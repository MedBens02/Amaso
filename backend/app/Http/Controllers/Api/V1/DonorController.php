<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\V1\StoreDonorRequest;
use App\Http\Requests\V1\UpdateDonorRequest;
use App\Models\Donor;
use App\Services\DonorService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DonorController extends Controller
{
    public function __construct(private readonly DonorService $donors)
    {
    }

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
            ],
        ]);
    }

    public function store(StoreDonorRequest $request): JsonResponse
    {
        $donor = $this->donors->create($request->validated());

        return response()->json([
            'message' => 'تم إنشاء المتبرع بنجاح',
            'data' => $donor->load('kafil.sponsorships.widow'),
        ], 201);
    }

    public function show(Donor $donor): JsonResponse
    {
        return response()->json([
            'data' => $donor->load('kafil.sponsorships.widow'),
        ]);
    }

    public function update(UpdateDonorRequest $request, Donor $donor): JsonResponse
    {
        $donor = $this->donors->update($donor, $request->validated());

        return response()->json([
            'message' => 'تم تحديث المتبرع بنجاح',
            'data' => $donor->fresh()->load('kafil.sponsorships.widow'),
        ]);
    }

    public function destroy(Donor $donor): JsonResponse
    {
        $this->donors->delete($donor);

        return response()->json([
            'message' => 'تم حذف المتبرع بنجاح',
        ]);
    }
}
