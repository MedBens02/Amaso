<?php

namespace App\Services;

use App\Models\FiscalYear;
use App\Models\Income;
use App\Models\Expense;
use App\Models\Budget;
use App\Models\BankAccount;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Exception;

class FiscalYearClosingService
{
    /**
     * Close a fiscal year following the complete business workflow
     */
    public function closeFiscalYear(FiscalYear $fiscalYear): array
    {
        return DB::transaction(function () use ($fiscalYear) {
            try {
                // Step 1: Lock the current fiscal year and its budget with row-level locks
                $lockedFiscalYear = FiscalYear::lockForUpdate()->find($fiscalYear->id);
                if (!$lockedFiscalYear) {
                    return $this->errorResponse('السنة المالية غير موجودة');
                }

                $budget = Budget::lockForUpdate()->where('fiscal_year_id', $fiscalYear->id)->first();
                if (!$budget) {
                    return $this->errorResponse('الميزانية غير موجودة لهذه السنة المالية');
                }

                // Step 2: Lock bank accounts and calculate total
                $bankAccounts = BankAccount::lockForUpdate()->get();
                $bankTotal = $bankAccounts->sum('balance');

                // Step 3: Ensure budget current amount equals bank total
                if (abs($budget->current_amount - $bankTotal) > 0.01) {
                    return $this->errorResponse(
                        'المبلغ الحالي للميزانية (' . number_format($budget->current_amount, 2) . ' درهم) ' .
                        'لا يتطابق مع إجمالي أرصدة البنوك (' . number_format($bankTotal, 2) . ' درهم). ' .
                        'يجب أن تتطابق الأرقام قبل إغلاق السنة المالية.'
                    );
                }

                // Step 4: Verify all incomes are approved
                $unapprovedIncomes = Income::where('fiscal_year_id', $fiscalYear->id)
                    ->where('status', '!=', 'Approved')
                    ->count();

                if ($unapprovedIncomes > 0) {
                    return $this->errorResponse(
                        'يوجد ' . $unapprovedIncomes . ' إيرادات غير معتمدة. يجب اعتماد جميع الإيرادات قبل إغلاق السنة المالية.'
                    );
                }

                // Step 5: Verify all expenses are approved
                $unapprovedExpenses = Expense::where('fiscal_year_id', $fiscalYear->id)
                    ->where('status', '!=', 'Approved')
                    ->count();

                if ($unapprovedExpenses > 0) {
                    return $this->errorResponse(
                        'يوجد ' . $unapprovedExpenses . ' مصروفات غير معتمدة. يجب اعتماد جميع المصروفات قبل إغلاق السنة المالية.'
                    );
                }

                // Step 6: Snapshot the carryover for next year
                $carryoverAmount = $budget->current_amount;
                $budget->update(['carryover_next_year' => $carryoverAmount]);

                // Step 7: Create or activate next fiscal year
                $nextYear = $fiscalYear->year + 1;
                $nextFiscalYear = FiscalYear::firstOrCreate([
                    'year' => $nextYear
                ], [
                    'is_active' => false
                ]);

                // Step 8: Create budget for next fiscal year
                $nextBudget = Budget::firstOrCreate([
                    'fiscal_year_id' => $nextFiscalYear->id
                ], [
                    'current_amount' => $carryoverAmount,
                    'carryover_prev_year' => $carryoverAmount,
                    'carryover_next_year' => 0.00
                ]);

                // If budget already existed, update it with correct values
                if ($nextBudget->wasRecentlyCreated === false) {
                    $nextBudget->update([
                        'current_amount' => $carryoverAmount,
                        'carryover_prev_year' => $carryoverAmount
                    ]);
                }

                // Step 9: Flip the active flags
                $lockedFiscalYear->update(['is_active' => false]);
                $nextFiscalYear->update(['is_active' => true]);

                return [
                    'success' => true,
                    'message' => 'تم إغلاق السنة المالية بنجاح',
                    'closedYear' => [
                        'id' => $lockedFiscalYear->id,
                        'year' => $lockedFiscalYear->year,
                        'status' => 'مغلق'
                    ],
                    'carryoverValue' => $carryoverAmount,
                    'nextYear' => [
                        'id' => $nextFiscalYear->id,
                        'year' => $nextFiscalYear->year,
                        'status' => 'مفتوح'
                    ],
                    'nextBudget' => [
                        'id' => $nextBudget->id,
                        'carryoverFromPreviousYear' => $nextBudget->carryover_prev_year,
                        'currentAmount' => $nextBudget->current_amount
                    ],
                    'bankTotal' => $bankTotal
                ];

            } catch (Exception $e) {
                throw $e; // Let transaction handle rollback
            }
        });
    }

    /**
     * Get closing summary for a fiscal year
     */
    public function getClosingSummary(FiscalYear $fiscalYear): array
    {
        // Count unapproved incomes
        $unapprovedIncomes = Income::where('fiscal_year_id', $fiscalYear->id)
            ->where('status', '!=', 'Approved')
            ->count();

        // Count unapproved expenses
        $unapprovedExpenses = Expense::where('fiscal_year_id', $fiscalYear->id)
            ->where('status', '!=', 'Approved')
            ->count();

        // Current sum of bank accounts
        $bankTotal = BankAccount::sum('balance');

        // Current budget's current amount
        $budget = Budget::where('fiscal_year_id', $fiscalYear->id)->first();
        $budgetCurrentAmount = $budget ? $budget->current_amount : 0;

        // Check if budget matches bank total
        $budgetMatchesBank = $budget ? abs($budgetCurrentAmount - $bankTotal) < 0.01 : false;

        // Determine if closing is allowed
        $canClose = $unapprovedIncomes === 0 && 
                   $unapprovedExpenses === 0 && 
                   $budgetMatchesBank && 
                   $fiscalYear->is_active;

        return [
            'success' => true,
            'fiscalYear' => [
                'id' => $fiscalYear->id,
                'year' => $fiscalYear->year,
                'isActive' => $fiscalYear->is_active
            ],
            'unapprovedIncomes' => $unapprovedIncomes,
            'unapprovedExpenses' => $unapprovedExpenses,
            'bankTotal' => $bankTotal,
            'budgetCurrentAmount' => $budgetCurrentAmount,
            'budgetMatchesBank' => $budgetMatchesBank,
            'canClose' => $canClose,
            'validationMessages' => $this->getValidationMessages(
                $unapprovedIncomes, 
                $unapprovedExpenses, 
                $budgetMatchesBank,
                $fiscalYear->is_active
            )
        ];
    }

    /**
     * Get validation messages in Arabic
     */
    private function getValidationMessages(int $unapprovedIncomes, int $unapprovedExpenses, bool $budgetMatchesBank, bool $isActive): array
    {
        $messages = [];

        if (!$isActive) {
            $messages[] = 'السنة المالية غير نشطة';
        }

        if ($unapprovedIncomes > 0) {
            $messages[] = 'يوجد ' . $unapprovedIncomes . ' إيرادات غير معتمدة';
        }

        if ($unapprovedExpenses > 0) {
            $messages[] = 'يوجد ' . $unapprovedExpenses . ' مصروفات غير معتمدة';
        }

        if (!$budgetMatchesBank) {
            $messages[] = 'المبلغ الحالي للميزانية لا يتطابق مع إجمالي أرصدة البنوك';
        }

        if (empty($messages)) {
            $messages[] = 'جميع المتطلبات مستوفاة لإغلاق السنة المالية';
        }

        return $messages;
    }

    /**
     * Helper method to return error response
     */
    private function errorResponse(string $message): array
    {
        return [
            'success' => false,
            'message' => $message
        ];
    }

    /**
     * Legacy methods for backward compatibility
     */
    public function validateClosingRequirements(FiscalYear $fiscalYear): array
    {
        $summary = $this->getClosingSummary($fiscalYear);
        
        return [
            'canClose' => $summary['canClose'],
            'errors' => $summary['canClose'] ? [] : $summary['validationMessages'],
            'success' => $summary['canClose']
        ];
    }

    public function getClosingStatus(FiscalYear $fiscalYear): array
    {
        return $this->getClosingSummary($fiscalYear);
    }

    public function transferIncomeToBank(Income $income, int $bankAccountId): array
    {
        try {
            if ($income->status !== 'Approved') {
                return [
                    'success' => false,
                    'message' => 'يجب اعتماد الإيراد قبل التحويل'
                ];
            }

            if (!in_array($income->payment_method, ['Cash', 'Cheque'])) {
                return [
                    'success' => false,
                    'message' => 'يمكن تحويل الإيرادات النقدية وإيرادات الشيكات فقط'
                ];
            }

            if ($income->transferred_at) {
                return [
                    'success' => false,
                    'message' => 'تم تحويل هذا الإيراد مسبقاً'
                ];
            }

            $bankAccount = BankAccount::find($bankAccountId);
            if (!$bankAccount) {
                return [
                    'success' => false,
                    'message' => 'الحساب المصرفي غير موجود'
                ];
            }

            DB::beginTransaction();

            // Update income with transfer details
            $income->update([
                'bank_account_id' => $bankAccountId,
                'transferred_at' => now()
            ]);

            // Update bank account balance
            $bankAccount->increment('balance', $income->amount);

            DB::commit();

            return [
                'success' => true,
                'message' => 'تم تحويل الإيراد بنجاح',
                'transferredAmount' => $income->amount,
                'bankAccount' => $bankAccount->label
            ];

        } catch (Exception $e) {
            DB::rollBack();
            
            return [
                'success' => false,
                'message' => 'خطأ في تحويل الإيراد: ' . $e->getMessage()
            ];
        }
    }

    public function getUntransferredIncomes(FiscalYear $fiscalYear): Collection
    {
        return Income::where('fiscal_year_id', $fiscalYear->id)
            ->where('status', 'Approved')
            ->whereIn('payment_method', ['Cash', 'Cheque'])
            ->whereNull('transferred_at')
            ->with(['incomeCategory', 'donor', 'kafil'])
            ->get();
    }
}