<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * One list of marks per year, each carrying what it is worth.
 *
 * The two semesters were columns on the enrollment and every other mark was
 * a row in enrollment_grades, so a year's marks lived in two places and only
 * the columns counted towards the average. Weighting them means they have to
 * be the same kind of thing, so the columns become rows like the rest.
 *
 * The weight rides on the row rather than being read from the level's scheme
 * each time. A mark is a record of what was awarded and what it counted for;
 * an administrator correcting a level's weights next year must not silently
 * re-price a year already marked and reported on. The dialog offers to
 * re-apply the level's weights when somebody actually wants that - the same
 * reason the transport sheet copies a rate into its lines.
 *
 * Marks with no weight are still worth recording - a mock exam, a resit that
 * was not counted - so a weight of zero means "on the record, not in the
 * average" rather than "delete this".
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('enrollment_grades', function (Blueprint $table) {
            $table->decimal('weight', 5, 2)->default(0)->after('scale');
        });

        // The marks that already existed were free-text extras entered
        // alongside the semesters, and none of them counted towards anything.
        // Leaving them at zero keeps every existing average exactly as it was.

        $semesters = [
            ['column' => 'first_semester_grade', 'label' => 'الأسدس الأول', 'order' => 0],
            ['column' => 'second_semester_grade', 'label' => 'الأسدس الثاني', 'order' => 1],
        ];

        $now = now();

        foreach ($semesters as $semester) {
            // Chunked: this runs over every enrollment ever recorded, and a
            // single insert of all of them is a statement no database should
            // be handed.
            DB::table('orphan_enrollments')
                ->whereNotNull($semester['column'])
                ->select('id', $semester['column'] . ' as mark', 'grade_scale')
                ->orderBy('id')
                ->chunk(500, function ($enrollments) use ($semester, $now) {
                    $rows = [];

                    foreach ($enrollments as $enrollment) {
                        $rows[] = [
                            'enrollment_id' => $enrollment->id,
                            'label' => $semester['label'],
                            'mark' => $enrollment->mark,
                            'scale' => $enrollment->grade_scale ?: 20,
                            // Half each, which is the mean the column pair
                            // already produced.
                            'weight' => 50,
                            'sort_order' => $semester['order'],
                            'created_at' => $now,
                            'updated_at' => $now,
                        ];
                    }

                    if ($rows !== []) {
                        DB::table('enrollment_grades')->insert($rows);
                    }
                });
        }

        Schema::table('orphan_enrollments', function (Blueprint $table) {
            // grade_scale stays: it is the ceiling the year's mark is
            // expressed on, which is still a property of the enrollment even
            // though each mark now carries its own.
            $table->dropColumn(['first_semester_grade', 'second_semester_grade']);
        });
    }

    public function down(): void
    {
        Schema::table('orphan_enrollments', function (Blueprint $table) {
            $table->decimal('first_semester_grade', 5, 2)->nullable()->after('status');
            $table->decimal('second_semester_grade', 5, 2)->nullable()->after('first_semester_grade');
        });

        foreach ([
            ['label' => 'الأسدس الأول', 'column' => 'first_semester_grade'],
            ['label' => 'الأسدس الثاني', 'column' => 'second_semester_grade'],
        ] as $semester) {
            DB::table('enrollment_grades')
                ->where('label', $semester['label'])
                ->orderBy('id')
                ->chunk(500, function ($grades) use ($semester) {
                    foreach ($grades as $grade) {
                        DB::table('orphan_enrollments')
                            ->where('id', $grade->enrollment_id)
                            ->update([$semester['column'] => $grade->mark]);
                    }
                });

            DB::table('enrollment_grades')->where('label', $semester['label'])->delete();
        }

        Schema::table('enrollment_grades', function (Blueprint $table) {
            $table->dropColumn('weight');
        });
    }
};
