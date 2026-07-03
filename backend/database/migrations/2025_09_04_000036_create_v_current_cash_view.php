<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement('DROP VIEW IF EXISTS v_current_cash');
        DB::statement('CREATE VIEW v_current_cash AS SELECT IFNULL(SUM(balance), 0.00) AS current_cash FROM bank_accounts');
    }

    public function down(): void
    {
        DB::statement('DROP VIEW IF EXISTS v_current_cash');
    }
};
