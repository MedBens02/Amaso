<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
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
        'parent_id',
        'label',
    ];

    /**
     * Categories classify what money was for and are independent of the
     * budget it moved through, so the same category can be used from any
     * fund. parent_id makes them nestable.
     */
    public function parent(): BelongsTo
    {
        return $this->belongsTo(self::class, 'parent_id');
    }

    /**
     * The funds this category is offered under.
     *
     * Empty means "every fund": a budget with no list attached offers the
     * whole set rather than none, so adding a fund does not make it unusable
     * until somebody fills its list in.
     */
    public function budgets(): BelongsToMany
    {
        return $this->belongsToMany(Budget::class, 'budget_expense_category', 'category_id', 'budget_id')
            ->withTimestamps();
    }

    public function children(): HasMany
    {
        return $this->hasMany(self::class, 'parent_id');
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