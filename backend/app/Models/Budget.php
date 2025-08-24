<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Budget extends Model
{
    use HasFactory;

    protected $fillable = [
        'fiscal_year_id',
        'current_amount',
        'carryover_prev_year',
    ];

    protected $casts = [
        'current_amount' => 'decimal:2',
        'carryover_prev_year' => 'decimal:2',
    ];

    public function fiscalYear(): BelongsTo
    {
        return $this->belongsTo(FiscalYear::class);
    }

    public function subBudgets(): HasMany
    {
        return $this->hasMany(SubBudget::class);
    }
}