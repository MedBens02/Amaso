<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WidowSocialIncome extends Model
{
    use HasFactory;

    protected $table = 'widow_social_income';

    protected $fillable = [
        'widow_id',
        'income_category_id',
        'amount',
        'remarks',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
    ];

    public function widow(): BelongsTo
    {
        return $this->belongsTo(Widow::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(WidowIncomeCategory::class, 'income_category_id');
    }
}
