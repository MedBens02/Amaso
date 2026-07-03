<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Seeds the lookup tables the application expects to exist.
 * Safe to re-run: rows are matched on their unique label/name.
 */
class ReferenceDataSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();

        foreach ([
            'مساعدة شهرية', 'مساعدة طبية', 'مساعدة تعليمية', 'مساعدة طارئة',
            'مساعدة غذائية', 'مساعدة كسوة', 'مساعدة إيجار', 'مساعدة فواتير',
        ] as $label) {
            DB::table('aid_types')->updateOrInsert(['label' => $label], ['updated_at' => $now, 'created_at' => $now]);
        }

        foreach (['شقة', 'منزل', 'غرفة', 'بيت شعبي', 'كوخ'] as $label) {
            DB::table('housing_types')->updateOrInsert(['label' => $label], ['updated_at' => $now, 'created_at' => $now]);
        }

        foreach ([
            ['سكري', false], ['ضغط دم', false], ['قلب', false], ['كلى', false], ['ربو', false],
            ['التهاب مفاصل', false], ['صداع نصفي', false], ['فقر دم', false], ['غدة درقية', false],
        ] as [$label, $chronic]) {
            DB::table('illnesses')->updateOrInsert(['label' => $label], ['is_chronic' => $chronic, 'updated_at' => $now, 'created_at' => $now]);
        }

        foreach ([
            'خياطة', 'طبخ', 'تنظيف', 'تدريس', 'أشغال يدوية',
            'حياكة', 'تطريز', 'حلاقة نسائية', 'ماكياج', 'حاسوب',
        ] as $label) {
            DB::table('skills')->updateOrInsert(['label' => $label], ['updated_at' => $now, 'created_at' => $now]);
        }

        $educationLevels = [
            [1, 'لم يلتحق بالمدرسة', 'Not Enrolled'],
            [2, 'روضة أطفال', 'Kindergarten'],
            [3, 'الصف الأول الابتدائي', 'First Grade'],
            [4, 'الصف الثاني الابتدائي', 'Second Grade'],
            [5, 'الصف الثالث الابتدائي', 'Third Grade'],
            [6, 'الصف الرابع الابتدائي', 'Fourth Grade'],
            [7, 'الصف الخامس الابتدائي', 'Fifth Grade'],
            [8, 'الصف السادس الابتدائي', 'Sixth Grade'],
            [9, 'الصف الأول الإعدادي', 'Seventh Grade'],
            [10, 'الصف الثاني الإعدادي', 'Eighth Grade'],
            [11, 'الصف الثالث الإعدادي', 'Ninth Grade'],
            [12, 'الصف الأول الثانوي', 'Tenth Grade'],
            [13, 'الصف الثاني الثانوي', 'Eleventh Grade'],
            [14, 'الصف الثالث الثانوي', 'Twelfth Grade'],
            [15, 'تخرج من الثانوية', 'High School Graduate'],
            [16, 'جامعي', 'University'],
            [17, 'تخرج من الجامعة', 'University Graduate'],
        ];
        foreach ($educationLevels as [$order, $ar, $en]) {
            DB::table('orphans_education_level')->updateOrInsert(
                ['name_ar' => $ar],
                ['name_en' => $en, 'sort_order' => $order, 'is_active' => true, 'updated_at' => $now, 'created_at' => $now]
            );
        }

        foreach (['راتب', 'معاش', 'مساعدة', 'تجارة', 'عمل حر', 'تبرعات', 'إيجار عقار', 'حرفة'] as $name) {
            DB::table('widow_income_categories')->updateOrInsert(['name' => $name], ['updated_at' => $now, 'created_at' => $now]);
        }

        foreach ([
            'إيجار', 'طعام', 'دواء', 'تعليم', 'فواتير',
            'مواصلات', 'ملابس', 'مستلزمات منزلية', 'رعاية صحية',
        ] as $name) {
            DB::table('widow_expense_categories')->updateOrInsert(['name' => $name], ['updated_at' => $now, 'created_at' => $now]);
        }
    }
}
