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
 * The association's method: total the fuel and the driver's fee, then share
 * that pot out among the children who rode, in proportion to how many times
 * each of them rode. A child carried eighteen times is owed twice what a
 * child carried nine times is, and a child carried not at all is owed
 * nothing. Children the bus cannot reach are paid per attendance instead, so
 * their amount is a multiplication rather than a division - and it is
 * settled as its own expense, because it is a different kind of spending
 * from a shared vehicle.
 */
class TransportSettlementService
{
    /**
     * Fill a month with a line for every child currently being helped,
     * leaving alone any line already there.
     *
     * Additive on purpose. Somebody opens the sheet, ticks half of it, and a
     * new child is enrolled the next day; re-opening it must add that child
     * without discarding the ticks already made.
     *
     * A part that has been settled takes no new children: their share would
     * have to come out of a pot already paid out.
     */
    public function syncLines(TransportMonth $month): void
    {
        $existing = $month->lines()->pluck('support_id')->all();

        // What a child who rode the whole month is down for on this sheet.
        // A child enrolled halfway through it most likely rode as often as
        // the rest from then on, and this is the only number on the sheet
        // that says how often that is - better than starting them at zero
        // and better than inventing a figure from a calendar.
        $fullMonth = (int) $month->lines()
            ->where('mode', TransportSupport::MODE_BUS)
            ->max('attendances');

        $missing = TransportSupport::query()
            ->active()
            ->forAcademicYear($month->academic_year_id)
            ->whereNotIn('id', $existing ?: [0])
            ->get();

        foreach ($missing as $support) {
            $part = $support->mode === TransportSupport::MODE_BUS
                ? TransportMonth::PART_BUS
                : TransportMonth::PART_ALLOWANCE;

            if ($month->isPartSettled($part)) {
                continue;
            }

            TransportMonthLine::create([
                'transport_month_id' => $month->id,
                'support_id' => $support->id,
                // Frozen as they are today - see the migration for why a copy
                // is right here and wrong nearly everywhere else.
                'mode' => $support->mode,
                'rate' => $support->mode === TransportSupport::MODE_ALLOWANCE
                    ? $support->allowance_rate
                    : null,
                // Retired: the bus share follows the trip count now. Left
                // set so a row still says what kind of line it was under the
                // old rule, and so the column keeps a meaning for the months
                // that were settled under it.
                'rode_consistently' => $support->mode === TransportSupport::MODE_BUS,
                'attendances' => $support->mode === TransportSupport::MODE_BUS ? $fullMonth : 0,
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
     * Lines belonging to a settled part are left exactly as they are. Their
     * money has been paid; re-dividing a pot after the fact would leave the
     * sheet disagreeing with an expense already in the accounts.
     */
    public function recalculate(TransportMonth $month): Collection
    {
        // Ordered explicitly, because the odd centimes depend on it. They go
        // to whichever shares lost most in the flooring, and when several
        // lose the same amount the order decides between them - so an
        // unordered read would hand the same sheet's spare centime to a
        // different child on a different day. The screen previews the split
        // while somebody is still typing and has to land on the same answer,
        // so it sorts by id too rather than by the name it displays.
        $lines = $month->lines()->with('support.enrollment.orphan')->orderBy('id')->get();

        $busSettled = $month->bus_settled;
        $allowanceSettled = $month->allowance_settled;

        $riders = $lines->filter(fn (TransportMonthLine $line) => $line->countsTowardsSplit());
        $shares = $busSettled
            ? []
            : $this->splitProRata(
                $month->bus_pot,
                $riders->map(fn (TransportMonthLine $line) => $line->splitWeight())->values()->all(),
            );

        $position = 0;
        foreach ($lines as $line) {
            $isBus = $line->mode === TransportSupport::MODE_BUS;

            if (($isBus && $busSettled) || (! $isBus && $allowanceSettled)) {
                continue;
            }

            if ($line->countsTowardsSplit()) {
                $line->amount = $shares[$position];
                $position++;
            } elseif (! $isBus) {
                $line->amount = round((float) $line->rate * $line->attendances, 2);
            } else {
                // A rider with no trips on the sheet did not use the bus.
                $line->amount = 0;
            }

            $line->save();
        }

        return $lines;
    }

    /**
     * Divide an amount of money in proportion to a list of weights, exactly.
     *
     * In centimes, because a third of 100 in floating point is 33.33 three
     * times and one centime vanishes - and the whole point of this sheet is
     * that the shares total exactly what was spent, or the expense raised
     * from it will not balance against the fuel receipts.
     *
     * Proportion alone almost never lands on whole centimes, so each share
     * is floored and the centimes left over are handed out one each to the
     * shares that lost the most in the flooring - the largest-remainder
     * method. Ties break towards the larger weight, so of two children who
     * come out level the one carried more often gets the odd centime, and
     * then towards the earlier line so the answer never depends on the order
     * two equal rows happened to arrive in.
     *
     * Every weight equal reproduces an even split, which is what the sheets
     * written before the trip counts existed contain.
     *
     * @param  array<int, int>  $weights  One per share, in the caller's order.
     * @return array<int, float>          Shares in that same order.
     */
    public function splitProRata(float $total, array $weights): array
    {
        $count = count($weights);

        if ($count === 0) {
            return [];
        }

        $sum = array_sum($weights);

        if ($sum <= 0) {
            return array_fill(0, $count, 0.0);
        }

        $centimes = (int) round($total * 100);
        $floors = [];
        $order = [];

        foreach ($weights as $index => $weight) {
            $exact = $centimes * $weight;
            $floors[$index] = intdiv($exact, $sum);
            $order[] = ['index' => $index, 'remainder' => $exact % $sum, 'weight' => $weight];
        }

        usort($order, fn ($a, $b) => [$b['remainder'], $b['weight'], $a['index']]
            <=> [$a['remainder'], $a['weight'], $b['index']]);

        $leftover = $centimes - array_sum($floors);

        for ($i = 0; $i < $leftover; $i++) {
            $floors[$order[$i % $count]['index']]++;
        }

        $shares = [];
        for ($index = 0; $index < $count; $index++) {
            $shares[$index] = round($floors[$index] / 100, 2);
        }

        return $shares;
    }

    /**
     * One half of the month as an expense waiting to be written.
     *
     * A line per child, not per family. The child is who was carried, and
     * the family report, the kafala budgets and the kafil statement all
     * follow an orphan beneficiary back to their mother anyway - so naming
     * the child loses nothing and says which one of three siblings the money
     * was for.
     */
    public function expenseDraft(TransportMonth $month, string $part): array
    {
        $mode = $part === TransportMonth::PART_BUS
            ? TransportSupport::MODE_BUS
            : TransportSupport::MODE_ALLOWANCE;

        $lines = $month->lines()
            ->where('mode', $mode)
            ->with('support.enrollment.orphan.widow')
            ->get()
            ->filter(fn (TransportMonthLine $line) => (float) $line->amount > 0);

        $byOrphan = [];
        $unidentified = 0;   // lines whose child could not be resolved at all

        foreach ($lines as $line) {
            $orphan = $line->support?->enrollment?->orphan;

            if ($orphan === null) {
                $unidentified++;
                continue;
            }

            // A child appearing twice in one part would be two arrangements of
            // the same kind at once, which the support guard prevents - but
            // summing rather than overwriting means a future change there
            // cannot silently drop one of them.
            $byOrphan[$orphan->id] ??= ['orphan' => $orphan, 'amount' => 0.0, 'attendances' => 0];
            $byOrphan[$orphan->id]['amount'] = round($byOrphan[$orphan->id]['amount'] + (float) $line->amount, 2);
            $byOrphan[$orphan->id]['attendances'] += (int) $line->attendances;
        }

        // One query for every child's beneficiary row rather than one per
        // child - this runs for the whole roster at once.
        $beneficiaries = Beneficiary::with('orphan.widow')
            ->where('type', 'Orphan')
            ->whereIn('orphan_id', array_keys($byOrphan))
            ->get()
            ->keyBy('orphan_id');

        $rows = [];
        $withoutBeneficiary = [];

        foreach ($byOrphan as $orphanId => $entry) {
            $beneficiary = $beneficiaries->get($orphanId);

            if ($beneficiary === null) {
                $withoutBeneficiary[] = trim(
                    ($entry['orphan']->first_name ?? '') . ' ' . ($entry['orphan']->last_name ?? ''),
                );
                continue;
            }

            $mother = $beneficiary->orphan?->widow;

            $rows[] = [
                'beneficiary_id' => $beneficiary->id,
                'amount' => $entry['amount'],
                'group_id' => null,
                // Why this child got this amount, carried into the expense:
                // the number of trips it was worked out from, or for an
                // allowance the number of times they came.
                'notes' => $entry['attendances'] > 0
                    ? ($mode === TransportSupport::MODE_ALLOWANCE
                        ? "{$entry['attendances']} حضور"
                        : "{$entry['attendances']} رحلة")
                    : null,
                // Shaped the way the expense form rehydrates a saved row, so
                // the names appear in the selected list rather than as bare
                // ids: it reads beneficiary.orphan.widow_id to group by
                // family, and beneficiary.orphan.widow for the mother's name.
                'beneficiary' => [
                    'id' => $beneficiary->id,
                    'type' => 'Orphan',
                    'full_name' => $beneficiary->full_name,
                    'orphan' => [
                        'id' => $entry['orphan']->id,
                        'widow_id' => $entry['orphan']->widow_id,
                        'first_name' => $entry['orphan']->first_name,
                        'last_name' => $entry['orphan']->last_name,
                        'widow' => $mother ? [
                            'id' => $mother->id,
                            'first_name' => $mother->first_name,
                            'last_name' => $mother->last_name,
                            'full_name' => trim($mother->first_name . ' ' . $mother->last_name),
                        ] : null,
                    ],
                ],
            ];
        }

        usort($rows, fn ($a, $b) => $b['amount'] <=> $a['amount']);

        return [
            'part' => $part,
            'rows' => $rows,
            'total' => round(array_sum(array_column($rows, 'amount')), 2),
            // Reported rather than swallowed: a line with no child, or a
            // child with no beneficiary row, would otherwise drop quietly out
            // of a total that is supposed to equal the month's spending.
            'unidentified_lines' => $unidentified,
            'children_without_beneficiary' => $withoutBeneficiary,
        ];
    }
}
