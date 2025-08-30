<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Income;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

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
            ->when($request->payment_method, function ($query, $paymentMethod) {
                return $query->where('payment_method', $paymentMethod);
            })
            ->when($request->sub_budget_id, function ($query, $subBudgetId) {
                return $query->where('sub_budget_id', $subBudgetId);
            })
            ->when($request->min_amount, function ($query, $minAmount) {
                return $query->where('amount', '>=', $minAmount);
            })
            ->when($request->max_amount, function ($query, $maxAmount) {
                return $query->where('amount', '<=', $maxAmount);
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
            'transferred_at' => 'nullable|date',
        ]);

        // Validation logic for payment method requirements
        if ($validated['payment_method'] === 'Cheque' && empty($validated['cheque_number'])) {
            return response()->json([
                'message' => 'رقم الشيك مطلوب عند اختيار الدفع بالشيك',
                'errors' => ['cheque_number' => ['رقم الشيك مطلوب']]
            ], 422);
        }

        if ($validated['payment_method'] === 'BankWire' && empty($validated['bank_account_id'])) {
            return response()->json([
                'message' => 'الحساب البنكي مطلوب لهذه طريقة الدفع',
                'errors' => ['bank_account_id' => ['الحساب البنكي مطلوب']]
            ], 422);
        }

        $validated['created_by'] = auth()->id() ?? 1; // Fallback to user ID 1 if auth not available
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
            'transferred_at' => 'nullable|date',
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

        try {
            DB::beginTransaction();

            $income->update([
                'status' => 'Approved',
                'approved_by' => auth()->id() ?? 1, // Fallback to user ID 1 if auth not available
                'approved_at' => now(),
            ]);

            // If it's a BankWire payment, automatically update the bank account balance
            if ($income->payment_method === 'BankWire' && $income->bank_account_id) {
                $bankAccount = \App\Models\BankAccount::find($income->bank_account_id);
                if ($bankAccount) {
                    $bankAccount->increment('balance', $income->amount);
                }
            }

            DB::commit();

            $message = $income->payment_method === 'BankWire' && $income->bank_account_id 
                ? 'تم اعتماد الإيراد بنجاح وتم إضافة المبلغ إلى رصيد الحساب البنكي'
                : 'تم اعتماد الإيراد بنجاح';

            return response()->json([
                'message' => $message,
                'data' => $income
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'حدث خطأ أثناء اعتماد الإيراد',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Transfer income to bank account (allowed for approved incomes)
     */
    public function transferToBank(Request $request, Income $income): JsonResponse
    {
        $request->validate([
            'bank_account_id' => 'required|exists:bank_accounts,id',
            'transferred_at' => 'required|date',
            'remarks' => 'nullable|string',
        ]);

        // Only allow transfer for approved cash/cheque incomes that haven't been transferred yet
        if ($income->status !== 'Approved') {
            return response()->json([
                'message' => 'يمكن تحويل الإيرادات المعتمدة فقط'
            ], 403);
        }

        if (!in_array($income->payment_method, ['Cash', 'Cheque'])) {
            return response()->json([
                'message' => 'يمكن تحويل الإيرادات النقدية والشيكات فقط'
            ], 403);
        }

        if ($income->transferred_at) {
            return response()->json([
                'message' => 'هذا الإيراد محول مسبقاً'
            ], 403);
        }

        try {
            DB::beginTransaction();

            // Get the bank account and update its balance
            $bankAccount = \App\Models\BankAccount::findOrFail($request->bank_account_id);
            
            // Update only transfer-related fields
            $income->update([
                'bank_account_id' => $request->bank_account_id,
                'transferred_at' => $request->transferred_at,
                'remarks' => $request->remarks ? 
                    ($income->remarks ? $income->remarks . ' | ' . $request->remarks : $request->remarks) : 
                    $income->remarks,
            ]);

            // Update bank account balance (add income amount)
            $bankAccount->increment('balance', $income->amount);

            DB::commit();

            return response()->json([
                'message' => 'تم تحويل الإيراد إلى البنك بنجاح وتم تحديث رصيد الحساب',
                'data' => $income->load(['bankAccount'])
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'حدث خطأ أثناء تحويل الإيراد',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}