<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Two things the enrollment record could not express.
 *
 * Higher education was a single rung. `orphans_education_level` is a ladder
 * of school years that ends "جامعي" - one level for the whole of university -
 * so a student who reached it had nowhere left to go, and the yearly rollover
 * promoted them straight into "تخرج من الجامعة" after a single year. Which
 * year of which course a student is in is a property of that enrollment, not
 * a new rung on a shared reference ladder, so it lives here: the phase
 * (licence, master, a two-year technician course...) and the year within it.
 *
 * Tutoring is what the association pays for on top of schooling, and it had
 * nowhere to be recorded at all - so nobody could answer "who are we
 * supporting, in which subjects, and through whom".
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orphan_enrollments', function (Blueprint $table) {
            $table->string('higher_education_phase', 20)->nullable()->after('specialty');
            $table->unsignedTinyInteger('higher_education_year')->nullable()->after('higher_education_phase');

            $table->boolean('has_tutoring')->default(false)->after('grade_scale');
            $table->string('tutoring_subjects', 255)->nullable()->after('has_tutoring');
            $table->string('tutoring_provider', 150)->nullable()->after('tutoring_subjects');

            // "Who is getting tutoring this year" is the one question this
            // flag exists to answer, and it is always asked within a year.
            $table->index(['academic_year_id', 'has_tutoring'], 'enrollments_year_tutoring_index');
        });
    }

    public function down(): void
    {
        Schema::table('orphan_enrollments', function (Blueprint $table) {
            $table->dropIndex('enrollments_year_tutoring_index');
            $table->dropColumn([
                'higher_education_phase',
                'higher_education_year',
                'has_tutoring',
                'tutoring_subjects',
                'tutoring_provider',
            ]);
        });
    }
};
