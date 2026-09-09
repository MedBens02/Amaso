<?php

namespace App\Console\Commands;

use App\Models\BankAccount;
use App\Models\BankAccountTransaction;
use App\Models\Donor;
use App\Models\Income;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * Checks that the stored balances still match what the history says they
 * should be. Read-only unless --fix-donor-totals is passed.
 *
 * Bank balances are only verifiable from the ledger's starting point, so a
 * drift here means either a balance was changed outside LedgerService or a
 * ledger row was lost - both worth investigating rather than silently
 * correcting, which is why this never rewrites a balance.
 */
class FinanceReconcile extends Command
{
    protected $signature = 'finance:reconcile {--fix-donor-totals : Recompute donors.total_given from approved incomes}';

    protected $description = 'Verify bank balances against the ledger and donor totals against approved incomes';

    public function handle(): int
    {
        $problems = $this->reconcileBankAccounts();
        $problems += $this->reconcileDonorTotals();

        if ($problems === 0) {
            $this->info('Everything reconciles.');

            return self::SUCCESS;
        }

        $this->warn("{$problems} discrepancy/discrepancies found.");

        return self::FAILURE;
    }

    private function reconcileBankAccounts(): int
    {
        $this->line('');
        $this->info('Bank accounts — stored balance vs ledger');

        $problems = 0;
        $rows = [];

        foreach (BankAccount::orderBy('id')->get() as $account) {
            $ledgerRows = BankAccountTransaction::where('bank_account_id', $account->id);
            $movement = (float) $ledgerRows->sum('amount');
            $count = $ledgerRows->count();

            // The ledger starts partway through the account's life, so the
            // opening balance it never recorded is inferred from the earliest
            // row: expected = (first balance_after - first amount) + movement.
            $first = BankAccountTransaction::where('bank_account_id', $account->id)
                ->orderBy('id')
                ->first();

            $opening = $first ? (float) $first->balance_after - (float) $first->amount : (float) $account->balance;
            $expected = $opening + $movement;
            $stored = (float) $account->balance;
            $drift = round($stored - $expected, 2);

            if (abs($drift) > 0.001) {
                $problems++;
            }

            $rows[] = [
                $account->id,
                $account->label,
                number_format($stored, 2),
                number_format($expected, 2),
                $drift == 0.0 ? 'ok' : number_format($drift, 2),
                $count,
            ];
        }

        $this->table(['id', 'account', 'stored', 'expected', 'drift', 'ledger rows'], $rows);

        return $problems;
    }

    private function reconcileDonorTotals(): int
    {
        $this->line('');
        $this->info('Donors — total_given vs approved incomes');

        $actuals = Income::where('status', 'Approved')
            ->whereNotNull('donor_id')
            ->selectRaw('donor_id, SUM(amount) as total')
            ->groupBy('donor_id')
            ->pluck('total', 'donor_id');

        $problems = 0;
        $rows = [];

        foreach (Donor::orderBy('id')->get() as $donor) {
            $expected = round((float) ($actuals[$donor->id] ?? 0), 2);
            $stored = round((float) $donor->total_given, 2);

            if (abs($stored - $expected) > 0.001) {
                $problems++;
                $rows[] = [$donor->id, trim("{$donor->first_name} {$donor->last_name}"), number_format($stored, 2), number_format($expected, 2)];
            }
        }

        if ($rows === []) {
            $this->line('  all donor totals match.');
        } else {
            $this->table(['id', 'donor', 'stored', 'expected'], $rows);

            if ($this->option('fix-donor-totals')) {
                DB::transaction(function () use ($actuals) {
                    Donor::query()->update(['total_given' => 0]);
                    foreach ($actuals as $donorId => $total) {
                        Donor::whereKey($donorId)->update(['total_given' => $total]);
                    }
                });

                $this->info('  donor totals recomputed from approved incomes.');

                return 0;
            }

            $this->line('  re-run with --fix-donor-totals to recompute them.');
        }

        return $problems;
    }
}
