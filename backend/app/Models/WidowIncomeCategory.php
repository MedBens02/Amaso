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

    public function socialIncome(): HasMany
    {
        return $this->hasMany(WidowSocialIncome::class, 'category_id');
    }
}
