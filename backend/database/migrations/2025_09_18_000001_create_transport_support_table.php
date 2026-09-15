<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * How a child gets to the association's centre.
 *
 * There is one bus, "حافلة المنصور", and one destination: the centre with
 * its five classrooms. Everything the association does about transport is
 * about getting children there and home again, so there is nothing here
 * naming a route, a school or a transporter - those were an earlier guess
 * at the problem and did not survive contact with how the work is actually
 * done.
 *
 * Two ways a child is helped, and never both at once:
 *
 *   bus        the bus collects them. Costs nothing per child here: the
 *              month's fuel and the driver's fee are pooled and divided
 *              among whoever rode consistently, which is what
 *              transport_months and its lines are for.
 *
 *   allowance  they live beyond the bus and are paid to make their own way,
 *              once per attendance. Their rate lives here because it is a
 *              standing arrangement with that family; how many times they
 *              actually came is a fact about a month, not about them.
 *
 * Hung off the enrollment, which already carries the orphan and the
 * academic year and is unique on the pair, so this cannot disagree with
 * either about who or when.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('transport_support', function (Blueprint $table) {
            $table->id();
            $table->foreignId('enrollment_id')->constrained('orphan_enrollments')->cascadeOnDelete();

            $table->string('mode', 20)->default('bus');        // bus | allowance
            $table->string('pickup_point', 150)->nullable();   // where the bus stops for them

            // Only for the allowance: what one attendance is worth. Null on a
            // bus rider, because their cost is a share of the month's pot and
            // a number here would be a second, disagreeing answer.
            $table->decimal('allowance_rate', 8, 2)->nullable();

            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->string('status', 20)->default('active');   // active | suspended | ended
            $table->text('notes')->nullable();
            $table->timestamps();

            // Not unique on enrollment_id: a child who moves house and comes
            // off the bus onto the allowance in January should keep both
            // rows, the one that ended and the one that started. Only one may
            // be live at a time - a partial unique index MySQL cannot
            // express, so the request class enforces it.
            $table->index(['enrollment_id', 'status'], 'transport_support_enrollment_status_index');
            $table->index(['mode', 'status'], 'transport_support_mode_status_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('transport_support');
    }
};
