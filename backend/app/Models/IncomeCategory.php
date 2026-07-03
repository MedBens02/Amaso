<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class IncomeCategory extends Model
{
    use HasFactory;

    /**
     * Sentinel category that incomes fall back to when their category is
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

    public function incomes(): HasMany
    {
        return $this->hasMany(Income::class);
    }

    protected static function booted()
    {
        static::deleting(function ($incomeCategory) {
            if ($incomeCategory->id === self::DELETED_CATEGORY_ID) {
                throw new \Exception('Cannot delete the default income category.');
            }
            $incomeCategory->incomes()->update(['income_category_id' => self::DELETED_CATEGORY_ID]);
        });
    }
}