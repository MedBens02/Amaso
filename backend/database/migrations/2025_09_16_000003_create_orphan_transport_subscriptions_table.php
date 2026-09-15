<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * One child, carried somewhere, for a while.
 *
 * Hung off the enrollment rather than the orphan, because transport is part
 * of a particular school year: the enrollment already carries the orphan and
 * the year and is unique on the pair, so this cannot drift out of step with
 * either, and a deleted enrollment takes its transport with it.
 *
 * A row per arrangement, not a flag on the enrollment the way tutoring is.
 * Tutoring is one arrangement or none; transport is not - a child can ride
 * the school bus in the morning and be driven to tutoring in the evening,
 * two runs, two transporters, two prices. A pair of columns on the
 * enrollment could hold the first and would silently lose the second.
 *
 * Either route_id or provider_id, never both. On a shared run the
 * transporter is the run's transporter, and copying it here is how the two
 * come to disagree after somebody re-lets the contract. A row with neither
 * is a child known to be carried by arrangements nobody has recorded yet,
 * which is worth being able to write down.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('orphan_transport_subscriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('enrollment_id')->constrained('orphan_enrollments')->cascadeOnDelete();

            $table->foreignId('route_id')->nullable()
                ->constrained('transport_routes')->nullOnDelete();

            // Only for a child who is not on a shared run - a taxi to tutoring,
            // a neighbour paid to take one child.
            $table->foreignId('provider_id')->nullable()
                ->constrained('transport_providers')->nullOnDelete();

            $table->string('purpose', 20)->default('school');  // school | tutoring | activity | other
            $table->string('pickup_point', 150)->nullable();   // where this child is collected

            // Advisory, and usually empty for a rider on a shared run whose
            // price is the run's. This is a planning figure, never an
            // accounting entry: what was actually spent is an expense under
            // "نقل مدرسي", posted against the orphan like any other.
            $table->decimal('monthly_cost', 10, 2)->nullable();
            $table->string('paid_by', 20)->default('association'); // association | family | shared | provider

            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->string('status', 20)->default('active');   // active | suspended | ended
            $table->text('notes')->nullable();
            $table->timestamps();

            // Deliberately not unique on (enrollment_id, purpose): a child who
            // changes transporter mid-year ends one arrangement and starts
            // another, and both belong in the record. Only one of them may be
            // active at a time, which MySQL cannot express as a partial index
            // and the request class enforces instead.
            $table->index(['enrollment_id', 'status'], 'transport_subs_enrollment_status_index');
            $table->index(['route_id', 'status'], 'transport_subs_route_status_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('orphan_transport_subscriptions');
    }
};
