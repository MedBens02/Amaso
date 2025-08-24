<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ExpenseBeneficiaryGroup extends Model
{
    use HasFactory;

    protected $fillable = [
        'expense_id',
        'group_id',
        'amount',
        'notes',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
    ];

    public function expense(): BelongsTo
    {
        return $this->belongsTo(Expense::class);
    }

    public function group(): BelongsTo
    {
        return $this->belongsTo(BeneficiaryGroup::class, 'group_id');
    }
}