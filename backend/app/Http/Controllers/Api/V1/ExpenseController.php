<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\V1\StoreExpenseRequest;
use App\Http\Requests\V1\UpdateExpenseRequest;
use App\Models\Expense;
use App\Services\ExpenseService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ExpenseController extends Controller
{
    private const RELATIONS = [
        'fiscalYear',
        'subBudget',
        'expenseCategory',
        'partner',
        'bankAccount',
        'beneficiaries.beneficiary',
        'beneficiaryGroups',
        'createdBy',
        'approvedBy',
    ];

    public function __construct(private readonly ExpenseService $expenses)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $query = Expense::with(self::RELATIONS)
            ->when($request->filled('fiscal_year_id'), fn ($q) => $q->where('fiscal_year_id', $request->fiscal_year_id))
            ->when($request->filled('sub_budget_id'), fn ($q) => $q->where('sub_budget_id', $request->sub_budget_id))
            ->when($request->filled('expense_category_id'), fn ($q) => $q->where('expense_category_id', $request->expense_category_id))
            ->when($request->filled('partner_id'), fn ($q) => $q->where('partner_id', $request->partner_id))
            ->when($request->filled('payment_method'), fn ($q) => $q->where('payment_method', $request->payment_method))
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->status))
            ->when($request->filled('min_amount'), fn ($q) => $q->where('amount', '>=', $request->min_amount))
            ->when($request->filled('max_amount'), fn ($q) => $q->where('amount', '<=', $request->max_amount))
            ->when($request->filled('from_date'), fn ($q) => $q->whereDate('expense_date', '>=', $request->from_date))
            ->when($request->filled('to_date'), fn ($q) => $q->whereDate('expense_date', '<=', $request->to_date));

        if ($search = $request->get('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('details', 'like', "%{$search}%")
                    ->orWhere('remarks', 'like', "%{$search}%")
                    ->orWhereHas('partner', fn ($partner) => $partner->where('name', 'like', "%{$search}%"))
                    ->orWhereHas('subBudget', fn ($budget) => $budget->where('label', 'like', "%{$search}%"))
                    ->orWhereHas('expenseCategory', fn ($category) => $category->where('label', 'like', "%{$search}%"));
            });
        }

        $expenses = $query->orderBy('expense_date', 'desc')
            ->paginate($request->get('per_page', 15), ['*'], 'page', $request->get('page', 1));

        return response()->json([
            'data' => $expenses->items(),
            'meta' => [
                'current_page' => $expenses->currentPage(),
                'last_page' => $expenses->lastPage(),
                'per_page' => $expenses->perPage(),
                'total' => $expenses->total(),
                'from' => $expenses->firstItem(),
                'to' => $expenses->lastItem(),
            ],
        ]);
    }

    public function store(StoreExpenseRequest $request): JsonResponse
    {
        $expense = $this->expenses->create($request->validated());

        return response()->json([
            'message' => 'تم إنشاء المصروف بنجاح',
            'data' => $expense->load(self::RELATIONS),
        ], 201);
    }

    public function show(Expense $expense): JsonResponse
    {
        return response()->json([
            'data' => $expense->load(self::RELATIONS),
        ]);
    }

    public function update(UpdateExpenseRequest $request, Expense $expense): JsonResponse
    {
        $expense = $this->expenses->update($expense, $request->validated());

        return response()->json([
            'message' => 'تم تحديث المصروف بنجاح',
            'data' => $expense->load(self::RELATIONS),
        ]);
    }

    public function destroy(Expense $expense): JsonResponse
    {
        $this->expenses->delete($expense);

        return response()->json([
            'message' => 'تم حذف المصروف بنجاح',
        ]);
    }

    public function approve(Expense $expense): JsonResponse
    {
        $expense = $this->expenses->approve($expense);

        return response()->json([
            'message' => 'تم اعتماد المصروف بنجاح',
            'data' => $expense->load(['approvedBy']),
        ]);
    }
}
