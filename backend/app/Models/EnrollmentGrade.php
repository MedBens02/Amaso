<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * One named mark on an enrollment, and what it counts for.
 *
 * The weight is a percentage of the year's mark, copied from the level's
 * scheme when the mark is entered. Zero is a real answer: a mock exam or an
 * uncounted resit is worth recording and worth nothing in the average.
 */
class EnrollmentGrade extends Model
{
    use HasFactory;

    protected $fillable = [
        'enrollment_id',
        'label',
        'mark',
        'scale',
        'weight',
        'sort_order',
    ];

    protected $casts = [
        'mark' => 'decimal:2',
        'scale' => 'decimal:2',
        'weight' => 'decimal:2',
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
     *
     * Rounded, because this is the figure shown beside the mark. Anything
     * averaging several of these wants exactPercentage() instead: rounding
     * each part before combining them moves the year's mark by a centime of
     * a point, which is visible next to a pass line at exactly half marks.
     */
    public function getPercentageAttribute(): ?float
    {
        $exact = $this->exactPercentage();

        return $exact === null ? null : round($exact, 1);
    }

    /** The same figure unrounded, for arithmetic that combines marks. */
    public function exactPercentage(): ?float
    {
        $scale = (float) $this->scale;

        return $scale > 0 ? (float) $this->mark / $scale * 100 : null;
    }
}
