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
        if ($transfer->status === 'Approved') {
            throw new BusinessRuleException('التحويل معتمد مسبقاً', 400);
        }

        return DB::transaction(function () use ($transfer, $remarks) {
            $fromAccount = BankAccount::findOrFail($transfer->from_account_id);

            if ($fromAccount->balance < $transfer->amount) {
                throw new BusinessRuleException('الرصيد في الحساب المصدر غير كافي لاعتماد التحويل', 422);
            }

            $fromAccount->decrement('balance', $transfer->amount);
            BankAccount::findOrFail($transfer->to_account_id)->increment('balance', $transfer->amount);

            $updateData = [
                'status' => 'Approved',
                'approved_by' => auth()->id() ?? 1,
                'approved_at' => now(),
            ];

            if ($remarks !== null) {
                $updateData['remarks'] = $remarks;
            }

            $transfer->update($updateData);

            return $transfer;
        });
    }
}
