<?php

namespace App\Models;

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
}