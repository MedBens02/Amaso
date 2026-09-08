<?php

namespace App\Services;

use App\Exceptions\BusinessRuleException;
use App\Models\BankAccount;
use App\Models\Transfer;
use Illuminate\Support\Facades\DB;

class TransferService
{
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

            // Lock both accounts in a stable order so two transfers moving
            // money in opposite directions cannot deadlock each other.
            $accountIds = [$locked->from_account_id, $locked->to_account_id];
            sort($accountIds);
            BankAccount::whereIn('id', $accountIds)->lockForUpdate()->get();

            $fromAccount = BankAccount::findOrFail($locked->from_account_id);

            if ((float) $fromAccount->balance < (float) $locked->amount) {
                throw new BusinessRuleException('الرصيد في الحساب المصدر غير كافي لاعتماد التحويل', 422);
            }

            $fromAccount->decrement('balance', $locked->amount);
            BankAccount::whereKey($locked->to_account_id)->increment('balance', $locked->amount);

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
