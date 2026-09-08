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
        'status',
        'notes',
    ];

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
