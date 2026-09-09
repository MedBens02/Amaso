<?php

namespace App\Services;

use App\Models\ExpenseBeneficiary;
use App\Models\Income;
use App\Models\Widow;

/**
 * Everything the association has done for one family, in one place.
 *
 * This is the report a field worker or an auditor asks for by name: who
 * sponsors this family, what came in against it, what was actually spent on
 * them and on what, and where their kafala stands part by part. It reads the
 * same derived kafala balance the expense form warns from, so the printed
 * figure and the on-screen warning cannot disagree.
 */
class FamilyReportService
{
    public function __construct(
        private readonly ReportService $reports,
        private readonly KafalaChamilaService $kafala,
    ) {
    }

    public function financial(Widow $widow, string $from, string $to): array
    {
        $widow->loadMissing(['orphans', 'sponsorships.kafil.donor']);

        $designated = Income::with(['budget', 'kafil'])
            ->where('widow_id', $widow->id)
            ->where('status', 'Approved')
            ->whereBetween('income_date', [$from, $to])
            ->orderBy('income_date')
            ->get();

        $received = $this->expensesForFamily($widow, $from, $to);
        $familyBalance = $this->kafala->familyBalances([$widow->id])[$widow->id] ?? null;

        return [
            'family' => [
                'id' => $widow->id,
                'full_name' => $widow->full_name,
                'phone' => $widow->phone,
                'neighborhood' => $widow->neighborhood,
                'national_id' => $widow->national_id,
                'orphans_count' => $widow->orphans->count(),
                'orphans' => $widow->orphans->map(fn ($orphan) => [
                    'full_name' => trim("{$orphan->first_name} {$orphan->last_name}"),
                    'birth_date' => $orphan->birth_date?->format('Y-m-d'),
                    'is_schooled' => (bool) $orphan->is_schooled,
                ])->values()->all(),
            ],
            'period' => ['from' => $from, 'to' => $to],
            'sponsorships' => $widow->sponsorships->map(fn ($sponsorship) => [
                'kafil' => $sponsorship->kafil?->full_name ?? '—',
                'phone' => $sponsorship->kafil?->phone,
                'amount' => round((float) $sponsorship->amount, 2),
            ])->values()->all(),
            // Payments a kafil explicitly tagged for this family.
            'designated_income' => $designated->map(fn (Income $income) => [
                'date' => $income->income_date?->format('Y-m-d'),
                'kafil' => $income->kafil?->full_name ?? '—',
                'budget' => $income->budget?->label,
                'amount' => round((float) $income->amount, 2),
            ])->all(),
            'received' => $received,
            'kafala_balance' => $familyBalance,
            'totals' => [
                'sponsorship_agreed' => round((float) $widow->sponsorships->sum('amount'), 2),
                'designated_income' => round((float) $designated->sum('amount'), 2),
                'received' => round(collect($received['rows'])->sum('amount'), 2),
            ],
        ];
    }

    /**
     * Expenses attributed to the widow herself or to any of her orphans.
     * Group expenses are already stored one row per member, so summing the
     * rows does not double count.
     */
    private function expensesForFamily(Widow $widow, string $from, string $to): array
    {
        $orphanIds = $widow->orphans->pluck('id');

        $rows = ExpenseBeneficiary::with(['expense.expenseCategory', 'expense.budget', 'beneficiary.orphan'])
            ->whereHas('beneficiary', fn ($q) => $q
                ->where('widow_id', $widow->id)
                ->orWhereIn('orphan_id', $orphanIds))
            ->whereHas('expense', fn ($q) => $q
                ->where('status', 'Approved')
                ->whereBetween('expense_date', [$from, $to]))
            ->get()
            ->sortBy(fn ($row) => $row->expense?->expense_date)
            ->values();

        return [
            'rows' => $rows->map(fn (ExpenseBeneficiary $row) => [
                'date' => $row->expense?->expense_date?->format('Y-m-d'),
                'budget' => $row->expense?->budget?->label,
                'category' => $row->expense?->expenseCategory?->label,
                'beneficiary' => $row->beneficiary?->orphan
                    ? trim("{$row->beneficiary->orphan->first_name} {$row->beneficiary->orphan->last_name}")
                    : $widow->full_name,
                'amount' => round((float) $row->amount, 2),
            ])->all(),
            'by_category' => $rows
                ->groupBy(fn ($row) => $row->expense?->expenseCategory?->label ?? 'غير مصنف')
                ->map(fn ($group, $label) => [
                    'label' => $label,
                    'count' => $group->count(),
                    'total' => round((float) $group->sum('amount'), 2),
                ])
                ->sortByDesc('total')
                ->values()
                ->all(),
        ];
    }
}
