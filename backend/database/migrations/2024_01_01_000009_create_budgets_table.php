<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('budgets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('fiscal_year_id')->constrained('fiscal_years');
            $table->decimal('current_amount', 16, 2)->default(0.00);
            $table->decimal('carryover_prev_year', 16, 2)->default(0.00);
            $table->timestamps();
            
            $table->unique('fiscal_year_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('budgets');
    }
};