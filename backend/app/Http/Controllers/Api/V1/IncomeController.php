<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\V1\StoreIncomeRequest;
use App\Http\Requests\V1\UpdateIncomeRequest;
use App\Models\Income;
use App\Services\IncomeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class IncomeController extends Controller
{
    public function __construct(private readonly IncomeService $incomes)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $incomes = Income::with([
            'fiscalYear',
            'subBudget',
            'incomeCategory',
            'donor',
            'kafil',
            'bankAccount',
        ])
            ->when($request->fiscal_year_id, fn ($query, $fiscalYearId) => $query->where('fiscal_year_id', $fiscalYearId))
            ->when($request->status, fn ($query, $status) => $query->where('status', $status))
            ->when($request->from_date, fn ($query, $fromDate) => $query->whereDate('income_date', '>=', $fromDate))
            ->when($request->to_date, fn ($query, $toDate) => $query->whereDate('income_date', '<=', $toDate))
            ->when($request->payment_method, fn ($query, $paymentMethod) => $query->where('payment_method', $paymentMethod))
            ->when($request->sub_budget_id, fn ($query, $subBudgetId) => $query->where('sub_budget_id', $subBudgetId))
            ->when($request->min_amount, fn ($query, $minAmount) => $query->where('amount', '>=', $minAmount))
            ->when($request->max_amount, fn ($query, $maxAmount) => $query->where('amount', '<=', $maxAmount))
            ->orderBy('income_date', 'desc')
            ->paginate($request->per_page ?? 15);

        return response()->json([
            'data' => $incomes->items(),
            'meta' => [
                'current_page' => $incomes->currentPage(),
                'last_page' => $incomes->lastPage(),
                'per_page' => $incomes->perPage(),
                'total' => $incomes->total(),
            ],
        ]);
    }

    public function store(StoreIncomeRequest $request): JsonResponse
    {
        $income = Income::create([
            ...$request->validated(),
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
            'subBudget',
            'incomeCategory',
            'donor',
            'kafil',
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
