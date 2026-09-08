<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('orphan_enrollments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('orphan_id')->constrained('orphans')->cascadeOnDelete();
            $table->foreignId('academic_year_id')->constrained('academic_years');
            $table->foreignId('education_level_id')->nullable()->constrained('orphans_education_level')->nullOnDelete();
            $table->foreignId('school_id')->nullable()->constrained('schools')->nullOnDelete();
            $table->string('specialty', 150)->nullable(); // university stage
            $table->enum('status', ['enrolled', 'passed', 'failed', 'left'])->default('enrolled');
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->unique(['orphan_id', 'academic_year_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('orphan_enrollments');
    }
};
