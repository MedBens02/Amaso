<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ExpenseBeneficiary extends Model
{
    use HasFactory;

    protected $fillable = [
        'expense_id',
        'beneficiary_type',
        'beneficiary_id',
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

    public function getBeneficiaryAttribute()
    {
        if ($this->beneficiary_type === 'Widow') {
            return Widow::find($this->beneficiary_id);
        } elseif ($this->beneficiary_type === 'Orphan') {
            return Orphan::find($this->beneficiary_id);
        }
        return null;
    }

    public function getBeneficiaryNameAttribute(): string
    {
        $beneficiary = $this->beneficiary;
        return $beneficiary ? $beneficiary->full_name : 'غير محدد';
    }
}