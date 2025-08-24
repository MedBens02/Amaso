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
        $transfers = Transfer::with([
            'fiscalYear',
            'fromAccount',
            'toAccount',
            'createdBy',
            'approvedBy'
        ])
            ->when($request->fiscal_year_id, function ($query, $fiscalYearId) {
                return $query->where('fiscal_year_id', $fiscalYearId);
            })
            ->when($request->status, function ($query, $status) {
                return $query->where('status', $status);
            })
            ->when($request->from_date, function ($query, $fromDate) {
                return $query->whereDate('transfer_date', '>=', $fromDate);
            })
            ->when($request->to_date, function ($query, $toDate) {
                return $query->whereDate('transfer_date', '<=', $toDate);
            })
            ->orderBy('transfer_date', 'desc')
            ->paginate($request->per_page ?? 15);

        return response()->json([
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
            'remarks' => 'nullable|string',
        ]);

        return DB::transaction(function () use ($validated) {
            // Check if source account has sufficient balance
            $fromAccount = BankAccount::findOrFail($validated['from_account_id']);
            if ($fromAccount->balance < $validated['amount']) {
                return response()->json([
                    'message' => 'الرصيد في الحساب المصدر غير كافي',
                    'errors' => ['amount' => ['الرصيد غير كافي']]
                ], 422);
            }

            $validated['created_by'] = auth()->id();
            $transfer = Transfer::create($validated);

            return response()->json([
                'message' => 'تم إنشاء التحويل بنجاح',
                'data' => $transfer->load(['fromAccount', 'toAccount'])
            ], 201);
        });
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

    public function approve(Transfer $transfer): JsonResponse
    {
        if ($transfer->status === 'Approved') {
            return response()->json([
                'message' => 'التحويل معتمد مسبقاً'
            ], 400);
        }

        return DB::transaction(function () use ($transfer) {
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

            // Approve the transfer
            $transfer->update([
                'status' => 'Approved',
                'approved_by' => auth()->id(),
                'approved_at' => now(),
            ]);

            return response()->json([
                'message' => 'تم اعتماد التحويل وتحديث أرصدة الحسابات بنجاح',
                'data' => $transfer->load(['fromAccount', 'toAccount'])
            ]);
        });
    }
}