<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\V1\DonorController;
use App\Http\Controllers\Api\V1\WidowController;
use App\Http\Controllers\Api\V1\KafilController;
use App\Http\Controllers\Api\V1\OrphanController;
use App\Http\Controllers\Api\V1\IncomeController;
use App\Http\Controllers\Api\V1\ExpenseController;
use App\Http\Controllers\Api\V1\TransferController;
use App\Http\Controllers\Api\V1\FiscalYearController;
use App\Http\Controllers\Api\V1\BeneficiaryGroupController;
use App\Http\Controllers\Api\V1\References;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

// Health check endpoint
Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'timestamp' => now(),
        'service' => 'Amaso API',
    ]);
});

// API v1 routes
Route::prefix('v1')->group(function () {

    // Donors CRUD
    Route::apiResource('donors', DonorController::class);

    // Widows CRUD
    Route::apiResource('widows', WidowController::class);
    Route::get('widows-reference-data', [WidowController::class, 'getReferenceData']);

    // Orphans CRUD (read-only, managed through widows)
    Route::get('orphans', [OrphanController::class, 'index']);
    Route::get('orphans/{orphan}', [OrphanController::class, 'show']);
    Route::post('orphans', [OrphanController::class, 'store']); // Returns error message
    Route::put('orphans/{orphan}', [OrphanController::class, 'update']); // Returns error message
    Route::delete('orphans/{orphan}', [OrphanController::class, 'destroy']); // Returns error message

    // Kafils CRUD
    Route::apiResource('kafils', KafilController::class);
    Route::post('kafils/{kafil}/remove-status', [KafilController::class, 'removeKafilStatus']);
    Route::get('kafils-for-sponsorship', [KafilController::class, 'getKafilsForSponsorship']);
    Route::post('sponsorships', [KafilController::class, 'createSponsorship']);

    // Incomes CRUD + approval
    Route::apiResource('incomes', IncomeController::class);
    Route::post('incomes/{income}/approve', [IncomeController::class, 'approve']);
    Route::post('incomes/{income}/transfer-to-bank', [IncomeController::class, 'transferToBank']);

    // Expenses CRUD + approval
    Route::apiResource('expenses', ExpenseController::class);
    Route::post('expenses/{expense}/approve', [ExpenseController::class, 'approve']);

    // Transfers CRUD + approval
    Route::apiResource('transfers', TransferController::class);
    Route::post('transfers/{transfer}/approve', [TransferController::class, 'approve']);

    // Beneficiary Groups CRUD + member management
    Route::apiResource('beneficiary-groups', BeneficiaryGroupController::class);
    Route::get('beneficiary-groups/{beneficiaryGroup}/members', [BeneficiaryGroupController::class, 'getMembers']);
    Route::post('beneficiary-groups/{beneficiaryGroup}/members', [BeneficiaryGroupController::class, 'addMembers']);
    Route::delete('beneficiary-groups/{beneficiaryGroup}/members/{beneficiary}', [BeneficiaryGroupController::class, 'removeMember']);
    Route::get('beneficiaries', [BeneficiaryGroupController::class, 'getBeneficiaries']);

    // Lookup data endpoints
    Route::get('bank-accounts', function () {
        return response()->json([
            'data' => \App\Models\BankAccount::orderBy('label')->get(),
        ]);
    });

    Route::get('sub-budgets', function () {
        return response()->json([
            'data' => \App\Models\SubBudget::orderBy('label')->get(),
        ]);
    });

    Route::get('income-categories', function () {
        return response()->json([
            'data' => \App\Models\IncomeCategory::with('subBudget')
                ->where('id', '!=', \App\Models\IncomeCategory::DELETED_CATEGORY_ID)
                ->orderBy('label')
                ->get(),
        ]);
    });

    Route::get('expense-categories', function () {
        return response()->json([
            'data' => \App\Models\ExpenseCategory::with('subBudget')
                ->where('id', '!=', \App\Models\ExpenseCategory::DELETED_CATEGORY_ID)
                ->orderBy('label')
                ->get(),
        ]);
    });

    Route::get('orphans-education-levels', function () {
        return response()->json([
            'data' => \App\Models\OrphansEducationLevel::active()->ordered()->get(),
        ]);
    });

    // References Management
    Route::prefix('references')->group(function () {
        // Skills
        Route::get('skills', [References\SkillController::class, 'index']);
        Route::post('skills', [References\SkillController::class, 'store']);
        Route::put('skills/{skill}', [References\SkillController::class, 'update']);
        Route::delete('skills/{skill}', [References\SkillController::class, 'destroy']);

        // Illnesses
        Route::get('illnesses', [References\IllnessController::class, 'index']);
        Route::post('illnesses', [References\IllnessController::class, 'store']);
        Route::put('illnesses/{illness}', [References\IllnessController::class, 'update']);
        Route::delete('illnesses/{illness}', [References\IllnessController::class, 'destroy']);

        // Aid Types
        Route::get('aid-types', [References\AidTypeController::class, 'index']);
        Route::post('aid-types', [References\AidTypeController::class, 'store']);
        Route::put('aid-types/{aidType}', [References\AidTypeController::class, 'update']);
        Route::delete('aid-types/{aidType}', [References\AidTypeController::class, 'destroy']);

        // Income Categories (Accounting)
        Route::get('income-categories', [References\AccountingIncomeCategoryController::class, 'index']);
        Route::post('income-categories', [References\AccountingIncomeCategoryController::class, 'store']);
        Route::put('income-categories/{category}', [References\AccountingIncomeCategoryController::class, 'update']);
        Route::get('income-categories/{category}/related-count', [References\AccountingIncomeCategoryController::class, 'relatedCount']);
        Route::delete('income-categories/{category}', [References\AccountingIncomeCategoryController::class, 'destroy']);

        // Expense Categories (Accounting)
        Route::get('expense-categories', [References\AccountingExpenseCategoryController::class, 'index']);
        Route::post('expense-categories', [References\AccountingExpenseCategoryController::class, 'store']);
        Route::put('expense-categories/{category}', [References\AccountingExpenseCategoryController::class, 'update']);
        Route::get('expense-categories/{category}/related-count', [References\AccountingExpenseCategoryController::class, 'relatedCount']);
        Route::delete('expense-categories/{category}', [References\AccountingExpenseCategoryController::class, 'destroy']);

        // Partner Fields
        Route::get('partner-fields', [References\PartnerFieldController::class, 'index']);
        Route::post('partner-fields', [References\PartnerFieldController::class, 'store']);
        Route::put('partner-fields/{field}', [References\PartnerFieldController::class, 'update']);
        Route::delete('partner-fields/{field}', [References\PartnerFieldController::class, 'destroy']);

        // Partner Subfields
        Route::get('partner-subfields', [References\PartnerSubfieldController::class, 'index']);
        Route::post('partner-subfields', [References\PartnerSubfieldController::class, 'store']);
        Route::put('partner-subfields/{subfield}', [References\PartnerSubfieldController::class, 'update']);
        Route::delete('partner-subfields/{subfield}', [References\PartnerSubfieldController::class, 'destroy']);

        // Partners
        Route::get('partners', [References\PartnerController::class, 'index']);
        Route::post('partners', [References\PartnerController::class, 'store']);
        Route::put('partners/{partner}', [References\PartnerController::class, 'update']);
        Route::delete('partners/{partner}', [References\PartnerController::class, 'destroy']);

        // Education Levels
        Route::get('education-levels', [References\EducationLevelController::class, 'index']);
        Route::post('education-levels', [References\EducationLevelController::class, 'store']);
        Route::put('education-levels/{level}', [References\EducationLevelController::class, 'update']);
        Route::delete('education-levels/{level}', [References\EducationLevelController::class, 'destroy']);
        Route::post('education-levels/reorder', [References\EducationLevelController::class, 'reorder']);

        // Sub-Budgets
        Route::get('sub-budgets', [References\SubBudgetController::class, 'index']);
        Route::post('sub-budgets', [References\SubBudgetController::class, 'store']);
        Route::put('sub-budgets/{subBudget}', [References\SubBudgetController::class, 'update']);
        Route::delete('sub-budgets/{subBudget}', [References\SubBudgetController::class, 'destroy']);

        // Widow Income Categories
        Route::get('widow-income-categories', [References\WidowIncomeCategoryController::class, 'index']);
        Route::post('widow-income-categories', [References\WidowIncomeCategoryController::class, 'store']);
        Route::put('widow-income-categories/{category}', [References\WidowIncomeCategoryController::class, 'update']);
        Route::delete('widow-income-categories/{category}', [References\WidowIncomeCategoryController::class, 'destroy']);

        // Widow Expense Categories
        Route::get('widow-expense-categories', [References\WidowExpenseCategoryController::class, 'index']);
        Route::post('widow-expense-categories', [References\WidowExpenseCategoryController::class, 'store']);
        Route::put('widow-expense-categories/{category}', [References\WidowExpenseCategoryController::class, 'update']);
        Route::delete('widow-expense-categories/{category}', [References\WidowExpenseCategoryController::class, 'destroy']);
    });

    // Fiscal Year Management
    Route::get('fiscal-years', [FiscalYearController::class, 'index']);
    Route::get('fiscal-years/{fiscalYear}/closing-status', [FiscalYearController::class, 'getClosingStatus']);
    Route::get('fiscal-years/{fiscalYear}/closing-summary', [FiscalYearController::class, 'getClosingSummary']);
    Route::post('fiscal-years/{fiscalYear}/close', [FiscalYearController::class, 'closeFiscalYear']);
    Route::get('fiscal-years/{fiscalYear}/untransferred-incomes', [FiscalYearController::class, 'getUntransferredIncomes']);
    Route::post('incomes/{income}/transfer', [FiscalYearController::class, 'transferIncome']);

});
