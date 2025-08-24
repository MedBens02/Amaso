<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('widow_social_income', function (Blueprint $table) {
            $table->id();
            $table->foreignId('widow_id')->constrained('widows')->onDelete('cascade');
            $table->foreignId('income_category_id')->constrained('widow_income_categories')->onDelete('restrict');
            $table->decimal('amount', 10, 2);
            $table->text('remarks')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('widow_social_income');
    }
};