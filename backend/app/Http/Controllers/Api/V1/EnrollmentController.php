<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\AcademicYear;
use App\Models\OrphanEnrollment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class EnrollmentController extends Controller
{
    private const RELATIONS = ['orphan.widow', 'academicYear', 'educationLevel', 'school'];

    public function index(Request $request): JsonResponse
    {
        $yearId = $request->get('academic_year_id')
            ?: AcademicYear::where('is_current', true)->value('id');

        $enrollments = OrphanEnrollment::with(self::RELATIONS)
            ->when($yearId, fn ($q) => $q->where('academic_year_id', $yearId))
            ->when($request->filled('school_id'), fn ($q) => $q->where('school_id', $request->school_id))
            ->when($request->filled('education_level_id'), fn ($q) => $q->where('education_level_id', $request->education_level_id))
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->status))
            ->when($request->search, function ($q, $search) {
                $q->whereHas('orphan', function ($orphan) use ($search) {
                    $orphan->where('first_name', 'like', "%{$search}%")
                        ->orWhere('last_name', 'like', "%{$search}%")
                        ->orWhere('masar_code', 'like', "%{$search}%");
                });
            })
            ->orderBy('id', 'desc')
            ->paginate(min($request->get('per_page', 25), 100));

        return response()->json([
            'data' => $enrollments->items(),
            'meta' => [
                'current_page' => $enrollments->currentPage(),
                'last_page' => $enrollments->lastPage(),
                'per_page' => $enrollments->perPage(),
                'total' => $enrollments->total(),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $this->validateEnrollment($request);

        $exists = OrphanEnrollment::where('orphan_id', $validated['orphan_id'])
            ->where('academic_year_id', $validated['academic_year_id'])
            ->exists();

        if ($exists) {
            return response()->json([
                'message' => 'هذا اليتيم مسجل مسبقاً في هذه السنة الدراسية',
            ], 422);
        }

        $enrollment = OrphanEnrollment::create($validated);
        $enrollment->load(self::RELATIONS);

        return response()->json([
            'message' => 'تم تسجيل اليتيم في السنة الدراسية بنجاح',
            'data' => $enrollment,
        ], 201);
    }

    public function update(Request $request, OrphanEnrollment $enrollment): JsonResponse
    {
        $validated = $request->validate([
            'education_level_id' => ['nullable', 'integer', 'exists:orphans_education_level,id'],
            'school_id' => ['nullable', 'integer', 'exists:schools,id'],
            'specialty' => ['nullable', 'string', 'max:150'],
            'status' => ['sometimes', Rule::in(['enrolled', 'passed', 'failed', 'left'])],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        $enrollment->update($validated);
        $enrollment->load(self::RELATIONS);

        return response()->json([
            'message' => 'تم تحديث التسجيل بنجاح',
            'data' => $enrollment,
        ]);
    }

    public function destroy(OrphanEnrollment $enrollment): JsonResponse
    {
        $enrollment->delete();

        return response()->json(['message' => 'تم حذف التسجيل بنجاح']);
    }

    private function validateEnrollment(Request $request): array
    {
        return $request->validate([
            'orphan_id' => ['required', 'integer', 'exists:orphans,id'],
            'academic_year_id' => ['required', 'integer', 'exists:academic_years,id'],
            'education_level_id' => ['nullable', 'integer', 'exists:orphans_education_level,id'],
            'school_id' => ['nullable', 'integer', 'exists:schools,id'],
            'specialty' => ['nullable', 'string', 'max:150'],
            'notes' => ['nullable', 'string', 'max:500'],
        ], [
            'orphan_id.required' => 'اليتيم مطلوب',
            'orphan_id.exists' => 'اليتيم غير موجود',
            'academic_year_id.required' => 'السنة الدراسية مطلوبة',
        ]);
    }
}
