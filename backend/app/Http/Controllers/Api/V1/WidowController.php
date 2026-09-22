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
        // The current year's enrollment, not the orphan's own (unused,
        // legacy) education_level_id - see Orphan::currentEducationLabel().
        'orphans.currentEnrollment.educationLevel',
        // The marks are rows now, so the card and the list read them through
        // the relation rather than off two columns.
        'orphans.currentEnrollment.grades',
        'phones',
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
        $query = Widow::query()->with(['orphans.currentEnrollment.educationLevel', 'orphans.currentEnrollment.grades']);

        // A family in عدة is not one of the association's families yet, so
        // she is not in the list of them. The عدة screen asks for her by
        // name through this same endpoint rather than having one of its own.
        match ($request->get('idda')) {
            'only' => $query->iddaCases(),
            'all' => null,
            default => $query->regular(),
        };

        if ($request->filled('search')) {
            $search = $request->get('search');
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    // Typing a full name is the normal case, and neither
                    // column alone contains it.
                    ->orWhereRaw("CONCAT(first_name, ' ', last_name) like ?", ["%{$search}%"])
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

        if ($request->filled('neighborhood')) {
            $query->where('neighborhood', $request->get('neighborhood'));
        }

        // A sector is asked for by id and answered in names, because that
        // is what the family record holds. An empty sector matches nothing,
        // which is right: it has no neighborhoods for anybody to live in.
        if ($request->filled('sector_id')) {
            $query->whereIn(
                'neighborhood',
                \App\Models\Neighborhood::where('sector_id', $request->get('sector_id'))->pluck('label'),
            );
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

        // Archived families (soft-deleted) are hidden unless explicitly requested.
        if ($request->boolean('archived')) {
            $query->onlyTrashed();
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
            'orphans.currentEnrollment.school',
            'orphans.currentEnrollment.grades',
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

    /**
     * Archive a family (soft delete). The caller must say when and why the
     * family left; nothing is ever hard-deleted.
     */
    public function destroy(Request $request, Widow $widow): JsonResponse
    {
        $leaving = $request->validate([
            'leaving_date' => ['required', 'date'],
            'leaving_reason' => ['required', 'in:graduated,removed'],
            'leaving_details' => ['nullable', 'string', 'max:500'],
        ], [
            'leaving_date.required' => 'تاريخ المغادرة مطلوب',
            'leaving_reason.required' => 'سبب المغادرة مطلوب',
            'leaving_reason.in' => 'سبب المغادرة يجب أن يكون: تخرج أو إزالة',
        ]);

        $fullName = $this->widows->archive($widow, $leaving);

        return response()->json([
            'message' => "تمت أرشفة ملف \"{$fullName}\" بنجاح. يمكن الاطلاع عليه من قائمة المؤرشفات.",
        ]);
    }

    /**
     * Take a family on: she stops being a عدة case and becomes one of the
     * association's families.
     *
     * The decision a human makes, not one a date makes. Her عدة running out
     * is what puts the case in front of somebody; this is somebody answering
     * it. The dates stay on the record - how she came to the association is
     * part of her history, not something to tidy away once she is enrolled.
     */
    public function enrol(Widow $widow): JsonResponse
    {
        if (! $widow->is_idda_case) {
            return response()->json(['message' => 'هذه الأسرة مسجّلة أصلاً ضمن الأسر المكفولة'], 400);
        }

        $widow->update(['is_idda_case' => false]);

        return response()->json([
            'message' => "تم تسجيل أسرة \"{$widow->full_name}\" ضمن الأسر المكفولة",
            'data' => $widow->fresh(),
        ]);
    }

    /**
     * Restore an archived family.
     */
    public function restore(Widow $widow): JsonResponse
    {
        if (!$widow->trashed()) {
            return response()->json(['message' => 'هذا الملف غير مؤرشف'], 400);
        }

        $widow = $this->widows->restore($widow);

        return response()->json([
            'message' => "تمت استعادة ملف \"{$widow->full_name}\" بنجاح",
            'data' => new WidowResource($widow),
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
                'sectors' => \App\Models\Sector::orderBy('label')->get(['id', 'label']),
                // The managed list, not whatever happens to be typed into
                // the families' records - that is what let a typo become a
                // neighborhood. Names still in use but never added to the
                // list are appended so that no family's address quietly
                // disappears from the form; they show with no sector until
                // somebody files them.
                'neighborhoods' => \App\Models\Neighborhood::with('sector')
                    ->orderBy('label')
                    ->get(['id', 'label', 'sector_id'])
                    ->map(fn ($item) => [
                        'id' => $item->id,
                        'label' => $item->label,
                        'sector_id' => $item->sector_id,
                        'sector' => $item->sector?->label,
                    ])
                    ->concat(
                        Widow::query()->regular()
                            ->whereNotNull('neighborhood')->where('neighborhood', '!=', '')
                            ->whereNotIn('neighborhood', \App\Models\Neighborhood::pluck('label'))
                            ->distinct()->orderBy('neighborhood')->pluck('neighborhood')
                            ->map(fn ($label) => ['id' => null, 'label' => $label, 'sector_id' => null, 'sector' => null]),
                    )
                    ->values(),
                'education_levels' => Widow::query()->regular()
                    ->whereNotNull('education_level')->where('education_level', '!=', '')
                    ->distinct()->orderBy('education_level')->pluck('education_level'),
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
