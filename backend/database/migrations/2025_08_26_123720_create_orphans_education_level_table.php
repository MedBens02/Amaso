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
        Schema::create('orphans_education_level', function (Blueprint $table) {
            $table->id();
            $table->string('name_ar', 100); // Arabic name
            $table->string('name_en', 100)->nullable(); // English name (optional)
            $table->integer('sort_order')->default(0); // For ordering
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('orphans_education_level');
    }
};
