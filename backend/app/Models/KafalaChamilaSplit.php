<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * The fixed 7-way split of a "kafala chamila" (comprehensive sponsorship)
 * payment: each row is one part (management/maouna/education/health/
 * activities/projects/formation), pinned to its own dedicated sub_budget +
 * income_category. The sub_budget/category pairing is permanent - only
 * `percentage` is meant to be changed, and only by an admin (see
 * KafalaChamilaController). SubBudgetController/AccountingIncomeCategoryController
 * refuse to delete or rename the rows these point to.
 */
class KafalaChamilaSplit extends Model
{
    use HasFactory;

    protected $fillable = [
        'key',
        'label',
        'percentage',
        'sub_budget_id',
        'income_category_id',
        'sort_order',
    ];

    protected $casts = [
        'percentage' => 'decimal:2',
    ];

    public function subBudget(): BelongsTo
    {
        return $this->belongsTo(SubBudget::class);
    }

    public function incomeCategory(): BelongsTo
    {
        return $this->belongsTo(IncomeCategory::class);
    }

    /** Sub-budget ids that must never be edited or deleted through the references UI. */
    public static function lockedSubBudgetIds(): array
    {
        return static::pluck('sub_budget_id')->all();
    }

    /** Income-category ids that must never be edited or deleted through the references UI. */
    public static function lockedIncomeCategoryIds(): array
    {
        return static::pluck('income_category_id')->all();
    }
}
