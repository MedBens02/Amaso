<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * One month of running the bus, and what each family owed of it.
 *
 * The association's method, which this exists to carry out rather than
 * improve on: at the end of the month, total the fuel and the driver's fee,
 * count the children who used the bus consistently that month, divide the
 * one by the other, and attribute each share to that child's family.
 *
 * The month is the unit because that is when the figures are known. Fuel is
 * bought all month and totalled once; the driver is paid once. Neither is
 * knowable per trip, so nothing here pretends to track trips.
 *
 * A settled part is a paid one: its amounts are frozen and an expense has
 * been raised from it. Re-running the division later, after a child has been
 * added or a rate changed, would silently disagree with money already paid -
 * so once a part is settled, its numbers stop moving. The other half of the
 * sheet carries on being worked on.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('transport_months', function (Blueprint $table) {
            $table->id();
            $table->foreignId('academic_year_id')->constrained('academic_years')->cascadeOnDelete();

            // The first of the month. A DATE rather than a year/month pair so
            // it sorts and compares without assembling anything.
            $table->date('period_month');

            $table->decimal('fuel_cost', 10, 2)->default(0);
            $table->decimal('driver_cost', 10, 2)->default(0);
            // Tyres, a repair, a toll. Kept separate from fuel so that the
            // fuel figure stays a fuel figure and nobody has to pad it.
            $table->decimal('other_cost', 10, 2)->default(0);

            // Two expenses, not one, because the month pays for two different
            // things: a shared vehicle whose cost is divided, and a set of
            // individual allowances that are each somebody's own. Rolling
            // them into one expense would make the bus's cost and the
            // allowances indistinguishable in the accounts ever after.
            //
            // They settle independently: the bus can be written up as soon as
            // the fuel bill is in, while the attendance counts are still
            // being collected.
            //
            // nullOnDelete: an expense deleted in the accounts must not take
            // the month's record of who rode with it.
            $table->foreignId('bus_expense_id')->nullable()->constrained('expenses')->nullOnDelete();
            $table->timestamp('bus_settled_at')->nullable();
            $table->foreignId('allowance_expense_id')->nullable()->constrained('expenses')->nullOnDelete();
            $table->timestamp('allowance_settled_at')->nullable();

            $table->text('notes')->nullable();
            $table->timestamps();

            // One sheet per month. Two would each hold half the riders and
            // both would divide by the wrong number.
            $table->unique(['academic_year_id', 'period_month'], 'transport_months_year_month_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('transport_months');
    }
};
