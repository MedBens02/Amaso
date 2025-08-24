<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class WidowExpenseCategory extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
    ];

    public function socialExpenses(): HasMany
    {
        return $this->hasMany(WidowSocialExpense::class, 'category_id');
    }
}
