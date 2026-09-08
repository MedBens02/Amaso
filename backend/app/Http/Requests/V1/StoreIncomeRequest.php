<?php

namespace App\Http\Requests\V1;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreIncomeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            // Posting into a closed year would change totals whose carryover
            // was already copied into the following year and is never
            // recomputed - the books would stop adding up.
            'fiscal_year_id' => ['required', Rule::exists('fiscal_years', 'id')->where('is_active', true)],
            'sub_budget_id' => ['required', 'exists:sub_budgets,id'],
            'income_category_id' => ['required', 'exists:income_categories,id'],
            'donor_id' => ['nullable', 'exists:donors,id'],
            'kafil_id' => ['nullable', 'exists:kafils,id'],
            // Family this payment is designated for (intent only - see Income::widow).
            'widow_id' => ['nullable', 'exists:widows,id'],
            'income_date' => ['required', 'date'],
            'amount' => ['required', 'numeric', 'min:0'],
            'payment_method' => ['required', 'in:Cash,Cheque,BankWire'],
            'cheque_number' => ['nullable', 'string', 'max:60'],
            'receipt_number' => ['nullable', 'string', 'max:60'],
            'bank_account_id' => ['nullable', 'exists:bank_accounts,id'],
            'remarks' => ['nullable', 'string'],
            'transferred_at' => ['nullable', 'date'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            if ($this->input('payment_method') === 'Cheque' && !$this->filled('cheque_number')) {
                $validator->errors()->add('cheque_number', 'رقم الشيك مطلوب عند اختيار الدفع بالشيك');
            }

            if ($this->input('payment_method') === 'BankWire' && !$this->filled('bank_account_id')) {
                $validator->errors()->add('bank_account_id', 'الحساب البنكي مطلوب لهذه طريقة الدفع');
            }
        });
    }
}
