<?php

namespace App\Services;

use App\Models\Income;
use App\Models\KafalaChamilaSplit;
use Illuminate\Database\Eloquent\Collection;
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

            return $created->load(['fiscalYear', 'subBudget', 'incomeCategory', 'kafil', 'bankAccount']);
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
}
