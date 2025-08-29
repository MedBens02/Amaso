<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\SubBudget;
use App\Models\IncomeCategory;
use App\Models\ExpenseCategory;

class GeneralSubBudgetsSeeder extends Seeder
{
    public function run(): void
    {
        // Clear existing data safely (handle foreign key constraints)
        \DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        IncomeCategory::truncate();
        ExpenseCategory::truncate();
        SubBudget::truncate();
        \DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        // Create general sub-budgets (not tied to fiscal years)
        $subBudgets = [
            [
                'label' => 'الرعاية الصحية',
                'income_categories' => [
                    'تبرعات للرعاية الصحية',
                    'منح طبية',
                    'دعم العلاجات'
                ],
                'expense_categories' => [
                    'أدوية ومستلزمات طبية',
                    'فحوصات طبية',
                    'عمليات جراحية',
                    'علاج طبيعي',
                    'مساعدات طبية طارئة'
                ]
            ],
            [
                'label' => 'التعليم والتدريب',
                'income_categories' => [
                    'رسوم التدريب',
                    'تبرعات تعليمية',
                    'منح دراسية'
                ],
                'expense_categories' => [
                    'رسوم مدرسية',
                    'مواد تعليمية',
                    'دورات تدريبية',
                    'منح الطلاب',
                    'مصاريف النقل للطلاب'
                ]
            ],
            [
                'label' => 'النقل والمواصلات',
                'income_categories' => [
                    'تبرعات للمواصلات',
                    'دعم النقل'
                ],
                'expense_categories' => [
                    'وقود',
                    'صيانة المركبات',
                    'تأمين المركبات',
                    'أجرة سائقين',
                    'تذاكر النقل العام'
                ]
            ],
            [
                'label' => 'الإدارة العامة',
                'income_categories' => [
                    'رسوم إدارية',
                    'تبرعات عامة'
                ],
                'expense_categories' => [
                    'رواتب الموظفين',
                    'مصاريف المكتب',
                    'إيجار',
                    'كهرباء وماء',
                    'مصاريف الاتصالات',
                    'مصاريف قانونية ومحاسبية'
                ]
            ],
            [
                'label' => 'المساعدات الاجتماعية',
                'income_categories' => [
                    'تبرعات للمساعدات الاجتماعية',
                    'زكاة',
                    'صدقات'
                ],
                'expense_categories' => [
                    'مساعدات نقدية للأرامل',
                    'مساعدات نقدية للأيتام',
                    'مساعدات غذائية',
                    'مساعدات سكن',
                    'مساعدات كسوة'
                ]
            ],
            [
                'label' => 'البرامج والفعاليات',
                'income_categories' => [
                    'رعاية الفعاليات',
                    'تبرعات للبرامج'
                ],
                'expense_categories' => [
                    'تنظيم الفعاليات',
                    'برامج ترفيهية للأطفال',
                    'ورش تدريبية',
                    'مؤتمرات ولقاءات',
                    'مواد دعائية وإعلانية'
                ]
            ]
        ];

        foreach ($subBudgets as $subBudgetData) {
            // Create sub-budget
            $subBudget = SubBudget::create([
                'label' => $subBudgetData['label']
            ]);

            // Create income categories for this sub-budget
            foreach ($subBudgetData['income_categories'] as $categoryLabel) {
                IncomeCategory::create([
                    'sub_budget_id' => $subBudget->id,
                    'label' => $categoryLabel
                ]);
            }

            // Create expense categories for this sub-budget
            foreach ($subBudgetData['expense_categories'] as $categoryLabel) {
                ExpenseCategory::create([
                    'sub_budget_id' => $subBudget->id,
                    'label' => $categoryLabel
                ]);
            }
        }

        $this->command->info('✅ General sub-budgets created successfully!');
        $this->command->info('📊 Summary:');
        $this->command->info('- Sub-budgets: ' . SubBudget::count());
        $this->command->info('- Income categories: ' . IncomeCategory::count());
        $this->command->info('- Expense categories: ' . ExpenseCategory::count());
    }
}