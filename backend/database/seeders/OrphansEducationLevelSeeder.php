<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class OrphansEducationLevelSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $educationLevels = [
            ['name_ar' => 'لم يلتحق بالمدرسة', 'name_en' => 'Not Enrolled', 'sort_order' => 1],
            ['name_ar' => 'روضة أطفال', 'name_en' => 'Kindergarten', 'sort_order' => 2],
            ['name_ar' => 'الصف الأول الابتدائي', 'name_en' => 'First Grade', 'sort_order' => 3],
            ['name_ar' => 'الصف الثاني الابتدائي', 'name_en' => 'Second Grade', 'sort_order' => 4],
            ['name_ar' => 'الصف الثالث الابتدائي', 'name_en' => 'Third Grade', 'sort_order' => 5],
            ['name_ar' => 'الصف الرابع الابتدائي', 'name_en' => 'Fourth Grade', 'sort_order' => 6],
            ['name_ar' => 'الصف الخامس الابتدائي', 'name_en' => 'Fifth Grade', 'sort_order' => 7],
            ['name_ar' => 'الصف السادس الابتدائي', 'name_en' => 'Sixth Grade', 'sort_order' => 8],
            ['name_ar' => 'الصف الأول الإعدادي', 'name_en' => 'Seventh Grade', 'sort_order' => 9],
            ['name_ar' => 'الصف الثاني الإعدادي', 'name_en' => 'Eighth Grade', 'sort_order' => 10],
            ['name_ar' => 'الصف الثالث الإعدادي', 'name_en' => 'Ninth Grade', 'sort_order' => 11],
            ['name_ar' => 'الصف الأول الثانوي', 'name_en' => 'Tenth Grade', 'sort_order' => 12],
            ['name_ar' => 'الصف الثاني الثانوي', 'name_en' => 'Eleventh Grade', 'sort_order' => 13],
            ['name_ar' => 'الصف الثالث الثانوي', 'name_en' => 'Twelfth Grade', 'sort_order' => 14],
            ['name_ar' => 'تخرج من الثانوية', 'name_en' => 'High School Graduate', 'sort_order' => 15],
            ['name_ar' => 'جامعي', 'name_en' => 'University', 'sort_order' => 16],
            ['name_ar' => 'تخرج من الجامعة', 'name_en' => 'University Graduate', 'sort_order' => 17],
        ];

        foreach ($educationLevels as $level) {
            DB::table('orphans_education_level')->insert([
                'name_ar' => $level['name_ar'],
                'name_en' => $level['name_en'],
                'sort_order' => $level['sort_order'],
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
}
