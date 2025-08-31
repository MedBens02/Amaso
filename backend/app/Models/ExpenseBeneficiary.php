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
        'beneficiary_id',
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

    public function beneficiary(): BelongsTo
    {
        return $this->belongsTo(Beneficiary::class);
    }

    public function beneficiaryGroup(): BelongsTo
    {
        return $this->belongsTo(BeneficiaryGroup::class, 'group_id');
    }

    public function getBeneficiaryNameAttribute(): string
    {
        if ($this->beneficiary_id && $this->beneficiary) {
            return $this->beneficiary->full_name;
        }
        
        if ($this->group_id && $this->beneficiaryGroup) {
            return $this->beneficiaryGroup->label . ' (مجموعة)';
        }
        
        return 'غير محدد';
    }
}