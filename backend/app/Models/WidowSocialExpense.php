<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WidowSocialExpense extends Model
{
    use HasFactory;

    protected $table = 'widow_social_expense';

    protected $fillable = [
        'widow_id',
        'expense_category_id',
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
        return $this->belongsTo(WidowExpenseCategory::class, 'expense_category_id');
    }
}
