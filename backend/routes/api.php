<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\V1\DonorController;
use App\Http\Controllers\Api\V1\WidowController;
use App\Http\Controllers\Api\V1\KafilController;
use App\Http\Controllers\Api\V1\IncomeController;
use App\Http\Controllers\Api\V1\ExpenseController;
use App\Http\Controllers\Api\V1\TransferController;

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
    
    // Kafils CRUD
    Route::apiResource('kafils', KafilController::class);
    Route::post('kafils/{kafil}/remove-status', [KafilController::class, 'removeKafilStatus']);
    
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
    
    Route::get('kafils', function () {
        return response()->json([
            'data' => \App\Models\Kafil::orderBy('first_name')->get()
        ]);
    });
    
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

    
});