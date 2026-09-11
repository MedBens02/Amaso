<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\V1\StoreIncomeRequest;
use App\Http\Requests\V1\UpdateIncomeRequest;
use App\Models\Income;
use App\Services\IncomeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class IncomeController extends Controller
{
    public function __construct(private readonly IncomeService $incomes)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $incomes = Income::with([
            'fiscalYear',
            'budget',
            'incomeCategory',
            'donor',
            'kafil',
            'widow',
            'bankAccount',
        ])
            ->when($request->fiscal_year_id, fn ($query, $fiscalYearId) => $query->where('fiscal_year_id', $fiscalYearId))
            ->when($request->status, fn ($query, $status) => $query->where('status', $status))
            ->when($request->from_date, fn ($query, $fromDate) => $query->whereDate('income_date', '>=', $fromDate))
            ->when($request->to_date, fn ($query, $toDate) => $query->whereDate('income_date', '<=', $toDate))
            ->when($request->payment_method, fn ($query, $paymentMethod) => $query->where('payment_method', $paymentMethod))
            ->when($request->budget_id, fn ($query, $budgetId) => $query->where('budget_id', $budgetId))
            ->when($request->min_amount, fn ($query, $minAmount) => $query->where('amount', '>=', $minAmount))
            ->when($request->max_amount, fn ($query, $maxAmount) => $query->where('amount', '<=', $maxAmount))
            // The list screen used to filter the search term in the browser,
            // over whichever page it happened to be holding. Searching a
            // sponsor's name then showed one result on page 1, six on page 2
            // and none on page 3, with the pager still counting every income
            // in the table. The search has to run where the pagination runs.
            ->when($request->search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('remarks', 'like', "%{$search}%")
                        ->orWhere('receipt_number', 'like', "%{$search}%")
                        ->orWhere('cheque_number', 'like', "%{$search}%")
                        ->orWhereHas('budget', fn ($budget) => $budget->where('label', 'like', "%{$search}%"))
                        ->orWhereHas('incomeCategory', fn ($category) => $category->where('label', 'like', "%{$search}%"))
                        ->orWhereHas('donor', fn ($donor) => $donor
                            ->where('first_name', 'like', "%{$search}%")
                            ->orWhere('last_name', 'like', "%{$search}%")
                            ->orWhereRaw("CONCAT(first_name, ' ', last_name) like ?", ["%{$search}%"]))
                        ->orWhereHas('kafil', fn ($kafil) => $kafil
                            ->where('first_name', 'like', "%{$search}%")
                            ->orWhere('last_name', 'like', "%{$search}%")
                            ->orWhereRaw("CONCAT(first_name, ' ', last_name) like ?", ["%{$search}%"]))
                        ->orWhereHas('widow', fn ($widow) => $widow
                            ->where('first_name', 'like', "%{$search}%")
                            ->orWhere('last_name', 'like', "%{$search}%")
                            ->orWhereRaw("CONCAT(first_name, ' ', last_name) like ?", ["%{$search}%"]));
                });
            })
            ->orderBy('income_date', 'desc');

        return response()->json($this->paginateByBatch($incomes, (int) ($request->per_page ?? 15), (int) ($request->page ?? 1)));
    }

    /**
     * A page of *payments*, not of rows.
     *
     * A kafala chamila payment is stored as one income per budget line -
     * seven rows for one 800 DH sponsorship - and the list has to show it as
     * the one thing it was. Paginating over rows would leave a batch split
     * across a page boundary, so the page is taken over groups instead: a
     * batch counts once, an ordinary income counts once, and every row of a
     * selected batch comes back whole.
     *
     * The pager then counts what is actually on screen. It used to count
     * every income in the table while the screen showed something else
     * entirely, which is the same disagreement that made searching look
     * broken.
     */
    private function paginateByBatch($query, int $perPage, int $page): array
    {
        $perPage = max(1, min($perPage, 100));
        $page = max(1, $page);

        // Standalone incomes are their own group; batch rows share theirs.
        $groupKey = "COALESCE(incomes.kafala_batch_id, CONCAT('income:', incomes.id))";

        $groups = (clone $query)
            ->toBase()
            ->select(DB::raw("{$groupKey} as group_key"))
            ->selectRaw('MAX(incomes.income_date) as latest_date')
            ->selectRaw('MAX(incomes.id) as latest_id')
            ->groupBy(DB::raw($groupKey))
            ->orderByDesc('latest_date')
            ->orderByDesc('latest_id');

        $total = (clone $groups)->getCountForPagination();

        $keys = $groups->forPage($page, $perPage)->get()->pluck('group_key')->all();

        // Where each group sits on this page, so the rows can be put back in
        // that order without searching the key list once per comparison.
        $position = array_flip($keys);

        $rows = $keys === []
            ? collect()
            : (clone $query)
                ->whereRaw("{$groupKey} in (" . implode(',', array_fill(0, count($keys), '?')) . ')', $keys)
                ->get()
                // Same order as the page of groups, with each batch's own rows
                // kept together and in a stable order underneath. One padded
                // key rather than a list of them: Collection::sortBy reads an
                // array of callbacks as comparators, not as key extractors,
                // which silently shuffles the rows instead of ordering them.
                ->sortBy(fn ($row) => sprintf(
                    '%06d:%012d',
                    $position[$row->kafala_batch_id ?? 'income:' . $row->id] ?? count($keys),
                    $row->id,
                ))
                ->values();

        return [
            'data' => $rows->all(),
            'meta' => [
                'current_page' => $page,
                'last_page' => max(1, (int) ceil($total / $perPage)),
                'per_page' => $perPage,
                // Payments, which is what the page shows and what the pager
                // has to count.
                'total' => $total,
                'total_rows' => $rows->count(),
            ],
        ];
    }

    public function store(StoreIncomeRequest $request): JsonResponse
    {
        $income = Income::create([
            ...$request->validated(),
            // Set here rather than left to the column default, which Eloquent
            // does not read back - the response was going out with no status
            // at all, so the client could not tell a new income from an
            // approved one.
            'status' => 'Draft',
            'created_by' => auth()->id() ?? 1,
        ]);

        return response()->json([
            'message' => 'تم إنشاء الإيراد بنجاح',
            'data' => $income->load(['donor', 'kafil', 'incomeCategory']),
        ], 201);
    }

    public function show(Income $income): JsonResponse
    {
        $income->load([
            'fiscalYear',
            'budget',
            'incomeCategory',
            'donor',
            'kafil',
            'widow',
            'bankAccount',
            'createdBy',
            'approvedBy',
        ]);

        return response()->json(['data' => $income]);
    }

    public function update(UpdateIncomeRequest $request, Income $income): JsonResponse
    {
        if ($income->status === 'Approved') {
            return response()->json([
                'message' => 'لا يمكن تعديل الإيرادات المعتمدة',
            ], 403);
        }

        $income->update($request->validated());

        return response()->json([
            'message' => 'تم تحديث الإيراد بنجاح',
            'data' => $income->load(['donor', 'kafil', 'incomeCategory']),
        ]);
    }

    public function destroy(Income $income): JsonResponse
    {
        if ($income->status === 'Approved') {
            return response()->json([
                'message' => 'لا يمكن حذف الإيرادات المعتمدة',
            ], 403);
        }

        $income->delete();

        return response()->json([
            'message' => 'تم حذف الإيراد بنجاح',
        ]);
    }

    public function approve(Income $income): JsonResponse
    {
        $income = $this->incomes->approve($income);

        $message = $income->payment_method === 'BankWire' && $income->bank_account_id
            ? 'تم اعتماد الإيراد بنجاح وتم إضافة المبلغ إلى رصيد الحساب البنكي'
            : 'تم اعتماد الإيراد بنجاح';

        return response()->json([
            'message' => $message,
            'data' => $income,
        ]);
    }

    public function transferToBank(Request $request, Income $income): JsonResponse
    {
        $validated = $request->validate([
            'bank_account_id' => ['required', 'exists:bank_accounts,id'],
            'transferred_at' => ['required', 'date'],
            'remarks' => ['nullable', 'string'],
        ]);

        $income = $this->incomes->transferToBank(
            $income,
            (int) $validated['bank_account_id'],
            $validated['transferred_at'],
            $validated['remarks'] ?? null,
        );

        return response()->json([
            'message' => 'تم تحويل الإيراد إلى البنك بنجاح وتم تحديث رصيد الحساب',
            'data' => $income->load(['bankAccount']),
        ]);
    }
}
