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
use App\Http\Controllers\Api\V1\ReferencesController;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

// Health check endpoint
Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'timestamp' => now(),
        'service' => 'Amaso API'
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
    
    // Expenses CRUD + approval
    Route::apiResource('expenses', ExpenseController::class);
    Route::post('expenses/{expense}/approve', [ExpenseController::class, 'approve']);
    
    // Transfers CRUD + approval
    Route::apiResource('transfers', TransferController::class);
    Route::post('transfers/{transfer}/approve', [TransferController::class, 'approve']);
    
    // Lookup data endpoints
    Route::get('fiscal-years', function () {
        return response()->json([
            'data' => \App\Models\FiscalYear::orderBy('year', 'desc')->get()
        ]);
    });
    
    Route::get('bank-accounts', function () {
        return response()->json([
            'data' => \App\Models\BankAccount::orderBy('label')->get()
        ]);
    });
    
    // Removed: kafils endpoint handled by KafilController::index
    
    Route::get('sub-budgets', function () {
        return response()->json([
            'data' => \App\Models\SubBudget::with('budget.fiscalYear')->orderBy('label')->get()
        ]);
    });
    
    Route::get('income-categories', function () {
        return response()->json([
            'data' => \App\Models\IncomeCategory::with('subBudget')->orderBy('label')->get()
        ]);
    });
    
    Route::get('expense-categories', function () {
        return response()->json([
            'data' => \App\Models\ExpenseCategory::with('subBudget')->orderBy('label')->get()
        ]);
    });

    Route::get('orphans-education-levels', function () {
        return response()->json([
            'data' => \App\Models\OrphansEducationLevel::active()->ordered()->get()
        ]);
    });

    // References Management - Skills
    Route::get('references/skills', [ReferencesController::class, 'getSkills']);
    Route::post('references/skills', [ReferencesController::class, 'storeSkill']);
    Route::put('references/skills/{skill}', [ReferencesController::class, 'updateSkill']);
    Route::delete('references/skills/{skill}', [ReferencesController::class, 'destroySkill']);
    
    // References Management - Illnesses
    Route::get('references/illnesses', [ReferencesController::class, 'getIllnesses']);
    Route::post('references/illnesses', [ReferencesController::class, 'storeIllness']);
    Route::put('references/illnesses/{illness}', [ReferencesController::class, 'updateIllness']);
    Route::delete('references/illnesses/{illness}', [ReferencesController::class, 'destroyIllness']);
    
    // References Management - Aid Types
    Route::get('references/aid-types', [ReferencesController::class, 'getAidTypes']);
    Route::post('references/aid-types', [ReferencesController::class, 'storeAidType']);
    Route::put('references/aid-types/{aidType}', [ReferencesController::class, 'updateAidType']);
    Route::delete('references/aid-types/{aidType}', [ReferencesController::class, 'destroyAidType']);
    
    // References Management - Income Categories
    Route::get('references/income-categories', [ReferencesController::class, 'getIncomeCategories']);
    Route::post('references/income-categories', [ReferencesController::class, 'storeIncomeCategory']);
    Route::put('references/income-categories/{category}', [ReferencesController::class, 'updateIncomeCategory']);
    Route::delete('references/income-categories/{category}', [ReferencesController::class, 'destroyIncomeCategory']);
    
    // References Management - Expense Categories
    Route::get('references/expense-categories', [ReferencesController::class, 'getExpenseCategories']);
    Route::post('references/expense-categories', [ReferencesController::class, 'storeExpenseCategory']);
    Route::put('references/expense-categories/{category}', [ReferencesController::class, 'updateExpenseCategory']);
    Route::delete('references/expense-categories/{category}', [ReferencesController::class, 'destroyExpenseCategory']);
    
    // References Management - Partners
    Route::get('references/partners', [ReferencesController::class, 'getPartners']);
    Route::post('references/partners', [ReferencesController::class, 'storePartner']);
    Route::put('references/partners/{partner}', [ReferencesController::class, 'updatePartner']);
    Route::delete('references/partners/{partner}', [ReferencesController::class, 'destroyPartner']);
    
    // References Management - Education Levels (CRUD)
    Route::get('references/education-levels', [ReferencesController::class, 'getEducationLevels']);
    Route::post('references/education-levels', [ReferencesController::class, 'storeEducationLevel']);
    Route::put('references/education-levels/{level}', [ReferencesController::class, 'updateEducationLevel']);
    Route::delete('references/education-levels/{level}', [ReferencesController::class, 'destroyEducationLevel']);
    Route::post('references/education-levels/reorder', [ReferencesController::class, 'reorderEducationLevels']);
    
});