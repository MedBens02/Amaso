<?php

namespace App\Services;

use App\Models\Budget;
use App\Models\Donor;
use App\Models\Expense;
use App\Models\Income;
use App\Models\Kafil;
use App\Models\Orphan;
use App\Models\Widow;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * Aggregates for the association-wide reports.
 *
 * These numbers used to be computed in the browser from the first 1,000 rows
 * of each list endpoint, which meant a report silently stopped being true once
 * the association passed that many records. They are SQL aggregates now, over
 * every row, so the totals are the totals.
 *
 * Only Approved incomes and expenses count toward money figures - drafts are
 * not money yet.
 */
class ReportAggregateService
{
    /** Families and children: headcount, coverage and composition. */
    public function widows(array $filters = []): array
    {
        $widows = Widow::query()
            ->when(!empty($filters['neighborhood']), fn ($q) => $q->where('neighborhood', $filters['neighborhood']))
            ->when(isset($filters['disability_flag']), fn ($q) => $q->where('disability_flag', (bool) $filters['disability_flag']));

        $totalWidows = (clone $widows)->count();
        $widowIds = (clone $widows)->pluck('id');

        $orphans = Orphan::whereIn('widow_id', $widowIds);
        $totalOrphans = (clone $orphans)->count();
        $familiesWithOrphans = (clone $orphans)->distinct('widow_id')->count('widow_id');

        $sponsored = DB::table('kafil_sponsorship')
            ->whereIn('widow_id', $widowIds)
            ->distinct('widow_id')
            ->count('widow_id');

        $withDisability = (clone $widows)->where('disability_flag', true)->count();

        return [
            'totals' => [
                'widows' => $totalWidows,
                'orphans' => $totalOrphans,
                'families_with_orphans' => $familiesWithOrphans,
                'average_orphans' => $familiesWithOrphans > 0
                    ? round($totalOrphans / $familiesWithOrphans, 2)
                    : 0,
                'sponsored_widows' => $sponsored,
                'sponsorship_coverage' => $totalWidows > 0 ? round($sponsored / $totalWidows * 100, 1) : 0,
                'disability_rate' => $totalWidows > 0 ? round($withDisability / $totalWidows * 100, 1) : 0,
            ],
            'by_neighborhood' => (clone $widows)
                ->selectRaw('COALESCE(NULLIF(neighborhood, ""), "غير محدد") as label, COUNT(*) as total')
                ->groupBy('label')->orderByDesc('total')->get()
                ->map(fn ($r) => ['label' => $r->label, 'total' => (int) $r->total])->all(),
            'orphans_by_gender' => (clone $orphans)
                ->selectRaw('gender as label, COUNT(*) as total')
                ->groupBy('gender')->get()
                ->map(fn ($r) => [
                    'label' => $r->label === 'male' ? 'ذكور' : 'إناث',
                    'total' => (int) $r->total,
                ])->all(),
            'orphans_by_schooling' => [
                ['label' => 'متمدرس', 'total' => (clone $orphans)->where('is_schooled', true)->count()],
                ['label' => 'غير متمدرس', 'total' => (clone $orphans)->where('is_schooled', false)->count()],
            ],
            'widows' => (clone $widows)->withCount(['orphans', 'sponsorships'])
                ->orderBy('first_name')->get()
                ->map(fn (Widow $w) => [
                    'full_name' => $w->full_name,
                    'phone' => $w->phone,
                    'neighborhood' => $w->neighborhood,
                    'orphans_count' => $w->orphans_count,
                    'sponsorships_count' => $w->sponsorships_count,
                    'admission_date' => $w->admission_date?->format('Y-m-d'),
                ])->all(),
        ];
    }

    /** Income and expense over a period, with the cuts a treasurer reads. */
    public function financial(array $filters = []): array
    {
        [$from, $to] = $this->period($filters);

        $incomes = Income::where('status', 'Approved')->whereBetween('income_date', [$from, $to])
            ->when(!empty($filters['fiscal_year_id']), fn ($q) => $q->where('fiscal_year_id', $filters['fiscal_year_id']));
        $expenses = Expense::where('status', 'Approved')->whereBetween('expense_date', [$from, $to])
            ->when(!empty($filters['fiscal_year_id']), fn ($q) => $q->where('fiscal_year_id', $filters['fiscal_year_id']));

        $totalIncome = (float) (clone $incomes)->sum('amount');
        $totalExpense = (float) (clone $expenses)->sum('amount');

        return [
            'period' => ['from' => $from, 'to' => $to],
            'totals' => [
                'income' => round($totalIncome, 2),
                'expense' => round($totalExpense, 2),
                'balance' => round($totalIncome - $totalExpense, 2),
                'income_count' => (clone $incomes)->count(),
                'expense_count' => (clone $expenses)->count(),
                'from_donors' => $totalIncome > 0
                    ? round((float) (clone $incomes)->whereNotNull('donor_id')->sum('amount') / $totalIncome * 100, 1)
                    : 0,
            ],
            'income_by_budget' => $this->sumBy($incomes, 'budgets', 'budget_id'),
            'income_by_category' => $this->sumBy($incomes, 'income_categories', 'income_category_id'),
            'expense_by_budget' => $this->sumBy($expenses, 'budgets', 'budget_id'),
            'expense_by_category' => $this->sumBy($expenses, 'expense_categories', 'expense_category_id'),
            'by_payment_method' => (clone $incomes)
                ->selectRaw('payment_method as label, SUM(amount) as total, COUNT(*) as count')
                ->groupBy('payment_method')->get()
                ->map(fn ($r) => [
                    'label' => match ($r->label) {
                        'Cash' => 'نقدي', 'Cheque' => 'شيك', 'BankWire' => 'تحويل بنكي', default => $r->label,
                    },
                    'total' => round((float) $r->total, 2),
                    'count' => (int) $r->count,
                ])->all(),
        ];
    }

    /** Who gave, and how much. */
    public function donors(array $filters = []): array
    {
        [$from, $to] = $this->period($filters);

        $donors = Donor::query()->withCount('kafil')->orderByDesc('total_given')->get();

        $periodTotals = Income::where('status', 'Approved')
            ->whereBetween('income_date', [$from, $to])
            ->whereNotNull('donor_id')
            ->selectRaw('donor_id, SUM(amount) as total, COUNT(*) as payments')
            ->groupBy('donor_id')->get()->keyBy('donor_id');

        $rows = $donors->map(fn (Donor $d) => [
            'full_name' => trim("{$d->first_name} {$d->last_name}"),
            'phone' => $d->phone,
            'email' => $d->email,
            'is_kafil' => $d->kafil_count > 0,
            'total_given' => round((float) $d->total_given, 2),
            'period_total' => round((float) ($periodTotals[$d->id]->total ?? 0), 2),
            'period_payments' => (int) ($periodTotals[$d->id]->payments ?? 0),
        ]);

        return [
            'period' => ['from' => $from, 'to' => $to],
            'totals' => [
                'donors' => $rows->count(),
                'kafils' => $rows->where('is_kafil', true)->count(),
                'given_all_time' => round($rows->sum('total_given'), 2),
                'given_in_period' => round($rows->sum('period_total'), 2),
                'active_in_period' => $rows->where('period_payments', '>', 0)->count(),
            ],
            'donors' => $rows->all(),
        ];
    }

    /** The year at a glance: money in and out beside who it reached. */
    public function annual(array $filters = []): array
    {
        $financial = $this->financial($filters);
        $widows = $this->widows();
        [$from, $to] = $this->period($filters);

        $monthly = Income::where('status', 'Approved')->whereBetween('income_date', [$from, $to])
            ->selectRaw("DATE_FORMAT(income_date, '%Y-%m') as month, SUM(amount) as total")
            ->groupBy('month')->orderBy('month')->get()->keyBy('month');

        $monthlyExpense = Expense::where('status', 'Approved')->whereBetween('expense_date', [$from, $to])
            ->selectRaw("DATE_FORMAT(expense_date, '%Y-%m') as month, SUM(amount) as total")
            ->groupBy('month')->orderBy('month')->get()->keyBy('month');

        $months = $monthly->keys()->merge($monthlyExpense->keys())->unique()->sort()->values();

        return [
            'period' => ['from' => $from, 'to' => $to],
            'financial' => $financial,
            'beneficiaries' => $widows['totals'],
            'monthly' => $months->map(fn ($m) => [
                'label' => $m,
                'income' => round((float) ($monthly[$m]->total ?? 0), 2),
                'expense' => round((float) ($monthlyExpense[$m]->total ?? 0), 2),
                'balance' => round((float) ($monthly[$m]->total ?? 0) - (float) ($monthlyExpense[$m]->total ?? 0), 2),
            ])->all(),
        ];
    }

    /**
     * Which families are uncovered, and by how much.
     *
     * The association's fundraising question is not "how many families do we
     * have" but "which ones is nobody paying for" - so this lists every family
     * whose sponsorships fall short of the standard package, worst first,
     * with the fully unsponsored at the top.
     */
    public function sponsorshipGaps(array $filters = []): array
    {
        $target = (float) ($filters['target'] ?? 800);

        $sponsorships = DB::table('kafil_sponsorship')
            ->selectRaw('widow_id, SUM(amount) as total, COUNT(*) as kafils')
            ->groupBy('widow_id')->get()->keyBy('widow_id');

        $rows = Widow::query()
            ->when(!empty($filters['neighborhood']), fn ($q) => $q->where('neighborhood', $filters['neighborhood']))
            ->withCount('orphans')
            ->orderBy('first_name')
            ->get()
            ->map(function (Widow $widow) use ($sponsorships, $target) {
                $covered = (float) ($sponsorships[$widow->id]->total ?? 0);

                return [
                    'widow_id' => $widow->id,
                    'full_name' => $widow->full_name,
                    'phone' => $widow->phone,
                    'neighborhood' => $widow->neighborhood,
                    'orphans_count' => $widow->orphans_count,
                    'kafils_count' => (int) ($sponsorships[$widow->id]->kafils ?? 0),
                    'covered' => round($covered, 2),
                    'shortfall' => round(max($target - $covered, 0), 2),
                ];
            })
            // Fully covered families are not what this report is for.
            ->filter(fn ($row) => $row['shortfall'] > 0)
            ->sortByDesc('shortfall')
            ->values();

        return [
            'target' => $target,
            'totals' => [
                'families_with_gap' => $rows->count(),
                'unsponsored' => $rows->where('kafils_count', 0)->count(),
                'orphans_affected' => $rows->sum('orphans_count'),
                'total_shortfall' => round($rows->sum('shortfall'), 2),
            ],
            'families' => $rows->all(),
        ];
    }

    /**
     * Pledged versus actually paid, per kafil, over a period.
     *
     * A sponsorship is a standing commitment, but nothing linked those
     * commitments to the payments that arrived, so a kafil could stop paying
     * without anything surfacing it. Expected is the monthly commitment times
     * the whole months in the period; anyone materially short is listed first.
     */
    public function kafilFollowUp(array $filters = []): array
    {
        [$from, $to] = $this->period($filters);
        $start = Carbon::parse($from);
        $end = Carbon::parse($to);
        $months = max(1, ($end->year - $start->year) * 12 + ($end->month - $start->month) + 1);

        $paid = Income::where('status', 'Approved')
            ->whereBetween('income_date', [$from, $to])
            ->whereNotNull('kafil_id')
            ->selectRaw('kafil_id, SUM(amount) as total, COUNT(*) as payments, MAX(income_date) as last_payment')
            ->groupBy('kafil_id')->get()->keyBy('kafil_id');

        $rows = Kafil::with('sponsorships')->get()->map(function (Kafil $kafil) use ($paid, $months) {
            // The agreed sponsorships are the real commitment; monthly_pledge is
            // a headline figure that is not always kept in step with them.
            $commitment = (float) ($kafil->sponsorships->sum('amount') ?: $kafil->monthly_pledge);
            $expected = $commitment * $months;
            $actual = (float) ($paid[$kafil->id]->total ?? 0);

            return [
                'kafil_id' => $kafil->id,
                'full_name' => $kafil->full_name,
                'phone' => $kafil->phone,
                'families' => $kafil->sponsorships->count(),
                'monthly_commitment' => round($commitment, 2),
                'expected' => round($expected, 2),
                'paid' => round($actual, 2),
                'balance' => round($actual - $expected, 2),
                'payments' => (int) ($paid[$kafil->id]->payments ?? 0),
                'last_payment' => $paid[$kafil->id]->last_payment ?? null,
                'coverage' => $expected > 0 ? round($actual / $expected * 100, 1) : null,
            ];
        })->sortBy('balance')->values();

        return [
            'period' => ['from' => $from, 'to' => $to],
            'months' => $months,
            'totals' => [
                'kafils' => $rows->count(),
                'expected' => round($rows->sum('expected'), 2),
                'paid' => round($rows->sum('paid'), 2),
                'behind' => $rows->filter(fn ($r) => $r['balance'] < -0.01)->count(),
                'never_paid' => $rows->where('payments', 0)->count(),
            ],
            'kafils' => $rows->all(),
        ];
    }

    /** What went into each fund, what came out, and what is left. */
    public function budgetUtilization(array $filters = []): array
    {
        [$from, $to] = $this->period($filters);

        $income = Income::where('status', 'Approved')->whereBetween('income_date', [$from, $to])
            ->selectRaw('budget_id, SUM(amount) as total')->groupBy('budget_id')->get()->keyBy('budget_id');
        $expense = Expense::where('status', 'Approved')->whereBetween('expense_date', [$from, $to])
            ->selectRaw('budget_id, SUM(amount) as total')->groupBy('budget_id')->get()->keyBy('budget_id');

        $rows = Budget::orderByDesc('is_default')->orderBy('label')->get()
            ->map(function (Budget $budget) use ($income, $expense) {
                $in = (float) ($income[$budget->id]->total ?? 0);
                $out = (float) ($expense[$budget->id]->total ?? 0);

                return [
                    'label' => $budget->label,
                    'is_default' => (bool) $budget->is_default,
                    'income' => round($in, 2),
                    'expense' => round($out, 2),
                    'remaining' => round($in - $out, 2),
                    // Spending past what a fund took in is the thing to notice.
                    'utilization' => $in > 0 ? round($out / $in * 100, 1) : null,
                ];
            });

        return [
            'period' => ['from' => $from, 'to' => $to],
            'totals' => [
                'income' => round($rows->sum('income'), 2),
                'expense' => round($rows->sum('expense'), 2),
                'remaining' => round($rows->sum('remaining'), 2),
                'overspent' => $rows->filter(fn ($r) => $r['remaining'] < -0.01)->count(),
            ],
            'budgets' => $rows->all(),
        ];
    }

    /**
     * The transaction listings behind the incomes and expenses pages.
     *
     * These pages could only ever produce a CSV or a browser print-out; the
     * ledger a treasurer hands to an auditor is the list itself, so it gets
     * the same real-text PDF treatment as everything else.
     */
    public function incomeList(array $filters = []): array
    {
        [$from, $to] = $this->period($filters);

        $rows = Income::with(['budget', 'incomeCategory', 'donor', 'kafil'])
            ->whereBetween('income_date', [$from, $to])
            ->when(!empty($filters['status']), fn ($q) => $q->where('status', $filters['status']))
            ->when(!empty($filters['budget_id']), fn ($q) => $q->where('budget_id', $filters['budget_id']))
            ->when(!empty($filters['fiscal_year_id']), fn ($q) => $q->where('fiscal_year_id', $filters['fiscal_year_id']))
            ->orderBy('income_date')
            ->get();

        return [
            'period' => ['from' => $from, 'to' => $to],
            'totals' => [
                'count' => $rows->count(),
                'total' => round((float) $rows->sum('amount'), 2),
                'approved' => round((float) $rows->where('status', 'Approved')->sum('amount'), 2),
                'draft' => round((float) $rows->where('status', 'Draft')->sum('amount'), 2),
            ],
            'rows' => $rows->map(fn (Income $income) => [
                'date' => $income->income_date?->format('Y-m-d'),
                'source' => $income->donor
                    ? trim("{$income->donor->first_name} {$income->donor->last_name}")
                    : ($income->kafil?->full_name ?? '—'),
                'budget' => $income->budget?->label,
                'category' => $income->incomeCategory?->label,
                'payment_method' => $income->payment_method,
                'status' => $income->status,
                'amount' => round((float) $income->amount, 2),
            ])->all(),
        ];
    }

    public function expenseList(array $filters = []): array
    {
        [$from, $to] = $this->period($filters);

        $rows = Expense::with(['budget', 'expenseCategory', 'partner'])
            ->whereBetween('expense_date', [$from, $to])
            ->when(!empty($filters['status']), fn ($q) => $q->where('status', $filters['status']))
            ->when(!empty($filters['budget_id']), fn ($q) => $q->where('budget_id', $filters['budget_id']))
            ->when(!empty($filters['fiscal_year_id']), fn ($q) => $q->where('fiscal_year_id', $filters['fiscal_year_id']))
            ->withCount('beneficiaries')
            ->orderBy('expense_date')
            ->get();

        return [
            'period' => ['from' => $from, 'to' => $to],
            'totals' => [
                'count' => $rows->count(),
                'total' => round((float) $rows->sum('amount'), 2),
                'approved' => round((float) $rows->where('status', 'Approved')->sum('amount'), 2),
                'draft' => round((float) $rows->where('status', 'Draft')->sum('amount'), 2),
            ],
            'rows' => $rows->map(fn (Expense $expense) => [
                'date' => $expense->expense_date?->format('Y-m-d'),
                'budget' => $expense->budget?->label,
                'category' => $expense->expenseCategory?->label,
                'partner' => $expense->partner?->name,
                'beneficiaries' => $expense->beneficiaries_count,
                'payment_method' => $expense->payment_method,
                'status' => $expense->status,
                'amount' => round((float) $expense->amount, 2),
            ])->all(),
        ];
    }

    /** Sum a money column grouped by a labelled reference table. */
    private function sumBy($query, string $table, string $column): array
    {
        return (clone $query)
            ->join($table, "{$table}.id", '=', DB::raw($this->qualified($query, $column)))
            ->selectRaw("{$table}.label as label, SUM(amount) as total, COUNT(*) as count")
            ->groupBy("{$table}.label")
            ->orderByDesc('total')
            ->get()
            ->map(fn ($r) => [
                'label' => $r->label,
                'total' => round((float) $r->total, 2),
                'count' => (int) $r->count,
            ])->all();
    }

    private function qualified($query, string $column): string
    {
        return $query->getModel()->getTable() . '.' . $column;
    }

    /** @return array{0: string, 1: string} */
    private function period(array $filters): array
    {
        $year = now()->year;

        return [
            $filters['from'] ?? "{$year}-01-01",
            $filters['to'] ?? "{$year}-12-31",
        ];
    }
}
