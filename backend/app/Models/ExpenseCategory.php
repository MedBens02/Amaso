<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ExpenseCategory extends Model
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

    public function expenses(): HasMany
    {
        return $this->hasMany(Expense::class);
    }

    protected static function booted()
    {
        static::deleting(function ($expenseCategory) {
            if ($expenseCategory->id === 999) {
                throw new \Exception('Cannot delete the default expense category.');
            }
            $expenseCategory->expenses()->update(['expense_category_id' => 999]);
        });
    }
}