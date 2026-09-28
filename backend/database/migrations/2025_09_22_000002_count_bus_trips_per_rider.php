<?php

use App\Models\TransportMonth;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Turn the bus tick into a count of trips.
 *
 * The month's cost used to be divided equally among the children the staff
 * ticked as having used the bus consistently, which is what the association
 * asked for at the time and what the original tables say. They have since
 * asked for the other thing: record how many times each child actually rode,
 * and pay each family in proportion.
 *
 * `attendances` already holds exactly that number for the children who are
 * paid an allowance instead, so the bus lines use the same column rather
 * than gaining one of their own that means the same thing.
 *
 * The tick becomes a count here. An unsettled sheet gets 1 for every child
 * who was ticked and 0 for everybody else, because that is what the old data
 * says and no more: 1 each is not a claim that anyone rode once, it is the
 * arithmetic the even split already was, written as weights. Every weight
 * equal divides the pot equally, so no unsettled month's figures move until
 * somebody types the real counts in.
 *
 * Settled months are not touched at all. Their amounts are frozen against
 * expenses already paid, and `rode_consistently` stays on the table as the
 * record of how those months were decided.
 */
return new class extends Migration
{
    public function up(): void
    {
        $unsettled = TransportMonth::whereNull('bus_settled_at')->pluck('id');

        if ($unsettled->isEmpty()) {
            return;
        }

        DB::table('transport_month_lines')
            ->whereIn('transport_month_id', $unsettled)
            ->where('mode', 'bus')
            ->update([
                'attendances' => DB::raw('CASE WHEN rode_consistently = 1 THEN 1 ELSE 0 END'),
            ]);
    }

    public function down(): void
    {
        $unsettled = TransportMonth::whereNull('bus_settled_at')->pluck('id');

        if ($unsettled->isEmpty()) {
            return;
        }

        // Back the other way: anybody with a trip on the sheet was a rider.
        DB::table('transport_month_lines')
            ->whereIn('transport_month_id', $unsettled)
            ->where('mode', 'bus')
            ->update([
                'rode_consistently' => DB::raw('CASE WHEN attendances > 0 THEN 1 ELSE 0 END'),
                'attendances' => 0,
            ]);
    }
};
