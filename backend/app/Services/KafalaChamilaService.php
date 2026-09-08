<?php

namespace App\Services;

use App\Models\Expense;
use App\Models\Income;
use App\Models\KafalaChamilaSplit;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Collection as BaseCollection;
use Illuminate\Support\Facades\DB;

/**
 * A "kafala chamila" (comprehensive sponsorship) payment is recorded as one
 * income per split part instead of a single lump sum, so each part lands in
 * its own dedicated, locked sub-budget/income-category for reporting.
 */
class KafalaChamilaService
{
    /**
     * @param array<int, array{split_id: int, amount: float}> $splits
     */
    public function createIncomeBatch(array $shared, array $splits): Collection
    {
        return DB::transaction(function () use ($shared, $splits) {
            $rules = KafalaChamilaSplit::whereIn('id', array_column($splits, 'split_id'))->get()->keyBy('id');

            $created = new Collection();

            foreach ($splits as $split) {
                $amount = (float) $split['amount'];
                if ($amount <= 0) {
                    // A part left at 0 by the user just isn't recorded - no empty income rows.
                    continue;
                }

                $rule = $rules->get($split['split_id']);

                $created->push(Income::create([
                    ...$shared,
                    'sub_budget_id' => $rule->sub_budget_id,
                    'income_category_id' => $rule->income_category_id,
                    'amount' => $amount,
                    'status' => 'Draft',
                    'created_by' => auth()->id() ?? 1,
                ]));
            }

            return $created->load(['fiscalYear', 'subBudget', 'incomeCategory', 'kafil', 'widow', 'bankAccount']);
        });
    }

    /**
     * @param array<int, array{id: int, percentage: float}> $splits
     */
    public function updateSplits(array $splits): Collection
    {
        return DB::transaction(function () use ($splits) {
            foreach ($splits as $split) {
                KafalaChamilaSplit::whereKey($split['id'])->update(['percentage' => $split['percentage']]);
            }

            return KafalaChamilaSplit::with(['subBudget', 'incomeCategory'])->orderBy('sort_order')->get();
        });
    }

    /**
     * The current balance of each of the 7 parts: approved money in, minus
     * approved money out. This is one shared pool per part across every
     * kafil - not a per-widow or per-kafil wallet. Only Approved rows count;
     * drafts are not money yet.
     */
    public function balances(): BaseCollection
    {
        $splits = KafalaChamilaSplit::with(['subBudget', 'incomeCategory'])->orderBy('sort_order')->get();

        $subBudgetIds = $splits->pluck('sub_budget_id')->all();

        $incomeBySubBudget = Income::whereIn('sub_budget_id', $subBudgetIds)
            ->where('status', 'Approved')
            ->selectRaw('sub_budget_id, SUM(amount) as total')
            ->groupBy('sub_budget_id')
            ->pluck('total', 'sub_budget_id');

        $expenseBySubBudget = Expense::whereIn('sub_budget_id', $subBudgetIds)
            ->where('status', 'Approved')
            ->selectRaw('sub_budget_id, SUM(amount) as total')
            ->groupBy('sub_budget_id')
            ->pluck('total', 'sub_budget_id');

        return $splits->map(function (KafalaChamilaSplit $split) use ($incomeBySubBudget, $expenseBySubBudget) {
            $totalIncome = (float) ($incomeBySubBudget[$split->sub_budget_id] ?? 0);
            $totalExpense = (float) ($expenseBySubBudget[$split->sub_budget_id] ?? 0);

            return [
                'id' => $split->id,
                'key' => $split->key,
                'label' => $split->label,
                'percentage' => $split->percentage,
                'sub_budget' => $split->subBudget,
                'income_category' => $split->incomeCategory,
                'total_income' => round($totalIncome, 2),
                'total_expense' => round($totalExpense, 2),
                'remaining' => round($totalIncome - $totalExpense, 2),
            ];
        })->values();
    }

    /**
     * How much of the shared pools each family has brought in, and how much
     * has already been spent on them out of those pools.
     *
     *   credited = approved income booked to a kafala chamila sub-budget and
     *              designated to this family (incomes.widow_id)
     *   spent    = approved expenses booked to the same sub-budget and
     *              attributed to that family - the widow herself or any of
     *              her orphans - through expense_beneficiaries
     *
     * This is advisory, not a wallet. The money itself stays pooled and
     * nothing here can block a payment: it exists so a family's own kafil
     * contributions are visible before spending pooled money on them, and so
     * spending beyond what a family brought in is a deliberate, visible act
     * rather than an invisible one.
     *
     * @param  array<int, int>  $widowIds
     * @return array<int, array<string, mixed>>  keyed by widow id
     */
    public function familyBalances(array $widowIds): array
    {
        $widowIds = array_values(array_unique(array_map('intval', $widowIds)));

        if ($widowIds === []) {
            return [];
        }

        $splits = KafalaChamilaSplit::with('subBudget')->orderBy('sort_order')->get();
        $subBudgetIds = $splits->pluck('sub_budget_id')->all();

        $credits = Income::query()
            ->where('status', 'Approved')
            ->whereIn('sub_budget_id', $subBudgetIds)
            ->whereIn('widow_id', $widowIds)
            ->selectRaw('widow_id, sub_budget_id, SUM(amount) as total')
            ->groupBy('widow_id', 'sub_budget_id')
            ->get()
            ->groupBy('widow_id');

        // Soft-deleted widows/orphans are joined directly rather than through
        // Eloquent: an expense paid to a family that has since been archived
        // still consumed that family's share.
        $familyExpr = 'COALESCE(b.widow_id, o.widow_id)';

        $debits = DB::table('expense_beneficiaries as eb')
            ->join('expenses as e', 'e.id', '=', 'eb.expense_id')
            ->join('beneficiaries as b', 'b.id', '=', 'eb.beneficiary_id')
            ->leftJoin('orphans as o', 'o.id', '=', 'b.orphan_id')
            ->where('e.status', 'Approved')
            ->whereIn('e.sub_budget_id', $subBudgetIds)
            ->where(function ($query) use ($widowIds) {
                $query->whereIn('b.widow_id', $widowIds)
                    ->orWhereIn('o.widow_id', $widowIds);
            })
            ->selectRaw("{$familyExpr} as widow_id, e.sub_budget_id, SUM(eb.amount) as total")
            ->groupBy(DB::raw($familyExpr), 'e.sub_budget_id')
            ->get()
            ->groupBy('widow_id');

        $result = [];

        foreach ($widowIds as $widowId) {
            $creditsBySubBudget = collect($credits[$widowId] ?? [])->keyBy('sub_budget_id');
            $debitsBySubBudget = collect($debits[$widowId] ?? [])->keyBy('sub_budget_id');

            $parts = $splits->map(function (KafalaChamilaSplit $split) use ($creditsBySubBudget, $debitsBySubBudget) {
                $credited = (float) ($creditsBySubBudget[$split->sub_budget_id]->total ?? 0);
                $spent = (float) ($debitsBySubBudget[$split->sub_budget_id]->total ?? 0);

                return [
                    'split_id' => $split->id,
                    'key' => $split->key,
                    'label' => $split->label,
                    'sub_budget_id' => $split->sub_budget_id,
                    'sub_budget_label' => $split->subBudget?->label,
                    'credited' => round($credited, 2),
                    'spent' => round($spent, 2),
                    'remaining' => round($credited - $spent, 2),
                ];
            })->values()->all();

            $result[$widowId] = [
                'widow_id' => $widowId,
                'parts' => $parts,
                'total_credited' => round(array_sum(array_column($parts, 'credited')), 2),
                'total_spent' => round(array_sum(array_column($parts, 'spent')), 2),
                'total_remaining' => round(array_sum(array_column($parts, 'remaining')), 2),
            ];
        }

        return $result;
    }
}
