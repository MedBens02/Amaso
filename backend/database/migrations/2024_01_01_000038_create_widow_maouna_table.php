<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('widow_maouna', function (Blueprint $table) {
            $table->id();
            $table->foreignId('widow_id')->constrained('widows')->onDelete('cascade');
            $table->foreignId('partner_id')->constrained('partners')->onDelete('restrict');
            $table->decimal('amount', 10, 2);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('widow_maouna');
    }
};