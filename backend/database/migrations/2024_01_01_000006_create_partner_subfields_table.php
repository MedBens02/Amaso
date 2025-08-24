<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('partner_subfields', function (Blueprint $table) {
            $table->id();
            $table->foreignId('field_id')->constrained('partner_fields');
            $table->string('label', 120)->nullable();
            $table->timestamps();
            
            $table->unique(['field_id', 'label']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('partner_subfields');
    }
};