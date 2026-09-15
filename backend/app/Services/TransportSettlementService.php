<?php

namespace App\Services;

use App\Models\Beneficiary;
use App\Models\TransportMonth;
use App\Models\TransportMonthLine;
use App\Models\TransportSupport;
use Illuminate\Support\Collection;

/**
 * The end-of-month arithmetic, in one place.
 *
 * The association's method, unchanged: total the fuel and the driver's fee,
 * count the children who used the bus consistently, divide, and attribute
 * each share to that child's family. Children the bus cannot reach are paid
 * per attendance instead, so their amount is a multiplication rather than a
 * division.
 */
class TransportSettlementService
{
    /**
     * Fill a draft month with a line for every child currently being helped,
     * leaving alone any line already there.
     *
     * Additive on purpose. Somebody opens the sheet, ticks half of it, and a
     * new child is enrolled the next day; re-opening it must add that child
     * without discarding the ticks already made.
     */
    public function syncLines(TransportMonth $month): void
    {
        if ($month->isClosed()) {
            return;
        }

        $existing = $month->lines()->pluck('support_id')->all();

        $missing = TransportSupport::query()
            ->active()
            ->forAcademicYear($month->academic_year_id)
            ->whereNotIn('id', $existing ?: [0])
            ->get();

        foreach ($missing as $support) {
            TransportMonthLine::create([
                'transport_month_id' => $month->id,
                'support_id' => $support->id,
                // Frozen as they are today - see the migration for why a copy
                // is right here and wrong nearly everywhere else.
                'mode' => $support->mode,
                'rate' => $support->mode === TransportSupport::MODE_ALLOWANCE
                    ? $support->allowance_rate
                    : null,
                // A bus rider is assumed to have ridden until somebody says
                // otherwise: that is the common case, and the staff are
                // unticking exceptions rather than ticking the whole roster.
                'rode_consistently' => $support->mode === TransportSupport::MODE_BUS,
                'attendances' => 0,
                'amount' => 0,
            ]);
        }

        // A child whose support was ended after the sheet was opened is no
        // longer part of this month unless they were already ticked - and if
        // they rode for half of it, the staff decide that, not this code. So
        // nothing is removed here.
    }

    /**
     * Work out what every line is worth and write the amounts back.
     *
     * Returns the same lines, so a caller can show the result without
     * re-reading them.
     */
    public function recalculate(TransportMonth $month): Collection
    {
        $lines = $month->lines()->with('support.enrollment.orphan')->get();

        $riders = $lines->filter(fn (TransportMonthLine $line) => $line->countsTowardsSplit());
        $shares = $this->splitEvenly($month->bus_pot, $riders->count());

        $position = 0;
        foreach ($lines as $line) {
            if ($line->countsTowardsSplit()) {
                $line->amount = $shares[$position];
                $position++;
            } elseif ($line->mode === TransportSupport::MODE_ALLOWANCE) {
                $line->amount = round((float) $line->rate * $line->attendances, 2);
            } else {
                // A bus rider who did not ride consistently is owed nothing.
                $line->amount = 0;
            }

            $line->save();
        }

        return $lines;
    }

    /**
     * Divide an amount of money into n equal parts that add back up to it.
     *
     * In centimes, because 100 / 3 in floating point is 33.33 three times
     * and one centime vanishes - and the whole point of this sheet is that
     * the shares total exactly what was spent, or the expense raised from it
     * will not balance against the fuel receipts. The odd centimes go to the
     * first few shares, which is arbitrary but has to be somebody.
     *
     * @return array<int, float>
     */
    public function splitEvenly(float $total, int $parts): array
    {
        if ($parts < 1) {
            return [];
        }

        $centimes = (int) round($total * 100);
        $base = intdiv($centimes, $parts);
        $remainder = $centimes % $parts;

        $shares = [];
        for ($i = 0; $i < $parts; $i++) {
            $shares[] = round(($base + ($i < $remainder ? 1 : 0)) / 100, 2);
        }

        return $shares;
    }

    /**
     * The month as an expense waiting to be written.
     *
     * Grouped by family, because that is how the association attributes it:
     * a family with two children on the bus owes two shares, and sees one
     * line for them. The per-child figures stay visible on the sheet itself,
     * so the total on a family's line can always be taken apart again.
     */
    public function expenseDraft(TransportMonth $month): array
    {
        $lines = $month->lines()
            ->with('support.enrollment.orphan.widow')
            ->get()
            ->filter(fn (TransportMonthLine $line) => (float) $line->amount > 0);

        $byWidow = [];
        $orphaned = [];   // lines whose child has no family on record

        foreach ($lines as $line) {
            $orphan = $line->support?->enrollment?->orphan;
            $widowId = $orphan?->widow_id;

            if ($widowId === null) {
                $orphaned[] = $line;
                continue;
            }

            $byWidow[$widowId] ??= ['amount' => 0.0, 'children' => []];
            $byWidow[$widowId]['amount'] = round($byWidow[$widowId]['amount'] + (float) $line->amount, 2);
            $byWidow[$widowId]['children'][] = [
                'name' => trim(($orphan->first_name ?? '') . ' ' . ($orphan->last_name ?? '')),
                'mode' => $line->mode,
                'amount' => (float) $line->amount,
                'attendances' => $line->mode === TransportSupport::MODE_ALLOWANCE ? $line->attendances : null,
            ];
        }

        // One query for every family's beneficiary row rather than one per
        // family - this runs for the whole roster at once.
        $beneficiaries = Beneficiary::with('widow')
            ->where('type', 'Widow')
            ->whereIn('widow_id', array_keys($byWidow))
            ->get()
            ->keyBy('widow_id');

        $rows = [];
        $unmatched = [];

        foreach ($byWidow as $widowId => $entry) {
            $beneficiary = $beneficiaries->get($widowId);

            if ($beneficiary === null) {
                $unmatched[] = $widowId;
                continue;
            }

            $rows[] = [
                'beneficiary_id' => $beneficiary->id,
                'amount' => $entry['amount'],
                'group_id' => null,
                'notes' => collect($entry['children'])
                    ->map(fn ($child) => $child['attendances'] !== null
                        ? "{$child['name']} ({$child['attendances']} حضور)"
                        : $child['name'])
                    ->implode('، '),
                'beneficiary' => [
                    'id' => $beneficiary->id,
                    'type' => $beneficiary->type,
                    'full_name' => $beneficiary->full_name,
                    'widow' => $beneficiary->widow ? [
                        'id' => $beneficiary->widow->id,
                        'full_name' => trim($beneficiary->widow->first_name . ' ' . $beneficiary->widow->last_name),
                    ] : null,
                ],
                'children' => $entry['children'],
            ];
        }

        usort($rows, fn ($a, $b) => $b['amount'] <=> $a['amount']);

        return [
            'rows' => $rows,
            'total' => round(array_sum(array_column($rows, 'amount')), 2),
            // Reported rather than swallowed: a child with no family on
            // record, or a family with no beneficiary row, would otherwise
            // drop quietly out of a total that is supposed to equal the
            // month's spending.
            'excluded_children' => count($orphaned),
            'families_without_beneficiary' => $unmatched,
        ];
    }
}
