<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TransportSupport extends Model
{
    use HasFactory;

    protected $table = 'transport_support';

    public const MODE_BUS = 'bus';
    public const MODE_ALLOWANCE = 'allowance';

    public const MODES = [
        self::MODE_BUS => 'حافلة المنصور',
        self::MODE_ALLOWANCE => 'منحة تنقل',
    ];

    public const STATUS_ACTIVE = 'active';
    public const STATUS_SUSPENDED = 'suspended';
    public const STATUS_ENDED = 'ended';

    public const STATUSES = [
        self::STATUS_ACTIVE => 'جاري',
        self::STATUS_SUSPENDED => 'موقوف مؤقتاً',
        self::STATUS_ENDED => 'منتهٍ',
    ];

    protected $fillable = [
        'enrollment_id',
        'mode',
        'pickup_point',
        'allowance_rate',
        'start_date',
        'end_date',
        'status',
        'notes',
    ];

    protected $casts = [
        'allowance_rate' => 'decimal:2',
        'start_date' => 'date',
        'end_date' => 'date',
    ];

    protected $appends = ['mode_label', 'status_label'];

    public function getModeLabelAttribute(): string
    {
        return self::MODES[$this->mode] ?? $this->mode;
    }

    public function getStatusLabelAttribute(): string
    {
        return self::STATUSES[$this->status] ?? $this->status;
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('status', self::STATUS_ACTIVE);
    }

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

    public function monthLines(): HasMany
    {
        return $this->hasMany(TransportMonthLine::class, 'support_id');
    }
}
