<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('kafil_sponsorship', function (Blueprint $table) {
            $table->id();
            $table->foreignId('kafil_id')->constrained('kafils');
            $table->foreignId('widow_id')->constrained('widows');
            $table->decimal('amount', 10, 2)->default(0.00);
            $table->timestamps();
            
            $table->unique(['kafil_id', 'widow_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('kafil_sponsorship');
    }
};