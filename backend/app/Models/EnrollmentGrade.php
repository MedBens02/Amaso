<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** One named mark on an enrollment - an exam, a test, a resit. */
class EnrollmentGrade extends Model
{
    use HasFactory;

    protected $fillable = [
        'enrollment_id',
        'label',
        'mark',
        'scale',
        'sort_order',
    ];

    protected $casts = [
        'mark' => 'decimal:2',
        'scale' => 'decimal:2',
        'sort_order' => 'integer',
    ];

    protected $appends = ['percentage'];

    public function enrollment(): BelongsTo
    {
        return $this->belongsTo(OrphanEnrollment::class, 'enrollment_id');
    }

    /**
     * The mark as a percentage, which is the only way to compare one out of
     * 20 with one out of 40.
     */
    public function getPercentageAttribute(): ?float
    {
        $scale = (float) $this->scale;

        return $scale > 0 ? round((float) $this->mark / $scale * 100, 1) : null;
    }
}
