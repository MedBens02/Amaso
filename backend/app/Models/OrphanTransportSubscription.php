<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrphanTransportSubscription extends Model
{
    use HasFactory;

    public const STATUS_ACTIVE = 'active';
    public const STATUS_SUSPENDED = 'suspended';
    public const STATUS_ENDED = 'ended';

    public const STATUSES = [
        self::STATUS_ACTIVE => 'جاري',
        self::STATUS_SUSPENDED => 'موقوف مؤقتاً',
        self::STATUS_ENDED => 'منتهٍ',
    ];

    /** Why this child is being carried. Mirrors a run's destination. */
    public const PURPOSES = [
        'school' => 'إلى المؤسسة التعليمية',
        'tutoring' => 'إلى الدعم المدرسي',
        'activity' => 'إلى نشاط',
        'other' => 'أخرى',
    ];

    /** Who bears the cost. "provider" is a run given free by the transporter. */
    public const PAYERS = [
        'association' => 'الجمعية',
        'family' => 'الأسرة',
        'shared' => 'مناصفة',
        'provider' => 'الناقل (مجاناً)',
    ];

    protected $fillable = [
        'enrollment_id',
        'route_id',
        'provider_id',
        'purpose',
        'pickup_point',
        'monthly_cost',
        'paid_by',
        'start_date',
        'end_date',
        'status',
        'notes',
    ];

    protected $casts = [
        'monthly_cost' => 'decimal:2',
        'start_date' => 'date',
        'end_date' => 'date',
    ];

    protected $appends = ['purpose_label', 'status_label', 'paid_by_label'];

    public function getPurposeLabelAttribute(): string
    {
        return self::PURPOSES[$this->purpose] ?? $this->purpose;
    }

    public function getStatusLabelAttribute(): string
    {
        return self::STATUSES[$this->status] ?? $this->status;
    }

    public function getPaidByLabelAttribute(): string
    {
        return self::PAYERS[$this->paid_by] ?? $this->paid_by;
    }

    /**
     * The transporter actually carrying this child.
     *
     * One answer derived from whichever of the two cases applies, rather than
     * a column somebody has to keep in step with the run. A rider on a shared
     * run is carried by the run's transporter, by definition; only a
     * standalone arrangement has one of its own.
     */
    public function effectiveProvider(): ?TransportProvider
    {
        return $this->route?->provider ?? $this->provider;
    }

    /**
     * What this arrangement costs the association a month, as far as anyone
     * has said. A rider on a shared run normally contributes nothing of their
     * own - the run's price covers them - so this is null there rather than a
     * share of it, which would double-count against the run's own figure.
     */
    public function getMonthlyCostAttribute($value): ?float
    {
        return $value === null ? null : (float) $value;
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('status', self::STATUS_ACTIVE);
    }

    /** Riders in one academic year, reached through the enrollment that holds it. */
    public function scopeForAcademicYear(Builder $query, int $academicYearId): Builder
    {
        return $query->whereHas(
            'enrollment',
            fn (Builder $q) => $q->where('academic_year_id', $academicYearId),
        );
    }

    public function enrollment(): BelongsTo
    {
        return $this->belongsTo(OrphanEnrollment::class, 'enrollment_id');
    }

    public function route(): BelongsTo
    {
        return $this->belongsTo(TransportRoute::class, 'route_id');
    }

    public function provider(): BelongsTo
    {
        return $this->belongsTo(TransportProvider::class, 'provider_id');
    }
}
