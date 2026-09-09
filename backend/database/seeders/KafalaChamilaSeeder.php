<?php

namespace Database\Seeders;

use App\Models\ExpenseCategory;
use App\Models\IncomeCategory;
use App\Models\KafalaChamilaSplit;
use App\Models\Budget;
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
        // Each part also gets the expense categories it is actually spent on,
        // so a payment out of a pool can be classified properly instead of
        // everything landing under one generic line. These are starting
        // points, not locked rows - the association can add its own.
        $parts = [
            [
                'key' => 'management', 'label' => 'تسيير', 'percentage' => 10, 'sort_order' => 1,
                'expenses' => ['مصاريف إدارية', 'أدوات ومستلزمات مكتبية', 'اتصالات وإنترنت'],
            ],
            [
                'key' => 'maouna', 'label' => 'معونة', 'percentage' => 50, 'sort_order' => 2,
                'expenses' => ['سلة غذائية', 'مساعدة نقدية شهرية', 'كسوة وملابس', 'مساعدة في الإيجار', 'فواتير الماء والكهرباء'],
            ],
            [
                'key' => 'education', 'label' => 'تعليم', 'percentage' => 20, 'sort_order' => 3,
                'expenses' => ['رسوم التمدرس', 'أدوات ولوازم مدرسية', 'دعم ومساندة دراسية', 'نقل مدرسي'],
            ],
            [
                'key' => 'health', 'label' => 'صحة', 'percentage' => 4, 'sort_order' => 4,
                'expenses' => ['أدوية', 'فحوصات وتحاليل', 'استشارات طبية', 'نظارات وأجهزة طبية'],
            ],
            [
                'key' => 'activities', 'label' => 'تربية وترفيه', 'percentage' => 5, 'sort_order' => 5,
                'expenses' => ['رحلات وخرجات', 'مخيمات صيفية', 'أنشطة ثقافية ورياضية', 'هدايا المناسبات'],
            ],
            [
                'key' => 'projects', 'label' => 'مشاريع', 'percentage' => 6, 'sort_order' => 6,
                'expenses' => ['مشاريع مدرة للدخل', 'تجهيز مشروع أسرة', 'دعم نشاط حر'],
            ],
            [
                'key' => 'formation', 'label' => 'تكوين', 'percentage' => 5, 'sort_order' => 7,
                'expenses' => ['دورات تكوينية', 'تكوين مهني', 'ورشات تأهيلية'],
            ],
        ];

        // One category for every part: a kafala payment is the same kind of
        // income whichever fund it lands in, and categories are no longer
        // tied to a budget so there is nothing to duplicate.
        $incomeCategory = IncomeCategory::firstOrCreate(['label' => 'كفالة شاملة']);

        foreach ($parts as $part) {
            $budget = Budget::firstOrCreate(['label' => "كفالة شاملة - {$part['label']}"]);

            // Spending categories are shared across the whole system now, so
            // these are simply added to the common list rather than being
            // owned by this fund.
            foreach ($part['expenses'] as $expenseLabel) {
                ExpenseCategory::firstOrCreate(['label' => $expenseLabel]);
            }

            KafalaChamilaSplit::firstOrCreate(
                ['key' => $part['key']],
                [
                    'label' => $part['label'],
                    'percentage' => $part['percentage'],
                    'budget_id' => $budget->id,
                    'income_category_id' => $incomeCategory->id,
                    'sort_order' => $part['sort_order'],
                ]
            );
        }
    }
}
