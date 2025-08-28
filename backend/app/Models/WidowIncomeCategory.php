<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class WidowIncomeCategory extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
    ];

    public function socialIncomes(): HasMany
    {
        return $this->hasMany(WidowSocialIncome::class, 'income_category_id');
    }
}
