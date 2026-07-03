<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('aid_types')) {
            // Table already exists (database imported from amaso.sql) - adopt it as-is.
            return;
        }

        Schema::create('aid_types', function (Blueprint $table) {
            $table->id();
            $table->string('label', 120)->nullable()->unique();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('aid_types');
    }
};
