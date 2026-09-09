<?php

namespace App\Services;

use App\Models\BankAccount;
use App\Models\BankAccountTransaction;

/**
 * The single place a bank account balance is allowed to move.
 *
 * Every caller must already hold a row lock on the account and be inside a
 * transaction: the ledger row and the balance change have to commit together
 * or the history stops explaining the balance.
 */
class LedgerService
{
    /**
     * Apply a signed amount to an account and record why.
     * Positive credits, negative debits.
     */
    public function record(
        BankAccount $account,
        float $amount,
        string $sourceType,
        ?int $sourceId = null,
        ?string $description = null,
    ): BankAccountTransaction {
        if ($amount >= 0) {
            $account->increment('balance', $amount);
        } else {
            $account->decrement('balance', abs($amount));
        }

        // Re-read rather than compute: the increment happened in SQL, and
        // under the caller's lock this is the authoritative resulting balance.
        $account->refresh();

        return BankAccountTransaction::create([
            'bank_account_id' => $account->id,
            'source_type' => $sourceType,
            'source_id' => $sourceId,
            'amount' => $amount,
            'balance_after' => $account->balance,
            'description' => $description,
            'created_by' => auth()->id(),
        ]);
    }
}
