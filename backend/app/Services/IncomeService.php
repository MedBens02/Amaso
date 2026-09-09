<?php

namespace App\Services;

use App\Exceptions\BusinessRuleException;
use App\Models\BankAccount;
use App\Models\BankAccountTransaction;
use App\Models\Donor;
use App\Models\Income;
use Illuminate\Support\Facades\DB;

class IncomeService
{
    public function __construct(private readonly LedgerService $ledger)
    {
    }

    /**
     * Approve a draft income. BankWire incomes are credited to their bank
     * account immediately; Cash/Cheque incomes stay in the cash box until
     * transferred with transferToBank().
     *
     * The status is re-read under a row lock inside the transaction: without
     * it, two concurrent approvals (a double-click, or two tabs) both see
     * Draft, both pass the guard, and the balance is credited twice for one
     * income row.
     */
    public function approve(Income $income): Income
    {
        return DB::transaction(function () use ($income) {
            $locked = Income::whereKey($income->getKey())->lockForUpdate()->firstOrFail();

            if ($locked->status === 'Approved') {
                throw new BusinessRuleException('الإيراد معتمد مسبقاً', 400);
            }

            $locked->update([
                'status' => 'Approved',
                'approved_by' => auth()->id() ?? 1,
                'approved_at' => now(),
            ]);

            // Displayed on the donor card and in reports, so it has to track
            // approvals rather than sitting at whatever it was imported as.
            if ($locked->donor_id) {
                Donor::whereKey($locked->donor_id)->increment('total_given', $locked->amount);
            }

            if ($locked->payment_method === 'BankWire' && $locked->bank_account_id) {
                $account = BankAccount::whereKey($locked->bank_account_id)->lockForUpdate()->firstOrFail();

                $this->ledger->record(
                    $account,
                    (float) $locked->amount,
                    BankAccountTransaction::SOURCE_INCOME,
                    $locked->id,
                    'اعتماد إيراد بحوالة بنكية',
                );
            }

            return $locked;
        });
    }

    /**
     * Deposit an approved Cash/Cheque income into a bank account.
     *
     * transferred_at is re-checked under the same row lock, so a double
     * submission cannot credit the account twice for one deposit.
     */
    public function transferToBank(Income $income, int $bankAccountId, string $transferredAt, ?string $remarks): Income
    {
        return DB::transaction(function () use ($income, $bankAccountId, $transferredAt, $remarks) {
            $locked = Income::whereKey($income->getKey())->lockForUpdate()->firstOrFail();

            if ($locked->status !== 'Approved') {
                throw new BusinessRuleException('يمكن تحويل الإيرادات المعتمدة فقط', 403);
            }

            if (!in_array($locked->payment_method, ['Cash', 'Cheque'])) {
                throw new BusinessRuleException('يمكن تحويل الإيرادات النقدية والشيكات فقط', 403);
            }

            if ($locked->transferred_at) {
                throw new BusinessRuleException('هذا الإيراد محول مسبقاً', 403);
            }

            $bankAccount = BankAccount::whereKey($bankAccountId)->lockForUpdate()->firstOrFail();

            $locked->update([
                'bank_account_id' => $bankAccountId,
                'transferred_at' => $transferredAt,
                'remarks' => $remarks
                    ? ($locked->remarks ? $locked->remarks . ' | ' . $remarks : $remarks)
                    : $locked->remarks,
            ]);

            $this->ledger->record(
                $bankAccount,
                (float) $locked->amount,
                BankAccountTransaction::SOURCE_INCOME_DEPOSIT,
                $locked->id,
                'إيداع إيراد نقدي/شيك في البنك',
            );

            return $locked;
        });
    }
}
