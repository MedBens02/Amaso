<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Orphan;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class OrphanController extends Controller
{
    /**
     * Display a listing of orphans grouped by widow.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Orphan::query()->with(['widow', 'educationLevel']);

        // Search functionality
        if ($request->filled('search')) {
            $search = $request->get('search');
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                  ->orWhere('last_name', 'like', "%{$search}%")
                  ->orWhereHas('widow', function ($widowQuery) use ($search) {
                      $widowQuery->where('first_name', 'like', "%{$search}%")
                                 ->orWhere('last_name', 'like', "%{$search}%");
                  });
            });
        }

        // Filter by gender
        if ($request->filled('gender')) {
            $query->where('gender', $request->get('gender'));
        }

        // Filter by education level
        if ($request->filled('education_level')) {
            $query->whereHas('educationLevel', function($q) use ($request) {
                $q->where('name_ar', 'like', '%' . $request->get('education_level') . '%');
            });
        }

        // Filter by age range
        if ($request->filled('min_age') || $request->filled('max_age')) {
            $minAge = $request->get('min_age');
            $maxAge = $request->get('max_age');
            
            if ($minAge) {
                $maxBirthDate = now()->subYears($minAge)->format('Y-m-d');
                $query->where('birth_date', '<=', $maxBirthDate);
            }
            
            if ($maxAge) {
                $minBirthDate = now()->subYears($maxAge + 1)->format('Y-m-d');
                $query->where('birth_date', '>', $minBirthDate);
            }
        }

        // Sorting
        $sortBy = $request->get('sort_by', 'widow_id');
        $sortOrder = $request->get('sort_order', 'asc');
        
        $allowedSortColumns = ['first_name', 'last_name', 'birth_date', 'gender', 'education_level', 'widow_id'];
        
        if (in_array($sortBy, $allowedSortColumns)) {
            $query->orderBy($sortBy, $sortOrder === 'desc' ? 'desc' : 'asc');
        } else {
            $query->orderBy('widow_id', 'asc')->orderBy('first_name', 'asc');
        }

        $perPage = min($request->get('per_page', 20), 100);
        $orphans = $query->paginate($perPage);

        // Group by widow
        $groupedOrphans = $orphans->getCollection()->groupBy('widow_id')->map(function ($group) {
            $widow = $group->first()->widow;
            return [
                'widow' => [
                    'id' => $widow->id,
                    'full_name' => $widow->first_name . ' ' . $widow->last_name,
                    'phone' => $widow->phone,
                    'neighborhood' => $widow->neighborhood,
                ],
                'orphans' => $group->map(function ($orphan) {
                    $birthDate = $orphan->birth_date ? \Carbon\Carbon::parse($orphan->birth_date) : null;
                    $age = $birthDate ? $birthDate->age : null;
                    
                    return [
                        'id' => $orphan->id,
                        'full_name' => $orphan->first_name . ' ' . $orphan->last_name,
                        'first_name' => $orphan->first_name,
                        'last_name' => $orphan->last_name,
                        'age' => $age,
                        'gender' => $orphan->gender,
                        'birth_date' => $orphan->birth_date,
                        'education_level' => $orphan->educationLevel ? $orphan->educationLevel->name_ar : 'غير محدد',
                        'health_status' => $orphan->health_status,
                        'created_at' => $orphan->created_at,
                        'updated_at' => $orphan->updated_at,
                    ];
                })->values()
            ];
        })->values();

        return response()->json([
            'data' => $groupedOrphans,
            'meta' => [
                'current_page' => $orphans->currentPage(),
                'last_page' => $orphans->lastPage(),
                'per_page' => $orphans->perPage(),
                'total' => $orphans->total(),
                'total_groups' => $groupedOrphans->count(),
            ]
        ]);
    }

    /**
     * Display the specified orphan.
     */
    public function show(Orphan $orphan): JsonResponse
    {
        $orphan->load(['widow', 'educationLevel']);
        
        $birthDate = $orphan->birth_date ? \Carbon\Carbon::parse($orphan->birth_date) : null;
        $age = $birthDate ? $birthDate->age : null;
        
        $orphanData = [
            'id' => $orphan->id,
            'full_name' => $orphan->first_name . ' ' . $orphan->last_name,
            'first_name' => $orphan->first_name,
            'last_name' => $orphan->last_name,
            'age' => $age,
            'gender' => $orphan->gender,
            'birth_date' => $orphan->birth_date,
            'education_level' => $orphan->educationLevel ? $orphan->educationLevel->name_ar : 'غير محدد',
            'health_status' => $orphan->health_status,
            'created_at' => $orphan->created_at,
            'updated_at' => $orphan->updated_at,
            'widow' => [
                'id' => $orphan->widow->id,
                'full_name' => $orphan->widow->first_name . ' ' . $orphan->widow->last_name,
                'phone' => $orphan->widow->phone,
                'email' => $orphan->widow->email,
                'neighborhood' => $orphan->widow->neighborhood,
                'address' => $orphan->widow->address,
            ],
        ];
        
        return response()->json([
            'data' => $orphanData
        ]);
    }

    /**
     * Note: Store and Update methods are intentionally not implemented
     * as orphans should only be managed through widow records
     */
    public function store(Request $request)
    {
        return response()->json([
            'message' => 'الأيتام يُدارون فقط من خلال سجلات الأرامل. يرجى استخدام صفحة تعديل الأرملة لإضافة أطفال.',
            'redirect' => '/dashboard/widows'
        ], 400);
    }

    public function update(Request $request, Orphan $orphan)
    {
        return response()->json([
            'message' => 'الأيتام يُدارون فقط من خلال سجلات الأرامل. يرجى استخدام صفحة تعديل الأرملة لتحديث بيانات الأطفال.',
            'widow_id' => $orphan->widow_id,
            'redirect' => '/dashboard/widows'
        ], 400);
    }

    public function destroy(Orphan $orphan)
    {
        return response()->json([
            'message' => 'الأيتام يُدارون فقط من خلال سجلات الأرامل. يرجى استخدام صفحة تعديل الأرملة لحذف الأطفال.',
            'widow_id' => $orphan->widow_id,
            'redirect' => '/dashboard/widows'
        ], 400);
    }
}