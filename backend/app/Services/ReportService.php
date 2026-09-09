<?php

namespace App\Services;

use App\Models\Beneficiary;
use App\Models\ExpenseBeneficiary;
use App\Models\Income;
use App\Models\Kafil;
use App\Models\Widow;
use Illuminate\Support\Collection;

/**
 * Reporting aggregates.
 *
 * A note on what these numbers mean, because it is easy to get wrong:
 * contributions are pooled. Nothing here traces a specific dirham from a
 * kafil to a specific expense, because that link does not exist - the money
 * goes into the sub-budgets and the association spends from the pool. So a
 * statement reports two separate, individually true figures side by side:
 * what the kafil gave (and how it was designated), and what the families
 * they sponsor actually received from the association. The two legitimately
 * differ, and the difference is worth showing.
 *
 * Only Approved incomes and expenses count - drafts are not money yet.
 */
class ReportService
{
    public function kafilStatement(Kafil $kafil, string $from, string $to): array
    {
        $kafil->loadMissing('donor');

        $incomes = Income::with('budget')
            ->where('kafil_id', $kafil->id)
            ->where('status', 'Approved')
            ->whereBetween('income_date', [$from, $to])
            ->get();

        $sponsorships = $kafil->sponsorships()->with(['widow.orphans'])->get()
            ->filter(fn ($sponsorship) => $sponsorship->widow !== null)
            ->values();

        $widows = $sponsorships->pluck('widow');
        $receivedByFamily = $this->amountsReceivedByFamily($widows, $from, $to);

        // Designated totals: payments this kafil explicitly tagged for a family.
        $designatedByWidow = $incomes->whereNotNull('widow_id')
            ->groupBy('widow_id')
            ->map(fn ($rows) => $this->sum($rows));

        $families = $sponsorships->map(function ($sponsorship) use ($designatedByWidow, $receivedByFamily) {
            $widow = $sponsorship->widow;

            return [
                'widow_id' => $widow->id,
                'full_name' => $widow->full_name,
                'sponsorship_amount' => round((float) $sponsorship->amount, 2),
                'designated_total' => round((float) ($designatedByWidow[$widow->id] ?? 0), 2),
                'orphans_count' => $widow->orphans->count(),
                'orphans' => $widow->orphans->map(fn ($orphan) => [
                    'id' => $orphan->id,
                    'full_name' => trim("{$orphan->first_name} {$orphan->last_name}"),
                    'birth_date' => $orphan->birth_date,
                    'is_schooled' => (bool) ($orphan->is_schooled ?? false),
                ])->values(),
                'received' => $receivedByFamily[$widow->id] ?? ['total' => 0.0, 'by_category' => []],
            ];
        });

        return [
            'kafil' => [
                'id' => $kafil->id,
                'full_name' => $kafil->full_name,
                'monthly_pledge' => round((float) $kafil->monthly_pledge, 2),
                'phone' => $kafil->phone,
                'email' => $kafil->email,
            ],
            'period' => ['from' => $from, 'to' => $to],
            'contributions' => [
                'total' => round($this->sum($incomes), 2),
                'payments_count' => $incomes->count(),
                'by_budget' => $incomes->groupBy('budget_id')
                    ->map(fn ($rows) => [
                        'budget_id' => $rows->first()->budget_id,
                        'label' => $rows->first()->budget?->label ?? 'غير محدد',
                        'amount' => round($this->sum($rows), 2),
                    ])
                    ->sortByDesc('amount')
                    ->values(),
            ],
            'families' => $families,
            'totals' => [
                'contributed' => round($this->sum($incomes), 2),
                'designated' => round((float) $designatedByWidow->sum(), 2),
                'received_by_families' => round($families->sum(fn ($f) => $f['received']['total']), 2),
            ],
        ];
    }

    /**
     * What each family actually received, from expenses attributed to the
     * widow herself or to any of her orphans, broken down by expense
     * category. Group expenses are already stored as one row per member, so
     * summing the rows does not double count.
     *
     * @param  Collection<int, Widow>  $widows
     * @return array<int, array{total: float, by_category: array}>
     */
    private function amountsReceivedByFamily(Collection $widows, string $from, string $to): array
    {
        if ($widows->isEmpty()) {
            return [];
        }

        $widowIds = $widows->pluck('id')->all();

        // orphan id => the widow whose family they belong to
        $widowIdByOrphanId = [];
        foreach ($widows as $widow) {
            foreach ($widow->orphans as $orphan) {
                $widowIdByOrphanId[$orphan->id] = $widow->id;
            }
        }

        $beneficiaries = Beneficiary::where(function ($query) use ($widowIds, $widowIdByOrphanId) {
            $query->whereIn('widow_id', $widowIds);
            if ($widowIdByOrphanId !== []) {
                $query->orWhereIn('orphan_id', array_keys($widowIdByOrphanId));
            }
        })->get();

        // beneficiary row id => the family it rolls up to
        $familyOfBeneficiary = [];
        foreach ($beneficiaries as $beneficiary) {
            if ($beneficiary->widow_id && in_array($beneficiary->widow_id, $widowIds, true)) {
                $familyOfBeneficiary[$beneficiary->id] = $beneficiary->widow_id;
            } elseif ($beneficiary->orphan_id && isset($widowIdByOrphanId[$beneficiary->orphan_id])) {
                $familyOfBeneficiary[$beneficiary->id] = $widowIdByOrphanId[$beneficiary->orphan_id];
            }
        }

        if ($familyOfBeneficiary === []) {
            return [];
        }

        $rows = ExpenseBeneficiary::with('expense.expenseCategory')
            ->whereIn('beneficiary_id', array_keys($familyOfBeneficiary))
            ->whereHas('expense', fn ($query) => $query
                ->where('status', 'Approved')
                ->whereBetween('expense_date', [$from, $to]))
            ->get();

        $result = [];
        foreach ($rows->groupBy(fn ($row) => $familyOfBeneficiary[$row->beneficiary_id]) as $widowId => $familyRows) {
            $result[$widowId] = [
                'total' => round($this->sum($familyRows), 2),
                'by_category' => $familyRows
                    ->groupBy(fn ($row) => $row->expense?->expenseCategory?->label ?? 'غير مصنف')
                    ->map(fn ($categoryRows, $label) => [
                        'label' => $label,
                        'amount' => round($this->sum($categoryRows), 2),
                    ])
                    ->sortByDesc('amount')
                    ->values()
                    ->all(),
            ];
        }

        return $result;
    }

    /** @param  Collection<int, mixed>  $rows */
    private function sum(Collection $rows): float
    {
        return (float) $rows->sum(fn ($row) => (float) $row->amount);
    }
}
