<?php

namespace App\Services;

use App\Models\AcademicYear;
use App\Models\OrphanEnrollment;
use Illuminate\Support\Collection;

/**
 * School performance reporting.
 *
 * Everything here is derived from `orphan_enrollments`: one row per student
 * per academic year, carrying the two semester marks. Rankings compare
 * percentages rather than raw marks, because a faculty marking out of 100 and
 * a primary school marking out of 20 otherwise end up in the same list with
 * the faculty always on top.
 *
 * Students with no mark recorded are never ranked - they are reported
 * separately as "not yet graded" so a thin ranking is visibly thin rather
 * than quietly wrong.
 */
class SchoolPerformanceService
{
    public const SEMESTER_FIRST = 'first';
    public const SEMESTER_SECOND = 'second';
    public const SEMESTER_AVERAGE = 'average';

    /** How a ranking is cut up before top_n is applied. */
    public const GROUP_NONE = 'none';
    public const GROUP_LEVEL = 'level';
    public const GROUP_SCHOOL = 'school';
    public const GROUP_GENDER = 'gender';

    /**
     * @param array{
     *   academic_year_id?: int|null,
     *   gender?: string|null,
     *   education_level_id?: int|null,
     *   school_id?: int|null,
     *   school_type?: string|null,
     *   is_private?: bool|null,
     *   is_amaso_linked?: bool|null,
     *   semester?: string|null,
     *   group_by?: string|null,
     *   top_n?: int|null,
     *   min_grade?: float|null,
     * } $filters
     */
    public function report(array $filters): array
    {
        $semester = $filters['semester'] ?? self::SEMESTER_AVERAGE;
        $year = $this->resolveYear($filters['academic_year_id'] ?? null);

        $enrollments = $this->query($filters, $year?->id)->get();

        [$graded, $ungraded] = $enrollments->partition(
            fn (OrphanEnrollment $row) => $this->markFor($row, $semester) !== null,
        );

        $ranked = $graded
            ->sortByDesc(fn (OrphanEnrollment $row) => $this->percentageFor($row, $semester))
            ->values();

        $topN = $filters['top_n'] ?? null;
        $groupBy = $filters['group_by'] ?? self::GROUP_NONE;

        // Grouped, top_n is per group: "the top 3 of every class" is a different
        // question from "the top 3 overall", and it is the one an association
        // handing out prizes per class actually asks.
        $groups = $groupBy === self::GROUP_NONE
            ? []
            : $this->rankWithinGroups($ranked, $groupBy, $semester, $topN);

        $leaderboard = ($topN && $groupBy === self::GROUP_NONE ? $ranked->take($topN) : $ranked)
            ->values()
            ->map(fn (OrphanEnrollment $row, int $index) => $this->studentRow($row, $index + 1, $semester));

        return [
            'academic_year' => $year ? ['id' => $year->id, 'label' => $year->label] : null,
            'semester' => $semester,
            'group_by' => $groupBy,
            'groups' => $groups,
            'filters' => $this->describeFilters($filters),
            'totals' => [
                'students' => $enrollments->count(),
                'graded' => $graded->count(),
                'ungraded' => $ungraded->count(),
                'average_percentage' => $this->averagePercentage($graded, $semester),
                'pass_rate' => $this->passRate($graded, $semester),
            ],
            'students' => $leaderboard->all(),
            'by_school' => $this->groupBy($graded, $semester, fn ($row) => $row->school?->name ?? 'غير محدد'),
            'by_level' => $this->groupBy($graded, $semester, fn ($row) => $row->educationLevel?->name_ar ?? 'غير محدد'),
            'by_gender' => $this->groupBy($graded, $semester, fn ($row) => $row->orphan?->gender ?? 'unknown'),
            'by_sector' => $this->groupBy(
                $graded,
                $semester,
                fn ($row) => $row->school === null ? 'غير محدد' : ($row->school->is_private ? 'خاص' : 'عمومي'),
            ),
            'ungraded_students' => $ungraded
                ->map(fn (OrphanEnrollment $row) => $this->studentRow($row, null, $semester))
                ->values()
                ->all(),
        ];
    }

    /**
     * Splits the ranking and re-ranks inside each part, so every group's first
     * place is a first place. Groups are ordered by their own average, and the
     * ones with nobody graded are dropped rather than printed empty.
     *
     * @param  Collection<int, OrphanEnrollment>  $ranked
     */
    private function rankWithinGroups(Collection $ranked, string $groupBy, string $semester, ?int $topN): array
    {
        $key = match ($groupBy) {
            self::GROUP_SCHOOL => fn (OrphanEnrollment $row) => $row->school?->name ?? 'غير محدد',
            self::GROUP_GENDER => fn (OrphanEnrollment $row) => match ($row->orphan?->gender) {
                'male' => 'ذكور', 'female' => 'إناث', default => 'غير محدد',
            },
            default => fn (OrphanEnrollment $row) => $row->educationLevel?->name_ar ?? 'غير محدد',
        };

        return $ranked
            ->groupBy($key)
            ->map(function (Collection $group, $label) use ($semester, $topN) {
                // The parent collection is already sorted, so group order holds.
                $members = ($topN ? $group->take($topN) : $group)->values();

                return [
                    'label' => (string) $label,
                    'students_total' => $group->count(),
                    'students_listed' => $members->count(),
                    'average_percentage' => $this->averagePercentage($group, $semester),
                    'pass_rate' => $this->passRate($group, $semester),
                    'students' => $members
                        ->map(fn (OrphanEnrollment $row, int $i) => $this->studentRow($row, $i + 1, $semester))
                        ->all(),
                ];
            })
            ->sortByDesc('average_percentage')
            ->values()
            ->all();
    }

    private function query(array $filters, ?int $yearId)
    {
        return OrphanEnrollment::with(['orphan.widow', 'academicYear', 'educationLevel', 'school'])
            ->when($yearId, fn ($q) => $q->where('academic_year_id', $yearId))
            ->when(
                !empty($filters['education_level_id']),
                fn ($q) => $q->where('education_level_id', $filters['education_level_id']),
            )
            ->when(!empty($filters['school_id']), fn ($q) => $q->where('school_id', $filters['school_id']))
            ->when(
                !empty($filters['gender']),
                fn ($q) => $q->whereHas('orphan', fn ($o) => $o->where('gender', $filters['gender'])),
            )
            ->whereHas('orphan', fn ($o) => $o->whereNull('deleted_at'))
            ->when(
                !empty($filters['school_type']),
                fn ($q) => $q->whereHas('school', fn ($s) => $s->where('type', $filters['school_type'])),
            )
            ->when(
                isset($filters['is_private']),
                fn ($q) => $q->whereHas('school', fn ($s) => $s->where('is_private', (bool) $filters['is_private'])),
            )
            ->when(
                isset($filters['is_amaso_linked']),
                fn ($q) => $q->whereHas(
                    'school',
                    fn ($s) => $s->where('is_amaso_linked', (bool) $filters['is_amaso_linked']),
                ),
            );
    }

    private function resolveYear(?int $yearId): ?AcademicYear
    {
        return $yearId
            ? AcademicYear::find($yearId)
            : AcademicYear::where('is_current', true)->first();
    }

    private function markFor(OrphanEnrollment $row, string $semester): ?float
    {
        return match ($semester) {
            self::SEMESTER_FIRST => $row->first_semester_grade === null ? null : (float) $row->first_semester_grade,
            self::SEMESTER_SECOND => $row->second_semester_grade === null ? null : (float) $row->second_semester_grade,
            default => $row->average_grade,
        };
    }

    private function percentageFor(OrphanEnrollment $row, string $semester): ?float
    {
        $mark = $this->markFor($row, $semester);
        $scale = (float) ($row->grade_scale ?: 20);

        return $mark === null || $scale <= 0 ? null : round($mark / $scale * 100, 2);
    }

    private function studentRow(OrphanEnrollment $row, ?int $rank, string $semester): array
    {
        $orphan = $row->orphan;

        return [
            'rank' => $rank,
            'enrollment_id' => $row->id,
            'orphan_id' => $orphan?->id,
            'full_name' => $orphan ? trim("{$orphan->first_name} {$orphan->last_name}") : 'غير معروف',
            'gender' => $orphan?->gender,
            'birth_date' => $orphan?->birth_date,
            'masar_code' => $orphan?->masar_code,
            'widow_id' => $orphan?->widow_id,
            'family' => $orphan?->widow?->full_name,
            'school' => $row->school?->name,
            'school_type' => $row->school?->type,
            'is_private' => $row->school?->is_private,
            'education_level' => $row->educationLevel?->name_ar,
            'specialty' => $row->specialty,
            'status' => $row->status,
            'first_semester_grade' => $row->first_semester_grade === null ? null : (float) $row->first_semester_grade,
            'second_semester_grade' => $row->second_semester_grade === null ? null : (float) $row->second_semester_grade,
            'grade_scale' => (float) ($row->grade_scale ?: 20),
            'grade' => $this->markFor($row, $semester),
            'percentage' => $this->percentageFor($row, $semester),
        ];
    }

    /**
     * @param  Collection<int, OrphanEnrollment>  $rows
     */
    private function groupBy(Collection $rows, string $semester, callable $key): array
    {
        return $rows
            ->groupBy($key)
            ->map(fn (Collection $group, $label) => [
                'label' => (string) $label,
                'students' => $group->count(),
                'average_percentage' => $this->averagePercentage($group, $semester),
                'pass_rate' => $this->passRate($group, $semester),
                'best' => $group
                    ->sortByDesc(fn (OrphanEnrollment $row) => $this->percentageFor($row, $semester))
                    ->first()?->orphan?->first_name,
            ])
            ->sortByDesc('average_percentage')
            ->values()
            ->all();
    }

    /**
     * @param  Collection<int, OrphanEnrollment>  $rows
     */
    private function averagePercentage(Collection $rows, string $semester): ?float
    {
        $percentages = $rows
            ->map(fn (OrphanEnrollment $row) => $this->percentageFor($row, $semester))
            ->filter(fn (?float $value) => $value !== null);

        return $percentages->isEmpty() ? null : round($percentages->avg(), 2);
    }

    /**
     * Half marks is the Moroccan pass line, so the rate is measured on the
     * percentage rather than the raw mark and holds across scales.
     *
     * @param  Collection<int, OrphanEnrollment>  $rows
     */
    private function passRate(Collection $rows, string $semester): ?float
    {
        $percentages = $rows
            ->map(fn (OrphanEnrollment $row) => $this->percentageFor($row, $semester))
            ->filter(fn (?float $value) => $value !== null);

        if ($percentages->isEmpty()) {
            return null;
        }

        return round($percentages->filter(fn (float $value) => $value >= 50)->count() / $percentages->count() * 100, 2);
    }

    private function describeFilters(array $filters): array
    {
        return [
            'gender' => $filters['gender'] ?? null,
            'education_level_id' => $filters['education_level_id'] ?? null,
            'school_id' => $filters['school_id'] ?? null,
            'school_type' => $filters['school_type'] ?? null,
            'is_private' => $filters['is_private'] ?? null,
            'is_amaso_linked' => $filters['is_amaso_linked'] ?? null,
            'top_n' => $filters['top_n'] ?? null,
            'group_by' => $filters['group_by'] ?? self::GROUP_NONE,
        ];
    }
}
