<?php

namespace App\Services;

use App\Exceptions\BusinessRuleException;
use App\Models\AcademicYear;
use App\Models\OrphanEnrollment;
use App\Models\OrphansEducationLevel;
use Illuminate\Support\Facades\DB;

class EducationService
{
    /**
     * The Moroccan ladder, in the words the reference levels are written in.
     *
     * Matched against `orphans_education_level.name_ar` because that list is
     * editable by the association - keying off row ids would break the first
     * time somebody renamed or reordered a level.
     */
    private const STAGE_KEYWORDS = [
        'preschool' => ['روضة'],
        'primary' => ['ابتدائ'],
        'middle' => ['إعداد', 'اعداد'],
        'secondary' => ['ثانو'],
        'higher' => ['جامع'],
    ];

    /** A level that records an ending rather than a year of study. */
    private const TERMINAL_KEYWORD = 'تخرج';

    /**
     * Close the current academic year and open the next one
     * (e.g. 2025/2026 -> 2026/2027).
     *
     * Every enrollment of the closing year must already be marked
     * (passed / failed / left). Failed students repeat their year exactly as
     * it stood. Passed students move up: one rung of the ladder at school,
     * one year of their course in higher education.
     *
     * Two cases are deliberately *not* decided here, because they are the
     * association's to decide and not a matter of arithmetic:
     *
     *  - A student who has passed the last year of secondary school, or the
     *    last year of a higher-education course, has finished a stage. Where
     *    they go next - a faculty, an institute, a trade, nowhere - is a
     *    choice. They get no next-year record and are returned in
     *    `needs_placement` for someone to place.
     *  - A student who moves from one stage to the next (primary to middle,
     *    middle to secondary) is almost certainly changing institution too.
     *    The record is created without one and returned in `needs_school`,
     *    rather than quietly carrying last year's primary school forward.
     *
     * Tutoring and the marking scale carry over as defaults: they describe
     * the support a student gets, which rarely changes from one year to the
     * next, and re-entering them for the whole roll every September is the
     * work this is meant to avoid.
     *
     * @return array{closed: string, opened: string, promoted: int, repeated: int,
     *               needs_placement: list<array{orphan_id: int, name: string, reason: string}>,
     *               needs_school: list<array{orphan_id: int, name: string, level: ?string}>}
     */
    public function rollover(): array
    {
        return DB::transaction(function () {
            $current = AcademicYear::where('is_current', true)->lockForUpdate()->first();

            if (!$current) {
                throw new BusinessRuleException('لا توجد سنة دراسية حالية. أنشئ سنة دراسية أولاً.', 422);
            }

            $pending = OrphanEnrollment::where('academic_year_id', $current->id)
                ->where('status', OrphanEnrollment::STATUS_ENROLLED)
                ->count();

            if ($pending > 0) {
                throw new BusinessRuleException(
                    "يوجد {$pending} تسجيلات لم تُحدد نتيجتها بعد (ناجح/راسب/غادر). حدد جميع النتائج قبل إغلاق السنة الدراسية.",
                    422
                );
            }

            $next = AcademicYear::firstOrCreate(
                ['start_year' => $current->start_year + 1],
                ['label' => AcademicYear::labelFor($current->start_year + 1), 'is_current' => false]
            );

            $promoted = 0;
            $repeated = 0;
            $needsPlacement = [];
            $needsSchool = [];

            $enrollments = OrphanEnrollment::with(['orphan', 'educationLevel', 'school'])
                ->where('academic_year_id', $current->id)
                ->whereIn('status', [OrphanEnrollment::STATUS_PASSED, OrphanEnrollment::STATUS_FAILED])
                ->get();

            foreach ($enrollments as $enrollment) {
                $passed = $enrollment->status === OrphanEnrollment::STATUS_PASSED;
                $placement = $passed ? $this->promote($enrollment) : $this->repeat($enrollment);
                $name = trim("{$enrollment->orphan?->first_name} {$enrollment->orphan?->last_name}") ?: '—';

                if ($placement === null) {
                    $needsPlacement[] = [
                        'orphan_id' => $enrollment->orphan_id,
                        'name' => $name,
                        'reason' => $this->finishedStageReason($enrollment),
                    ];

                    continue;
                }

                OrphanEnrollment::firstOrCreate(
                    ['orphan_id' => $enrollment->orphan_id, 'academic_year_id' => $next->id],
                    [
                        ...$placement,
                        'status' => OrphanEnrollment::STATUS_ENROLLED,
                        'grade_scale' => $enrollment->grade_scale,
                        'has_tutoring' => $enrollment->has_tutoring,
                        'tutoring_subjects' => $enrollment->tutoring_subjects,
                        'tutoring_provider' => $enrollment->tutoring_provider,
                    ]
                );

                if ($placement['school_id'] === null && $enrollment->school_id !== null) {
                    $needsSchool[] = [
                        'orphan_id' => $enrollment->orphan_id,
                        'name' => $name,
                        'level' => OrphansEducationLevel::whereKey($placement['education_level_id'])->value('name_ar'),
                    ];
                }

                $passed ? $promoted++ : $repeated++;
            }

            $current->update(['is_current' => false]);
            $next->update(['is_current' => true]);

            return [
                'closed' => $current->label,
                'opened' => $next->label,
                'promoted' => $promoted,
                'repeated' => $repeated,
                'needs_placement' => $needsPlacement,
                'needs_school' => $needsSchool,
            ];
        });
    }

    /** A repeated year is last year over again, marks excepted. */
    private function repeat(OrphanEnrollment $enrollment): array
    {
        return [
            'education_level_id' => $enrollment->education_level_id,
            'school_id' => $enrollment->school_id,
            'specialty' => $enrollment->specialty,
            'higher_education_phase' => $enrollment->higher_education_phase,
            'higher_education_year' => $enrollment->higher_education_year,
        ];
    }

    /** The next year up, or null when the student has finished a stage. */
    private function promote(OrphanEnrollment $enrollment): ?array
    {
        if ($enrollment->isHigherEducation()) {
            return $this->promoteWithinCourse($enrollment);
        }

        $level = $enrollment->educationLevel;
        $nextLevel = $level ? $this->nextLevel($level) : null;

        // Already sitting on a graduation marker, or at the top of the ladder:
        // there is no further year to move them into.
        if (!$level || $this->isTerminal($level) || !$nextLevel) {
            return null;
        }

        // The next rung is the graduation marker - so the year they just
        // passed was the last of the stage.
        if ($this->isTerminal($nextLevel)) {
            return null;
        }

        $changesStage = $this->stageOf($level) !== $this->stageOf($nextLevel);

        return [
            'education_level_id' => $nextLevel->id,
            // A new stage means a new institution; carrying the old one over
            // is worse than leaving it to be filled in.
            'school_id' => $changesStage ? null : $enrollment->school_id,
            'specialty' => $changesStage ? null : $enrollment->specialty,
            'higher_education_phase' => null,
            'higher_education_year' => null,
        ];
    }

    /** One more year of the same course, until its last year is passed. */
    private function promoteWithinCourse(OrphanEnrollment $enrollment): ?array
    {
        $phase = $enrollment->higher_education_phase;
        $year = $enrollment->higher_education_year ?: 1;
        $length = OrphanEnrollment::HIGHER_EDUCATION_PHASES[$phase]['years'] ?? null;

        // No course recorded: the record says "university" and nothing more,
        // so there is no year to advance and no end to detect.
        if ($phase === null) {
            return null;
        }

        if ($length !== null && $year >= $length) {
            return null;
        }

        return [
            'education_level_id' => $enrollment->education_level_id,
            'school_id' => $enrollment->school_id,
            'specialty' => $enrollment->specialty,
            'higher_education_phase' => $phase,
            'higher_education_year' => $year + 1,
        ];
    }

    private function finishedStageReason(OrphanEnrollment $enrollment): string
    {
        if ($enrollment->isHigherEducation()) {
            $course = OrphanEnrollment::HIGHER_EDUCATION_PHASES[$enrollment->higher_education_phase]['label'] ?? null;

            return $course
                ? "أنهى {$course} - يحتاج إلى توجيه"
                : 'مسجل في التعليم العالي بدون سلك محدد - يحتاج إلى تحديد السلك';
        }

        return 'أنهى الثانوية - يحتاج إلى اختيار مؤسسة للتعليم العالي';
    }

    private function nextLevel(OrphansEducationLevel $level): ?OrphansEducationLevel
    {
        return OrphansEducationLevel::where('is_active', true)
            ->where('sort_order', '>', $level->sort_order)
            ->orderBy('sort_order')
            ->first();
    }

    private function isTerminal(OrphansEducationLevel $level): bool
    {
        return str_contains((string) $level->name_ar, self::TERMINAL_KEYWORD);
    }

    private function stageOf(?OrphansEducationLevel $level): ?string
    {
        $name = (string) $level?->name_ar;

        foreach (self::STAGE_KEYWORDS as $stage => $keywords) {
            foreach ($keywords as $keyword) {
                if (str_contains($name, $keyword)) {
                    return $stage;
                }
            }
        }

        return null;
    }
}
