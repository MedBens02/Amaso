<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class IncomeCategory extends Model
{
    use HasFactory;

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
            if ($incomeCategory->id === 999) {
                throw new \Exception('Cannot delete the default income category.');
            }
            $incomeCategory->incomes()->update(['income_category_id' => 999]);
        });
    }
}