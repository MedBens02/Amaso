<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('sub_budgets')) {
            // Table already exists (database imported from amaso.sql) - adopt it as-is.
            return;
        }

        Schema::create('sub_budgets', function (Blueprint $table) {
            $table->id();
            $table->string('label', 120);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sub_budgets');
    }
};
