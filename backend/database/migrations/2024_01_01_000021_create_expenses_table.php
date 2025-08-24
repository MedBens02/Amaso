<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('expenses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('fiscal_year_id')->constrained('fiscal_years');
            $table->foreignId('sub_budget_id')->constrained('sub_budgets');
            $table->foreignId('expense_category_id')->constrained('expense_categories');
            $table->foreignId('partner_id')->nullable()->constrained('partners');
            $table->text('details')->nullable();
            $table->date('expense_date');
            $table->decimal('amount', 16, 2);
            $table->enum('payment_method', ['Cash', 'Cheque', 'BankWire']);
            $table->string('cheque_number', 60)->nullable();
            $table->string('receipt_number', 60)->nullable();
            $table->foreignId('bank_account_id')->nullable()->constrained('bank_accounts');
            $table->text('remarks')->nullable();
            $table->boolean('unrelated_to_benef')->default(false);
            $table->enum('status', ['Draft', 'Approved'])->default('Draft');
            $table->foreignId('created_by')->nullable()->constrained('users');
            $table->foreignId('approved_by')->nullable()->constrained('users');
            $table->timestamp('approved_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('expenses');
    }
};