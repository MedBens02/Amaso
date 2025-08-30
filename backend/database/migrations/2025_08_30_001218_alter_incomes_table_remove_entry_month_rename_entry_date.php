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
        Schema::table('incomes', function (Blueprint $table) {
            // Remove the entry_month column
            $table->dropColumn('entry_month');
            
            // Rename entry_date to income_date
            $table->renameColumn('entry_date', 'income_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('incomes', function (Blueprint $table) {
            // Rename income_date back to entry_date
            $table->renameColumn('income_date', 'entry_date');
            
            // Add back the entry_month column
            $table->integer('entry_month')->nullable();
        });
    }
};
