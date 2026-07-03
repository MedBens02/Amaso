<?php

namespace App\Services;

use App\Exceptions\BusinessRuleException;
use App\Models\BeneficiaryGroup;
use App\Models\Expense;
use App\Models\ExpenseBeneficiary;
use Illuminate\Support\Facades\DB;

class ExpenseService
{
    public function create(array $data): Expense
    {
        return DB::transaction(function () use ($data) {
            $expense = Expense::create([
                ...$this->expenseAttributes($data),
                'status' => 'Draft',
                'created_by' => auth()->id() ?? 1,
            ]);

            if (!($data['unrelated_to_benef'] ?? false)) {
                $this->syncBeneficiaries($expense, $data);
            }

            return $expense;
        });
    }

    public function update(Expense $expense, array $data): Expense
    {
        if ($expense->status === 'Approved') {
            throw new BusinessRuleException('لا يمكن تعديل المصاريف المعتمدة', 403);
        }

        return DB::transaction(function () use ($expense, $data) {
            $expense->update($this->expenseAttributes($data));

            $expense->beneficiaries()->delete();
            if (!($data['unrelated_to_benef'] ?? false)) {
                $this->syncBeneficiaries($expense, $data);
            }

            return $expense;
        });
    }

    public function delete(Expense $expense): void
    {
        if ($expense->status === 'Approved') {
            throw new BusinessRuleException('لا يمكن حذف المصاريف المعتمدة', 403);
        }

        DB::transaction(function () use ($expense) {
            $expense->beneficiaries()->delete();
            $expense->delete();
        });
    }

    /**
     * Approve a draft expense and deduct the amount from the linked bank
     * account, if any.
     *
     * NOTE: the balance update is a read-modify-write without a row lock and
     * without a sufficient-funds check - kept as-is on purpose; the fixes are
     * tracked in FINANCIAL-INTEGRITY.md (issues #1 and #2).
     */
    public function approve(Expense $expense): Expense
    {
        if ($expense->status === 'Approved') {
            throw new BusinessRuleException('المصروف معتمد مسبقاً', 400);
        }

        return DB::transaction(function () use ($expense) {
            $expense->update([
                'status' => 'Approved',
                'approved_by' => auth()->id() ?? 1,
                'approved_at' => now(),
            ]);

            if ($expense->bank_account_id && $expense->bankAccount) {
                $expense->bankAccount->update([
                    'balance' => $expense->bankAccount->balance - $expense->amount,
                ]);
            }

            return $expense;
        });
    }

    private function expenseAttributes(array $data): array
    {
        return [
            'fiscal_year_id' => $data['fiscal_year_id'],
            'sub_budget_id' => $data['sub_budget_id'],
            'expense_category_id' => $data['expense_category_id'],
            'partner_id' => $data['partner_id'] ?? null,
            'expense_date' => $data['expense_date'],
            'amount' => $data['amount'],
            'payment_method' => $data['payment_method'],
            'cheque_number' => $data['cheque_number'] ?? null,
            'receipt_number' => $data['receipt_number'] ?? null,
            'bank_account_id' => $data['bank_account_id'] ?? null,
            'details' => $data['details'] ?? null,
            'remarks' => $data['remarks'] ?? null,
            'unrelated_to_benef' => $data['unrelated_to_benef'] ?? false,
        ];
    }

    /**
     * Attach individual beneficiaries, then expand each beneficiary group
     * into per-member rows, splitting the group amount equally among the
     * non-excluded members.
     */
    private function syncBeneficiaries(Expense $expense, array $data): void
    {
        foreach ($data['beneficiaries'] ?? [] as $beneficiary) {
            ExpenseBeneficiary::create([
                'expense_id' => $expense->id,
                'beneficiary_id' => $beneficiary['beneficiary_id'],
                'amount' => $beneficiary['amount'],
                'notes' => $beneficiary['notes'] ?? null,
            ]);
        }

        foreach ($data['beneficiary_groups'] ?? [] as $groupData) {
            $group = BeneficiaryGroup::with('beneficiaries')->find($groupData['group_id']);
            if (!$group) {
                continue;
            }

            $excluded = $groupData['excluded_members'] ?? [];
            $members = $group->beneficiaries->reject(fn ($member) => in_array($member->id, $excluded));

            if ($members->isEmpty()) {
                continue;
            }

            $amountPerMember = $groupData['amount'] / $members->count();

            foreach ($members as $member) {
                ExpenseBeneficiary::create([
                    'expense_id' => $expense->id,
                    'beneficiary_id' => $member->id,
                    'group_id' => $group->id,
                    'amount' => $amountPerMember,
                    'notes' => $groupData['notes'] ?? null,
                ]);
            }
        }
    }
}
