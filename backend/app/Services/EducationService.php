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
     * Close the current academic year and open the next one
     * (e.g. 2025/2026 -> 2026/2027).
     *
     * Every enrollment of the closing year must already be marked
     * (passed / failed / left). Passed students are re-enrolled in the next
     * year one education level up; failed students repeat their level.
     * School and specialty carry over as defaults and can be edited after.
     *
     * @return array{closed: string, opened: string, promoted: int, repeated: int}
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

            $enrollments = OrphanEnrollment::where('academic_year_id', $current->id)
                ->whereIn('status', [OrphanEnrollment::STATUS_PASSED, OrphanEnrollment::STATUS_FAILED])
                ->get();

            foreach ($enrollments as $enrollment) {
                $passed = $enrollment->status === OrphanEnrollment::STATUS_PASSED;

                OrphanEnrollment::firstOrCreate(
                    ['orphan_id' => $enrollment->orphan_id, 'academic_year_id' => $next->id],
                    [
                        'education_level_id' => $passed
                            ? $this->nextLevelId($enrollment->education_level_id)
                            : $enrollment->education_level_id,
                        'school_id' => $enrollment->school_id,
                        'specialty' => $enrollment->specialty,
                        'status' => OrphanEnrollment::STATUS_ENROLLED,
                    ]
                );

                $passed ? $promoted++ : $repeated++;
            }

            $current->update(['is_current' => false]);
            $next->update(['is_current' => true]);

            return [
                'closed' => $current->label,
                'opened' => $next->label,
                'promoted' => $promoted,
                'repeated' => $repeated,
            ];
        });
    }

    /** The next active education level in the ladder, or the same one at the top. */
    private function nextLevelId(?int $levelId): ?int
    {
        if (!$levelId) {
            return null;
        }

        $level = OrphansEducationLevel::find($levelId);
        if (!$level) {
            return null;
        }

        $next = OrphansEducationLevel::where('is_active', true)
            ->where('sort_order', '>', $level->sort_order)
            ->orderBy('sort_order')
            ->first();

        return $next?->id ?? $levelId;
    }
}
