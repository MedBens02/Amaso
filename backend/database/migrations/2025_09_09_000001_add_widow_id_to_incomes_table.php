<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Which family a payment was designated for, captured at payment time.
     *
     * This is a statement of intent, not a ledger: the money still goes to
     * the sub-budgets like any other income. Storing it (rather than
     * deriving it from the kafil's current sponsorships) keeps past
     * statements reproducible when sponsorships change mid-year.
     */
    public function up(): void
    {
        if (Schema::hasColumn('incomes', 'widow_id')) {
            return;
        }

        Schema::table('incomes', function (Blueprint $table) {
            $table->foreignId('widow_id')->nullable()->after('kafil_id')
                ->constrained('widows')->nullOnDelete();
        });
    }

    public function down(): void
    {
        if (!Schema::hasColumn('incomes', 'widow_id')) {
            return;
        }

        Schema::table('incomes', function (Blueprint $table) {
            $table->dropConstrainedForeignId('widow_id');
        });
    }
};
