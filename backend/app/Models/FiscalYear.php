<?php

namespace App\Models;

use App\Exceptions\BusinessRuleException;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class FiscalYear extends Model
{
    use HasFactory;

    protected $fillable = [
        'year',
        'is_active',
        'carryover_prev_year',
        'carryover_next_year',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'carryover_prev_year' => 'decimal:2',
        'carryover_next_year' => 'decimal:2',
    ];


    public function incomes(): HasMany
    {
        return $this->hasMany(Income::class);
    }

    public function expenses(): HasMany
    {
        return $this->hasMany(Expense::class);
    }

    public function transfers(): HasMany
    {
        return $this->hasMany(Transfer::class);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Refuse to move money in a year that is no longer open.
     *
     * The store requests already keep new rows out of a closed year, but a
     * draft created while the year was open outlives the close - and
     * approving one is what actually moves the money. The carryover was
     * copied into the following year at closing and is never recomputed, so
     * a late approval leaves the two years disagreeing by its amount with
     * nothing to show why.
     *
     * Called from the approval paths rather than the write paths: a draft is
     * only a note until somebody approves it, and blocking the note as well
     * would strand work that was legitimately entered before the close.
     */
    public static function assertOpen(?int $fiscalYearId, string $action): void
    {
        if (!$fiscalYearId) {
            return;
        }

        $year = static::find($fiscalYearId);

        if ($year && !$year->is_active) {
            throw new BusinessRuleException(
                "السنة المالية {$year->year} مغلقة، ولا يمكن {$action} ضمنها. "
                . 'رحّل العملية إلى السنة المالية النشطة.',
                422
            );
        }
    }
}