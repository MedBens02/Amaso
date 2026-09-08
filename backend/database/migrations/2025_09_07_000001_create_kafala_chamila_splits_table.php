<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('kafala_chamila_splits', function (Blueprint $table) {
            $table->id();
            // Stable machine key (management/maouna/education/health/activities/projects/formation).
            // sub_budget_id/income_category_id/key never change once seeded - only percentage does.
            $table->string('key', 30)->unique();
            $table->string('label', 120);
            $table->decimal('percentage', 5, 2);
            $table->foreignId('sub_budget_id')->constrained('sub_budgets');
            $table->foreignId('income_category_id')->constrained('income_categories');
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('kafala_chamila_splits');
    }
};
