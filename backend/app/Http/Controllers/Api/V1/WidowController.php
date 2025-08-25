<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\V1\StoreWidowRequest;
use App\Http\Requests\V1\UpdateWidowRequest;
use App\Http\Resources\V1\WidowResource;
use App\Models\Widow;
use App\Models\WidowFiles;
use App\Models\WidowSocial;
use App\Models\WidowSocialIncome;
use App\Models\WidowSocialExpense;
use App\Models\WidowMaouna;
use App\Models\Orphan;
use App\Models\Skill;
use App\Models\Illness;
use App\Models\WidowIncomeCategory;
use App\Models\WidowExpenseCategory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;

class WidowController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Widow::query()->with(['orphans']);

        // Search functionality
        if ($request->filled('search')) {
            $search = $request->get('search');
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                  ->orWhere('last_name', 'like', "%{$search}%")
                  ->orWhere('national_id', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%")
;
            });
        }

        // Filter by disability status
        if ($request->filled('has_disability')) {
            $query->where('disability_flag', $request->boolean('has_disability'));
        }

        // Filter by education level
        if ($request->filled('education_level')) {
            $query->where('education_level', $request->get('education_level'));
        }

        $perPage = min($request->get('per_page', 15), 100);
        $widows = $query->latest()->paginate($perPage);

        return WidowResource::collection($widows);
    }

    public function store(StoreWidowRequest $request): JsonResponse
    {
        try {
            $widow = DB::transaction(function () use ($request) {
                $validated = $request->validated();
                
                // Create the main widow record directly (no family needed)
                $widowData = collect($validated)->only([
                    'first_name', 'last_name', 'phone', 'email', 
                    'address', 'neighborhood', 'admission_date', 'national_id', 
                    'birth_date', 'marital_status', 'education_level', 
                    'disability_flag', 'disability_type'
                ])->toArray();
                
                $widow = Widow::create($widowData);
                
                // Create widow files record
                WidowFiles::create([
                    'widow_id' => $widow->id,
                    'social_situation' => $validated['social_situation'],
                    'has_chronic_disease' => $validated['has_chronic_disease'] ?? false,
                ]);
                
                // Create widow social record (only if housing data is provided)
                if (!empty($validated['housing_type_id'])) {
                    WidowSocial::create([
                        'widow_id' => $widow->id,
                        'housing_type_id' => $validated['housing_type_id'],
                        'housing_status' => $validated['housing_status'] ?? 'owned',
                        'has_water' => $validated['has_water'] ?? false,
                        'has_electricity' => $validated['has_electricity'] ?? false,
                        'has_furniture' => $validated['has_furniture'] ?? 0,
                    ]);
                }
                
                // Create children/orphans
                if (!empty($validated['children'])) {
                    foreach ($validated['children'] as $childData) {
                        Orphan::create([
                            'widow_id' => $widow->id,
                            'first_name' => $childData['first_name'],
                            'last_name' => $childData['last_name'],
                            'birth_date' => $childData['birth_date'],
                            'gender' => $childData['gender'], // Use 'gender' as in migration, not 'sex'
                            'education_level' => $childData['education_level'] ?? null,
                            'health_status' => $childData['health_status'] ?? null,
                        ]);
                    }
                }
                
                // Create income entries
                if (!empty($validated['income'])) {
                    foreach ($validated['income'] as $incomeData) {
                        $categoryId = $incomeData['category_id'];
                        
                        // If category_id is null but category_name is provided, create new category
                        if (!$categoryId && !empty($incomeData['category_name'])) {
                            $category = WidowIncomeCategory::firstOrCreate(['name' => $incomeData['category_name']]);
                            $categoryId = $category->id;
                        }
                        
                        if ($categoryId) {
                            WidowSocialIncome::create([
                                'widow_id' => $widow->id,
                                'income_category_id' => $categoryId,
                                'amount' => $incomeData['amount'],
                                'remarks' => $incomeData['description'] ?? null,
                            ]);
                        }
                    }
                }
                
                // Create expense entries
                if (!empty($validated['expenses'])) {
                    foreach ($validated['expenses'] as $expenseData) {
                        $categoryId = $expenseData['category_id'];
                        
                        // If category_id is null but category_name is provided, create new category
                        if (!$categoryId && !empty($expenseData['category_name'])) {
                            $category = WidowExpenseCategory::firstOrCreate(['name' => $expenseData['category_name']]);
                            $categoryId = $category->id;
                        }
                        
                        if ($categoryId) {
                            WidowSocialExpense::create([
                                'widow_id' => $widow->id,
                                'expense_category_id' => $categoryId,
                                'amount' => $expenseData['amount'],
                                'remarks' => $expenseData['description'] ?? null,
                            ]);
                        }
                    }
                }
                
                // Handle new skills creation
                if (!empty($validated['new_skills'])) {
                    foreach ($validated['new_skills'] as $skillName) {
                        $skill = Skill::firstOrCreate(['label' => $skillName]);
                        $validated['skills'][] = $skill->id;
                    }
                }
                
                // Attach skills
                if (!empty($validated['skills'])) {
                    $widow->skills()->attach($validated['skills']);
                }
                
                // Handle new illnesses creation
                if (!empty($validated['new_illnesses'])) {
                    foreach ($validated['new_illnesses'] as $illnessName) {
                        $illness = Illness::firstOrCreate([
                            'label' => $illnessName,
                            'is_chronic' => false  // Default to non-chronic for new illnesses
                        ]);
                        $validated['illnesses'][] = $illness->id;
                    }
                }
                
                // Attach illnesses
                if (!empty($validated['illnesses'])) {
                    $widow->illnesses()->attach($validated['illnesses']);
                }
                
                // Attach aid types
                if (!empty($validated['aid_types'])) {
                    $widow->aidTypes()->attach($validated['aid_types']);
                }
                
                // Create maouna entries
                if (!empty($validated['maouna'])) {
                    foreach ($validated['maouna'] as $maounaData) {
                        WidowMaouna::create([
                            'widow_id' => $widow->id,
                            'partner_id' => $maounaData['partner_id'],
                            'amount' => $maounaData['amount'],
                            'is_active' => true,
                        ]);
                    }
                }
                
                return $widow;
            });
            
            $widow->load([
                'orphans', 'widowFiles', 'widowSocial.housingType',
                'socialIncome.category', 'socialExpenses.category', 
                'skills', 'illnesses', 'aidTypes', 'activeMaouna.partner'
            ]);

            return response()->json([
                'message' => 'تم إنشاء الأرملة بنجاح مع جميع البيانات المرتبطة',
                'data' => new WidowResource($widow)
            ], 201);
            
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'حدث خطأ أثناء إنشاء الأرملة',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function show(Widow $widow): JsonResponse
    {
        $widow->load([
            'orphans', 
            'widowFiles', 
            'widowSocial.housingType',
            'socialIncome.category', 
            'socialExpenses.category', 
            'skills', 
            'illnesses', 
            'aidTypes', 
            'activeMaouna.partner',
            'sponsorships.kafil.donor'
        ]);
        
        return response()->json([
            'data' => new WidowResource($widow)
        ]);
    }

    public function update(UpdateWidowRequest $request, Widow $widow): JsonResponse
    {
        $widow->update($request->validated());
        
        $widow->load(['orphans']);

        return response()->json([
            'message' => 'تم تحديث بيانات الأرملة بنجاح',
            'data' => new WidowResource($widow)
        ]);
    }

    public function destroy(Widow $widow): JsonResponse
    {
        try {
            return DB::transaction(function () use ($widow) {
                // Check if widow has active sponsorships
                if ($widow->sponsorships()->exists()) {
                    return response()->json([
                        'message' => 'لا يمكن حذف الأرملة لأنها مرتبطة بكفالات نشطة'
                    ], 400);
                }

                $fullName = $widow->full_name;

                // Delete all related records manually (due to cascade constraints)
                // Delete skills relationships
                $widow->skills()->detach();
                
                // Delete illnesses relationships
                $widow->illnesses()->detach();
                
                // Delete aid types relationships
                $widow->aidTypes()->detach();
                
                // Delete maouna records
                WidowMaouna::where('widow_id', $widow->id)->delete();
                
                // Delete social income records
                WidowSocialIncome::where('widow_id', $widow->id)->delete();
                
                // Delete social expense records
                WidowSocialExpense::where('widow_id', $widow->id)->delete();
                
                // Delete widow social record
                WidowSocial::where('widow_id', $widow->id)->delete();
                
                // Delete widow files record
                WidowFiles::where('widow_id', $widow->id)->delete();
                
                // Delete orphans manually (since cascade might not be set up properly)
                $widow->orphans()->delete();
                
                // Finally delete the widow
                $widow->delete();

                return response()->json([
                    'message' => "تم حذف الأرملة \"{$fullName}\" بنجاح مع جميع البيانات المرتبطة"
                ]);
            });
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'حدث خطأ أثناء حذف الأرملة',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function getReferenceData(): JsonResponse
    {
        $data = [
            'housing_types' => \App\Models\HousingType::all(['id', 'label']),
            'skills' => \App\Models\Skill::all(['id', 'label']),
            'illnesses' => \App\Models\Illness::all(['id', 'label']),
            'aid_types' => \App\Models\AidType::all(['id', 'label']),
            'income_categories' => \App\Models\WidowIncomeCategory::all(['id', 'name']),
            'expense_categories' => \App\Models\WidowExpenseCategory::all(['id', 'name']),
            'partners' => \App\Models\Partner::with(['field', 'subfield'])->get(['id', 'name', 'field_id', 'subfield_id']),
        ];

        return response()->json([
            'data' => $data
        ]);
    }

    public function getWidowDetails(Widow $widow): JsonResponse
    {
        $widow->load([
            'orphans', 
            'widowFiles', 
            'widowSocial.housingType',
            'socialIncome.category', 
            'socialExpenses.category', 
            'skills', 
            'illnesses', 
            'aidTypes', 
            'maouna.partner',
            'sponsorships.kafil.donor'
        ]);
        
        return response()->json([
            'data' => new WidowResource($widow)
        ]);
    }
}