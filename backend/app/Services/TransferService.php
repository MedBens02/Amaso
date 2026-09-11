<?php

namespace App\Services;

use App\Exceptions\BusinessRuleException;
use App\Models\BankAccount;
use App\Models\BankAccountTransaction;
use App\Models\FiscalYear;
use App\Models\Transfer;
use Illuminate\Support\Facades\DB;

class TransferService
{
    public function __construct(private readonly LedgerService $ledger)
    {
    }

    /**
     * Approve a draft transfer and move the amount between the two accounts.
     */
    public function approve(Transfer $transfer, ?string $remarks = null): Transfer
    {
        return DB::transaction(function () use ($transfer, $remarks) {
            $locked = Transfer::whereKey($transfer->getKey())->lockForUpdate()->firstOrFail();

            if ($locked->status === 'Approved') {
                throw new BusinessRuleException('التحويل معتمد مسبقاً', 400);
            }

            FiscalYear::assertOpen($locked->fiscal_year_id, 'اعتماد تحويل');

            // Lock both accounts in a stable order so two transfers moving
            // money in opposite directions cannot deadlock each other.
            $accountIds = [$locked->from_account_id, $locked->to_account_id];
            sort($accountIds);
            BankAccount::whereIn('id', $accountIds)->lockForUpdate()->get();

            $fromAccount = BankAccount::findOrFail($locked->from_account_id);

            if ((float) $fromAccount->balance < (float) $locked->amount) {
                throw new BusinessRuleException('الرصيد في الحساب المصدر غير كافي لاعتماد التحويل', 422);
            }

            $toAccount = BankAccount::findOrFail($locked->to_account_id);

            $this->ledger->record(
                $fromAccount,
                -(float) $locked->amount,
                BankAccountTransaction::SOURCE_TRANSFER_OUT,
                $locked->id,
                "تحويل إلى حساب \"{$toAccount->label}\"",
            );

            $this->ledger->record(
                $toAccount,
                (float) $locked->amount,
                BankAccountTransaction::SOURCE_TRANSFER_IN,
                $locked->id,
                "تحويل من حساب \"{$fromAccount->label}\"",
            );

            $updateData = [
                'status' => 'Approved',
                'approved_by' => auth()->id() ?? 1,
                'approved_at' => now(),
            ];

            if ($remarks !== null) {
                $updateData['remarks'] = $remarks;
            }

            $locked->update($updateData);

            return $locked;
        });
    }
}
