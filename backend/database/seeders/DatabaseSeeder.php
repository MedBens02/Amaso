<?php

namespace Database\Seeders;

use App\Support\AuditLogger;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Reference and config data is not somebody's edit, and a fresh
        // install should open its activity log on an empty page rather than
        // on a few hundred rows nobody performed.
        AuditLogger::disable();

        $this->call([
            UserSeeder::class,
            ReferenceDataSeeder::class,
            AccountingSeeder::class,
            EducationSeeder::class,
            KafalaChamilaSeeder::class,
        ]);
    }
}
