<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('beneficiary_group_members', function (Blueprint $table) {
            $table->foreignId('group_id')->constrained('beneficiary_groups');
            $table->enum('beneficiary_type', ['Widow', 'Orphan']);
            $table->unsignedBigInteger('beneficiary_id');
            $table->timestamps();
            
            $table->primary(['group_id', 'beneficiary_type', 'beneficiary_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('beneficiary_group_members');
    }
};