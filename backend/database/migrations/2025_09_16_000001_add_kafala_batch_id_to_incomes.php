<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

/**
 * Ties the rows of one kafala chamila payment back together.
 *
 * A comprehensive sponsorship is entered once and stored as one income per
 * budget line - seven rows for a single 800 DH payment, because that is what
 * the money actually has to be split into for the books to work. Nothing
 * recorded that they were one payment, so the incomes list showed seven
 * unrelated entries and the association had to recognise them by eye.
 *
 * An explicit id rather than a guess at read time. The rows of a batch do
 * share a natural key - the sponsor, the date, the receipt and the family -
 * and that is what the backfill below uses, but rebuilding the grouping from
 * it on every query would be both slower and wrong the first time a sponsor
 * pays twice on one day without a receipt number. Stored once, indexed, and
 * the list groups on it.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('incomes', function (Blueprint $table) {
            // Null for an ordinary income: it is its own group.
            $table->char('kafala_batch_id', 26)->nullable()->after('widow_id');
            $table->index('kafala_batch_id', 'incomes_kafala_batch_id_index');
        });

        // Rows already in the books: grouped by the natural key, and only
        // where the budget/category pair is one the split rules produce, so
        // an ordinary income that happens to share a date is left alone.
        $batches = DB::table('incomes as i')
            ->join('kafala_chamila_splits as s', function ($join) {
                $join->on('s.budget_id', '=', 'i.budget_id')
                    ->on('s.income_category_id', '=', 'i.income_category_id');
            })
            ->whereNotNull('i.kafil_id')
            ->groupBy('i.kafil_id', 'i.income_date', 'i.receipt_number', 'i.widow_id')
            ->havingRaw('COUNT(*) > 1')
            ->get([
                'i.kafil_id',
                'i.income_date',
                'i.receipt_number',
                'i.widow_id',
                DB::raw('GROUP_CONCAT(i.id) as income_ids'),
            ]);

        foreach ($batches as $batch) {
            DB::table('incomes')
                ->whereIn('id', explode(',', $batch->income_ids))
                ->update(['kafala_batch_id' => (string) Str::ulid()]);
        }
    }

    public function down(): void
    {
        Schema::table('incomes', function (Blueprint $table) {
            $table->dropIndex('incomes_kafala_batch_id_index');
            $table->dropColumn('kafala_batch_id');
        });
    }
};
