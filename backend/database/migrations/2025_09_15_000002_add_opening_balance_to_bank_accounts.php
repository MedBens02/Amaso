<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Where an account's first dirham came from.
 *
 * `bank_account_transactions` records every movement the app makes and the
 * balance after it, which is enough to print a statement - except that the
 * balance an account was already carrying when it was entered into the system
 * has no row at all. So "sum the ledger" never equalled "read the balance",
 * and there was no way to tell a genuine drift from that missing starting
 * point. Storing it makes opening + ledger = balance an invariant the books
 * can actually be checked against.
 *
 * Backfilled rather than assumed zero: existing accounts were created with a
 * balance and have been moving ever since, so the opening balance is whatever
 * the current balance is once the recorded movements are taken back out.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bank_accounts', function (Blueprint $table) {
            $table->decimal('opening_balance', 15, 2)->default(0)->after('balance');
        });

        foreach (DB::table('bank_accounts')->get() as $account) {
            $movements = (float) DB::table('bank_account_transactions')
                ->where('bank_account_id', $account->id)
                ->sum('amount');

            DB::table('bank_accounts')
                ->where('id', $account->id)
                ->update(['opening_balance' => (float) $account->balance - $movements]);
        }
    }

    public function down(): void
    {
        Schema::table('bank_accounts', function (Blueprint $table) {
            $table->dropColumn('opening_balance');
        });
    }
};
