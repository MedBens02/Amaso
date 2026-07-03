<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\V1\StoreTransferRequest;
use App\Http\Requests\V1\UpdateTransferRequest;
use App\Models\Transfer;
use App\Services\TransferService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TransferController extends Controller
{
    public function __construct(private readonly TransferService $transfers)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $query = Transfer::with([
            'fiscalYear',
            'fromAccount',
            'toAccount',
            'createdBy',
            'approvedBy',
        ])
            ->when($request->fiscal_year_id, fn ($query, $fiscalYearId) => $query->where('fiscal_year_id', $fiscalYearId))
            ->when($request->status, fn ($query, $status) => $query->where('status', $status))
            ->when($request->from_date, fn ($query, $fromDate) => $query->whereDate('transfer_date', '>=', $fromDate))
            ->when($request->to_date, fn ($query, $toDate) => $query->whereDate('transfer_date', '<=', $toDate))
            ->when($request->month, fn ($query, $month) => $query->whereMonth('transfer_date', $month))
            ->when($request->year, fn ($query, $year) => $query->whereYear('transfer_date', $year))
            ->when($request->min_amount, fn ($query, $minAmount) => $query->where('amount', '>=', $minAmount))
            ->when($request->max_amount, fn ($query, $maxAmount) => $query->where('amount', '<=', $maxAmount))
            ->when($request->from_account_id, fn ($query, $fromAccountId) => $query->where('from_account_id', $fromAccountId))
            ->when($request->to_account_id, fn ($query, $toAccountId) => $query->where('to_account_id', $toAccountId));

        $query->when($request->search, function ($query, $search) {
            return $query->where(function ($q) use ($search) {
                $q->where('remarks', 'like', "%{$search}%")
                    ->orWhereHas('fromAccount', function ($account) use ($search) {
                        $account->where('label', 'like', "%{$search}%")
                            ->orWhere('bank_name', 'like', "%{$search}%");
                    })
                    ->orWhereHas('toAccount', function ($account) use ($search) {
                        $account->where('label', 'like', "%{$search}%")
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
            ],
        ]);
    }

    public function store(StoreTransferRequest $request): JsonResponse
    {
        $transfer = Transfer::create([
            ...$request->validated(),
            'status' => 'Draft',
            'created_by' => auth()->id() ?? 1,
        ]);

        return response()->json([
            'message' => 'تم إنشاء التحويل بنجاح. سيتم تحديث الأرصدة عند الاعتماد.',
            'data' => $transfer->load(['fromAccount', 'toAccount']),
        ], 201);
    }

    public function show(Transfer $transfer): JsonResponse
    {
        $transfer->load([
            'fiscalYear',
            'fromAccount',
            'toAccount',
            'createdBy',
            'approvedBy',
        ]);

        return response()->json(['data' => $transfer]);
    }

    public function update(UpdateTransferRequest $request, Transfer $transfer): JsonResponse
    {
        if ($transfer->status === 'Approved') {
            return response()->json([
                'message' => 'لا يمكن تعديل التحويلات المعتمدة',
            ], 403);
        }

        $transfer->update($request->validated());

        return response()->json([
            'message' => 'تم تحديث التحويل بنجاح',
            'data' => $transfer->load(['fromAccount', 'toAccount']),
        ]);
    }

    public function destroy(Transfer $transfer): JsonResponse
    {
        if ($transfer->status === 'Approved') {
            return response()->json([
                'message' => 'لا يمكن حذف التحويلات المعتمدة',
            ], 403);
        }

        $transfer->delete();

        return response()->json([
            'message' => 'تم حذف التحويل بنجاح',
        ]);
    }

    public function approve(Request $request, Transfer $transfer): JsonResponse
    {
        $validated = $request->validate([
            'remarks' => ['nullable', 'string', 'max:1000'],
        ]);

        $transfer = $this->transfers->approve($transfer, $validated['remarks'] ?? null);

        return response()->json([
            'message' => 'تم اعتماد التحويل وتحديث أرصدة الحسابات بنجاح',
            'data' => $transfer->load(['fromAccount', 'toAccount']),
        ]);
    }
}
