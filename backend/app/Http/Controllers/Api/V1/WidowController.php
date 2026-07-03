<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\V1\StoreWidowRequest;
use App\Http\Requests\V1\UpdateWidowRequest;
use App\Http\Resources\V1\WidowResource;
use App\Models\Widow;
use App\Services\WidowService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class WidowController extends Controller
{
    private const DETAIL_RELATIONS = [
        'orphans',
        'widowFiles',
        'widowSocial.housingType',
        'socialIncome.category',
        'socialExpenses.category',
        'skills',
        'illnesses',
        'aidTypes',
        'activeMaouna.partner.field',
        'activeMaouna.partner.subfield',
    ];

    public function __construct(private readonly WidowService $widows)
    {
    }

    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Widow::query()->with(['orphans']);

        if ($request->filled('search')) {
            $search = $request->get('search');
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhere('national_id', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        if ($request->filled('has_disability')) {
            $query->where('disability_flag', $request->boolean('has_disability'));
        }

        if ($request->filled('education_level')) {
            $query->where('education_level', $request->get('education_level'));
        }

        if ($request->filled('illness_id')) {
            $query->whereHas('illnesses', fn ($q) => $q->where('illnesses.id', $request->get('illness_id')));
        }

        if ($request->filled('aid_type_id')) {
            $query->whereHas('aidTypes', fn ($q) => $q->where('aid_types.id', $request->get('aid_type_id')));
        }

        if ($request->filled('skill_id')) {
            $query->whereHas('skills', fn ($q) => $q->where('skills.id', $request->get('skill_id')));
        }

        if ($request->filled('has_kafil')) {
            $request->boolean('has_kafil')
                ? $query->whereHas('sponsorships')
                : $query->whereDoesntHave('sponsorships');
        }

        if ($request->filled('has_chronic_illness')) {
            $query->whereHas('widowFiles', fn ($q) => $q->where('has_chronic_disease', $request->boolean('has_chronic_illness')));
        }

        if ($request->filled('has_active_maouna')) {
            $request->boolean('has_active_maouna')
                ? $query->whereHas('activeMaouna', fn ($q) => $q->where('is_active', true))
                : $query->whereDoesntHave('activeMaouna', fn ($q) => $q->where('is_active', true));
        }

        if ($request->filled('maouna_partner_id')) {
            $query->whereHas('activeMaouna', function ($q) use ($request) {
                $q->where('partner_id', $request->get('maouna_partner_id'))
                    ->where('is_active', true);
            });
        }

        $sortBy = $request->get('sort_by', 'created_at');
        $sortOrder = $request->get('sort_order', 'desc');
        $allowedSortColumns = [
            'first_name',
            'last_name',
            'birth_date',
            'neighborhood',
            'education_level',
            'disability_flag',
            'created_at',
        ];

        in_array($sortBy, $allowedSortColumns)
            ? $query->orderBy($sortBy, $sortOrder === 'desc' ? 'desc' : 'asc')
            : $query->latest();

        $perPage = min($request->get('per_page', 15), 100);

        return WidowResource::collection($query->paginate($perPage));
    }

    public function store(StoreWidowRequest $request): JsonResponse
    {
        $widow = $this->widows->create($request->validated());
        $widow->load(self::DETAIL_RELATIONS);

        return response()->json([
            'message' => 'تم إنشاء الأرملة بنجاح مع جميع البيانات المرتبطة',
            'data' => new WidowResource($widow),
        ], 201);
    }

    public function show(Widow $widow): JsonResponse
    {
        $widow->load([
            ...self::DETAIL_RELATIONS,
            'orphans.educationLevel',
            'sponsorships.kafil.donor',
        ]);

        return response()->json([
            'data' => new WidowResource($widow),
        ]);
    }

    public function update(UpdateWidowRequest $request, Widow $widow): JsonResponse
    {
        $widow = $this->widows->update($widow, $request->validated());
        $widow->load([...self::DETAIL_RELATIONS, 'sponsorships.kafil.donor']);

        return response()->json([
            'message' => 'تم تحديث جميع بيانات الأرملة بنجاح',
            'data' => new WidowResource($widow),
        ]);
    }

    public function destroy(Widow $widow): JsonResponse
    {
        $fullName = $this->widows->delete($widow);

        return response()->json([
            'message' => "تم حذف الأرملة \"{$fullName}\" بنجاح مع جميع البيانات المرتبطة",
        ]);
    }

    public function getReferenceData(): JsonResponse
    {
        return response()->json([
            'data' => [
                'housing_types' => \App\Models\HousingType::all(['id', 'label']),
                'skills' => \App\Models\Skill::all(['id', 'label']),
                'illnesses' => \App\Models\Illness::all(['id', 'label']),
                'aid_types' => \App\Models\AidType::all(['id', 'label']),
                'income_categories' => \App\Models\WidowIncomeCategory::all(['id', 'name']),
                'expense_categories' => \App\Models\WidowExpenseCategory::all(['id', 'name']),
                'partners' => \App\Models\Partner::with(['field', 'subfield'])->get(['id', 'name', 'field_id', 'subfield_id']),
            ],
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
            'maouna.partner.field',
            'maouna.partner.subfield',
            'sponsorships.kafil.donor',
        ]);

        return response()->json([
            'data' => new WidowResource($widow),
        ]);
    }
}
