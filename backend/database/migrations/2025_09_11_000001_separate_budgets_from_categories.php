<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Splits the two jobs `budgets` was doing into separate dimensions.
 *
 * Until now a sub-budget was both the fund money sits in *and* the thing a
 * category belonged to, so a category could only ever serve one fund and the
 * kafala chamila parts each needed their own duplicate categories.
 *
 * After this:
 *   budgets     - the fund. Money in, money out, a balance. Chosen on every
 *                 income and expense.
 *   categories  - what the money was for. Free to use from any budget, and
 *                 nestable via parent_id.
 *
 * The data survives untouched: budget_id values become budget_id values
 * unchanged, so every existing income and expense keeps pointing at the same
 * row it always did.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::rename('sub_budgets', 'budgets');

        Schema::table('budgets', function (Blueprint $table) {
            // The fallback for anything not tied to a specific fund. Kept as a
            // flag rather than a hardcoded id so the association can move it.
            $table->boolean('is_default')->default(false);
        });

        foreach (['incomes', 'expenses', 'kafala_chamila_splits'] as $table) {
            if (Schema::hasColumn($table, 'sub_budget_id')) {
                Schema::table($table, function (Blueprint $blueprint) {
                    $blueprint->renameColumn('sub_budget_id', 'budget_id');
                });
            }
        }

        // Categories stop belonging to a fund and gain their own hierarchy.
        foreach (['income_categories', 'expense_categories'] as $table) {
            $this->dropForeignKeysOn($table, 'sub_budget_id');

            Schema::table($table, function (Blueprint $blueprint) use ($table) {
                if (Schema::hasColumn($table, 'sub_budget_id')) {
                    $blueprint->dropColumn('sub_budget_id');
                }

                $blueprint->foreignId('parent_id')->nullable()->after('id')
                    ->constrained($table)->nullOnDelete();
            });
        }
    }

    public function down(): void
    {
        foreach (['income_categories', 'expense_categories'] as $table) {
            $this->dropForeignKeysOn($table, 'parent_id');

            Schema::table($table, function (Blueprint $blueprint) use ($table) {
                if (Schema::hasColumn($table, 'parent_id')) {
                    $blueprint->dropColumn('parent_id');
                }
                $blueprint->foreignId('sub_budget_id')->nullable()->constrained('budgets');
            });
        }

        foreach (['incomes', 'expenses', 'kafala_chamila_splits'] as $table) {
            if (Schema::hasColumn($table, 'budget_id')) {
                Schema::table($table, function (Blueprint $blueprint) {
                    $blueprint->renameColumn('budget_id', 'sub_budget_id');
                });
            }
        }

        Schema::table('budgets', function (Blueprint $table) {
            $table->dropColumn('is_default');
        });

        Schema::rename('budgets', 'sub_budgets');
    }

    /**
     * Foreign keys on databases restored from the original amaso.sql dump
     * carry the dump's own constraint names, not the ones Laravel would
     * infer, so they are looked up rather than guessed.
     */
    private function dropForeignKeysOn(string $table, string $column): void
    {
        if (DB::getDriverName() !== 'mysql') {
            // SQLite rebuilds the table on alter, so there is nothing to drop.
            return;
        }

        $constraints = DB::select(
            'SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE
             WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?
               AND REFERENCED_TABLE_NAME IS NOT NULL',
            [DB::getDatabaseName(), $table, $column]
        );

        foreach ($constraints as $constraint) {
            DB::statement("ALTER TABLE `{$table}` DROP FOREIGN KEY `{$constraint->CONSTRAINT_NAME}`");
        }
    }
};
