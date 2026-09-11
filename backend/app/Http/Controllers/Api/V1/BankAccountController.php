<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\BankAccount;
use App\Models\BankAccountTransaction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BankAccountController extends Controller
{
    /** Arabic for each kind of movement, so a statement reads as one. */
    private const SOURCE_LABELS = [
        BankAccountTransaction::SOURCE_INCOME => 'إيراد بحوالة بنكية',
        BankAccountTransaction::SOURCE_INCOME_DEPOSIT => 'إيداع إيراد نقدي/شيك',
        BankAccountTransaction::SOURCE_EXPENSE => 'مصروف',
        BankAccountTransaction::SOURCE_TRANSFER_OUT => 'تحويل صادر',
        BankAccountTransaction::SOURCE_TRANSFER_IN => 'تحويل وارد',
    ];

    public function index(): JsonResponse
    {
        return response()->json([
            'data' => BankAccount::orderBy('label')->get(),
        ]);
    }

    /**
     * Every movement on one account, newest first, and whether they add up.
     *
     * The ledger has recorded each change since the app was first used, but
     * nothing ever read it back - so the association could see that an
     * account holds 38,900 and had no way to find out why, or to check it
     * against the bank's own statement. That is what this is for.
     *
     * The reconciliation block is the point of the opening balance: opening
     * plus every recorded movement must equal the stored balance. If it ever
     * does not, something wrote to `balance` outside the ledger, and the
     * screen says so rather than quietly showing a total nobody can trace.
     */
    public function statement(Request $request, BankAccount $bankAccount): JsonResponse
    {
        $filters = $request->validate([
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date'],
            'source_type' => ['nullable', 'string', 'in:' . implode(',', array_keys(self::SOURCE_LABELS))],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:200'],
        ]);

        $query = BankAccountTransaction::with('createdBy:id,name')
            ->where('bank_account_id', $bankAccount->id)
            ->when($filters['from'] ?? null, fn ($q, $from) => $q->whereDate('created_at', '>=', $from))
            ->when($filters['to'] ?? null, fn ($q, $to) => $q->whereDate('created_at', '<=', $to))
            ->when($filters['source_type'] ?? null, fn ($q, $type) => $q->where('source_type', $type));

        $rows = (clone $query)->orderByDesc('id')->paginate($filters['per_page'] ?? 50);

        // Over the whole account, not the filtered page: this is the check
        // that the balance is explained, and a date filter cannot be allowed
        // to make it look like it is when it is not.
        $recorded = (float) BankAccountTransaction::where('bank_account_id', $bankAccount->id)->sum('amount');
        $expected = (float) $bankAccount->opening_balance + $recorded;

        return response()->json([
            'data' => [
                'account' => [
                    'id' => $bankAccount->id,
                    'label' => $bankAccount->label,
                    'bank_name' => $bankAccount->bank_name,
                    'account_number' => $bankAccount->account_number,
                    'opening_balance' => round((float) $bankAccount->opening_balance, 2),
                    'balance' => round((float) $bankAccount->balance, 2),
                ],
                'reconciliation' => [
                    'opening_balance' => round((float) $bankAccount->opening_balance, 2),
                    'recorded_movements' => round($recorded, 2),
                    'expected_balance' => round($expected, 2),
                    'stored_balance' => round((float) $bankAccount->balance, 2),
                    // A hundredth of a dirham of float noise is not a problem
                    // worth alarming anyone about; anything larger is.
                    'balanced' => abs($expected - (float) $bankAccount->balance) < 0.005,
                ],
                'totals' => [
                    'credits' => round((float) (clone $query)->where('amount', '>', 0)->sum('amount'), 2),
                    'debits' => round((float) (clone $query)->where('amount', '<', 0)->sum('amount'), 2),
                ],
                'transactions' => $rows->getCollection()->map(fn ($row) => [
                    'id' => $row->id,
                    'date' => $row->created_at?->toDateString(),
                    'source_type' => $row->source_type,
                    'source_label' => self::SOURCE_LABELS[$row->source_type] ?? $row->source_type,
                    'source_id' => $row->source_id,
                    'description' => $row->description,
                    'amount' => round((float) $row->amount, 2),
                    'balance_after' => round((float) $row->balance_after, 2),
                    'created_by' => $row->createdBy?->name,
                ])->all(),
            ],
            'meta' => [
                'current_page' => $rows->currentPage(),
                'last_page' => $rows->lastPage(),
                'per_page' => $rows->perPage(),
                'total' => $rows->total(),
            ],
        ]);
    }
}
