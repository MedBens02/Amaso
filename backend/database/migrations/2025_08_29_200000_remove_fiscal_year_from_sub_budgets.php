<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('sub_budgets', function (Blueprint $table) {
            // Drop foreign key constraint first
            $table->dropForeign(['fiscal_year_id']);
            // Drop the fiscal_year_id column
            $table->dropColumn('fiscal_year_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sub_budgets', function (Blueprint $table) {
            // Add back the fiscal_year_id column
            $table->foreignId('fiscal_year_id')->constrained('fiscal_years');
        });
    }
};