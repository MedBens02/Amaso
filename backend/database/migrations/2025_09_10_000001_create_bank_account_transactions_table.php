<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * An append-only history of every change to a bank account balance.
     *
     * bank_accounts.balance is mutated in place by three different flows
     * (income approval, income deposit, expense approval, transfers). Until
     * now nothing recorded when or why it moved, so a wrong balance could
     * neither be explained nor traced. Every balance change writes a row here
     * inside the same transaction, which makes the stored balance verifiable:
     * see the finance:reconcile command.
     */
    public function up(): void
    {
        Schema::create('bank_account_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('bank_account_id')->constrained('bank_accounts')->cascadeOnDelete();

            // What caused the movement, e.g. income/expense/transfer, plus the
            // id of that record. Kept as a plain pair rather than a polymorphic
            // relation because the source tables are unrelated and this is only
            // ever read for auditing.
            $table->string('source_type', 30);
            $table->unsignedBigInteger('source_id')->nullable();

            // Signed: credits are positive, debits negative.
            $table->decimal('amount', 16, 2);
            $table->decimal('balance_after', 16, 2);

            $table->string('description', 255)->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users');
            $table->timestamps();

            $table->index(['bank_account_id', 'id']);
            $table->index(['source_type', 'source_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bank_account_transactions');
    }
};
