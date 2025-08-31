<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Expense;
use App\Models\ExpenseBeneficiary;
use App\Models\BeneficiaryGroup;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class ExpenseController extends Controller
{
    /**
     * Display a listing of expenses
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $perPage = $request->get('per_page', 15);
            $page = $request->get('page', 1);
            $search = $request->get('search');

            $query = Expense::with([
                'fiscalYear',
                'subBudget',
                'expenseCategory',
                'partner',
                'bankAccount',
                'beneficiaries.beneficiary',
                'beneficiaryGroups',
                'createdBy',
                'approvedBy'
            ]);

            // Apply filters
            if ($request->filled('fiscal_year_id')) {
                $query->where('fiscal_year_id', $request->fiscal_year_id);
            }

            if ($request->filled('status')) {
                $query->where('status', $request->status);
            }

            if ($request->filled('from_date')) {
                $query->whereDate('expense_date', '>=', $request->from_date);
            }

            if ($request->filled('to_date')) {
                $query->whereDate('expense_date', '<=', $request->to_date);
            }

            if ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('details', 'like', "%{$search}%")
                      ->orWhere('remarks', 'like', "%{$search}%")
                      ->orWhereHas('partner', function ($partnerQuery) use ($search) {
                          $partnerQuery->where('name', 'like', "%{$search}%");
                      })
                      ->orWhereHas('subBudget', function ($budgetQuery) use ($search) {
                          $budgetQuery->where('label', 'like', "%{$search}%");
                      })
                      ->orWhereHas('expenseCategory', function ($categoryQuery) use ($search) {
                          $categoryQuery->where('label', 'like', "%{$search}%");
                      });
                });
            }

            $expenses = $query->orderBy('expense_date', 'desc')
                             ->paginate($perPage, ['*'], 'page', $page);

            return response()->json([
                'data' => $expenses->items(),
                'meta' => [
                    'current_page' => $expenses->currentPage(),
                    'last_page' => $expenses->lastPage(),
                    'per_page' => $expenses->perPage(),
                    'total' => $expenses->total(),
                    'from' => $expenses->firstItem(),
                    'to' => $expenses->lastItem(),
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'خطأ في تحميل المصروفات',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a new expense
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validator = $this->validateExpenseData($request);
            
            if ($validator->fails()) {
                return response()->json([
                    'message' => 'بيانات غير صحيحة',
                    'errors' => $validator->errors()
                ], 422);
            }

            $validatedData = $validator->validated();

            return DB::transaction(function () use ($validatedData, $request) {
                // Create the expense
                $expense = Expense::create([
                    'fiscal_year_id' => $validatedData['fiscal_year_id'],
                    'sub_budget_id' => $validatedData['sub_budget_id'],
                    'expense_category_id' => $validatedData['expense_category_id'],
                    'partner_id' => $validatedData['partner_id'] ?? null,
                    'expense_date' => $validatedData['expense_date'],
                    'amount' => $validatedData['amount'],
                    'payment_method' => $validatedData['payment_method'],
                    'cheque_number' => $validatedData['cheque_number'] ?? null,
                    'receipt_number' => $validatedData['receipt_number'] ?? null,
                    'bank_account_id' => $validatedData['bank_account_id'] ?? null,
                    'details' => $validatedData['details'] ?? null,
                    'remarks' => $validatedData['remarks'] ?? null,
                    'unrelated_to_benef' => $validatedData['unrelated_to_benef'] ?? false,
                    'status' => 'Draft',
                    'created_by' => auth()->id() ?? 1,
                ]);

                // Handle beneficiaries if not unrelated
                if (!($validatedData['unrelated_to_benef'] ?? false)) {
                    $this->processBeneficiaries($expense, $validatedData);
                }

                // Load relationships for response
                $expense->load([
                    'fiscalYear',
                    'subBudget',
                    'expenseCategory',
                    'partner',
                    'bankAccount',
                    'beneficiaries.beneficiary',
                    'createdBy'
                ]);

                return response()->json([
                    'message' => 'تم إنشاء المصروف بنجاح',
                    'data' => $expense
                ], 201);
            });

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'خطأ في إنشاء المصروف',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified expense
     */
    public function show(Expense $expense): JsonResponse
    {
        try {
            $expense->load([
                'fiscalYear',
                'subBudget',
                'expenseCategory',
                'partner',
                'bankAccount',
                'beneficiaries.beneficiary',
                'beneficiaryGroups',
                'createdBy',
                'approvedBy'
            ]);

            return response()->json([
                'data' => $expense
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'خطأ في تحميل المصروف',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update the specified expense
     */
    public function update(Request $request, Expense $expense): JsonResponse
    {
        try {
            if ($expense->status === 'Approved') {
                return response()->json([
                    'message' => 'لا يمكن تعديل المصاريف المعتمدة'
                ], 403);
            }

            $validator = $this->validateExpenseData($request, $expense->id);
            
            if ($validator->fails()) {
                return response()->json([
                    'message' => 'بيانات غير صحيحة',
                    'errors' => $validator->errors()
                ], 422);
            }

            $validatedData = $validator->validated();

            return DB::transaction(function () use ($expense, $validatedData) {
                // Update expense basic data
                $expense->update([
                    'fiscal_year_id' => $validatedData['fiscal_year_id'],
                    'sub_budget_id' => $validatedData['sub_budget_id'],
                    'expense_category_id' => $validatedData['expense_category_id'],
                    'partner_id' => $validatedData['partner_id'] ?? null,
                    'expense_date' => $validatedData['expense_date'],
                    'amount' => $validatedData['amount'],
                    'payment_method' => $validatedData['payment_method'],
                    'cheque_number' => $validatedData['cheque_number'] ?? null,
                    'receipt_number' => $validatedData['receipt_number'] ?? null,
                    'bank_account_id' => $validatedData['bank_account_id'] ?? null,
                    'details' => $validatedData['details'] ?? null,
                    'remarks' => $validatedData['remarks'] ?? null,
                    'unrelated_to_benef' => $validatedData['unrelated_to_benef'] ?? false,
                ]);

                // Clear existing beneficiaries
                $expense->beneficiaries()->delete();

                // Handle beneficiaries if not unrelated
                if (!($validatedData['unrelated_to_benef'] ?? false)) {
                    $this->processBeneficiaries($expense, $validatedData);
                }

                $expense->load([
                    'fiscalYear',
                    'subBudget',
                    'expenseCategory',
                    'partner',
                    'bankAccount',
                    'beneficiaries.beneficiary'
                ]);

                return response()->json([
                    'message' => 'تم تحديث المصروف بنجاح',
                    'data' => $expense
                ]);
            });

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'خطأ في تحديث المصروف',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified expense
     */
    public function destroy(Expense $expense): JsonResponse
    {
        try {
            if ($expense->status === 'Approved') {
                return response()->json([
                    'message' => 'لا يمكن حذف المصاريف المعتمدة'
                ], 403);
            }

            DB::transaction(function () use ($expense) {
                // Delete related beneficiaries first
                $expense->beneficiaries()->delete();
                
                // Delete the expense
                $expense->delete();
            });

            return response()->json([
                'message' => 'تم حذف المصروف بنجاح'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'خطأ في حذف المصروف',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Approve an expense
     */
    public function approve(Expense $expense): JsonResponse
    {
        try {
            if ($expense->status === 'Approved') {
                return response()->json([
                    'message' => 'المصروف معتمد مسبقاً'
                ], 400);
            }

            $expense->update([
                'status' => 'Approved',
                'approved_by' => auth()->id() ?? 1,
                'approved_at' => now(),
            ]);

            return response()->json([
                'message' => 'تم اعتماد المصروف بنجاح',
                'data' => $expense->load(['approvedBy'])
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'خطأ في اعتماد المصروف',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Validate expense data
     */
    private function validateExpenseData(Request $request, $expenseId = null)
    {
        $rules = [
            'fiscal_year_id' => 'required|exists:fiscal_years,id',
            'sub_budget_id' => 'required|exists:sub_budgets,id',
            'expense_category_id' => 'required|exists:expense_categories,id',
            'partner_id' => 'nullable|exists:partners,id',
            'expense_date' => 'required|date',
            'amount' => 'required|numeric|min:0.01',
            'payment_method' => 'required|in:Cash,Cheque,BankWire',
            'cheque_number' => 'nullable|string|max:60',
            'receipt_number' => 'nullable|string|max:60',
            'bank_account_id' => 'nullable|exists:bank_accounts,id',
            'details' => 'nullable|string',
            'remarks' => 'nullable|string',
            'unrelated_to_benef' => 'boolean',
            'beneficiaries' => 'nullable|array',
            'beneficiaries.*.beneficiary_id' => 'required_with:beneficiaries|exists:beneficiaries,id',
            'beneficiaries.*.amount' => 'required_with:beneficiaries|numeric|min:0',
            'beneficiaries.*.notes' => 'nullable|string',
            'beneficiary_groups' => 'nullable|array',
            'beneficiary_groups.*.group_id' => 'required_with:beneficiary_groups|exists:beneficiary_groups,id',
            'beneficiary_groups.*.amount' => 'required_with:beneficiary_groups|numeric|min:0',
            'beneficiary_groups.*.excluded_members' => 'nullable|array',
            'beneficiary_groups.*.excluded_members.*' => 'integer|exists:beneficiaries,id',
            'beneficiary_groups.*.notes' => 'nullable|string',
        ];

        $messages = [
            'fiscal_year_id.required' => 'السنة المالية مطلوبة',
            'fiscal_year_id.exists' => 'السنة المالية غير موجودة',
            'sub_budget_id.required' => 'الميزانية الفرعية مطلوبة',
            'sub_budget_id.exists' => 'الميزانية الفرعية غير موجودة',
            'expense_category_id.required' => 'فئة المصروف مطلوبة',
            'expense_category_id.exists' => 'فئة المصروف غير موجودة',
            'partner_id.exists' => 'الشريك غير موجود',
            'expense_date.required' => 'تاريخ المصروف مطلوب',
            'expense_date.date' => 'تاريخ المصروف غير صحيح',
            'amount.required' => 'المبلغ مطلوب',
            'amount.numeric' => 'المبلغ يجب أن يكون رقماً',
            'amount.min' => 'المبلغ يجب أن يكون أكبر من صفر',
            'payment_method.required' => 'طريقة الدفع مطلوبة',
            'payment_method.in' => 'طريقة الدفع غير صحيحة',
            'bank_account_id.exists' => 'الحساب البنكي غير موجود',
            'beneficiaries.*.beneficiary_id.required_with' => 'معرف المستفيد مطلوب',
            'beneficiaries.*.beneficiary_id.exists' => 'المستفيد غير موجود',
            'beneficiaries.*.amount.required_with' => 'مبلغ المستفيد مطلوب',
            'beneficiaries.*.amount.numeric' => 'مبلغ المستفيد يجب أن يكون رقماً',
            'beneficiaries.*.amount.min' => 'مبلغ المستفيد يجب أن يكون أكبر من أو يساوي صفر',
            'beneficiary_groups.*.group_id.required_with' => 'معرف المجموعة مطلوب',
            'beneficiary_groups.*.group_id.exists' => 'المجموعة غير موجودة',
            'beneficiary_groups.*.amount.required_with' => 'مبلغ المجموعة مطلوب',
            'beneficiary_groups.*.amount.numeric' => 'مبلغ المجموعة يجب أن يكون رقماً',
            'beneficiary_groups.*.amount.min' => 'مبلغ المجموعة يجب أن يكون أكبر من أو يساوي صفر',
            'beneficiary_groups.*.excluded_members.*.integer' => 'معرف العضو المستبعد غير صحيح',
            'beneficiary_groups.*.excluded_members.*.exists' => 'العضو المستبعد غير موجود',
        ];

        $validator = Validator::make($request->all(), $rules, $messages);

        // Custom validation logic
        $validator->after(function ($validator) use ($request) {
            $data = $request->all();
            
            // Payment method specific validations
            if ($data['payment_method'] === 'Cheque' && empty($data['cheque_number'])) {
                $validator->errors()->add('cheque_number', 'رقم الشيك مطلوب عند اختيار الدفع بالشيك');
            }

            if (in_array($data['payment_method'], ['BankWire', 'Cheque']) && empty($data['bank_account_id'])) {
                $validator->errors()->add('bank_account_id', 'الحساب البنكي مطلوب لهذه طريقة الدفع');
            }

            // Beneficiaries validation
            if (!($data['unrelated_to_benef'] ?? false)) {
                $hasBeneficiaries = !empty($data['beneficiaries']);
                $hasGroups = !empty($data['beneficiary_groups']);

                if (!$hasBeneficiaries && !$hasGroups) {
                    $validator->errors()->add('beneficiaries', 'يجب اختيار مستفيدين أو مجموعات مستفيدين إذا كان المصروف مرتبط بالمستفيدين');
                }
            }
        });

        return $validator;
    }

    /**
     * Process beneficiaries and groups
     */
    private function processBeneficiaries(Expense $expense, array $data)
    {
        // Add individual beneficiaries
        if (!empty($data['beneficiaries'])) {
            foreach ($data['beneficiaries'] as $beneficiaryData) {
                ExpenseBeneficiary::create([
                    'expense_id' => $expense->id,
                    'beneficiary_id' => $beneficiaryData['beneficiary_id'],
                    'amount' => $beneficiaryData['amount'],
                    'notes' => $beneficiaryData['notes'] ?? null,
                ]);
            }
        }

        // Add beneficiary groups with excluded members handling
        if (!empty($data['beneficiary_groups'])) {
            foreach ($data['beneficiary_groups'] as $groupData) {
                $group = BeneficiaryGroup::with('beneficiaries')->find($groupData['group_id']);
                
                if ($group) {
                    $excludedMembers = $groupData['excluded_members'] ?? [];
                    $activeMembers = $group->beneficiaries->filter(function ($member) use ($excludedMembers) {
                        return !in_array($member->id, $excludedMembers);
                    });

                    if ($activeMembers->count() > 0) {
                        $amountPerMember = $groupData['amount'] / $activeMembers->count();

                        foreach ($activeMembers as $member) {
                            ExpenseBeneficiary::create([
                                'expense_id' => $expense->id,
                                'beneficiary_id' => $member->id,
                                'group_id' => $group->id,
                                'amount' => $amountPerMember,
                                'notes' => $groupData['notes'] ?? null,
                            ]);
                        }
                    }
                }
            }
        }
    }
}