<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Indexes for the columns the application actually filters and sorts on.
 *
 * Laravel indexed every foreign key when the tables were created, so joins
 * were already covered - but nothing indexed the columns the list screens
 * and the whole reporting layer narrow by. `status` and the date column are
 * in almost every query the money side makes ("approved incomes between
 * these two dates"), and the two soft-deleted tables scan `deleted_at` on
 * literally every read.
 *
 * The composite pairs lead with `status` because it is always an equality
 * test, with the date range second: that order lets one index serve both the
 * filter and the `order by <date> desc` the lists finish with. A date-only
 * filter cannot use a composite whose first column is missing, so the plain
 * date indexes are kept alongside them for that case.
 *
 * On the association's present data this changes little - the tables are
 * small enough to scan quickly. It matters as the records accumulate, where
 * a scan grows with the table and an index lookup does not.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('incomes', function (Blueprint $table) {
            $table->index(['status', 'income_date'], 'incomes_status_date_index');
            $table->index('income_date', 'incomes_income_date_index');
            $table->index('payment_method', 'incomes_payment_method_index');
        });

        Schema::table('expenses', function (Blueprint $table) {
            $table->index(['status', 'expense_date'], 'expenses_status_date_index');
            $table->index('expense_date', 'expenses_expense_date_index');
            $table->index('payment_method', 'expenses_payment_method_index');
        });

        // Every widow and orphan query carries "where deleted_at is null".
        Schema::table('widows', function (Blueprint $table) {
            $table->index('deleted_at', 'widows_deleted_at_index');
            $table->index('neighborhood', 'widows_neighborhood_index');
            $table->index('admission_date', 'widows_admission_date_index');
        });

        Schema::table('orphans', function (Blueprint $table) {
            $table->index('deleted_at', 'orphans_deleted_at_index');
            $table->index('birth_date', 'orphans_birth_date_index');
        });

        Schema::table('transfers', function (Blueprint $table) {
            $table->index(['status', 'transfer_date'], 'transfers_status_date_index');
        });
    }

    public function down(): void
    {
        Schema::table('incomes', function (Blueprint $table) {
            $table->dropIndex('incomes_status_date_index');
            $table->dropIndex('incomes_income_date_index');
            $table->dropIndex('incomes_payment_method_index');
        });

        Schema::table('expenses', function (Blueprint $table) {
            $table->dropIndex('expenses_status_date_index');
            $table->dropIndex('expenses_expense_date_index');
            $table->dropIndex('expenses_payment_method_index');
        });

        Schema::table('widows', function (Blueprint $table) {
            $table->dropIndex('widows_deleted_at_index');
            $table->dropIndex('widows_neighborhood_index');
            $table->dropIndex('widows_admission_date_index');
        });

        Schema::table('orphans', function (Blueprint $table) {
            $table->dropIndex('orphans_deleted_at_index');
            $table->dropIndex('orphans_birth_date_index');
        });

        Schema::table('transfers', function (Blueprint $table) {
            $table->dropIndex('transfers_status_date_index');
        });
    }
};
