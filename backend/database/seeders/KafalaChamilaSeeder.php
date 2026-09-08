<?php

namespace Database\Seeders;

use App\Models\ExpenseCategory;
use App\Models\IncomeCategory;
use App\Models\KafalaChamilaSplit;
use App\Models\SubBudget;
use Illuminate\Database\Seeder;

/**
 * Seeds the 7 dedicated, locked sub-budgets/income-categories a "kafala
 * chamila" (comprehensive sponsorship) payment is split across, and the
 * default percentage rule for each.
 *
 * Uses firstOrCreate everywhere on purpose: the percentages are meant to
 * be admin-editable afterward (see KafalaChamilaController), so re-running
 * this seeder must never reset an admin's changes back to the defaults -
 * it only fills in what's missing.
 */
class KafalaChamilaSeeder extends Seeder
{
    public function run(): void
    {
        $parts = [
            ['key' => 'management', 'label' => 'تسيير', 'percentage' => 10, 'sort_order' => 1],
            ['key' => 'maouna', 'label' => 'معونة', 'percentage' => 50, 'sort_order' => 2],
            ['key' => 'education', 'label' => 'تعليم', 'percentage' => 20, 'sort_order' => 3],
            ['key' => 'health', 'label' => 'صحة', 'percentage' => 4, 'sort_order' => 4],
            ['key' => 'activities', 'label' => 'تربية وترفيه', 'percentage' => 5, 'sort_order' => 5],
            ['key' => 'projects', 'label' => 'مشاريع', 'percentage' => 6, 'sort_order' => 6],
            ['key' => 'formation', 'label' => 'تكوين', 'percentage' => 5, 'sort_order' => 7],
        ];

        foreach ($parts as $part) {
            $subBudget = SubBudget::firstOrCreate(['label' => "كفالة شاملة - {$part['label']}"]);

            $incomeCategory = IncomeCategory::firstOrCreate(
                ['label' => "كفالة شاملة - {$part['label']}"],
                ['sub_budget_id' => $subBudget->id]
            );

            // Without at least one expense category under the sub-budget, the
            // pool can only take money in and never pay anything out - the
            // expense form lists categories filtered by sub-budget. This is a
            // sensible default, not a locked row: the association is free to
            // add finer categories under the same sub-budget.
            ExpenseCategory::firstOrCreate(
                ['label' => "كفالة شاملة - {$part['label']}"],
                ['sub_budget_id' => $subBudget->id]
            );

            KafalaChamilaSplit::firstOrCreate(
                ['key' => $part['key']],
                [
                    'label' => $part['label'],
                    'percentage' => $part['percentage'],
                    'sub_budget_id' => $subBudget->id,
                    'income_category_id' => $incomeCategory->id,
                    'sort_order' => $part['sort_order'],
                ]
            );
        }
    }
}
