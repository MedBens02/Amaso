<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TransportRoute extends Model
{
    use HasFactory;

    /** Where the run goes. A school bus is the common case, not the only one. */
    public const DESTINATIONS = [
        'school' => 'إلى المؤسسة التعليمية',
        'tutoring' => 'إلى الدعم المدرسي',
        'activity' => 'إلى نشاط',
        'other' => 'أخرى',
    ];

    protected $fillable = [
        'academic_year_id',
        'provider_id',
        'name',
        'destination_type',
        'school_id',
        'capacity',
        'monthly_cost',
        'schedule',
        'pickup_area',
        'is_active',
        'notes',
    ];

    protected $casts = [
        'capacity' => 'integer',
        'monthly_cost' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    protected $appends = ['destination_label', 'seats_left', 'cost_per_rider'];

    public function getDestinationLabelAttribute(): string
    {
        return self::DESTINATIONS[$this->destination_type] ?? $this->destination_type;
    }

    /**
     * How many more children this run can take.
     *
     * Null rather than a number when no capacity was recorded - "unknown" and
     * "none left" are different answers, and a zero here would stop somebody
     * adding a child to a van that has room.
     *
     * Reads `active_riders_count` when the caller has loaded it, so a list of
     * runs costs one extra query rather than one per run.
     */
    public function getSeatsLeftAttribute(): ?int
    {
        if ($this->capacity === null) {
            return null;
        }

        return max(0, $this->capacity - $this->activeRiderCount());
    }

    /**
     * What one seat on this run costs a month.
     *
     * Divided rather than stored, because the moment a twelfth child joins an
     * eleven-child van, a stored per-seat figure is wrong everywhere it was
     * written down. Advisory: the association pays the run's price whether
     * eleven or twelve children ride it.
     */
    public function getCostPerRiderAttribute(): ?float
    {
        $riders = $this->activeRiderCount();

        if ($this->monthly_cost === null || $riders === 0) {
            return null;
        }

        return round((float) $this->monthly_cost / $riders, 2);
    }

    /**
     * Riders currently on the run, from a loaded count where one exists.
     *
     * withCount('activeRiders') names it active_riders_count; falling back to
     * counting the loaded relation keeps a freshly created model honest.
     */
    public function activeRiderCount(): int
    {
        if (array_key_exists('active_riders_count', $this->attributes)) {
            return (int) $this->attributes['active_riders_count'];
        }

        if ($this->relationLoaded('activeRiders')) {
            return $this->activeRiders->count();
        }

        return $this->activeRiders()->count();
    }

    public function academicYear(): BelongsTo
    {
        return $this->belongsTo(AcademicYear::class);
    }

    public function provider(): BelongsTo
    {
        return $this->belongsTo(TransportProvider::class, 'provider_id');
    }

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    public function subscriptions(): HasMany
    {
        return $this->hasMany(OrphanTransportSubscription::class, 'route_id');
    }

    public function activeRiders(): HasMany
    {
        return $this->subscriptions()->where('status', OrphanTransportSubscription::STATUS_ACTIVE);
    }
}
