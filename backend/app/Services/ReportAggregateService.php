<?php

namespace App\Services;

use App\Models\Donor;
use App\Models\Expense;
use App\Models\Income;
use App\Models\Orphan;
use App\Models\Widow;
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
