<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\AcademicYear;
use App\Models\EducationLevelGradeComponent;
use App\Models\OrphanEnrollment;
use App\Models\OrphansEducationLevel;
use App\Models\School;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class EnrollmentController extends Controller
{
    private const RELATIONS = [
        'orphan.widow', 'academicYear', 'educationLevel', 'school',
        'transportSupport', 'grades',
    ];

    public function index(Request $request): JsonResponse
    {
        $yearId = $request->get('academic_year_id')
            ?: AcademicYear::where('is_current', true)->value('id');

        $enrollments = OrphanEnrollment::with(self::RELATIONS)
            ->when($yearId, fn ($q) => $q->where('academic_year_id', $yearId))
            ->when($request->filled('school_id'), fn ($q) => $q->where('school_id', $request->school_id))
            ->when($request->filled('education_level_id'), fn ($q) => $q->where('education_level_id', $request->education_level_id))
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->status))
            // "1"/"0" rather than a boolean: it arrives as a query string.
            ->when($request->filled('has_tutoring'), fn ($q) => $q->where('has_tutoring', $request->boolean('has_tutoring')))
            // Transport is a row rather than a flag, so "who is carried" is a
            // question about whether one exists and is live - not a column.
            ->when($request->filled('has_transport'), fn ($q) => $request->boolean('has_transport')
                ? $q->whereHas('transportSupport', fn ($t) => $t->active())
                : $q->whereDoesntHave('transportSupport', fn ($t) => $t->active()))
            ->when($request->filled('school_type'), fn ($q) => $q->whereHas(
                'school',
                fn ($school) => $school->where('type', $request->school_type),
            ))
            ->when($request->search, function ($q, $search) {
                $q->whereHas('orphan', function ($orphan) use ($search) {
                    $orphan->where('first_name', 'like', "%{$search}%")
                        ->orWhere('last_name', 'like', "%{$search}%")
                        ->orWhereRaw("CONCAT(first_name, ' ', last_name) like ?", ["%{$search}%"])
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
                // Sent with the list the screen already fetches, so the course
                // labels do not have to be kept in step by hand on the client.
                'higher_education_phases' => collect(OrphanEnrollment::HIGHER_EDUCATION_PHASES)
                    ->map(fn ($phase, $key) => [
                        'value' => $key,
                        'label' => $phase['label'],
                        'years' => $phase['years'],
                    ])
                    ->values(),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $this->validateEnrollment($request);

        if ($this->alreadyEnrolled($validated['orphan_id'], $validated['academic_year_id'])) {
            return response()->json([
                'message' => 'هذا اليتيم مسجل مسبقاً في هذه السنة الدراسية',
            ], 422);
        }

        $enrollment = OrphanEnrollment::create($this->withCourseConsistency($validated));
        $enrollment->load(self::RELATIONS);

        return response()->json([
            'message' => 'تم تسجيل اليتيم في السنة الدراسية بنجاح',
            'data' => $enrollment,
        ], 201);
    }

    public function update(Request $request, OrphanEnrollment $enrollment): JsonResponse
    {
        $validated = $request->validate([
            // The year is editable: a record entered against the wrong one
            // used to be fixable only by deleting it and losing its marks.
            'academic_year_id' => ['sometimes', 'integer', 'exists:academic_years,id'],
            'status' => ['sometimes', Rule::in([
                OrphanEnrollment::STATUS_ENROLLED,
                OrphanEnrollment::STATUS_PASSED,
                OrphanEnrollment::STATUS_FAILED,
                OrphanEnrollment::STATUS_LEFT,
            ])],
            ...$this->placementRules(),
            ...$this->gradeRules($request, $enrollment),
        ], $this->messages());

        $targetYear = $validated['academic_year_id'] ?? $enrollment->academic_year_id;

        if ($targetYear !== $enrollment->academic_year_id && $this->alreadyEnrolled($enrollment->orphan_id, $targetYear, $enrollment->id)) {
            return response()->json([
                'message' => 'هذا التلميذ مسجل مسبقاً في السنة الدراسية المختارة',
            ], 422);
        }

        $enrollment->update($this->withCourseConsistency($validated, $enrollment));
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
     * The exam marks on one enrollment, replaced as a set.
     *
     * Sent whole rather than one row at a time: the screen edits a list -
     * add a line, retitle one, delete one - and saving it as a set means
     * what is on screen is what ends up stored, with no way for a delete to
     * be lost because the request that carried it failed on its own.
     */
    public function saveGrades(Request $request, OrphanEnrollment $enrollment): JsonResponse
    {
        $validated = $request->validate([
            'grades' => ['present', 'array', 'max:50'],
            'grades.*.label' => ['required', 'string', 'max:120'],
            'grades.*.mark' => ['required', 'numeric', 'min:0'],
            'grades.*.scale' => ['required', 'numeric', 'min:1', 'max:1000'],
            // What this mark counts for, as a percentage of the year. Zero is
            // a real answer: a mock exam is on the record and out of the
            // average.
            'grades.*.weight' => ['sometimes', 'numeric', 'min:0', 'max:100'],
        ], [
            'grades.*.label.required' => 'اسم النقطة مطلوب',
            'grades.*.mark.required' => 'النقطة مطلوبة',
            'grades.*.mark.numeric' => 'النقطة يجب أن تكون رقماً',
            'grades.*.scale.required' => 'السلم مطلوب',
            'grades.*.weight.max' => 'المعامل لا يتجاوز 100%',
        ]);

        // Two rows of the same name would both claim to be the same component
        // and the year's mark would count it twice.
        $labels = array_map(fn ($grade) => trim($grade['label']), $validated['grades']);
        if (count($labels) !== count(array_unique($labels))) {
            return response()->json([
                'message' => 'لا يمكن تكرار اسم النقطة في السنة نفسها.',
                'errors' => ['grades' => ['اسم النقطة مكرر']],
            ], 422);
        }

        // A mark above its own ceiling is a typo, not a record worth keeping -
        // the same rule the semester marks have always had.
        foreach ($validated['grades'] as $index => $grade) {
            if ((float) $grade['mark'] > (float) $grade['scale']) {
                return response()->json([
                    'message' => "النقطة \"{$grade['label']}\" ({$grade['mark']}) تتجاوز سلمها ({$grade['scale']}).",
                    'errors' => ["grades.{$index}.mark" => ['النقطة تتجاوز السلم المعتمد']],
                ], 422);
            }
        }

        DB::transaction(function () use ($enrollment, $validated) {
            $enrollment->grades()->delete();

            foreach ($validated['grades'] as $index => $grade) {
                $enrollment->grades()->create([
                    'label' => trim($grade['label']),
                    'mark' => $grade['mark'],
                    'scale' => $grade['scale'],
                    'weight' => $grade['weight'] ?? 0,
                    'sort_order' => $index,
                ]);
            }
        });

        $fresh = $enrollment->fresh('grades');

        return response()->json([
            'message' => 'تم حفظ النقط بنجاح',
            'data' => [
                'grades' => $fresh->grades,
                // So the row on the screen behind the dialog can show the new
                // year mark without refetching the whole table.
                'average_grade' => $fresh->average_grade,
                'grade_percentage' => $fresh->grade_percentage,
            ],
        ]);
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
        $enrollments = OrphanEnrollment::with('grades')->whereIn('id', $rows->keys())->get();

        // One query for every level's scheme rather than one per student:
        // this runs for a whole class at a time.
        $schemes = EducationLevelGradeComponent::query()
            ->whereIn('education_level_id', $enrollments->pluck('education_level_id')->filter()->unique())
            ->orderBy('sort_order')
            ->get()
            ->groupBy('education_level_id');

        $columns = [
            'first_semester_grade' => 'الأسدس الأول',
            'second_semester_grade' => 'الأسدس الثاني',
        ];

        $saved = 0;
        $rejected = [];

        DB::transaction(function () use ($enrollments, $rows, $schemes, $columns, &$saved, &$rejected) {
            foreach ($enrollments as $enrollment) {
                $row = $rows[$enrollment->id];
                $scale = (float) ($row['grade_scale'] ?? $enrollment->grade_scale ?: 20);

                // A mark above its own ceiling is a typo, not a record worth keeping.
                $overCeiling = collect(array_keys($columns))
                    ->filter(fn ($key) => isset($row[$key]) && $row[$key] !== null && (float) $row[$key] > $scale);

                if ($overCeiling->isNotEmpty()) {
                    $rejected[] = [
                        'enrollment_id' => $enrollment->id,
                        'message' => "النقطة تتجاوز السلم المعتمد ({$scale})",
                    ];

                    continue;
                }

                $scheme = $schemes->get($enrollment->education_level_id);

                // These two columns on the screen are two components of the
                // year, so a level whose scheme has no place for them cannot
                // take a mark this way - it would be recorded at no weight
                // and count for nothing, which looks like entering a mark and
                // is not.
                $missing = collect($columns)
                    ->filter(fn ($label, $key) => array_key_exists($key, $row) && $row[$key] !== null)
                    ->reject(fn ($label) => $scheme === null || $scheme->firstWhere('label', $label) !== null);

                if ($missing->isNotEmpty()) {
                    $rejected[] = [
                        'enrollment_id' => $enrollment->id,
                        'message' => 'نظام احتساب هذا المستوى لا يتضمن ' . $missing->implode('، ') . ' — استعمل نافذة نقط السنة.',
                    ];

                    continue;
                }

                if (array_key_exists('grade_scale', $row) && $row['grade_scale'] !== null) {
                    $enrollment->update(['grade_scale' => $row['grade_scale']]);
                    // The ceiling on screen is the one these marks were given
                    // on; leaving the rows behind would silently re-price them.
                    $enrollment->grades()
                        ->whereIn('label', array_values($columns))
                        ->update(['scale' => $row['grade_scale']]);
                }

                // Only the keys actually sent are touched, so a null clears a
                // mark on purpose while an absent key leaves it alone.
                foreach ($columns as $key => $label) {
                    if (! array_key_exists($key, $row)) {
                        continue;
                    }

                    if ($row[$key] === null) {
                        $enrollment->grades()->where('label', $label)->delete();

                        continue;
                    }

                    $component = $scheme?->firstWhere('label', $label);

                    $enrollment->grades()->updateOrCreate(
                        ['label' => $label],
                        [
                            'mark' => $row[$key],
                            'scale' => $scale,
                            'weight' => $component?->weight ?? 0,
                            'sort_order' => $component?->sort_order ?? 0,
                        ],
                    );
                }

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
     * The ceiling the year's mark is expressed on. The marks themselves are
     * rows, each with its own scale, saved through the grade endpoints.
     */
    private function gradeRules(Request $request, ?OrphanEnrollment $enrollment = null): array
    {
        return [
            'grade_scale' => ['nullable', 'numeric', 'min:1', 'max:1000'],
        ];
    }

    /** Where the student is studying, and what help they get while doing it. */
    private function placementRules(): array
    {
        return [
            'education_level_id' => ['nullable', 'integer', 'exists:orphans_education_level,id'],
            'school_id' => ['nullable', 'integer', 'exists:schools,id'],
            'specialty' => ['nullable', 'string', 'max:150'],
            'higher_education_phase' => ['nullable', Rule::in(array_keys(OrphanEnrollment::HIGHER_EDUCATION_PHASES))],
            // Eight is past a doctorate and well past a repeated licence year;
            // anything beyond it is a typo rather than a student.
            'higher_education_year' => ['nullable', 'integer', 'min:1', 'max:8'],
            'has_tutoring' => ['sometimes', 'boolean'],
            'tutoring_subjects' => ['nullable', 'string', 'max:255'],
            'tutoring_provider' => ['nullable', 'string', 'max:150'],
            'notes' => ['nullable', 'string', 'max:500'],
        ];
    }

    private function messages(): array
    {
        return [
            'higher_education_phase.in' => 'سلك التعليم العالي غير معروف',
            'higher_education_year.min' => 'سنة التعليم العالي تبدأ من 1',
            'higher_education_year.max' => 'سنة التعليم العالي لا يمكن أن تتجاوز 8',
            'academic_year_id.exists' => 'السنة الدراسية غير موجودة',
        ];
    }

    /** One enrollment per student per year is the whole point of the table. */
    private function alreadyEnrolled(int $orphanId, int $academicYearId, ?int $ignoreId = null): bool
    {
        return OrphanEnrollment::where('orphan_id', $orphanId)
            ->where('academic_year_id', $academicYearId)
            ->when($ignoreId, fn ($q) => $q->whereKeyNot($ignoreId))
            ->exists();
    }

    /**
     * Keep the course fields and the placement telling the same story.
     *
     * A record that is not in higher education has no business carrying a
     * licence year - it would show up on the card as a university the student
     * has left, or never reached. And a record that *is* in higher education
     * with no year set is a first year; storing that beats rendering a blank
     * where a year belongs.
     *
     * Resolved from whatever the request did not send, so a partial update -
     * the status buttons send only a status - cannot change the answer by
     * omission.
     */
    private function withCourseConsistency(array $attributes, ?OrphanEnrollment $existing = null): array
    {
        $resolve = fn (string $key, $fallback) => array_key_exists($key, $attributes) ? $attributes[$key] : $fallback;

        $phase = $resolve('higher_education_phase', $existing?->higher_education_phase);
        $schoolId = $resolve('school_id', $existing?->school_id);
        $levelId = $resolve('education_level_id', $existing?->education_level_id);

        $isHigherEducation = $phase !== null
            || ($schoolId && School::whereKey($schoolId)->value('type') === School::TYPE_UNIVERSITY)
            || ($levelId && str_contains(
                (string) OrphansEducationLevel::whereKey($levelId)->value('name_ar'),
                'جامع',
            ));

        if (!$isHigherEducation) {
            $attributes['higher_education_phase'] = null;
            $attributes['higher_education_year'] = null;

            return $attributes;
        }

        $attributes['higher_education_year'] = $resolve('higher_education_year', $existing?->higher_education_year) ?: 1;

        return $attributes;
    }

    private function validateEnrollment(Request $request): array
    {
        return $request->validate([
            'orphan_id' => ['required', 'integer', 'exists:orphans,id'],
            'academic_year_id' => ['required', 'integer', 'exists:academic_years,id'],
            ...$this->placementRules(),
            ...$this->gradeRules($request),
        ], [
            'orphan_id.required' => 'اليتيم مطلوب',
            'orphan_id.exists' => 'اليتيم غير موجود',
            'academic_year_id.required' => 'السنة الدراسية مطلوبة',
            ...$this->messages(),
        ]);
    }
}
