<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('donors')) {
            // Table already exists (database imported from amaso.sql) - adopt it as-is.
            return;
        }

        Schema::create('donors', function (Blueprint $table) {
            $table->id();
            $table->string('first_name', 120)->nullable();
            $table->string('last_name', 120)->nullable();
            $table->string('phone', 30)->nullable();
            $table->string('email', 120)->nullable();
            $table->text('address')->nullable();
            $table->timestamps();
            $table->boolean('is_kafil')->default(false);
            $table->decimal('total_given', 16, 2)->default(0);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('donors');
    }
};
