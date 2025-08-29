<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Transfer;
use App\Models\BankAccount;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class TransferController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Transfer::with([
            'fiscalYear',
            'fromAccount',
            'toAccount',
            'createdBy',
            'approvedBy'
        ]);

        // Basic filters
        $query->when($request->fiscal_year_id, function ($query, $fiscalYearId) {
            return $query->where('fiscal_year_id', $fiscalYearId);
        });

        $query->when($request->status, function ($query, $status) {
            return $query->where('status', $status);
        });

        // Date range filtering
        $query->when($request->from_date, function ($query, $fromDate) {
            return $query->whereDate('transfer_date', '>=', $fromDate);
        });

        $query->when($request->to_date, function ($query, $toDate) {
            return $query->whereDate('transfer_date', '<=', $toDate);
        });

        // Month filtering
        $query->when($request->month, function ($query, $month) {
            return $query->whereMonth('transfer_date', $month);
        });

        $query->when($request->year, function ($query, $year) {
            return $query->whereYear('transfer_date', $year);
        });

        // Amount range filtering
        $query->when($request->min_amount, function ($query, $minAmount) {
            return $query->where('amount', '>=', $minAmount);
        });

        $query->when($request->max_amount, function ($query, $maxAmount) {
            return $query->where('amount', '<=', $maxAmount);
        });

        // Account-specific filtering
        $query->when($request->from_account_id, function ($query, $fromAccountId) {
            return $query->where('from_account_id', $fromAccountId);
        });

        $query->when($request->to_account_id, function ($query, $toAccountId) {
            return $query->where('to_account_id', $toAccountId);
        });

        // Search filtering (remarks or account names)
        $query->when($request->search, function ($query, $search) {
            return $query->where(function ($q) use ($search) {
                $q->where('remarks', 'like', "%{$search}%")
                  ->orWhereHas('fromAccount', function ($accountQuery) use ($search) {
                      $accountQuery->where('label', 'like', "%{$search}%")
                                  ->orWhere('bank_name', 'like', "%{$search}%");
                  })
                  ->orWhereHas('toAccount', function ($accountQuery) use ($search) {
                      $accountQuery->where('label', 'like', "%{$search}%")
                                  ->orWhere('bank_name', 'like', "%{$search}%");
                  });
            });
        });

        $transfers = $query->orderBy('transfer_date', 'desc')
            ->paginate($request->per_page ?? 15);

        return response()->json([
            'success' => true,
            'data' => $transfers->items(),
            'meta' => [
                'current_page' => $transfers->currentPage(),
                'last_page' => $transfers->lastPage(),
                'per_page' => $transfers->perPage(),
                'total' => $transfers->total(),
            ]
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'fiscal_year_id' => 'required|exists:fiscal_years,id',
            'transfer_date' => 'required|date',
            'from_account_id' => 'required|exists:bank_accounts,id',
            'to_account_id' => 'required|exists:bank_accounts,id|different:from_account_id',
            'amount' => 'required|numeric|min:0',
            'remarks' => 'nullable|string|max:1000',
        ]);

        $validated['created_by'] = 1; // Mock user ID
        $validated['status'] = 'Draft'; // All new transfers start as Draft
        
        $transfer = Transfer::create($validated);

        return response()->json([
            'message' => 'تم إنشاء التحويل بنجاح. سيتم تحديث الأرصدة عند الاعتماد.',
            'data' => $transfer->load(['fromAccount', 'toAccount'])
        ], 201);
    }

    public function show(Transfer $transfer): JsonResponse
    {
        $transfer->load([
            'fiscalYear',
            'fromAccount',
            'toAccount',
            'createdBy',
            'approvedBy'
        ]);

        return response()->json(['data' => $transfer]);
    }

    public function update(Request $request, Transfer $transfer): JsonResponse
    {
        if ($transfer->status === 'Approved') {
            return response()->json([
                'message' => 'لا يمكن تعديل التحويلات المعتمدة'
            ], 403);
        }

        $validated = $request->validate([
            'fiscal_year_id' => 'required|exists:fiscal_years,id',
            'transfer_date' => 'required|date',
            'from_account_id' => 'required|exists:bank_accounts,id',
            'to_account_id' => 'required|exists:bank_accounts,id|different:from_account_id',
            'amount' => 'required|numeric|min:0',
            'remarks' => 'nullable|string',
        ]);

        $transfer->update($validated);

        return response()->json([
            'message' => 'تم تحديث التحويل بنجاح',
            'data' => $transfer->load(['fromAccount', 'toAccount'])
        ]);
    }

    public function destroy(Transfer $transfer): JsonResponse
    {
        if ($transfer->status === 'Approved') {
            return response()->json([
                'message' => 'لا يمكن حذف التحويلات المعتمدة'
            ], 403);
        }

        $transfer->delete();

        return response()->json([
            'message' => 'تم حذف التحويل بنجاح'
        ]);
    }

    public function approve(Request $request, Transfer $transfer): JsonResponse
    {
        if ($transfer->status === 'Approved') {
            return response()->json([
                'message' => 'التحويل معتمد مسبقاً'
            ], 400);
        }

        $validated = $request->validate([
            'remarks' => 'nullable|string|max:1000'
        ]);

        return DB::transaction(function () use ($transfer, $validated) {
            // Check if source account has sufficient balance
            $fromAccount = BankAccount::findOrFail($transfer->from_account_id);
            if ($fromAccount->balance < $transfer->amount) {
                return response()->json([
                    'message' => 'الرصيد في الحساب المصدر غير كافي لاعتماد التحويل',
                    'errors' => ['balance' => ['الرصيد غير كافي']]
                ], 422);
            }

            // Update account balances
            $fromAccount->decrement('balance', $transfer->amount);
            $toAccount = BankAccount::findOrFail($transfer->to_account_id);
            $toAccount->increment('balance', $transfer->amount);

            // Approve the transfer and update remarks if provided
            $updateData = [
                'status' => 'Approved',
                'approved_by' => 1, // Mock user ID
                'approved_at' => now(),
            ];

            if (isset($validated['remarks'])) {
                $updateData['remarks'] = $validated['remarks'];
            }

            $transfer->update($updateData);

            return response()->json([
                'message' => 'تم اعتماد التحويل وتحديث أرصدة الحسابات بنجاح',
                'data' => $transfer->load(['fromAccount', 'toAccount'])
            ]);
        });
    }
}