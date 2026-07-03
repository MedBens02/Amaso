<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('beneficiaries')) {
            // Table already exists (database imported from amaso.sql) - adopt it as-is.
            return;
        }

        Schema::create('beneficiaries', function (Blueprint $table) {
            $table->id();
            $table->enum('type', ['Widow', 'Orphan']);
            $table->foreignId('widow_id')->nullable()->unique('uniq_widow');
            $table->foreignId('orphan_id')->nullable()->unique('uniq_orphan');
            $table->timestamp('created_at')->nullable()->useCurrent();
            $table->timestamp('updated_at')->nullable()->useCurrent()->useCurrentOnUpdate();
            $table->foreign('widow_id', 'fk_benef_widow')->references('id')->on('widows')->cascadeOnDelete();
            $table->foreign('orphan_id', 'fk_benef_orphan')->references('id')->on('orphans')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('beneficiaries');
    }
};
