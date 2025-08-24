<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('kafils', function (Blueprint $table) {
            $table->foreignId('donor_id')->nullable()->constrained('donors')->onDelete('cascade');
            $table->decimal('monthly_pledge', 10, 2)->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('kafils', function (Blueprint $table) {
            $table->dropForeign(['donor_id']);
            $table->dropColumn(['donor_id', 'monthly_pledge']);
        });
    }
};