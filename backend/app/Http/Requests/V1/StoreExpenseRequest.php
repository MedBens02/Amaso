<?php

namespace App\Http\Requests\V1;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class StoreExpenseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'fiscal_year_id' => ['required', 'exists:fiscal_years,id'],
            'sub_budget_id' => ['required', 'exists:sub_budgets,id'],
            'expense_category_id' => ['required', 'exists:expense_categories,id'],
            'partner_id' => ['nullable', 'exists:partners,id'],
            'expense_date' => ['required', 'date'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'payment_method' => ['required', 'in:Cash,Cheque,BankWire'],
            'cheque_number' => ['nullable', 'string', 'max:60'],
            'receipt_number' => ['nullable', 'string', 'max:60'],
            'bank_account_id' => ['nullable', 'exists:bank_accounts,id'],
            'details' => ['nullable', 'string'],
            'remarks' => ['nullable', 'string'],
            'unrelated_to_benef' => ['boolean'],
            'beneficiaries' => ['nullable', 'array'],
            'beneficiaries.*.beneficiary_id' => ['required_with:beneficiaries', 'exists:beneficiaries,id'],
            'beneficiaries.*.amount' => ['required_with:beneficiaries', 'numeric', 'min:0'],
            'beneficiaries.*.notes' => ['nullable', 'string'],
            'beneficiary_groups' => ['nullable', 'array'],
            'beneficiary_groups.*.group_id' => ['required_with:beneficiary_groups', 'exists:beneficiary_groups,id'],
            'beneficiary_groups.*.amount' => ['required_with:beneficiary_groups', 'numeric', 'min:0'],
            'beneficiary_groups.*.excluded_members' => ['nullable', 'array'],
            'beneficiary_groups.*.excluded_members.*' => ['integer', 'exists:beneficiaries,id'],
            'beneficiary_groups.*.notes' => ['nullable', 'string'],
        ];
    }

    public function messages(): array
    {
        return [
            'fiscal_year_id.required' => 'السنة المالية مطلوبة',
            'fiscal_year_id.exists' => 'السنة المالية غير موجودة',
            'sub_budget_id.required' => 'الميزانية الفرعية مطلوبة',
            'sub_budget_id.exists' => 'الميزانية الفرعية غير موجودة',
            'expense_category_id.required' => 'فئة المصروف مطلوبة',
            'expense_category_id.exists' => 'فئة المصروف غير موجودة',
            'partner_id.exists' => 'الشريك غير موجود',
            'expense_date.required' => 'تاريخ المصروف مطلوب',
            'expense_date.date' => 'تاريخ المصروف غير صحيح',
            'amount.required' => 'المبلغ مطلوب',
            'amount.numeric' => 'المبلغ يجب أن يكون رقماً',
            'amount.min' => 'المبلغ يجب أن يكون أكبر من صفر',
            'payment_method.required' => 'طريقة الدفع مطلوبة',
            'payment_method.in' => 'طريقة الدفع غير صحيحة',
            'bank_account_id.exists' => 'الحساب البنكي غير موجود',
            'beneficiaries.*.beneficiary_id.required_with' => 'معرف المستفيد مطلوب',
            'beneficiaries.*.beneficiary_id.exists' => 'المستفيد غير موجود',
            'beneficiaries.*.amount.required_with' => 'مبلغ المستفيد مطلوب',
            'beneficiaries.*.amount.numeric' => 'مبلغ المستفيد يجب أن يكون رقماً',
            'beneficiaries.*.amount.min' => 'مبلغ المستفيد يجب أن يكون أكبر من أو يساوي صفر',
            'beneficiary_groups.*.group_id.required_with' => 'معرف المجموعة مطلوب',
            'beneficiary_groups.*.group_id.exists' => 'المجموعة غير موجودة',
            'beneficiary_groups.*.amount.required_with' => 'مبلغ المجموعة مطلوب',
            'beneficiary_groups.*.amount.numeric' => 'مبلغ المجموعة يجب أن يكون رقماً',
            'beneficiary_groups.*.amount.min' => 'مبلغ المجموعة يجب أن يكون أكبر من أو يساوي صفر',
            'beneficiary_groups.*.excluded_members.*.integer' => 'معرف العضو المستبعد غير صحيح',
            'beneficiary_groups.*.excluded_members.*.exists' => 'العضو المستبعد غير موجود',
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            if ($this->input('payment_method') === 'Cheque' && !$this->filled('cheque_number')) {
                $validator->errors()->add('cheque_number', 'رقم الشيك مطلوب عند اختيار الدفع بالشيك');
            }

            if (in_array($this->input('payment_method'), ['BankWire', 'Cheque']) && !$this->filled('bank_account_id')) {
                $validator->errors()->add('bank_account_id', 'الحساب البنكي مطلوب لهذه طريقة الدفع');
            }

            if (!$this->boolean('unrelated_to_benef')) {
                $hasBeneficiaries = !empty($this->input('beneficiaries'));
                $hasGroups = !empty($this->input('beneficiary_groups'));

                if (!$hasBeneficiaries && !$hasGroups) {
                    $validator->errors()->add('beneficiaries', 'يجب اختيار مستفيدين أو مجموعات مستفيدين إذا كان المصروف مرتبط بالمستفيدين');
                }
            }
        });
    }
}
