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

    protected $fillable = [
        'orphan_id',
        'academic_year_id',
        'education_level_id',
        'school_id',
        'specialty',
        'first_semester_grade',
        'second_semester_grade',
        'grade_scale',
        'status',
        'notes',
    ];

    protected $casts = [
        'first_semester_grade' => 'decimal:2',
        'second_semester_grade' => 'decimal:2',
        'grade_scale' => 'decimal:2',
    ];

    protected $appends = ['average_grade', 'grade_percentage'];

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
