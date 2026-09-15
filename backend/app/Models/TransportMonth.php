<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TransportMonth extends Model
{
    use HasFactory;

    public const STATUS_DRAFT = 'draft';
    public const STATUS_CLOSED = 'closed';

    public const STATUSES = [
        self::STATUS_DRAFT => 'مسودة',
        self::STATUS_CLOSED => 'مُرحَّل',
    ];

    protected $fillable = [
        'academic_year_id',
        'period_month',
        'fuel_cost',
        'driver_cost',
        'other_cost',
        'status',
        'expense_id',
        'closed_at',
        'notes',
    ];

    protected $casts = [
        'period_month' => 'date',
        'fuel_cost' => 'decimal:2',
        'driver_cost' => 'decimal:2',
        'other_cost' => 'decimal:2',
        'closed_at' => 'datetime',
    ];

    protected $appends = ['status_label', 'bus_pot', 'period_label'];

    /** "شتنبر 2026", for a heading that a person reads rather than parses. */
    public function getPeriodLabelAttribute(): string
    {
        static $months = [
            1 => 'يناير', 2 => 'فبراير', 3 => 'مارس', 4 => 'أبريل',
            5 => 'ماي', 6 => 'يونيو', 7 => 'يوليوز', 8 => 'غشت',
            9 => 'شتنبر', 10 => 'أكتوبر', 11 => 'نونبر', 12 => 'دجنبر',
        ];

        $date = $this->period_month;

        return $date === null ? '' : ($months[(int) $date->format('n')] . ' ' . $date->format('Y'));
    }

    public function getStatusLabelAttribute(): string
    {
        return self::STATUSES[$this->status] ?? $this->status;
    }

    /** Everything the bus cost this month, which is what gets divided. */
    public function getBusPotAttribute(): float
    {
        return round(
            (float) $this->fuel_cost + (float) $this->driver_cost + (float) $this->other_cost,
            2,
        );
    }

    public function isClosed(): bool
    {
        return $this->status === self::STATUS_CLOSED;
    }

    public function academicYear(): BelongsTo
    {
        return $this->belongsTo(AcademicYear::class);
    }

    public function expense(): BelongsTo
    {
        return $this->belongsTo(Expense::class);
    }

    public function lines(): HasMany
    {
        return $this->hasMany(TransportMonthLine::class);
    }

    public function busLines(): HasMany
    {
        return $this->lines()->where('mode', TransportSupport::MODE_BUS);
    }

    public function allowanceLines(): HasMany
    {
        return $this->lines()->where('mode', TransportSupport::MODE_ALLOWANCE);
    }
}
