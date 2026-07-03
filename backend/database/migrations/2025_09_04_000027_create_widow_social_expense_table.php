<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('widow_social_expense')) {
            // Table already exists (database imported from amaso.sql) - adopt it as-is.
            return;
        }

        Schema::create('widow_social_expense', function (Blueprint $table) {
            $table->id();
            $table->foreignId('widow_id')->constrained('widows')->cascadeOnDelete();
            $table->foreignId('expense_category_id')->constrained('widow_expense_categories')->restrictOnDelete();
            $table->decimal('amount', 10, 2);
            $table->text('remarks')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('widow_social_expense');
    }
};
