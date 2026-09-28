<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class OrphanEnrollment extends Model
{
    use HasFactory;

    public const STATUS_ENROLLED = 'enrolled';
    public const STATUS_PASSED = 'passed';
    public const STATUS_FAILED = 'failed';
    public const STATUS_LEFT = 'left';

    /**
     * Higher-education courses, and how many years each nominally runs for.
     *
     * The length is what the rollover uses to know when a student has reached
     * the end of a course rather than simply another year of it. Nominal, not
     * binding: a repeated year pushes a student past it, which is why passing
     * the last year is what ends a course, not the count on its own.
     */
    public const HIGHER_EDUCATION_PHASES = [
        'preparatory' => ['label' => 'أقسام تحضيرية', 'years' => 2],
        'technician' => ['label' => 'تقني متخصص', 'years' => 2],
        'licence' => ['label' => 'إجازة', 'years' => 3],
        'master' => ['label' => 'ماستر', 'years' => 2],
        'doctorate' => ['label' => 'دكتوراه', 'years' => 3],
        'other' => ['label' => 'تكوين آخر', 'years' => 2],
    ];

    protected $fillable = [
        'orphan_id',
        'academic_year_id',
        'education_level_id',
        'school_id',
        'specialty',
        'higher_education_phase',
        'higher_education_year',
        // The marks themselves live in enrollment_grades, one row each with
        // what it counts for. This is only the ceiling the year's mark is
        // expressed on.
        'grade_scale',
        'has_tutoring',
        'tutoring_subjects',
        'tutoring_provider',
        'status',
        'notes',
    ];

    protected $casts = [
        'grade_scale' => 'decimal:2',
        'higher_education_year' => 'integer',
        'has_tutoring' => 'boolean',
    ];

    protected $appends = ['average_grade', 'grade_percentage', 'higher_education_label'];

    /**
     * The year's mark, expressed on this enrollment's own ceiling.
     *
     * Rounded once, from the exact weighted figure rather than from the
     * rounded percentage beside it - rounding twice moved a mark by a
     * hundredth, which is visible next to a pass line drawn at exactly half.
     */
    public function getAverageGradeAttribute(): ?float
    {
        $percentage = $this->weightedPercentage();
        $scale = (float) ($this->grade_scale ?: 20);

        return $percentage === null ? null : self::round2($percentage / 100 * $scale);
    }

    /**
     * The year's mark as a percentage: every mark weighted by what it counts
     * for, which is the only way to compare a baccalaureate year against a
     * primary one.
     */
    public function getGradePercentageAttribute(): ?float
    {
        $percentage = $this->weightedPercentage();

        return $percentage === null ? null : self::round2($percentage);
    }

    /**
     * The weighted mean of this year's marks, unrounded, as a percentage.
     *
     * Divided by the weight actually present rather than by 100, so a student
     * with only the first semester in is rankable on that alone instead of
     * being dragged down by the exam they have not sat yet - the same
     * principle the old two-semester mean followed, and for two semesters at
     * half each it produces exactly the figure that mean did.
     *
     * A mark weighted zero is on the record and out of the average: a mock
     * exam, a resit that did not count, or a mark entered against a level
     * whose scheme has no place for it. There is deliberately no fallback
     * that averages weightless marks anyway - "worth nothing" is an answer,
     * and quietly counting a practice paper towards the year would be worse
     * than showing no mark at all.
     */
    /**
     * One of this year's marks by name, or null if it was never recorded.
     *
     * The two semesters used to be columns and everything read them directly.
     * They are rows now, and a level is free to have neither - so everywhere
     * that wants "the first semester mark" asks for it by name and copes with
     * not getting one.
     */
    public function markNamed(string $label): ?EnrollmentGrade
    {
        return $this->grades->firstWhere('label', $label);
    }

    /** The first semester's mark, for the screens and cards that show it. */
    public function getFirstSemesterGradeAttribute(): ?float
    {
        $grade = $this->markNamed(EducationLevelGradeComponent::DEFAULT_SCHEME[0]['label']);

        return $grade === null ? null : (float) $grade->mark;
    }

    /** The second semester's mark. */
    public function getSecondSemesterGradeAttribute(): ?float
    {
        $grade = $this->markNamed(EducationLevelGradeComponent::DEFAULT_SCHEME[1]['label']);

        return $grade === null ? null : (float) $grade->mark;
    }

    /**
     * Round to a hundredth without the last bit of the float deciding.
     *
     * A year's marks can land exactly on a rounding boundary - two marks of
     * 15.15 and 13.84 average to precisely 14.495 - and binary floating point
     * stores that as either a hair above or a hair below depending on which
     * arithmetic got there. One route rounded to 14.50 and the other to
     * 14.49. The pass line is drawn at exactly half marks, so a hundredth is
     * the difference between a pass and a fail for a student sitting on it.
     *
     * Rounding at six decimals first absorbs that representation error -
     * marks are recorded to two, so there is nothing real down there to lose
     * - and the second round then has a number that is actually 14.495.
     */
    private static function round2(float $value): float
    {
        return round(round($value, 6), 2);
    }

    private function weightedPercentage(): ?float
    {
        $weighted = 0.0;
        $weights = 0.0;

        foreach ($this->grades as $grade) {
            $percentage = $grade->exactPercentage();
            $weight = (float) $grade->weight;

            if ($percentage === null || $weight <= 0) {
                continue;
            }

            $weighted += $percentage * $weight;
            $weights += $weight;
        }

        return $weights > 0 ? $weighted / $weights : null;
    }

    /**
     * Whether this enrollment sits above secondary school.
     *
     * Deliberately not a single test. The reference ladder carries one
     * "جامعي" rung, the institution carries a type, and the enrollment
     * carries a course - any of the three is enough, because a record can be
     * placed at an institute before its level is set, or given a course
     * before its institution is chosen.
     */
    public function isHigherEducation(): bool
    {
        return $this->higher_education_phase !== null
            || $this->school?->type === School::TYPE_UNIVERSITY
            || str_contains((string) $this->educationLevel?->name_ar, 'جامع');
    }

    /** "إجازة - السنة 2", for a card or a table cell. */
    public function getHigherEducationLabelAttribute(): ?string
    {
        $phase = self::HIGHER_EDUCATION_PHASES[$this->higher_education_phase]['label'] ?? null;
        $year = $this->higher_education_year ? "السنة {$this->higher_education_year}" : null;

        return implode(' - ', array_filter([$phase, $year])) ?: null;
    }

    public function orphan(): BelongsTo
    {
        return $this->belongsTo(Orphan::class)->withTrashed();
    }

    /** The named exam marks, in the order they were entered. */
    public function grades(): HasMany
    {
        return $this->hasMany(EnrollmentGrade::class, 'enrollment_id')->orderBy('sort_order')->orderBy('id');
    }

    public function academicYear(): BelongsTo
    {
        return $this->belongsTo(AcademicYear::class);
    }

    public function educationLevel(): BelongsTo
    {
        return $this->belongsTo(OrphansEducationLevel::class, 'education_level_id');
    }

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    /**
     * How this child gets to the centre this year.
     *
     * Plural because the record keeps the arrangement that ended beside the
     * one that replaced it - a child who moves house comes off the bus and
     * onto an allowance, and both belong in the history. Only one is live.
     */
    public function transportSupport(): HasMany
    {
        return $this->hasMany(TransportSupport::class, 'enrollment_id');
    }
}
