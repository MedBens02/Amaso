<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('fiscal_years')) {
            // Table already exists (database imported from amaso.sql) - adopt it as-is.
            return;
        }

        Schema::create('fiscal_years', function (Blueprint $table) {
            $table->id();
            $table->year('year')->unique();
            $table->boolean('is_active')->default(true);
            $table->decimal('carryover_prev_year', 16, 2)->default(0);
            $table->decimal('carryover_next_year', 16, 2)->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('fiscal_years');
    }
};
