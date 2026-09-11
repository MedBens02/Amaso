<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

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
        'first_semester_grade',
        'second_semester_grade',
        'grade_scale',
        'has_tutoring',
        'tutoring_subjects',
        'tutoring_provider',
        'status',
        'notes',
    ];

    protected $casts = [
        'first_semester_grade' => 'decimal:2',
        'second_semester_grade' => 'decimal:2',
        'grade_scale' => 'decimal:2',
        'higher_education_year' => 'integer',
        'has_tutoring' => 'boolean',
    ];

    protected $appends = ['average_grade', 'grade_percentage', 'higher_education_label'];

    /**
     * The year's mark: the mean of both semesters once both are in, and the
     * single recorded semester before that - so a student is rankable mid-year
     * without a half-empty average dragging them down.
     */
    public function getAverageGradeAttribute(): ?float
    {
        $marks = array_values(array_filter(
            [$this->first_semester_grade, $this->second_semester_grade],
            fn ($mark) => $mark !== null,
        ));

        return $marks === [] ? null : round(array_sum($marks) / count($marks), 2);
    }

    /**
     * Schools mark out of 20, some faculties out of another ceiling; comparing
     * percentages is the only way a mixed ranking means anything.
     */
    public function getGradePercentageAttribute(): ?float
    {
        $average = $this->average_grade;
        $scale = (float) ($this->grade_scale ?: 20);

        return $average === null || $scale <= 0 ? null : round($average / $scale * 100, 2);
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
}
