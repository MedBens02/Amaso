<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\FiscalYear;
use App\Models\Income;
use App\Models\Expense;
use App\Services\FiscalYearClosingService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class FiscalYearController extends Controller
{
    protected FiscalYearClosingService $closingService;

    public function __construct(FiscalYearClosingService $closingService)
    {
        $this->closingService = $closingService;
    }

    /**
     * Get all fiscal years with budget information
     */
    public function index(): JsonResponse
    {
        $fiscalYears = FiscalYear::with('budget')
            ->orderBy('year', 'desc')
            ->get()
            ->map(function ($fiscalYear) {
                // Calculate totals for this fiscal year
                $totalIncomes = Income::where('fiscal_year_id', $fiscalYear->id)
                    ->where('status', 'Approved')
                    ->sum('amount');
                
                $totalExpenses = Expense::where('fiscal_year_id', $fiscalYear->id)
                    ->where('status', 'Approved')
                    ->sum('amount');

                $budget = $fiscalYear->budget;
                $totalBudget = $budget ? $budget->current_amount + $budget->carryover_prev_year : 0;
                
                return [
                    'id' => $fiscalYear->id,
                    'year' => (string)$fiscalYear->year,
                    'status' => $fiscalYear->is_active ? 'مفتوح' : 'مغلق',
                    'startDate' => $fiscalYear->year . '-01-01',
                    'endDate' => $fiscalYear->year . '-12-31',
                    'totalBudget' => (float)$totalBudget,
                    'totalIncomes' => (float)$totalIncomes,
                    'totalSpent' => (float)$totalExpenses,
                    'carryOver' => $budget ? (float)$budget->carryover_prev_year : 0,
                    'carryoverNextYear' => $budget ? (float)$budget->carryover_next_year : 0,
                    'remaining' => (float)($totalBudget - $totalExpenses),
                    'isActive' => $fiscalYear->is_active,
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $fiscalYears
        ]);
    }

    /**
     * Get fiscal year closing status
     */
    public function getClosingStatus(FiscalYear $fiscalYear): JsonResponse
    {
        $status = $this->closingService->getClosingStatus($fiscalYear);
        
        return response()->json([
            'success' => true,
            'data' => $status
        ]);
    }

    /**
     * Close a fiscal year - Admin only operation
     */
    public function closeFiscalYear(FiscalYear $fiscalYear): JsonResponse
    {
        // Basic authorization check - in production, implement proper role-based auth
        if (!$this->canCloseFiscalYear()) {
            return response()->json([
                'success' => false,
                'message' => 'غير مخول لإغلاق السنة المالية. هذه العملية مقتصرة على المديرين فقط.'
            ], 403);
        }
        
        if (!$fiscalYear->is_active) {
            return response()->json([
                'success' => false,
                'message' => 'لا يمكن إغلاق سنة مالية غير نشطة'
            ], 400);
        }

        try {
            $result = $this->closingService->closeFiscalYear($fiscalYear);
            return response()->json($result, $result['success'] ? 200 : 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'خطأ في إغلاق السنة المالية: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Basic authorization check for fiscal year closing
     * In production, replace with proper role-based authorization
     */
    private function canCloseFiscalYear(): bool
    {
        // For now, allow all users - in production implement proper auth
        // Example: return auth()->user()?->hasRole('admin') ?? false;
        return true;
    }

    /**
     * Get fiscal year closing summary
     */
    public function getClosingSummary(FiscalYear $fiscalYear): JsonResponse
    {
        $summary = $this->closingService->getClosingSummary($fiscalYear);
        
        return response()->json([
            'success' => true,
            'data' => $summary
        ]);
    }

    /**
     * Transfer income to bank account
     */
    public function transferIncome(Request $request, Income $income): JsonResponse
    {
        $request->validate([
            'bank_account_id' => 'required|exists:bank_accounts,id'
        ]);

        $result = $this->closingService->transferIncomeToBank(
            $income,
            $request->bank_account_id
        );

        return response()->json($result, $result['success'] ? 200 : 400);
    }

    /**
     * Get untransferred incomes for a fiscal year
     */
    public function getUntransferredIncomes(FiscalYear $fiscalYear): JsonResponse
    {
        $incomes = $this->closingService->getUntransferredIncomes($fiscalYear);
        
        return response()->json([
            'success' => true,
            'data' => $incomes
        ]);
    }
}