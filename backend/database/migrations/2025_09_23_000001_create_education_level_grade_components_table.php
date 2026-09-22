<?php

use App\Models\EducationLevelGradeComponent;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * How a year's mark is worked out, one scheme per school level.
 *
 * A year used to be the mean of two semesters, which is what every level
 * below the baccalaureate does. The final years do not: the national exam
 * carries most of the mark and the semesters together carry the rest. The
 * weights are the ministry's, they differ by level, and they are the same
 * for every child sitting that level - so they belong to the level, not to
 * the child.
 *
 * That is the whole point of putting them here. Somebody marking a class
 * never types a weight; they type marks into boxes that are already
 * labelled and already weighted, because an administrator set the scheme
 * for that level once.
 *
 * Weights are flat percentages that add up to 100, not a tree. "The exam is
 * 75% and the two semesters share the other 25%" is 75 / 12.5 / 12.5, which
 * is the same arithmetic and far easier to read, check and total.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('education_level_grade_components', function (Blueprint $table) {
            $table->id();
            $table->foreignId('education_level_id')
                ->constrained('orphans_education_level')
                ->cascadeOnDelete();

            $table->string('label', 120);
            // A percentage. Two decimals because splitting 25 between two
            // semesters gives 12.5, and splitting 100 three ways gives 33.33.
            $table->decimal('weight', 5, 2)->default(0);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();

            // One component of a given name per level: two rows called
            // "الامتحان الجهوي" would both claim the same mark.
            $table->unique(['education_level_id', 'label'], 'level_grade_components_unique');
            $table->index(['education_level_id', 'sort_order'], 'level_grade_components_order');
        });

        // Every level starts as what the application already did, so nothing
        // changes for the levels nobody edits.
        //
        // On a fresh install this finds no levels - the reference seeder has
        // not run yet - which is why the seeder calls the same method after
        // planting them.
        EducationLevelGradeComponent::ensureDefaultFor(
            DB::table('orphans_education_level')->pluck('id'),
        );
    }

    public function down(): void
    {
        Schema::dropIfExists('education_level_grade_components');
    }
};
