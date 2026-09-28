<?php

use App\Models\Budget;
use App\Models\Setting;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Families in عدة: supported, counted separately, decided on afterwards.
 *
 * A woman widowed this week is not yet one of the association's families.
 * She is a "يتيم جديد" case: supported through her عدة with a fixed monthly
 * amount while the association looks at the case, and only then taken on as
 * a sponsored family or not. Counting her among the beneficiaries from day
 * one would overstate every figure the association reports, and dropping her
 * into the lists would put her in front of every expense that has nothing to
 * do with her.
 *
 * Three facts, because three different things are being recorded:
 *
 *   husband_death_date  When she was widowed. Useful on any widow's record,
 *                       not only these - so it is a field on every one.
 *   idda_end_date       When the عدة support stops. Entered rather than
 *                       computed: the period is four months and ten days,
 *                       but lunar, and a pregnancy runs it to the birth. The
 *                       form offers the arithmetic and the user overrides it.
 *   is_idda_case        Whether this family is still only a عدة case. It is
 *                       what hides her, and it is cleared by hand when the
 *                       association decides to take the family on.
 *
 * The end date does not clear the flag by itself. A family whose عدة has run
 * out is not a family anybody has decided about yet, and the screen shows
 * exactly that, waiting for somebody to enrol or archive her. Deciding for
 * them by a date arithmetic is how a family would quietly disappear.
 *
 * The allowance runs from the admission date, not the death: the association
 * pays from when the case reached them.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('widows', function (Blueprint $table) {
            $table->date('husband_death_date')->nullable()->after('birth_date');
            $table->date('idda_end_date')->nullable()->after('husband_death_date');
            $table->boolean('is_idda_case')->default(false)->after('idda_end_date');

            // Every list, count and picker filters on this, so it is worth an
            // index of its own rather than a scan per screen.
            $table->index('is_idda_case', 'widows_idda_case_index');
        });

        Schema::table('budgets', function (Blueprint $table) {
            // Which fund the عدة allowance is paid from. A flag rather than a
            // name match, for the same reason is_default is one: the
            // association can rename their budgets and nothing should break.
            $table->boolean('is_idda')->default(false)->after('is_default');
        });

        $now = now();

        // For a database that already has its budgets. A fresh install has
        // none yet, so the accounting seeder calls the same method after its
        // own pinned ids are taken - see Budget::ensureIdda for why that
        // order matters.
        if (DB::table('budgets')->exists()) {
            Budget::ensureIdda();
        }

        // What one family gets each month of her عدة. A setting rather than a
        // constant: the figure is the association's to change, and changing
        // it should not need a new version of the application.
        DB::table('settings')->updateOrInsert(
            ['key' => 'idda_monthly_allowance'],
            ['value' => '400', 'updated_at' => $now, 'created_at' => $now],
        );
        // Written through the query builder, so the model's cache still
        // holds the values from before this ran.
        Setting::forget();
    }

    public function down(): void
    {
        DB::table('settings')->where('key', 'idda_monthly_allowance')->delete();

        Schema::table('budgets', function (Blueprint $table) {
            $table->dropColumn('is_idda');
        });

        Schema::table('widows', function (Blueprint $table) {
            $table->dropIndex('widows_idda_case_index');
            $table->dropColumn(['husband_death_date', 'idda_end_date', 'is_idda_case']);
        });
    }
};
