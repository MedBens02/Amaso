<?php

namespace App\Services;

use App\Exceptions\BusinessRuleException;
use App\Models\BankAccount;
use App\Models\Income;
use Illuminate\Support\Facades\DB;

class IncomeService
{
    /**
     * Approve a draft income. BankWire incomes are credited to their bank
     * account immediately; Cash/Cheque incomes stay in the cash box until
     * transferred with transferToBank().
     */
    public function approve(Income $income): Income
    {
        if ($income->status === 'Approved') {
            throw new BusinessRuleException('الإيراد معتمد مسبقاً', 400);
        }

        return DB::transaction(function () use ($income) {
            $income->update([
                'status' => 'Approved',
                'approved_by' => auth()->id() ?? 1,
                'approved_at' => now(),
            ]);

            if ($income->payment_method === 'BankWire' && $income->bank_account_id) {
                BankAccount::whereKey($income->bank_account_id)->increment('balance', $income->amount);
            }

            return $income;
        });
    }

    /**
     * Deposit an approved Cash/Cheque income into a bank account.
     */
    public function transferToBank(Income $income, int $bankAccountId, string $transferredAt, ?string $remarks): Income
    {
        if ($income->status !== 'Approved') {
            throw new BusinessRuleException('يمكن تحويل الإيرادات المعتمدة فقط', 403);
        }

        if (!in_array($income->payment_method, ['Cash', 'Cheque'])) {
            throw new BusinessRuleException('يمكن تحويل الإيرادات النقدية والشيكات فقط', 403);
        }

        if ($income->transferred_at) {
            throw new BusinessRuleException('هذا الإيراد محول مسبقاً', 403);
        }

        return DB::transaction(function () use ($income, $bankAccountId, $transferredAt, $remarks) {
            $bankAccount = BankAccount::findOrFail($bankAccountId);

            $income->update([
                'bank_account_id' => $bankAccountId,
                'transferred_at' => $transferredAt,
                'remarks' => $remarks
                    ? ($income->remarks ? $income->remarks . ' | ' . $remarks : $remarks)
                    : $income->remarks,
            ]);

            $bankAccount->increment('balance', $income->amount);

            return $income;
        });
    }
}
