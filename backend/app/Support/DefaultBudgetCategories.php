<?php

namespace App\Support;

use Illuminate\Support\Facades\DB;

/**
 * Which fund each seeded category belongs under, to begin with.
 *
 * This is the association's own arrangement, recovered rather than invented:
 * the accounting seeder has always listed a budget id beside every category,
 * left over from before budgets and categories were separated and ignored
 * ever since. It is the right thing to start the links from.
 *
 * Lives here because two callers need it and they run at different times. A
 * database that already exists gets its links from the migration; a fresh
 * install gets them from the seeder, because at migration time the
 * categories have not been created yet and there is nothing to link. Getting
 * that order wrong is silent - the tables are made, the links are not, and
 * every fund quietly offers every category as though nobody had set it up.
 */
class DefaultBudgetCategories
{
    /** @var array<int, int> income category id => budget id */
    public const INCOME = [
        1 => 1, 3 => 1, 4 => 2, 5 => 2, 6 => 2, 7 => 3, 8 => 3,
        9 => 4, 10 => 4, 11 => 5, 12 => 5, 13 => 5, 14 => 6, 15 => 6,
        999 => 1, 1002 => 8,
    ];

    /** @var array<int, int> expense category id => budget id */
    public const EXPENSE = [
        1 => 1, 2 => 1, 3 => 1, 4 => 1, 5 => 1,
        6 => 2, 7 => 2, 8 => 2, 9 => 2, 10 => 2,
        11 => 3, 12 => 3, 13 => 3, 14 => 3, 15 => 3,
        16 => 4, 17 => 4, 18 => 4, 19 => 4, 20 => 4, 21 => 4,
        22 => 5, 23 => 5, 24 => 5, 25 => 5, 26 => 5,
        27 => 6, 28 => 6, 29 => 6, 30 => 6, 31 => 6,
        999 => 1,
    ];

    /**
     * Link the seeded categories to their funds, for any pair not already
     * linked.
     *
     * Additive and idempotent. It never removes a link, because a fund whose
     * list the association has since edited is their arrangement and not
     * this one's to correct.
     *
     * @return int how many links were added
     */
    public static function apply(): int
    {
        return self::link('budget_income_category', 'income_categories', self::INCOME)
            + self::link('budget_expense_category', 'expense_categories', self::EXPENSE);
    }

    /**
     * @param  array<int, int>  $map  category id => budget id
     */
    private static function link(string $pivot, string $categoryTable, array $map): int
    {
        // Only for rows that are actually there: an install that deleted a
        // seeded category, or never had one, must not fail on a foreign key.
        $categories = DB::table($categoryTable)->pluck('id')->flip();
        $budgets = DB::table('budgets')->pluck('id')->flip();
        $existing = DB::table($pivot)
            ->get(['budget_id', 'category_id'])
            ->map(fn ($row) => "{$row->budget_id}:{$row->category_id}")
            ->flip();

        $now = now();
        $rows = [];

        foreach ($map as $categoryId => $budgetId) {
            if (! $categories->has($categoryId) || ! $budgets->has($budgetId)) {
                continue;
            }

            if ($existing->has("{$budgetId}:{$categoryId}")) {
                continue;
            }

            $rows[] = [
                'budget_id' => $budgetId,
                'category_id' => $categoryId,
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        if ($rows !== []) {
            DB::table($pivot)->insert($rows);
        }

        return count($rows);
    }
}
