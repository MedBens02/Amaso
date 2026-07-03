<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('beneficiary_group_members')) {
            // Table already exists (database imported from amaso.sql) - adopt it as-is.
            return;
        }

        Schema::create('beneficiary_group_members', function (Blueprint $table) {
            $table->foreignId('group_id')->constrained('beneficiary_groups');
            $table->unsignedBigInteger('beneficiary_id');
            $table->timestamps();
            $table->primary(['group_id', 'beneficiary_id']);
            $table->index('beneficiary_id', 'idx_bgm_beneficiary_id');
            $table->foreign('beneficiary_id', 'fk_bgm_beneficiaries')->references('id')->on('beneficiaries')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('beneficiary_group_members');
    }
};
