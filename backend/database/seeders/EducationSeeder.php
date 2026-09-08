<?php

namespace Database\Seeders;

use App\Models\AcademicYear;
use Illuminate\Database\Seeder;

class EducationSeeder extends Seeder
{
    public function run(): void
    {
        // Academic years run September-August: before September we are still
        // in the year that started last calendar year.
        $startYear = (int) date('n') >= 9 ? (int) date('Y') : (int) date('Y') - 1;

        AcademicYear::firstOrCreate(
            ['start_year' => $startYear],
            [
                'label' => AcademicYear::labelFor($startYear),
                'is_current' => !AcademicYear::where('is_current', true)->exists(),
            ]
        );
    }
}
