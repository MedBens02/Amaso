<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TransportMonth extends Model
{
    use HasFactory;

    /**
     * The two halves of a month, each settled on its own.
     *
     * They are different kinds of spending: one vehicle whose cost is shared
     * out, and a handful of allowances that are each one child's. Keeping
     * them apart in the accounts is the whole reason for the split.
     */
    public const PART_BUS = 'bus';
    public const PART_ALLOWANCE = 'allowance';

    public const PARTS = [
        self::PART_BUS => 'كلفة الحافلة',
        self::PART_ALLOWANCE => 'منح التنقل',
    ];

    public const STATUS_DRAFT = 'draft';
    public const STATUS_PARTIAL = 'partial';
    public const STATUS_CLOSED = 'closed';

    public const STATUSES = [
        self::STATUS_DRAFT => 'مسودة',
        self::STATUS_PARTIAL => 'مُرحَّل جزئياً',
        self::STATUS_CLOSED => 'مُرحَّل',
    ];

    protected $fillable = [
        'academic_year_id',
        'period_month',
        'fuel_cost',
        'driver_cost',
        'other_cost',
        'bus_expense_id',
        'bus_settled_at',
        'allowance_expense_id',
        'allowance_settled_at',
        'notes',
    ];

    protected $casts = [
        'period_month' => 'date',
        'fuel_cost' => 'decimal:2',
        'driver_cost' => 'decimal:2',
        'other_cost' => 'decimal:2',
        'bus_settled_at' => 'datetime',
        'allowance_settled_at' => 'datetime',
    ];

    protected $appends = [
        'status', 'status_label', 'bus_pot', 'period_label',
        'bus_settled', 'allowance_settled',
    ];

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

    public function getBusSettledAttribute(): bool
    {
        return $this->bus_settled_at !== null;
    }

    public function getAllowanceSettledAttribute(): bool
    {
        return $this->allowance_settled_at !== null;
    }

    /**
     * Derived, never stored.
     *
     * A status column would be a second answer to a question the two
     * settlement timestamps already answer, and the two would disagree the
     * first time one of them was written without the other.
     */
    public function getStatusAttribute(): string
    {
        if ($this->bus_settled && $this->allowance_settled) {
            return self::STATUS_CLOSED;
        }

        return $this->bus_settled || $this->allowance_settled
            ? self::STATUS_PARTIAL
            : self::STATUS_DRAFT;
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

    public function isPartSettled(string $part): bool
    {
        return $part === self::PART_BUS ? $this->bus_settled : $this->allowance_settled;
    }

    /** Whether any money has been paid out of this month at all. */
    public function isTouched(): bool
    {
        return $this->bus_settled || $this->allowance_settled;
    }

    public function academicYear(): BelongsTo
    {
        return $this->belongsTo(AcademicYear::class);
    }

    public function busExpense(): BelongsTo
    {
        return $this->belongsTo(Expense::class, 'bus_expense_id');
    }

    public function allowanceExpense(): BelongsTo
    {
        return $this->belongsTo(Expense::class, 'allowance_expense_id');
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
