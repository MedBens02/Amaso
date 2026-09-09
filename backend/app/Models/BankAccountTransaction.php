<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * One row per change to a bank account balance. Append-only: corrections are
 * made by writing a further row, never by editing or deleting one, so the
 * history always explains the current balance.
 */
class BankAccountTransaction extends Model
{
    use HasFactory;

    public const SOURCE_INCOME = 'income';
    public const SOURCE_INCOME_DEPOSIT = 'income_deposit';
    public const SOURCE_EXPENSE = 'expense';
    public const SOURCE_TRANSFER_OUT = 'transfer_out';
    public const SOURCE_TRANSFER_IN = 'transfer_in';

    protected $fillable = [
        'bank_account_id',
        'source_type',
        'source_id',
        'amount',
        'balance_after',
        'description',
        'created_by',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'balance_after' => 'decimal:2',
    ];

    public function bankAccount(): BelongsTo
    {
        return $this->belongsTo(BankAccount::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
