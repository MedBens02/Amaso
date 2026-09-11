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

                // Closing an already-closed year would overwrite a carryover
                // the following year has already been opened with, and flip
                // the active flag onto a year that was closed long ago.
                if (!$lockedFiscalYear->is_active) {
                    return $this->errorResponse(
                        'السنة المالية ' . $lockedFiscalYear->year . ' مغلقة مسبقاً.'
                    );
                }

                // Lock the accounts *before* reading their total: the carryover
                // is that total, and an approval landing between the read and
                // the lock would carry a number forward that was never true.
                BankAccount::lockForUpdate()->get();

                $currentCash = $this->cashService->getCurrentCash();

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

                // The carryover is SUM(bank balances), so approved cash and
                // cheques that were never deposited are in no balance at all
                // and would simply disappear from the books at closing.
                $untransferredCash = $this->getUntransferredIncomes($fiscalYear)->count();

                if ($untransferredCash > 0) {
                    return $this->errorResponse(
                        'يوجد ' . $untransferredCash . ' إيرادات نقدية/شيكات معتمدة لم يتم تحويلها إلى البنك. '
                        . 'يجب تحويلها أولاً وإلا لن تُحتسب ضمن رصيد ترحيل السنة المالية.'
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

        // Approved cash/cheque income still sitting outside any bank account.
        // The carryover is SUM(bank balances), so these would vanish at closing.
        $untransferredCash = $this->getUntransferredIncomes($fiscalYear)->count();

        // Current cash from service
        $currentCash = $this->cashService->getCurrentCash();

        // Since we're using the current cash directly, it always matches
        $cashIsValid = true;

        // Determine if closing is allowed
        $canClose = $unapprovedIncomes === 0 &&
                   $unapprovedExpenses === 0 &&
                   $unapprovedTransfers === 0 &&
                   $untransferredCash === 0 &&
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
            'untransferredCash' => $untransferredCash,
            'currentCash' => $currentCash,
            'cashIsValid' => $cashIsValid,
            'canClose' => $canClose,
            'validationMessages' => $this->getValidationMessages(
                $unapprovedIncomes,
                $unapprovedExpenses,
                $unapprovedTransfers,
                $untransferredCash,
                $cashIsValid,
                $fiscalYear->is_active
            )
        ];
    }

    /**
     * Get validation messages in Arabic
     */
    private function getValidationMessages(int $unapprovedIncomes, int $unapprovedExpenses, int $unapprovedTransfers, int $untransferredCash, bool $cashIsValid, bool $isActive): array
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

        if ($untransferredCash > 0) {
            $messages[] = 'يوجد ' . $untransferredCash . ' إيرادات نقدية/شيكات معتمدة لم تُحوَّل إلى البنك (لن تُحتسب في الترحيل)';
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