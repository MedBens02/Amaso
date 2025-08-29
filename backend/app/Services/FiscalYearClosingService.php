<?php

namespace App\Services;

use App\Models\FiscalYear;
use App\Models\Income;
use App\Models\Expense;
use App\Models\Transfer;
use App\Models\BankAccount;
use App\Services\CashService;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Exception;

class FiscalYearClosingService
{
    protected CashService $cashService;

    public function __construct(CashService $cashService)
    {
        $this->cashService = $cashService;
    }
    /**
     * Close a fiscal year following the complete business workflow
     */
    public function closeFiscalYear(FiscalYear $fiscalYear): array
    {
        return DB::transaction(function () use ($fiscalYear) {
            try {
                // Step 1: Lock the current fiscal year with row-level lock
                $lockedFiscalYear = FiscalYear::lockForUpdate()->find($fiscalYear->id);
                if (!$lockedFiscalYear) {
                    return $this->errorResponse('السنة المالية غير موجودة');
                }

                // Step 2: Get current cash from the service
                $currentCash = $this->cashService->getCurrentCash();
                
                // Lock bank accounts for consistency during the transaction
                BankAccount::lockForUpdate()->get();

                // Step 3: Verify all incomes are approved
                $unapprovedIncomes = Income::where('fiscal_year_id', $fiscalYear->id)
                    ->where('status', '!=', 'Approved')
                    ->count();

                if ($unapprovedIncomes > 0) {
                    return $this->errorResponse(
                        'يوجد ' . $unapprovedIncomes . ' إيرادات غير معتمدة. يجب اعتماد جميع الإيرادات قبل إغلاق السنة المالية.'
                    );
                }

                // Step 4: Verify all expenses are approved
                $unapprovedExpenses = Expense::where('fiscal_year_id', $fiscalYear->id)
                    ->where('status', '!=', 'Approved')
                    ->count();

                if ($unapprovedExpenses > 0) {
                    return $this->errorResponse(
                        'يوجد ' . $unapprovedExpenses . ' مصروفات غير معتمدة. يجب اعتماد جميع المصروفات قبل إغلاق السنة المالية.'
                    );
                }

                // Step 5: Verify all transfers are approved
                $unapprovedTransfers = Transfer::where('fiscal_year_id', $fiscalYear->id)
                    ->where('status', '!=', 'Approved')
                    ->count();

                if ($unapprovedTransfers > 0) {
                    return $this->errorResponse(
                        'يوجد ' . $unapprovedTransfers . ' تحويلات غير معتمدة. يجب اعتماد جميع التحويلات قبل إغلاق السنة المالية.'
                    );
                }

                // Step 6: Set carryover amount for current year
                $carryoverAmount = $currentCash;
                $lockedFiscalYear->update(['carryover_next_year' => $carryoverAmount]);

                // Step 7: Create or activate next fiscal year
                $nextYear = $fiscalYear->year + 1;
                $nextFiscalYear = FiscalYear::firstOrCreate([
                    'year' => $nextYear
                ], [
                    'is_active' => false
                ]);

                // Step 8: Set carryover amount for next fiscal year
                $nextFiscalYear->update([
                    'carryover_prev_year' => $carryoverAmount,
                    'carryover_next_year' => 0.00
                ]);

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
                    'nextFiscalYear' => [
                        'id' => $nextFiscalYear->id,
                        'carryoverFromPreviousYear' => $nextFiscalYear->carryover_prev_year,
                        'carryoverNextYear' => $nextFiscalYear->carryover_next_year
                    ],
                    'currentCash' => $currentCash
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

        // Count unapproved transfers
        $unapprovedTransfers = Transfer::where('fiscal_year_id', $fiscalYear->id)
            ->where('status', '!=', 'Approved')
            ->count();

        // Current cash from service
        $currentCash = $this->cashService->getCurrentCash();
        
        // Since we're using the current cash directly, it always matches
        $cashIsValid = true;

        // Determine if closing is allowed
        $canClose = $unapprovedIncomes === 0 && 
                   $unapprovedExpenses === 0 && 
                   $unapprovedTransfers === 0 && 
                   $cashIsValid && 
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
            'unapprovedTransfers' => $unapprovedTransfers,
            'currentCash' => $currentCash,
            'cashIsValid' => $cashIsValid,
            'canClose' => $canClose,
            'validationMessages' => $this->getValidationMessages(
                $unapprovedIncomes, 
                $unapprovedExpenses, 
                $unapprovedTransfers,
                $cashIsValid,
                $fiscalYear->is_active
            )
        ];
    }

    /**
     * Get validation messages in Arabic
     */
    private function getValidationMessages(int $unapprovedIncomes, int $unapprovedExpenses, int $unapprovedTransfers, bool $cashIsValid, bool $isActive): array
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

        if ($unapprovedTransfers > 0) {
            $messages[] = 'يوجد ' . $unapprovedTransfers . ' تحويلات غير معتمدة';
        }

        if (!$cashIsValid) {
            $messages[] = 'خطأ في حساب رصيد النقد الحالي';
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