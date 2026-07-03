<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ExpenseCategory extends Model
{
    use HasFactory;

    /**
     * Sentinel category that expenses fall back to when their category is
     * deleted. The row is created by AccountingSeeder and must never be
     * deleted itself.
     */
    public const DELETED_CATEGORY_ID = 999;

    protected $fillable = [
        'sub_budget_id',
        'label',
    ];

    public function subBudget(): BelongsTo
    {
        return $this->belongsTo(SubBudget::class);
    }

    public function expenses(): HasMany
    {
        return $this->hasMany(Expense::class);
    }

    protected static function booted()
    {
        static::deleting(function ($expenseCategory) {
            if ($expenseCategory->id === self::DELETED_CATEGORY_ID) {
                throw new \Exception('Cannot delete the default expense category.');
            }
            $expenseCategory->expenses()->update(['expense_category_id' => self::DELETED_CATEGORY_ID]);
        });
    }
}