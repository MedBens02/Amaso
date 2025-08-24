<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('widows', function (Blueprint $table) {
            $table->id();
            $table->string('first_name', 120)->nullable();
            $table->string('last_name', 120)->nullable();
            $table->string('phone', 30)->nullable();
            $table->string('email', 120)->nullable();
            $table->text('address')->nullable();
            $table->string('neighborhood', 120)->nullable();
            $table->date('admission_date')->nullable();
            $table->string('national_id', 30)->nullable();
            $table->date('birth_date')->nullable();
            $table->enum('marital_status', ['Single', 'Widowed', 'Remarried', 'Divorced'])->default('Widowed');
            $table->string('education_level', 100)->nullable();
            $table->boolean('disability_flag')->default(false);
            $table->string('disability_type', 120)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('widows');
    }
};