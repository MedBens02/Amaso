<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('widow_skill', function (Blueprint $table) {
            $table->id();
            $table->foreignId('widow_id')->constrained('widows')->onDelete('cascade');
            $table->foreignId('skill_id')->constrained('skills')->onDelete('restrict');
            $table->timestamps();
            
            $table->unique(['widow_id', 'skill_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('widow_skill');
    }
};