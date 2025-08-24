<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('transfers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('fiscal_year_id')->constrained('fiscal_years');
            $table->date('transfer_date');
            $table->foreignId('from_account_id')->constrained('bank_accounts');
            $table->foreignId('to_account_id')->constrained('bank_accounts');
            $table->decimal('amount', 16, 2);
            $table->text('remarks')->nullable();
            $table->enum('status', ['Draft', 'Approved'])->default('Draft');
            $table->foreignId('created_by')->nullable()->constrained('users');
            $table->foreignId('approved_by')->nullable()->constrained('users');
            $table->timestamp('approved_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('transfers');
    }
};