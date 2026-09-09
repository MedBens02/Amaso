<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * The fixed 7-way split of a "kafala chamila" (comprehensive sponsorship)
 * payment: each row is one part (management/maouna/education/health/
 * activities/projects/formation), pinned to its own dedicated budget +
 * income_category. The budget/category pairing is permanent - only
 * `percentage` is meant to be changed, and only by an admin (see
 * KafalaChamilaController). BudgetController/AccountingIncomeCategoryController
 * refuse to delete or rename the rows these point to.
 */
class KafalaChamilaSplit extends Model
{
    use HasFactory;

    protected $fillable = [
        'key',
        'label',
        'percentage',
        'budget_id',
        'income_category_id',
        'sort_order',
    ];

    protected $casts = [
        'percentage' => 'decimal:2',
    ];

    public function budget(): BelongsTo
    {
        return $this->belongsTo(Budget::class);
    }

    public function incomeCategory(): BelongsTo
    {
        return $this->belongsTo(IncomeCategory::class);
    }

    /** Sub-budget ids that must never be edited or deleted through the references UI. */
    public static function lockedBudgetIds(): array
    {
        return static::pluck('budget_id')->all();
    }

    /** Income-category ids that must never be edited or deleted through the references UI. */
    public static function lockedIncomeCategoryIds(): array
    {
        return static::pluck('income_category_id')->all();
    }
}
