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

    /**
     * @deprecated Kept only so a level chosen before the enrollment system
     * existed is not silently lost, and so deleting a level still has
     * something to null out (see EducationLevelController::destroy). Never
     * read this for "what level is this child at" - see currentEducationLabel().
     */
    public function educationLevel(): BelongsTo
    {
        return $this->belongsTo(OrphansEducationLevel::class, 'education_level_id');
    }

    /**
     * What the education page would call this child right now.
     *
     * This used to be education_level_id on the orphan row itself - a second
     * copy of the same fact the enrollment already carries, filled in once
     * when a family was created or edited and never touched again. The
     * moment anyone worked from the education page instead - registering a
     * student, promoting a class at rollover, correcting a placement,
     * removing an enrollment - that copy stopped matching, and the widow
     * card kept showing whatever it was first given.
     *
     * The enrollment is the only thing written by every one of those paths,
     * so it is the only thing this reads. Requires currentEnrollment.
     * educationLevel already eager-loaded; returns null rather than
     * triggering a query per orphan when it is not, which a list of
     * hundreds cannot afford.
     */
    public function currentEducationLabel(): ?string
    {
        if (!$this->relationLoaded('currentEnrollment')) {
            return null;
        }

        return $this->currentEnrollment?->educationLevel?->name_ar;
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