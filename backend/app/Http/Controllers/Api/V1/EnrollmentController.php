<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\AcademicYear;
use App\Models\OrphanEnrollment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
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
            ...$this->gradeRules($request, $enrollment),
        ], $this->gradeMessages());

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

    /**
     * Marking a whole class in one request: entering grades one student at a
     * time through the generic update endpoint is what the registrar actually
     * does least - they sit with a report card list for a school and a level.
     */
    public function storeGrades(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'grades' => ['required', 'array', 'min:1', 'max:200'],
            'grades.*.enrollment_id' => ['required', 'integer', 'exists:orphan_enrollments,id'],
            'grades.*.first_semester_grade' => ['nullable', 'numeric', 'min:0'],
            'grades.*.second_semester_grade' => ['nullable', 'numeric', 'min:0'],
            'grades.*.grade_scale' => ['nullable', 'numeric', 'min:1', 'max:1000'],
        ], [
            'grades.required' => 'لم يتم إرسال أي نقط',
            'grades.*.first_semester_grade.numeric' => 'نقطة الأسدس الأول يجب أن تكون رقماً',
            'grades.*.second_semester_grade.numeric' => 'نقطة الأسدس الثاني يجب أن تكون رقماً',
        ]);

        $rows = collect($validated['grades'])->keyBy('enrollment_id');
        $enrollments = OrphanEnrollment::whereIn('id', $rows->keys())->get();

        $saved = 0;
        $rejected = [];

        DB::transaction(function () use ($enrollments, $rows, &$saved, &$rejected) {
            foreach ($enrollments as $enrollment) {
                $row = $rows[$enrollment->id];
                $scale = (float) ($row['grade_scale'] ?? $enrollment->grade_scale ?: 20);

                // A mark above its own ceiling is a typo, not a record worth keeping.
                $overCeiling = collect(['first_semester_grade', 'second_semester_grade'])
                    ->filter(fn ($key) => isset($row[$key]) && $row[$key] !== null && (float) $row[$key] > $scale);

                if ($overCeiling->isNotEmpty()) {
                    $rejected[] = [
                        'enrollment_id' => $enrollment->id,
                        'message' => "النقطة تتجاوز السلم المعتمد ({$scale})",
                    ];

                    continue;
                }

                // Only the keys actually sent are touched, so a null clears a
                // mark on purpose while an absent key leaves it alone.
                $changes = [];
                foreach (['first_semester_grade', 'second_semester_grade', 'grade_scale'] as $key) {
                    if (array_key_exists($key, $row)) {
                        $changes[$key] = $row[$key];
                    }
                }

                $enrollment->update($changes);

                $saved++;
            }
        });

        return response()->json([
            'message' => $rejected === []
                ? "تم حفظ نقط {$saved} تلميذ(ة)"
                : "تم حفظ نقط {$saved} تلميذ(ة)، وتم رفض " . count($rejected),
            'data' => [
                'saved' => $saved,
                'rejected' => $rejected,
            ],
        ], $rejected === [] ? 200 : 422);
    }

    /**
     * A mark cannot exceed the scale it was given on - which may be arriving in
     * the same request, so the ceiling is resolved before the rules are built.
     */
    private function gradeRules(Request $request, ?OrphanEnrollment $enrollment = null): array
    {
        $scale = (float) ($request->input('grade_scale') ?? $enrollment?->grade_scale ?? 20);

        return [
            'first_semester_grade' => ['nullable', 'numeric', 'min:0', "max:{$scale}"],
            'second_semester_grade' => ['nullable', 'numeric', 'min:0', "max:{$scale}"],
            'grade_scale' => ['nullable', 'numeric', 'min:1', 'max:1000'],
        ];
    }

    private function gradeMessages(): array
    {
        return [
            'first_semester_grade.max' => 'نقطة الأسدس الأول تتجاوز السلم المعتمد',
            'second_semester_grade.max' => 'نقطة الأسدس الثاني تتجاوز السلم المعتمد',
            'first_semester_grade.min' => 'النقطة لا يمكن أن تكون سالبة',
            'second_semester_grade.min' => 'النقطة لا يمكن أن تكون سالبة',
        ];
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
            ...$this->gradeRules($request),
        ], [
            'orphan_id.required' => 'اليتيم مطلوب',
            'orphan_id.exists' => 'اليتيم غير موجود',
            'academic_year_id.required' => 'السنة الدراسية مطلوبة',
            ...$this->gradeMessages(),
        ]);
    }
}
