<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * One child's place in one month.
 *
 * For a bus rider the only question is whether they used it consistently -
 * that is the association's own word and their own judgement, so it is a
 * tick the staff make, not a threshold this code invents from attendance it
 * does not have. Riders who did are counted; the month's pot is divided
 * among exactly them.
 *
 * For an allowance child the question is how many times they came, because
 * they are paid per attendance.
 *
 * mode and rate are copied here rather than read from the support record.
 * Normally copying a fact is how two copies come to disagree - but here
 * disagreeing is the point: a child who moves from the bus to an allowance
 * in January must still appear in December as a bus rider, and a rate that
 * rises in March must not silently re-price February. A closed month is a
 * record of what was paid, and what was paid does not change when the
 * present does.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('transport_month_lines', function (Blueprint $table) {
            $table->id();
            $table->foreignId('transport_month_id')->constrained('transport_months')->cascadeOnDelete();
            $table->foreignId('support_id')->constrained('transport_support')->cascadeOnDelete();

            $table->string('mode', 20);                        // as it was that month

            // Bus: did they use it consistently, in the staff's judgement.
            $table->boolean('rode_consistently')->default(true);

            // Allowance: how many times they came.
            $table->unsignedSmallInteger('attendances')->default(0);
            $table->decimal('rate', 8, 2)->nullable();         // as it was that month

            // What this child's family is owed for the month. Recomputed on
            // every save while the sheet is a draft, frozen when it closes.
            $table->decimal('amount', 10, 2)->default(0);

            $table->text('notes')->nullable();
            $table->timestamps();

            // A child appears once in a month, or the division counts them
            // twice and everybody else's share shrinks.
            $table->unique(['transport_month_id', 'support_id'], 'transport_month_lines_unique');
            $table->index(['transport_month_id', 'mode'], 'transport_month_lines_mode_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('transport_month_lines');
    }
};
