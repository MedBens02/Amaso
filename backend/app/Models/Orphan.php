<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class Orphan extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $fillable = [
        'widow_id',
        'first_name',
        'last_name',
        'gender',
        'birth_date',
        'education_level_id',
        'health_status',
        'phone',
        'cin',
        'is_working',
        'work_type',
        'is_work_permanent',
        'is_married',
        'is_schooled',
        'masar_code',
        'is_not_interested',
        'is_inactive',
    ];

    protected $casts = [
        'birth_date' => 'date',
        'is_working' => 'boolean',
        'is_work_permanent' => 'boolean',
        'is_married' => 'boolean',
        'is_schooled' => 'boolean',
        'is_not_interested' => 'boolean',
        'is_inactive' => 'boolean',
    ];

    public function widow(): BelongsTo
    {
        // withTrashed: orphans of an archived family must still resolve
        // their guardian in historical views.
        return $this->belongsTo(Widow::class)->withTrashed();
    }

    public function enrollments(): HasMany
    {
        return $this->hasMany(OrphanEnrollment::class);
    }

    /**
     * The enrollment for whichever academic year is current - what the family
     * form reads and writes, so the school shown there is the school the
     * education system holds rather than a second, drifting copy.
     */
    public function currentEnrollment(): HasOne
    {
        return $this->hasOne(OrphanEnrollment::class)
            ->whereHas('academicYear', fn ($year) => $year->where('is_current', true));
    }

    public function educationLevel(): BelongsTo
    {
        return $this->belongsTo(OrphansEducationLevel::class, 'education_level_id');
    }

    public function getFullNameAttribute(): string
    {
        return trim($this->first_name . ' ' . $this->last_name);
    }

    public function getAgeAttribute(): ?int
    {
        return $this->birth_date ? $this->birth_date->age : null;
    }
}