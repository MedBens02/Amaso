<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orphan_enrollments', function (Blueprint $table) {
            // Moroccan schools mark out of 20; universities sometimes use another
            // ceiling, so the scale is stored per enrollment and rankings compare
            // percentages rather than raw marks.
            $table->decimal('first_semester_grade', 5, 2)->nullable()->after('specialty');
            $table->decimal('second_semester_grade', 5, 2)->nullable()->after('first_semester_grade');
            $table->decimal('grade_scale', 5, 2)->default(20)->after('second_semester_grade');
        });
    }

    public function down(): void
    {
        Schema::table('orphan_enrollments', function (Blueprint $table) {
            $table->dropColumn(['first_semester_grade', 'second_semester_grade', 'grade_scale']);
        });
    }
};
