<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('expense_beneficiaries')) {
            // Table already exists (database imported from amaso.sql) - adopt it as-is.
            return;
        }

        Schema::create('expense_beneficiaries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('expense_id')->constrained('expenses');
            $table->unsignedBigInteger('beneficiary_id')->nullable();
            $table->unsignedBigInteger('group_id')->nullable();
            $table->decimal('amount', 16, 2);
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->index('beneficiary_id', 'idx_eb_beneficiary_id');
            $table->foreign('beneficiary_id', 'fk_eb_beneficiaries')->references('id')->on('beneficiaries')->cascadeOnDelete();
            $table->foreign('group_id', 'fk_exp_ben_group')->references('id')->on('beneficiary_groups')->restrictOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('expense_beneficiaries');
    }
};
