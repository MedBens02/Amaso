<?php

namespace App\Services;

use App\Http\Controllers\Api\V1\AuditLogController;
use App\Models\AcademicYear;
use App\Models\AuditLog;
use App\Models\BankAccount;
use App\Models\Expense;
use App\Models\FiscalYear;
use App\Models\Income;
use App\Models\Orphan;
use App\Models\OrphanEnrollment;
use App\Models\Transfer;
use App\Models\TransportMonth;
use App\Models\TransportSupport;
use App\Models\User;
use App\Models\Widow;
use Illuminate\Support\Facades\DB;

/**
 * What each person sees when they open the application.
 *
 * One dashboard for everybody meant the education officer opened the books
 * every morning and the accountant scrolled past school transport to find
 * the drafts waiting on her. Each role now gets the sections that are its
 * work, and only those are computed - an aggregate nobody will look at is
 * still a query somebody waits for.
 *
 * The sections are about relevance, not secrecy: reading is open to every
 * account (see App\Support\Roles), so nothing here hides a figure anyone
 * could not already open. The one exception is the accounts section, which
 * describes other people's logins and is the superuser's alone, as the
 * accounts screen itself is.
 *
 * Every figure is an SQL aggregate over every row, for the reason the
 * reports are: totals computed from the first page of a list stop being
 * true the day the list grows past it.
 */
class DashboardService
{
    /** Which sections each role's dashboard is built from. */
    public const SECTIONS = [
        User::ROLE_SUPERUSER => ['finance', 'families', 'education', 'accounts'],
        User::ROLE_ADMIN => ['finance', 'families', 'education'],
        User::ROLE_ACCOUNTANT => ['finance'],
        // The social worker keeps a compact view of schooling: until an
        // education officer is appointed, registrations are theirs.
        User::ROLE_SOCIAL_WORKER => ['families', 'education'],
        User::ROLE_EDUCATION_OFFICER => ['education'],
    ];

    /** How far ahead an ending عدة is worth raising. */
    private const IDDA_HORIZON_DAYS = 30;

    /** How close a password expiry has to be before it is worth raising. */
    private const PASSWORD_WARN_DAYS = 5;

    public function __construct(private readonly ReportAggregateService $reports)
    {
    }

    public function for(User $user): array
    {
        $sections = self::SECTIONS[$user->role] ?? [];

        $data = [];
        foreach ($sections as $section) {
            $data[$section] = match ($section) {
                'finance' => $this->finance(),
                'families' => $this->families($user),
                'education' => $this->education(),
                'accounts' => $this->accounts(),
            };
        }

        return [
            'role' => $user->role,
            'generated_at' => now()->toIso8601String(),
            'sections' => $data,
        ];
    }

    /**
     * The books: what came in and went out this year, where the money sits,
     * and the queue of drafts that are not money yet.
     */
    public function finance(): array
    {
        $annual = $this->reports->annual();
        $fiscalYear = FiscalYear::active()->first();

        $accounts = BankAccount::orderBy('label')->get(['id', 'label', 'bank_name', 'balance']);

        $pending = fn ($query) => [
            'count' => (clone $query)->count(),
            'amount' => round((float) (clone $query)->sum('amount'), 2),
        ];

        // Approved cash and cheques that never reached a bank account: the
        // year cannot be closed until they do, so they are raised all year
        // rather than discovered in December.
        $untransferred = $fiscalYear
            ? Income::where('fiscal_year_id', $fiscalYear->id)
                ->where('status', 'Approved')
                ->whereIn('payment_method', ['Cash', 'Cheque'])
                ->whereNull('transferred_at')
            : null;

        // Oldest first: a draft that has waited three weeks is the one
        // somebody is going to ask about.
        $incomeDrafts = Income::where('status', 'Draft')
            ->with(['incomeCategory:id,label', 'donor:id,first_name,last_name', 'kafil:id,first_name,last_name', 'createdBy:id,name'])
            ->orderBy('income_date')->orderBy('id')->limit(6)->get()
            ->map(fn (Income $i) => [
                'type' => 'income',
                'id' => $i->id,
                'date' => $i->income_date?->toDateString(),
                'amount' => round((float) $i->amount, 2),
                'label' => $i->incomeCategory?->label ?? '—',
                'party' => $i->kafil?->full_name ?? $i->donor?->full_name,
                'created_by' => $i->createdBy?->name,
            ]);

        $expenseDrafts = Expense::where('status', 'Draft')
            ->with(['expenseCategory:id,label', 'createdBy:id,name'])
            ->orderBy('expense_date')->orderBy('id')->limit(6)->get()
            ->map(fn (Expense $e) => [
                'type' => 'expense',
                'id' => $e->id,
                'date' => $e->expense_date?->toDateString(),
                'amount' => round((float) $e->amount, 2),
                'label' => $e->expenseCategory?->label ?? '—',
                'party' => $e->details,
                'created_by' => $e->createdBy?->name,
            ]);

        $queue = $incomeDrafts->concat($expenseDrafts)
            ->sortBy(fn ($row) => [$row['date'] ?? '9999-12-31', $row['type'], $row['id']])
            ->take(8)->values();

        return [
            'period' => $annual['period'],
            'fiscal_year' => $fiscalYear ? ['id' => $fiscalYear->id, 'year' => $fiscalYear->year] : null,
            'totals' => $annual['financial']['totals'],
            'monthly' => $annual['monthly'],
            'top_expense_categories' => array_slice($annual['financial']['expense_by_category'], 0, 5),
            'cash' => [
                'total' => round((float) $accounts->sum('balance'), 2),
                'accounts' => $accounts->map(fn ($a) => [
                    'id' => $a->id,
                    'label' => $a->label,
                    'bank_name' => $a->bank_name,
                    'balance' => round((float) $a->balance, 2),
                ])->values(),
            ],
            'pending' => [
                'incomes' => $pending(Income::where('status', 'Draft')),
                'expenses' => $pending(Expense::where('status', 'Draft')),
                'transfers' => $pending(Transfer::where('status', 'Draft')),
            ],
            'untransferred' => $untransferred ? $pending($untransferred) : ['count' => 0, 'amount' => 0],
            'queue' => $queue,
        ];
    }

    /**
     * The families: how many, which عدة cases need a decision, who nobody
     * is paying for, and the aid this person has recorded that is still
     * waiting on the books.
     */
    public function families(User $user): array
    {
        $beneficiaries = $this->reports->widows()['totals'];
        $gaps = $this->reports->sponsorshipGaps();
        $today = now()->startOfDay();

        // Every عدة case that is over, or will be within the horizon. Both
        // are the same decision - take the family on or not - and the ones
        // already over are the ones that are late.
        $idda = Widow::iddaCases()
            ->whereNotNull('idda_end_date')
            ->whereDate('idda_end_date', '<=', $today->copy()->addDays(self::IDDA_HORIZON_DAYS)->toDateString())
            ->orderBy('idda_end_date')
            ->get(['id', 'first_name', 'last_name', 'neighborhood', 'idda_end_date', 'is_idda_case', 'admission_date'])
            ->map(function (Widow $w) use ($today) {
                $end = $w->idda_end_date->copy()->startOfDay();

                return [
                    'id' => $w->id,
                    'full_name' => $w->full_name,
                    'neighborhood' => $w->neighborhood,
                    'end_date' => $end->toDateString(),
                    'ended' => $end->lt($today),
                    // Signed: negative is how many days ago it ended.
                    'days' => (int) $today->diffInDays($end, false),
                ];
            });

        $myDrafts = Expense::where('status', 'Draft')->where('created_by', $user->id);

        return [
            'counts' => [
                'families' => (int) ($beneficiaries['widows'] ?? 0),
                'orphans' => (int) ($beneficiaries['orphans'] ?? 0),
                'sponsored' => (int) ($beneficiaries['sponsored_widows'] ?? 0),
                'coverage' => $beneficiaries['sponsorship_coverage'] ?? 0,
                'idda_active' => Widow::iddaActive()->count(),
                'idda_awaiting' => $idda->where('ended', true)->count(),
            ],
            'sponsorship' => [
                'target' => $gaps['target'],
                'totals' => $gaps['totals'],
                'families' => array_slice($gaps['families'], 0, 5),
            ],
            'idda' => $idda->values(),
            'my_drafts' => [
                'count' => (clone $myDrafts)->count(),
                'amount' => round((float) (clone $myDrafts)->sum('amount'), 2),
                'items' => (clone $myDrafts)->with('expenseCategory:id,label')
                    ->latest('expense_date')->limit(5)->get()
                    ->map(fn (Expense $e) => [
                        'id' => $e->id,
                        'date' => $e->expense_date?->toDateString(),
                        'amount' => round((float) $e->amount, 2),
                        'label' => $e->expenseCategory?->label ?? '—',
                        'details' => $e->details,
                    ])->values(),
            ],
            'recent_families' => Widow::regular()
                ->latest('admission_date')->limit(5)
                ->get(['id', 'first_name', 'last_name', 'neighborhood', 'admission_date'])
                ->map(fn (Widow $w) => [
                    'id' => $w->id,
                    'full_name' => $w->full_name,
                    'neighborhood' => $w->neighborhood,
                    'admission_date' => $w->admission_date?->toDateString(),
                ])->values(),
        ];
    }

    /**
     * Schooling: who is registered this year, who should be and is not, how
     * last year went, and which transport months are still open.
     */
    public function education(): array
    {
        $year = AcademicYear::current();

        $enrollments = $year
            ? OrphanEnrollment::where('academic_year_id', $year->id)
                ->selectRaw('status, COUNT(*) as n')->groupBy('status')->pluck('n', 'status')
            : collect();

        // Children the file says are at school, from families the
        // association supports, with no registration this year. Not a
        // judgement on the child - most of these are a form nobody has
        // filled in yet - which is exactly why it is worth raising.
        $unenrolled = $year
            ? Orphan::query()
                ->where('is_schooled', true)
                ->where(fn ($q) => $q->where('is_inactive', false)->orWhereNull('is_inactive'))
                ->whereHas('widow', fn ($q) => $q->regular())
                ->whereDoesntHave('enrollments', fn ($q) => $q->where('academic_year_id', $year->id))
            : null;

        $ungraded = $year
            ? OrphanEnrollment::where('academic_year_id', $year->id)->doesntHave('grades')->count()
            : 0;

        // Last year's outcome, from the most recent year before this one.
        $previous = $year
            ? AcademicYear::where('start_year', '<', $year->start_year)->orderByDesc('start_year')->first()
            : null;
        $previousOutcome = $previous
            ? OrphanEnrollment::where('academic_year_id', $previous->id)
                ->selectRaw("SUM(status = 'passed') as passed, SUM(status = 'failed') as failed")
                ->first()
            : null;
        $passed = (int) ($previousOutcome->passed ?? 0);
        $failed = (int) ($previousOutcome->failed ?? 0);

        $months = $year
            ? TransportMonth::where('academic_year_id', $year->id)->orderBy('period_month')->get()
            : collect();
        $firstOfThisMonth = now()->startOfMonth();

        $riders = TransportSupport::active()
            ->when($year, fn ($q) => $q->whereHas('enrollment', fn ($e) => $e->where('academic_year_id', $year->id)))
            ->selectRaw('mode, COUNT(*) as n')->groupBy('mode')->pluck('n', 'mode');

        return [
            'year' => $year ? ['id' => $year->id, 'label' => $year->label] : null,
            'enrollments' => [
                'total' => (int) $enrollments->sum(),
                'by_status' => [
                    'enrolled' => (int) ($enrollments['enrolled'] ?? 0),
                    'passed' => (int) ($enrollments['passed'] ?? 0),
                    'failed' => (int) ($enrollments['failed'] ?? 0),
                    'left' => (int) ($enrollments['left'] ?? 0),
                ],
                'ungraded' => $ungraded,
            ],
            'unenrolled' => [
                'count' => $unenrolled ? (clone $unenrolled)->count() : 0,
                'items' => $unenrolled
                    ? (clone $unenrolled)->with('widow:id,first_name,last_name')
                        ->orderBy('first_name')->limit(6)->get()
                        ->map(fn (Orphan $o) => [
                            'id' => $o->id,
                            'full_name' => trim($o->first_name . ' ' . $o->last_name),
                            'age' => $o->birth_date?->age,
                            'family' => $o->widow?->full_name,
                            'widow_id' => $o->widow_id,
                        ])->values()
                    : [],
            ],
            'previous_year' => $previous ? [
                'label' => $previous->label,
                'passed' => $passed,
                'failed' => $failed,
                'pass_rate' => ($passed + $failed) > 0 ? round($passed / ($passed + $failed) * 100, 1) : null,
            ] : null,
            'transport' => [
                'riders' => [
                    'bus' => (int) ($riders[TransportSupport::MODE_BUS] ?? 0),
                    'allowance' => (int) ($riders[TransportSupport::MODE_ALLOWANCE] ?? 0),
                ],
                'months' => $months->map(fn (TransportMonth $m) => [
                    'id' => $m->id,
                    'label' => $m->period_label,
                    'status' => $m->status,
                    'status_label' => $m->status_label,
                    // A month that is over and still not closed is late;
                    // the current one being open is just the month.
                    'overdue' => $m->status !== TransportMonth::STATUS_CLOSED
                        && $m->period_month->lt($firstOfThisMonth),
                ])->values(),
                'current_month_opened' => $months->contains(
                    fn (TransportMonth $m) => $m->period_month->isSameMonth(now())
                ),
            ],
        ];
    }

    /**
     * The accounts themselves: who can still get in, whose second factor is
     * off, whose password is about to lock them out, and the latest of what
     * everybody did.
     */
    public function accounts(): array
    {
        $users = User::all();
        $active = $users->where('is_active', true);

        $expiring = $active->filter(function (User $u) {
            $days = $u->passwordExpiresInDays();

            return $days !== null && $days >= 0 && $days <= self::PASSWORD_WARN_DAYS;
        });

        return [
            'counts' => [
                'total' => $users->count(),
                'active' => $active->count(),
                'inactive' => $users->count() - $active->count(),
                'two_factor_off' => $active->where('two_factor_enabled', false)->count(),
                'password_expiring' => $expiring->count(),
                'password_due' => $active->filter(fn (User $u) => $u->mustChangePassword())->count(),
                'never_signed_in' => $active->whereNull('last_login_at')->count(),
            ],
            'by_role' => collect(User::ROLES)->mapWithKeys(
                fn ($role) => [$role => $active->where('role', $role)->count()]
            ),
            // Named, because "two accounts have no second factor" is a
            // number to worry about and "these two" is a thing to fix.
            'two_factor_off' => $active->where('two_factor_enabled', false)
                ->map(fn (User $u) => ['id' => $u->id, 'name' => $u->name, 'role' => $u->role])
                ->values(),
            'recent_activity' => AuditLog::latest('created_at')->limit(8)
                ->get(['id', 'user_name', 'action', 'entity_type', 'entity_label', 'created_at'])
                ->map(fn (AuditLog $log) => [
                    'id' => $log->id,
                    'user_name' => $log->user_name,
                    'action' => $log->action,
                    'action_label' => AuditLogController::ACTION_LABELS[$log->action] ?? $log->action,
                    'entity_type' => $log->entity_type,
                    'entity_type_label' => AuditLogController::ENTITY_LABELS[$log->entity_type] ?? $log->entity_type,
                    'entity_label' => $log->entity_label,
                    'created_at' => $log->created_at?->toIso8601String(),
                ])->values(),
        ];
    }
}
