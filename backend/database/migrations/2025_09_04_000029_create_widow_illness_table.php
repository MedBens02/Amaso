<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('widow_illness')) {
            // Table already exists (database imported from amaso.sql) - adopt it as-is.
            return;
        }

        Schema::create('widow_illness', function (Blueprint $table) {
            $table->id();
            $table->foreignId('widow_id')->constrained('widows')->cascadeOnDelete();
            $table->foreignId('illness_id')->constrained('illnesses')->restrictOnDelete();
            $table->timestamps();
            $table->unique(['widow_id', 'illness_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('widow_illness');
    }
};
