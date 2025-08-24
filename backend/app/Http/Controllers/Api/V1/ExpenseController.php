<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Expense;
use App\Models\ExpenseBeneficiary;
use App\Models\ExpenseBeneficiaryGroup;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class ExpenseController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $expenses = Expense::with([
            'fiscalYear',
            'subBudget',
            'expenseCategory',
            'partner',
            'bankAccount',
            'beneficiaries',
            'beneficiaryGroups'
        ])
            ->when($request->fiscal_year_id, function ($query, $fiscalYearId) {
                return $query->where('fiscal_year_id', $fiscalYearId);
            })
            ->when($request->status, function ($query, $status) {
                return $query->where('status', $status);
            })
            ->when($request->from_date, function ($query, $fromDate) {
                return $query->whereDate('expense_date', '>=', $fromDate);
            })
            ->when($request->to_date, function ($query, $toDate) {
                return $query->whereDate('expense_date', '<=', $toDate);
            })
            ->orderBy('expense_date', 'desc')
            ->paginate($request->per_page ?? 15);

        return response()->json([
            'data' => $expenses->items(),
            'meta' => [
                'current_page' => $expenses->currentPage(),
                'last_page' => $expenses->lastPage(),
                'per_page' => $expenses->perPage(),
                'total' => $expenses->total(),
            ]
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'fiscal_year_id' => 'required|exists:fiscal_years,id',
            'sub_budget_id' => 'required|exists:sub_budgets,id',
            'expense_category_id' => 'required|exists:expense_categories,id',
            'partner_id' => 'nullable|exists:partners,id',
            'details' => 'nullable|string',
            'expense_date' => 'required|date',
            'amount' => 'required|numeric|min:0',
            'payment_method' => 'required|in:Cash,Cheque,BankWire',
            'cheque_number' => 'nullable|string|max:60',
            'receipt_number' => 'nullable|string|max:60',
            'bank_account_id' => 'nullable|exists:bank_accounts,id',
            'remarks' => 'nullable|string',
            'unrelated_to_benef' => 'boolean',
            'beneficiaries' => 'nullable|array',
            'beneficiaries.*.type' => 'required_with:beneficiaries|in:Widow,Orphan',
            'beneficiaries.*.id' => 'required_with:beneficiaries|integer',
            'beneficiaries.*.amount' => 'required_with:beneficiaries|numeric|min:0',
            'beneficiaries.*.notes' => 'nullable|string',
            'beneficiary_groups' => 'nullable|array',
            'beneficiary_groups.*.group_id' => 'required_with:beneficiary_groups|exists:beneficiary_groups,id',
            'beneficiary_groups.*.amount' => 'required_with:beneficiary_groups|numeric|min:0',
            'beneficiary_groups.*.notes' => 'nullable|string',
        ]);

        return DB::transaction(function () use ($validated) {
            $validated['created_by'] = auth()->id();
            
            $expense = Expense::create([
                'fiscal_year_id' => $validated['fiscal_year_id'],
                'sub_budget_id' => $validated['sub_budget_id'],
                'expense_category_id' => $validated['expense_category_id'],
                'partner_id' => $validated['partner_id'] ?? null,
                'details' => $validated['details'] ?? null,
                'expense_date' => $validated['expense_date'],
                'amount' => $validated['amount'],
                'payment_method' => $validated['payment_method'],
                'cheque_number' => $validated['cheque_number'] ?? null,
                'receipt_number' => $validated['receipt_number'] ?? null,
                'bank_account_id' => $validated['bank_account_id'] ?? null,
                'remarks' => $validated['remarks'] ?? null,
                'unrelated_to_benef' => $validated['unrelated_to_benef'] ?? false,
                'created_by' => auth()->id(),
            ]);

            // Add individual beneficiaries
            if (!empty($validated['beneficiaries'])) {
                foreach ($validated['beneficiaries'] as $beneficiary) {
                    ExpenseBeneficiary::create([
                        'expense_id' => $expense->id,
                        'beneficiary_type' => $beneficiary['type'],
                        'beneficiary_id' => $beneficiary['id'],
                        'amount' => $beneficiary['amount'],
                        'notes' => $beneficiary['notes'] ?? null,
                    ]);
                }
            }

            // Add beneficiary groups
            if (!empty($validated['beneficiary_groups'])) {
                foreach ($validated['beneficiary_groups'] as $group) {
                    ExpenseBeneficiaryGroup::create([
                        'expense_id' => $expense->id,
                        'group_id' => $group['group_id'],
                        'amount' => $group['amount'],
                        'notes' => $group['notes'] ?? null,
                    ]);
                }
            }

            return response()->json([
                'message' => 'تم إنشاء المصروف بنجاح',
                'data' => $expense->load(['expenseCategory', 'partner', 'beneficiaries', 'beneficiaryGroups'])
            ], 201);
        });
    }

    public function show(Expense $expense): JsonResponse
    {
        $expense->load([
            'fiscalYear',
            'subBudget',
            'expenseCategory',
            'partner',
            'bankAccount',
            'beneficiaries',
            'beneficiaryGroups',
            'createdBy',
            'approvedBy'
        ]);

        return response()->json(['data' => $expense]);
    }

    public function update(Request $request, Expense $expense): JsonResponse
    {
        if ($expense->status === 'Approved') {
            return response()->json([
                'message' => 'لا يمكن تعديل المصاريف المعتمدة'
            ], 403);
        }

        $validated = $request->validate([
            'fiscal_year_id' => 'required|exists:fiscal_years,id',
            'sub_budget_id' => 'required|exists:sub_budgets,id',
            'expense_category_id' => 'required|exists:expense_categories,id',
            'partner_id' => 'nullable|exists:partners,id',
            'details' => 'nullable|string',
            'expense_date' => 'required|date',
            'amount' => 'required|numeric|min:0',
            'payment_method' => 'required|in:Cash,Cheque,BankWire',
            'cheque_number' => 'nullable|string|max:60',
            'receipt_number' => 'nullable|string|max:60',
            'bank_account_id' => 'nullable|exists:bank_accounts,id',
            'remarks' => 'nullable|string',
            'unrelated_to_benef' => 'boolean',
        ]);

        $expense->update($validated);

        return response()->json([
            'message' => 'تم تحديث المصروف بنجاح',
            'data' => $expense->load(['expenseCategory', 'partner'])
        ]);
    }

    public function destroy(Expense $expense): JsonResponse
    {
        if ($expense->status === 'Approved') {
            return response()->json([
                'message' => 'لا يمكن حذف المصاريف المعتمدة'
            ], 403);
        }

        $expense->delete();

        return response()->json([
            'message' => 'تم حذف المصروف بنجاح'
        ]);
    }

    public function approve(Expense $expense): JsonResponse
    {
        if ($expense->status === 'Approved') {
            return response()->json([
                'message' => 'المصروف معتمد مسبقاً'
            ], 400);
        }

        $expense->update([
            'status' => 'Approved',
            'approved_by' => auth()->id(),
            'approved_at' => now(),
        ]);

        return response()->json([
            'message' => 'تم اعتماد المصروف بنجاح',
            'data' => $expense
        ]);
    }
}