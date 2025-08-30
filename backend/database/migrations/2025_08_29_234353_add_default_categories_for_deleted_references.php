<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        DB::table('expense_categories')->insertOrIgnore([
            'id' => 999,
            'sub_budget_id' => 1, // Assuming first sub_budget exists
            'label' => 'Deleted Category (Default)',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('income_categories')->insertOrIgnore([
            'id' => 999,
            'sub_budget_id' => 1, // Assuming first sub_budget exists
            'label' => 'Deleted Category (Default)',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::table('expense_categories')->where('id', 999)->delete();
        DB::table('income_categories')->where('id', 999)->delete();
    }
};
