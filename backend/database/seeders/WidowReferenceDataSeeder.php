<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class WidowReferenceDataSeeder extends Seeder
{
    public function run(): void
    {
        // Housing Types
        $housingTypes = [
            ['label' => 'شقة'],
            ['label' => 'منزل'],
            ['label' => 'غرفة'],
            ['label' => 'بيت شعبي'],
            ['label' => 'كوخ']
        ];
        foreach ($housingTypes as $type) {
            DB::table('housing_types')->updateOrInsert(
                ['label' => $type['label']],
                [
                    'label' => $type['label'],
                    'created_at' => now(),
                    'updated_at' => now()
                ]
            );
        }

        // Skills
        $skills = [
            ['label' => 'خياطة'],
            ['label' => 'طبخ'],
            ['label' => 'تنظيف'],
            ['label' => 'تدريس'],
            ['label' => 'أشغال يدوية'],
            ['label' => 'حياكة'],
            ['label' => 'تطريز'],
            ['label' => 'حلاقة نسائية'],
            ['label' => 'ماكياج'],
            ['label' => 'حاسوب']
        ];
        foreach ($skills as $skill) {
            DB::table('skills')->updateOrInsert(
                ['label' => $skill['label']],
                [
                    'label' => $skill['label'],
                    'created_at' => now(),
                    'updated_at' => now()
                ]
            );
        }

        // Illnesses
        $illnesses = [
            ['label' => 'سكري'],
            ['label' => 'ضغط دم'],
            ['label' => 'قلب'],
            ['label' => 'كلى'],
            ['label' => 'ربو'],
            ['label' => 'التهاب مفاصل'],
            ['label' => 'صداع نصفي'],
            ['label' => 'فقر دم'],
            ['label' => 'غدة درقية']
        ];
        foreach ($illnesses as $illness) {
            DB::table('illnesses')->updateOrInsert(
                ['label' => $illness['label']],
                [
                    'label' => $illness['label'],
                    'created_at' => now(),
                    'updated_at' => now()
                ]
            );
        }

        // Aid Types
        $aidTypes = [
            ['label' => 'مساعدة شهرية'],
            ['label' => 'مساعدة طبية'],
            ['label' => 'مساعدة تعليمية'],
            ['label' => 'مساعدة طارئة'],
            ['label' => 'مساعدة غذائية'],
            ['label' => 'مساعدة كسوة'],
            ['label' => 'مساعدة إيجار'],
            ['label' => 'مساعدة فواتير']
        ];
        foreach ($aidTypes as $aidType) {
            DB::table('aid_types')->updateOrInsert(
                ['label' => $aidType['label']],
                [
                    'label' => $aidType['label'],
                    'created_at' => now(),
                    'updated_at' => now()
                ]
            );
        }

        // Widow Income Categories
        $incomeCategories = [
            ['name' => 'راتب'],
            ['name' => 'معاش'],
            ['name' => 'مساعدة'],
            ['name' => 'تجارة'],
            ['name' => 'عمل حر'],
            ['name' => 'تبرعات'],
            ['name' => 'إيجار عقار'],
            ['name' => 'حرفة']
        ];
        foreach ($incomeCategories as $category) {
            DB::table('widow_income_categories')->updateOrInsert(
                ['name' => $category['name']],
                [
                    'name' => $category['name'],
                    'created_at' => now(),
                    'updated_at' => now()
                ]
            );
        }

        // Widow Expense Categories
        $expenseCategories = [
            ['name' => 'إيجار'],
            ['name' => 'طعام'],
            ['name' => 'دواء'],
            ['name' => 'تعليم'],
            ['name' => 'فواتير'],
            ['name' => 'مواصلات'],
            ['name' => 'ملابس'],
            ['name' => 'مستلزمات منزلية'],
            ['name' => 'رعاية صحية']
        ];
        foreach ($expenseCategories as $category) {
            DB::table('widow_expense_categories')->updateOrInsert(
                ['name' => $category['name']],
                [
                    'name' => $category['name'],
                    'created_at' => now(),
                    'updated_at' => now()
                ]
            );
        }

        // Create basic partner fields first
        $fieldData = DB::table('partner_fields')->where('label', 'مساعدات اجتماعية')->first();
        if (!$fieldData) {
            $fieldId = DB::table('partner_fields')->insertGetId([
                'label' => 'مساعدات اجتماعية',
                'created_at' => now(),
                'updated_at' => now()
            ]);
        } else {
            $fieldId = $fieldData->id;
        }

        $subfieldData = DB::table('partner_subfields')->where('field_id', $fieldId)->where('label', 'معونات مالية')->first();
        if (!$subfieldData) {
            $subfieldId = DB::table('partner_subfields')->insertGetId([
                'field_id' => $fieldId,
                'label' => 'معونات مالية',
                'created_at' => now(),
                'updated_at' => now()
            ]);
        } else {
            $subfieldId = $subfieldData->id;
        }

        // Partners for Maouna
        $partners = [
            ['name' => 'شريك المعونة الأول'],
            ['name' => 'شريك المعونة الثاني'],
            ['name' => 'وزارة التنمية الاجتماعية'],
            ['name' => 'الأونروا'],
            ['name' => 'جمعية خيرية محلية']
        ];
        foreach ($partners as $partner) {
            DB::table('partners')->updateOrInsert(
                ['name' => $partner['name']],
                [
                    'name' => $partner['name'],
                    'field_id' => $fieldId,
                    'subfield_id' => $subfieldId,
                    'created_at' => now(),
                    'updated_at' => now()
                ]
            );
        }
    }
}