<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('widow_aid')) {
            // Table already exists (database imported from amaso.sql) - adopt it as-is.
            return;
        }

        Schema::create('widow_aid', function (Blueprint $table) {
            $table->id();
            $table->foreignId('widow_id')->constrained('widows')->cascadeOnDelete();
            $table->foreignId('aid_type_id')->constrained('aid_types')->restrictOnDelete();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->unique(['widow_id', 'aid_type_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('widow_aid');
    }
};
