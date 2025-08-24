<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('widow_social', function (Blueprint $table) {
            $table->id();
            $table->foreignId('widow_id')->constrained('widows')->onDelete('cascade');
            $table->foreignId('housing_type_id')->constrained('housing_types')->onDelete('restrict');
            $table->enum('housing_status', ['owned', 'rented', 'free']);
            $table->boolean('has_water')->default(false);
            $table->boolean('has_electricity')->default(false);
            $table->integer('has_furniture')->default(0); // Score out of 5
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('widow_social');
    }
};