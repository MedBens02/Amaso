<?php

use App\Support\DefaultBudgetCategories;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Which categories belong under which fund.
 *
 * Categories used to hang off a budget by a foreign key, and an earlier
 * migration cut them loose. Its reasoning holds: a category owned by one
 * fund can only ever serve that fund, so the eight kafala chamila parts each
 * needed their own duplicate copy of the same spending categories, and a
 * report totalling "سلة غذائية" had to know that eight rows were one thing.
 *
 * So this is not that key coming back. It is a link table: a category can sit
 * under as many budgets as it is genuinely used from, and it is still one
 * category. Choosing a budget on the income or expense form narrows the list
 * to what that fund is spent on, which is the hierarchy the association
 * wanted, without the duplication that made it worth removing.
 *
 * A budget with nothing attached offers every category rather than none.
 * Anything else would make a fund unusable the moment somebody adds one and
 * has not filled its list in yet - and a screen that offers no choices looks
 * broken rather than strict.
 */
return new class extends Migration
{
    public function up(): void
    {
        foreach ([
            'budget_income_category' => 'income_categories',
            'budget_expense_category' => 'expense_categories',
        ] as $pivot => $categories) {
            Schema::create($pivot, function (Blueprint $table) use ($pivot, $categories) {
                $table->id();
                $table->foreignId('budget_id')->constrained('budgets')->cascadeOnDelete();
                $table->foreignId('category_id')->constrained($categories)->cascadeOnDelete();
                $table->timestamps();

                // One link per pair; a category listed twice under one fund
                // would appear twice in the dropdown.
                $table->unique(['budget_id', 'category_id'], "{$pivot}_unique");
                $table->index('budget_id', "{$pivot}_budget_index");
            });
        }

        // For a database that already has its categories. A fresh install
        // has none at migration time, so the accounting seeder calls the
        // same thing afterwards - see DefaultBudgetCategories.
        DefaultBudgetCategories::apply();
    }

    public function down(): void
    {
        Schema::dropIfExists('budget_expense_category');
        Schema::dropIfExists('budget_income_category');
    }

};
