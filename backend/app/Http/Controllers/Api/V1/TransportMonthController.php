<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\AcademicYear;
use App\Models\Budget;
use App\Models\Expense;
use App\Models\ExpenseCategory;
use App\Models\FiscalYear;
use App\Models\TransportMonth;
use App\Models\TransportMonthLine;
use App\Models\TransportSupport;
use App\Services\TransportSettlementService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class TransportMonthController extends Controller
{
    public function __construct(private readonly TransportSettlementService $settlement)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $yearId = $request->integer('academic_year_id') ?: AcademicYear::where('is_current', true)->value('id');

        $months = TransportMonth::with('expense:id,amount,expense_date,status')
            ->withCount([
                'lines',
                'lines as riders_count' => fn ($q) => $q
                    ->where('mode', TransportSupport::MODE_BUS)
                    ->where('rode_consistently', true),
                'lines as allowance_count' => fn ($q) => $q
                    ->where('mode', TransportSupport::MODE_ALLOWANCE)
                    ->where('attendances', '>', 0),
            ])
            ->withSum('lines as total_amount', 'amount')
            ->when($yearId, fn ($q) => $q->where('academic_year_id', $yearId))
            ->orderByDesc('period_month')
            ->get();

        return response()->json([
            'data' => $months,
            'meta' => [
                'academic_year_id' => $yearId,
                'statuses' => TransportMonth::STATUSES,
            ],
        ]);
    }

    /** One month's sheet: every child, what they did, and what it comes to. */
    public function show(TransportMonth $transportMonth): JsonResponse
    {
        return response()->json(['data' => $this->sheet($transportMonth)]);
    }

    /**
     * Open a month.
     *
     * Creating it fills it with everybody currently being helped, so the
     * staff open a sheet that is already the roster rather than an empty
     * table they have to populate by hand.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'academic_year_id' => ['required', 'exists:academic_years,id'],
            'period_month' => ['required', 'date'],
            'fuel_cost' => ['nullable', 'numeric', 'min:0', 'max:9999999.99'],
            'driver_cost' => ['nullable', 'numeric', 'min:0', 'max:9999999.99'],
            'other_cost' => ['nullable', 'numeric', 'min:0', 'max:9999999.99'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ], [
            'academic_year_id.required' => 'السنة الدراسية مطلوبة',
            'period_month.required' => 'الشهر مطلوب',
        ]);

        // Normalised to the first of the month: the sheet is about a month,
        // and two sheets differing only by the day they were opened on would
        // each hold half the riders.
        $first = Carbon::parse($validated['period_month'])->startOfMonth()->toDateString();

        $exists = TransportMonth::where('academic_year_id', $validated['academic_year_id'])
            ->whereDate('period_month', $first)
            ->exists();

        if ($exists) {
            throw ValidationException::withMessages([
                'period_month' => ['هذا الشهر مفتوح بالفعل في هذه السنة الدراسية'],
            ]);
        }

        $month = DB::transaction(function () use ($validated, $first) {
            $month = TransportMonth::create([
                'academic_year_id' => $validated['academic_year_id'],
                'period_month' => $first,
                'fuel_cost' => $validated['fuel_cost'] ?? 0,
                'driver_cost' => $validated['driver_cost'] ?? 0,
                'other_cost' => $validated['other_cost'] ?? 0,
                'notes' => $validated['notes'] ?? null,
                'status' => TransportMonth::STATUS_DRAFT,
            ]);

            $this->settlement->syncLines($month);
            $this->settlement->recalculate($month);

            return $month;
        });

        return response()->json([
            'message' => 'تم فتح الشهر وإضافة المستفيدين إليه',
            'data' => $this->sheet($month->fresh()),
        ], 201);
    }

    /** Change the month's costs, and optionally the whole sheet in one go. */
    public function update(Request $request, TransportMonth $transportMonth): JsonResponse
    {
        $this->guardOpen($transportMonth);

        $validated = $request->validate([
            'fuel_cost' => ['nullable', 'numeric', 'min:0', 'max:9999999.99'],
            'driver_cost' => ['nullable', 'numeric', 'min:0', 'max:9999999.99'],
            'other_cost' => ['nullable', 'numeric', 'min:0', 'max:9999999.99'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'lines' => ['sometimes', 'array'],
            'lines.*.id' => ['required', 'integer'],
            'lines.*.rode_consistently' => ['sometimes', 'boolean'],
            'lines.*.attendances' => ['sometimes', 'integer', 'min:0', 'max:60'],
            'lines.*.notes' => ['sometimes', 'nullable', 'string', 'max:500'],
        ], [
            'lines.*.attendances.max' => 'عدد مرات الحضور في الشهر لا يتجاوز 60',
        ]);

        DB::transaction(function () use ($validated, $transportMonth) {
            $transportMonth->update([
                'fuel_cost' => $validated['fuel_cost'] ?? $transportMonth->fuel_cost,
                'driver_cost' => $validated['driver_cost'] ?? $transportMonth->driver_cost,
                'other_cost' => $validated['other_cost'] ?? $transportMonth->other_cost,
                'notes' => array_key_exists('notes', $validated) ? $validated['notes'] : $transportMonth->notes,
            ]);

            foreach ($validated['lines'] ?? [] as $row) {
                $line = TransportMonthLine::where('transport_month_id', $transportMonth->id)
                    ->whereKey($row['id'])
                    ->first();

                if ($line === null) {
                    continue;   // a line from another month, or one since removed
                }

                $line->fill(array_intersect_key($row, array_flip([
                    'rode_consistently', 'attendances', 'notes',
                ])));
                $line->save();
            }

            $this->settlement->recalculate($transportMonth);
        });

        return response()->json([
            'message' => 'تم حفظ الشهر',
            'data' => $this->sheet($transportMonth->fresh()),
        ]);
    }

    /** Pick up children enrolled since the sheet was opened. */
    public function refresh(TransportMonth $transportMonth): JsonResponse
    {
        $this->guardOpen($transportMonth);

        $before = $transportMonth->lines()->count();

        DB::transaction(function () use ($transportMonth) {
            $this->settlement->syncLines($transportMonth);
            $this->settlement->recalculate($transportMonth);
        });

        $added = $transportMonth->lines()->count() - $before;

        return response()->json([
            'message' => $added > 0
                ? "تمت إضافة {$added} مستفيداً جديداً إلى الشهر"
                : 'لا يوجد مستفيدون جدد لإضافتهم',
            'data' => $this->sheet($transportMonth->fresh()),
        ]);
    }

    /**
     * The month as an expense waiting to be written, for the form to fill
     * itself from. Reads only - nothing is posted to the accounts from here.
     */
    public function expenseDraft(TransportMonth $transportMonth): JsonResponse
    {
        $draft = $this->settlement->expenseDraft($transportMonth);

        return response()->json([
            'data' => array_merge($draft, [
                'transport_month_id' => $transportMonth->id,
                'period_label' => $transportMonth->period_label,
                'details' => "مصاريف نقل المستفيدين إلى المركز - {$transportMonth->period_label}",
                // The last day of the month it covers, which is when the
                // association actually settles it.
                'expense_date' => $transportMonth->period_month->copy()->endOfMonth()->toDateString(),
                // Resolved here rather than written into the screen as
                // numbers: which row is "نقل مدرسي" is a fact about this
                // database, and an id compiled into the frontend would be
                // wrong on any other one.
                'expense_category_id' => $this->categoryId(),
                'budget_id' => $this->budgetId(),
                'fiscal_year_id' => FiscalYear::where('is_active', true)->value('id'),
            ]),
        ]);
    }

    /**
     * Mark the month settled, naming the expense that paid it.
     *
     * Called by the expenses screen after the expense is saved, so the sheet
     * and the money can be read back against each other. The amounts stop
     * moving at this point: re-dividing a closed month after a child is
     * added would disagree with an expense already in the accounts.
     */
    public function close(Request $request, TransportMonth $transportMonth): JsonResponse
    {
        $validated = $request->validate([
            'expense_id' => ['required', 'exists:expenses,id'],
        ], [
            'expense_id.required' => 'رقم المصروف مطلوب لترحيل الشهر',
        ]);

        if ($transportMonth->isClosed()) {
            throw ValidationException::withMessages([
                'expense_id' => ['هذا الشهر مُرحَّل بالفعل'],
            ]);
        }

        DB::transaction(function () use ($transportMonth, $validated) {
            // One last division, so what is frozen is what the sheet showed.
            $this->settlement->recalculate($transportMonth);

            $transportMonth->update([
                'status' => TransportMonth::STATUS_CLOSED,
                'expense_id' => $validated['expense_id'],
                'closed_at' => now(),
            ]);
        });

        return response()->json([
            'message' => 'تم ترحيل الشهر وربطه بالمصروف',
            'data' => $this->sheet($transportMonth->fresh()),
        ]);
    }

    /** Undo a settlement, for a month closed against the wrong expense. */
    public function reopen(TransportMonth $transportMonth): JsonResponse
    {
        if (! $transportMonth->isClosed()) {
            return response()->json(['message' => 'هذا الشهر غير مُرحَّل أصلاً'], 400);
        }

        $transportMonth->update([
            'status' => TransportMonth::STATUS_DRAFT,
            'expense_id' => null,
            'closed_at' => null,
        ]);

        return response()->json([
            'message' => 'تم إرجاع الشهر إلى مسودة. لم يُحذف المصروف المرتبط به - احذفه من المصروفات إن لزم.',
            'data' => $this->sheet($transportMonth->fresh()),
        ]);
    }

    public function destroy(TransportMonth $transportMonth): JsonResponse
    {
        if ($transportMonth->isClosed()) {
            return response()->json([
                'message' => 'لا يمكن حذف شهر مُرحَّل. أرجعه إلى مسودة أولاً.',
            ], 400);
        }

        $label = $transportMonth->period_label;
        $transportMonth->delete();

        return response()->json(['message' => "تم حذف شهر {$label}"]);
    }

    /**
     * The category a month of transport belongs under.
     *
     * By name, with a widening fallback, because the reference lists are the
     * association's to edit: an exact match first, anything about transport
     * second, and nothing at all if neither exists - in which case the form
     * simply opens with the category unchosen rather than with a wrong one.
     */
    private function categoryId(): ?int
    {
        return ExpenseCategory::where('label', 'نقل مدرسي')->value('id')
            ?? ExpenseCategory::where('label', 'like', '%نقل%')->value('id');
    }

    private function budgetId(): ?int
    {
        return Budget::where('label', 'النقل والمواصلات')->value('id')
            ?? Budget::where('label', 'like', '%نقل%')->value('id')
            ?? Budget::where('label', 'الميزانية العامة')->value('id')
            ?? Budget::orderBy('id')->value('id');
    }

    private function guardOpen(TransportMonth $month): void
    {
        if ($month->isClosed()) {
            throw ValidationException::withMessages([
                'status' => ['هذا الشهر مُرحَّل ولا يمكن تعديله. أرجعه إلى مسودة أولاً.'],
            ]);
        }
    }

    /** The month, its lines, and the totals every screen wants with them. */
    private function sheet(TransportMonth $month): array
    {
        $lines = $month->lines()
            ->with(['support.enrollment.orphan.widow', 'support.enrollment.educationLevel'])
            ->get()
            ->sortBy(fn ($line) => [$line->mode, $line->support?->enrollment?->orphan?->first_name ?? ''])
            ->values();

        $riders = $lines->filter(fn ($line) => $line->countsTowardsSplit());
        $allowances = $lines->where('mode', TransportSupport::MODE_ALLOWANCE);

        return [
            'month' => $month->load('expense:id,amount,expense_date,status', 'academicYear'),
            'lines' => $lines,
            'totals' => [
                'bus_pot' => $month->bus_pot,
                'riders_counted' => $riders->count(),
                'riders_total' => $lines->where('mode', TransportSupport::MODE_BUS)->count(),
                // What one child's share works out at. Shown rather than
                // stored: the shares themselves carry the odd centimes, and
                // this is the round number the staff recognise.
                'share_per_rider' => $riders->count() > 0
                    ? round($month->bus_pot / $riders->count(), 2)
                    : null,
                'bus_total' => round((float) $riders->sum('amount'), 2),
                'allowance_total' => round((float) $allowances->sum('amount'), 2),
                'allowance_children' => $allowances->where('attendances', '>', 0)->count(),
                'grand_total' => round((float) $lines->sum('amount'), 2),
            ],
        ];
    }
}
