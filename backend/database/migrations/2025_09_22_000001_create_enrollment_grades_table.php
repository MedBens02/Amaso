<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Exam marks, as many as a student sits.
 *
 * An enrollment carries two semester averages, which is what the school
 * issues and what the performance report ranks on. Those stay where they
 * are. What was missing is everything in between: a regional exam, a
 * controlled assessment, a resit - marks the association wants on file
 * without pretending they are the year's result.
 *
 * Each one is a label, a mark and the ceiling that mark was out of, because
 * a 15 means nothing without knowing whether it was out of 20 or out of 40,
 * and the two semester averages already learned that lesson (grade_scale).
 * The scale is stored per mark rather than per enrollment: an exam can be
 * marked on a different ceiling from the term.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('enrollment_grades', function (Blueprint $table) {
            $table->id();
            $table->foreignId('enrollment_id')
                ->constrained('orphan_enrollments')
                ->cascadeOnDelete();

            $table->string('label', 120);
            $table->decimal('mark', 6, 2);
            $table->decimal('scale', 6, 2)->default(20);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();

            // Every read is "the marks for this enrollment, in order".
            $table->index(['enrollment_id', 'sort_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('enrollment_grades');
    }
};
