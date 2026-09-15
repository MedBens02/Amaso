<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * A vehicle run that several children share.
 *
 * The thing the association actually contracts for is the run, not the seat:
 * one price a month for a van that collects eleven children from one
 * neighbourhood and drops them at one school. Recording that as eleven
 * separate arrangements would multiply one contract price by eleven, or
 * force somebody to divide it by hand and write the answer in eleven places.
 * So the price lives here, once, and a rider's own cost is left empty unless
 * they really are paying something of their own.
 *
 * Tied to an academic year because everything about a run is renegotiated
 * with one: the price, the timetable, and who is on it. Last year's roster
 * is history to be read, not a list to be edited.
 *
 * capacity is what makes "can we take one more child" answerable without
 * ringing the driver.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('transport_routes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('academic_year_id')->constrained('academic_years')->cascadeOnDelete();

            // nullOnDelete, not cascade: losing the transporter's record must
            // not take the roster of who rode with them down with it.
            $table->foreignId('provider_id')->nullable()
                ->constrained('transport_providers')->nullOnDelete();

            $table->string('name', 150);                      // "مسار الحي المحمدي - صباح"
            $table->string('destination_type', 20)->default('school'); // school | tutoring | activity | other

            // Set when the run goes to one particular institution, which is
            // the ordinary case for a school bus and never the case for a
            // run that drops children at several tutoring centres.
            $table->foreignId('school_id')->nullable()->constrained('schools')->nullOnDelete();

            $table->unsignedSmallInteger('capacity')->nullable();
            $table->decimal('monthly_cost', 10, 2)->nullable(); // the contract price, advisory
            $table->string('schedule', 255)->nullable();        // "الإثنين-الجمعة 07:30 و 17:00"
            $table->string('pickup_area', 150)->nullable();     // the neighbourhood it serves
            $table->boolean('is_active')->default(true);
            $table->text('notes')->nullable();
            $table->timestamps();

            // Two runs in one year cannot share a name, or the roster becomes
            // ambiguous to the person reading it. Across years they may.
            $table->unique(['academic_year_id', 'name'], 'transport_routes_year_name_unique');

            // "What is running this year" is the question every screen opens with.
            $table->index(['academic_year_id', 'is_active'], 'transport_routes_year_active_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('transport_routes');
    }
};
