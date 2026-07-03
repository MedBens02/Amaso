<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('bank_accounts')) {
            // Table already exists (database imported from amaso.sql) - adopt it as-is.
            return;
        }

        Schema::create('bank_accounts', function (Blueprint $table) {
            $table->id();
            $table->string('label', 120)->nullable()->unique();
            $table->string('bank_name', 120)->nullable();
            $table->string('account_number', 60)->nullable();
            $table->decimal('balance', 16, 2)->default(0);
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bank_accounts');
    }
};
