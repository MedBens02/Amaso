<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\BankAccount;
use App\Models\BankAccountTransaction;
use App\Models\Expense;
use App\Models\Income;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

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
     * A new account starts where the bank says it does.
     *
     * `balance` is not something the caller sends: it is opening_balance
     * plus every recorded movement, and a brand new account has none. Taking
     * a balance here would let the two disagree from the first day, which is
     * exactly what the reconciliation block on the statement exists to
     * catch.
     */
    public function store(Request $request): JsonResponse
    {
        $data = $this->validateAccount($request);

        $account = BankAccount::create([
            ...$data,
            'balance' => $data['opening_balance'] ?? 0,
        ]);

        return response()->json([
            'message' => 'تم إنشاء الحساب البنكي بنجاح',
            'data' => $account,
        ], 201);
    }

    /**
     * Correcting the details, and - carefully - the starting figure.
     *
     * The invariant is opening_balance + every movement == balance. Editing
     * the opening figure is a legitimate correction ("we typed the starting
     * amount wrong"), but only if the balance moves by the same amount in
     * the same breath; otherwise the account silently stops reconciling and
     * the statement starts accusing the ledger of a drift that was entered
     * here.
     */
    public function update(Request $request, BankAccount $bankAccount): JsonResponse
    {
        $data = $this->validateAccount($request, $bankAccount);

        DB::transaction(function () use ($bankAccount, $data) {
            if (array_key_exists('opening_balance', $data)) {
                $shift = (float) $data['opening_balance'] - (float) $bankAccount->opening_balance;
                $data['balance'] = (float) $bankAccount->balance + $shift;
            }

            $bankAccount->update($data);
        });

        return response()->json([
            'message' => 'تم تحديث الحساب البنكي بنجاح',
            'data' => $bankAccount->fresh(),
        ]);
    }

    /**
     * An account is only removable while nothing points at it.
     *
     * Incomes and expenses keep the account they were settled through, and
     * the ledger is the record of how the balance got where it is - deleting
     * the account would take that with it (the ledger cascades) and leave
     * approved money pointing at nothing. An account that is no longer used
     * is history, not a mistake, so the refusal says what is holding it.
     */
    public function destroy(BankAccount $bankAccount): JsonResponse
    {
        $incomes = Income::where('bank_account_id', $bankAccount->id)->count();
        $expenses = Expense::where('bank_account_id', $bankAccount->id)->count();
        $movements = BankAccountTransaction::where('bank_account_id', $bankAccount->id)->count();

        if ($incomes + $expenses + $movements > 0) {
            $parts = [];
            if ($incomes > 0) $parts[] = "{$incomes} إيراد";
            if ($expenses > 0) $parts[] = "{$expenses} مصروف";
            if ($movements > 0) $parts[] = "{$movements} حركة في السجل";

            return response()->json([
                'message' => "لا يمكن حذف \"{$bankAccount->label}\": مرتبط بـ " . implode(' و', $parts) . '.',
            ], 422);
        }

        // Nothing points at it, so the balance can only be the opening
        // figure somebody typed. Deleting it anyway would drop that amount
        // out of the association's total with nothing recording why - so it
        // has to be written down to zero first, deliberately.
        if (abs((float) $bankAccount->balance) > 0.009) {
            return response()->json([
                'message' => "لا يمكن حذف \"{$bankAccount->label}\": رصيده ليس صفراً. إن كان الحساب مسجلاً بالخطأ، غيّر رصيده الافتتاحي إلى صفر أولاً.",
            ], 422);
        }

        $label = $bankAccount->label;
        $bankAccount->delete();

        return response()->json(['message' => "تم حذف الحساب البنكي \"{$label}\" بنجاح"]);
    }

    private function validateAccount(Request $request, ?BankAccount $current = null): array
    {
        return $request->validate([
            'label' => ['required', 'string', 'max:120', Rule::unique('bank_accounts', 'label')->ignore($current?->id)],
            'bank_name' => ['nullable', 'string', 'max:120'],
            'account_number' => ['nullable', 'string', 'max:60'],
            'opening_balance' => ['nullable', 'numeric'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ], [
            'label.required' => 'اسم الحساب مطلوب',
            'label.unique' => 'يوجد حساب بنكي بهذا الاسم',
            'opening_balance.numeric' => 'الرصيد الافتتاحي يجب أن يكون رقماً',
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
