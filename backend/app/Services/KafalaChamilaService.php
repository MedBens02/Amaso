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
}
