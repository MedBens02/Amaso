<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Income extends Model
{
    use HasFactory;

    protected $fillable = [
        'fiscal_year_id',
        'sub_budget_id',
        'income_category_id',
        'donor_id',
        'kafil_id',
        'income_date',
        'amount',
        'payment_method',
        'cheque_number',
        'receipt_number',
        'bank_account_id',
        'remarks',
        'status',
        'created_by',
        'approved_by',
        'approved_at',
        'transferred_at',
    ];

    protected $casts = [
        'income_date' => 'date',
        'amount' => 'decimal:2',
        'approved_at' => 'datetime',
        'transferred_at' => 'datetime',
    ];

    public function fiscalYear(): BelongsTo
    {
        return $this->belongsTo(FiscalYear::class);
    }

    public function subBudget(): BelongsTo
    {
        return $this->belongsTo(SubBudget::class);
    }

    public function incomeCategory(): BelongsTo
    {
        return $this->belongsTo(IncomeCategory::class);
    }

    public function donor(): BelongsTo
    {
        return $this->belongsTo(Donor::class);
    }

    public function kafil(): BelongsTo
    {
        return $this->belongsTo(Kafil::class);
    }

    public function bankAccount(): BelongsTo
    {
        return $this->belongsTo(BankAccount::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function scopeApproved($query)
    {
        return $query->where('status', 'Approved');
    }

    public function scopeDraft($query)
    {
        return $query->where('status', 'Draft');
    }

    public function getDonorNameAttribute(): string
    {
        if ($this->donor_id) {
            return $this->donor->full_name;
        }
        if ($this->kafil_id) {
            return $this->kafil->full_name . ' (كافل)';
        }
        return 'غير محدد';
    }
}