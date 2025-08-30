<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Income;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class IncomeController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $incomes = Income::with([
            'fiscalYear',
            'subBudget',
            'incomeCategory',
            'donor',
            'kafil',
            'bankAccount'
        ])
            ->when($request->fiscal_year_id, function ($query, $fiscalYearId) {
                return $query->where('fiscal_year_id', $fiscalYearId);
            })
            ->when($request->status, function ($query, $status) {
                return $query->where('status', $status);
            })
            ->when($request->from_date, function ($query, $fromDate) {
                return $query->whereDate('income_date', '>=', $fromDate);
            })
            ->when($request->to_date, function ($query, $toDate) {
                return $query->whereDate('income_date', '<=', $toDate);
            })
            ->orderBy('income_date', 'desc')
            ->paginate($request->per_page ?? 15);

        return response()->json([
            'data' => $incomes->items(),
            'meta' => [
                'current_page' => $incomes->currentPage(),
                'last_page' => $incomes->lastPage(),
                'per_page' => $incomes->perPage(),
                'total' => $incomes->total(),
            ]
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'fiscal_year_id' => 'required|exists:fiscal_years,id',
            'sub_budget_id' => 'required|exists:sub_budgets,id',
            'income_category_id' => 'required|exists:income_categories,id',
            'donor_id' => 'nullable|exists:donors,id',
            'kafil_id' => 'nullable|exists:kafils,id',
            'income_date' => 'required|date',
            'amount' => 'required|numeric|min:0',
            'payment_method' => 'required|in:Cash,Cheque,BankWire',
            'cheque_number' => 'nullable|string|max:60',
            'receipt_number' => 'nullable|string|max:60',
            'bank_account_id' => 'nullable|exists:bank_accounts,id',
            'remarks' => 'nullable|string',
        ]);

        // Validation logic for payment method requirements
        if ($validated['payment_method'] === 'Cheque' && empty($validated['cheque_number'])) {
            return response()->json([
                'message' => 'رقم الشيك مطلوب عند اختيار الدفع بالشيك',
                'errors' => ['cheque_number' => ['رقم الشيك مطلوب']]
            ], 422);
        }

        if (in_array($validated['payment_method'], ['Cheque', 'BankWire']) && empty($validated['bank_account_id'])) {
            return response()->json([
                'message' => 'الحساب البنكي مطلوب لهذه طريقة الدفع',
                'errors' => ['bank_account_id' => ['الحساب البنكي مطلوب']]
            ], 422);
        }

        $validated['created_by'] = auth()->id();
        $income = Income::create($validated);

        return response()->json([
            'message' => 'تم إنشاء الإيراد بنجاح',
            'data' => $income->load(['donor', 'kafil', 'incomeCategory'])
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
            'approvedBy'
        ]);

        return response()->json(['data' => $income]);
    }

    public function update(Request $request, Income $income): JsonResponse
    {
        if ($income->status === 'Approved') {
            return response()->json([
                'message' => 'لا يمكن تعديل الإيرادات المعتمدة'
            ], 403);
        }

        $validated = $request->validate([
            'fiscal_year_id' => 'required|exists:fiscal_years,id',
            'sub_budget_id' => 'required|exists:sub_budgets,id',
            'income_category_id' => 'required|exists:income_categories,id',
            'donor_id' => 'nullable|exists:donors,id',
            'kafil_id' => 'nullable|exists:kafils,id',
            'income_date' => 'required|date',
            'amount' => 'required|numeric|min:0',
            'payment_method' => 'required|in:Cash,Cheque,BankWire',
            'cheque_number' => 'nullable|string|max:60',
            'receipt_number' => 'nullable|string|max:60',
            'bank_account_id' => 'nullable|exists:bank_accounts,id',
            'remarks' => 'nullable|string',
        ]);

        $income->update($validated);

        return response()->json([
            'message' => 'تم تحديث الإيراد بنجاح',
            'data' => $income->load(['donor', 'kafil', 'incomeCategory'])
        ]);
    }

    public function destroy(Income $income): JsonResponse
    {
        if ($income->status === 'Approved') {
            return response()->json([
                'message' => 'لا يمكن حذف الإيرادات المعتمدة'
            ], 403);
        }

        $income->delete();

        return response()->json([
            'message' => 'تم حذف الإيراد بنجاح'
        ]);
    }

    public function approve(Income $income): JsonResponse
    {
        if ($income->status === 'Approved') {
            return response()->json([
                'message' => 'الإيراد معتمد مسبقاً'
            ], 400);
        }

        $income->update([
            'status' => 'Approved',
            'approved_by' => auth()->id(),
            'approved_at' => now(),
        ]);

        return response()->json([
            'message' => 'تم اعتماد الإيراد بنجاح',
            'data' => $income
        ]);
    }
}