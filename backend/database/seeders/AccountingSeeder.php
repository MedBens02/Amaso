<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Seeds the accounting structure: sub-budgets, income/expense categories
 * and the active fiscal year.
 *
 * IDs are pinned for sub-budgets and categories because the two are linked
 * and because the application relies on the sentinel category id 999
 * ("Deleted Category (Default)") that deleted-category records fall back to.
 * Safe to re-run.
 */
class AccountingSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();

        $subBudgets = [
            [1, 'الرعاية الصحية'],
            [2, 'التعليم والتدريب'],
            [3, 'النقل والمواصلات'],
            [4, 'الإدارة العامة'],
            [5, 'المساعدات الاجتماعية'],
            [6, 'البرامج والفعاليات'],
            [8, 'كفالة شاملة'],
        ];
        foreach ($subBudgets as [$id, $label]) {
            DB::table('sub_budgets')->updateOrInsert(['id' => $id], ['label' => $label, 'updated_at' => $now, 'created_at' => $now]);
        }

        $incomeCategories = [
            [1, 1, 'تبرعات للرعاية الصحية'],
            [3, 1, 'دعم العلاجات'],
            [4, 2, 'رسوم التدريب'],
            [5, 2, 'تبرعات تعليمية'],
            [6, 2, 'منح دراسية'],
            [7, 3, 'تبرعات للمواصلات'],
            [8, 3, 'دعم النقل'],
            [9, 4, 'رسوم إدارية'],
            [10, 4, 'تبرعات عامة'],
            [11, 5, 'تبرعات للمساعدات الاجتماعية'],
            [12, 5, 'زكاة'],
            [13, 5, 'صدقات'],
            [14, 6, 'رعاية الفعاليات'],
            [15, 6, 'تبرعات للبرامج'],
            [999, 1, 'Deleted Category (Default)'],
            [1002, 8, 'كفالة شاملة'],
        ];
        foreach ($incomeCategories as [$id, $subBudgetId, $label]) {
            DB::table('income_categories')->updateOrInsert(
                ['id' => $id],
                ['sub_budget_id' => $subBudgetId, 'label' => $label, 'updated_at' => $now, 'created_at' => $now]
            );
        }

        $expenseCategories = [
            [1, 1, 'أدوية ومستلزمات طبية'],
            [2, 1, 'فحوصات طبية'],
            [3, 1, 'عمليات جراحية'],
            [4, 1, 'علاج طبيعي'],
            [5, 1, 'مساعدات طبية طارئة'],
            [6, 2, 'رسوم مدرسية'],
            [7, 2, 'مواد تعليمية'],
            [8, 2, 'دورات تدريبية'],
            [9, 2, 'منح الطلاب'],
            [10, 2, 'مصاريف النقل للطلاب'],
            [11, 3, 'وقود'],
            [12, 3, 'صيانة المركبات'],
            [13, 3, 'تأمين المركبات'],
            [14, 3, 'أجرة سائقين'],
            [15, 3, 'تذاكر النقل العام'],
            [16, 4, 'رواتب الموظفين'],
            [17, 4, 'مصاريف المكتب'],
            [18, 4, 'إيجار'],
            [19, 4, 'كهرباء وماء'],
            [20, 4, 'مصاريف الاتصالات'],
            [21, 4, 'مصاريف قانونية ومحاسبية'],
            [22, 5, 'مساعدات نقدية للأرامل'],
            [23, 5, 'مساعدات نقدية للأيتام'],
            [24, 5, 'مساعدات غذائية'],
            [25, 5, 'مساعدات سكن'],
            [26, 5, 'مساعدات كسوة'],
            [27, 6, 'تنظيم الفعاليات'],
            [28, 6, 'برامج ترفيهية للأطفال'],
            [29, 6, 'ورش تدريبية'],
            [30, 6, 'مؤتمرات ولقاءات'],
            [31, 6, 'مواد دعائية وإعلانية'],
            [999, 1, 'Deleted Category (Default)'],
        ];
        foreach ($expenseCategories as [$id, $subBudgetId, $label]) {
            DB::table('expense_categories')->updateOrInsert(
                ['id' => $id],
                ['sub_budget_id' => $subBudgetId, 'label' => $label, 'updated_at' => $now, 'created_at' => $now]
            );
        }

        DB::table('fiscal_years')->updateOrInsert(
            ['year' => (int) date('Y')],
            ['is_active' => true, 'carryover_prev_year' => 0, 'carryover_next_year' => 0, 'updated_at' => $now, 'created_at' => $now]
        );
    }
}
