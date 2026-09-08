<?php

namespace App\Http\Requests\V1;

use App\Models\KafalaChamilaSplit;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class StoreKafalaChamilaIncomeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'kafil_id' => ['required', 'exists:kafils,id'],
            // Family this kafala is designated for (intent only - see Income::widow).
            'widow_id' => ['nullable', 'exists:widows,id'],
            'fiscal_year_id' => ['required', 'exists:fiscal_years,id'],
            'income_date' => ['required', 'date'],
            'payment_method' => ['required', 'in:Cash,Cheque,BankWire'],
            'cheque_number' => ['nullable', 'string', 'max:60'],
            'receipt_number' => ['nullable', 'string', 'max:60'],
            'bank_account_id' => ['nullable', 'exists:bank_accounts,id'],
            'remarks' => ['nullable', 'string'],
            'transferred_at' => ['nullable', 'date'],

            'splits' => ['required', 'array'],
            'splits.*.split_id' => ['required', 'integer', 'exists:kafala_chamila_splits,id'],
            'splits.*.amount' => ['required', 'numeric', 'min:0'],
        ];
    }

    public function messages(): array
    {
        return [
            'kafil_id.required' => 'الكفيل مطلوب',
            'kafil_id.exists' => 'الكفيل غير موجود',
            'fiscal_year_id.required' => 'السنة المالية مطلوبة',
            'income_date.required' => 'تاريخ الإيراد مطلوب',
            'payment_method.required' => 'طريقة الدفع مطلوبة',
            'splits.*.split_id.exists' => 'أحد بنود التوزيع غير موجود',
            'splits.*.amount.min' => 'المبلغ يجب أن يكون أكبر من أو يساوي صفر',
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

            $splits = collect($this->input('splits', []));
            if ($splits->isEmpty()) {
                return;
            }

            $expectedIds = KafalaChamilaSplit::pluck('id')->sort()->values();
            $submittedIds = $splits->pluck('split_id')->filter()->map(fn ($id) => (int) $id)->sort()->values();

            if (!$expectedIds->diff($submittedIds)->isEmpty() || !$submittedIds->diff($expectedIds)->isEmpty()) {
                $validator->errors()->add('splits', 'يجب إدخال مبلغ لكل بند من بنود توزيع الكفالة الشاملة، لا أكثر ولا أقل');
            }

            $total = $splits->sum(fn ($split) => (float) ($split['amount'] ?? 0));
            if ($total <= 0) {
                $validator->errors()->add('splits', 'مجموع مبالغ التوزيع يجب أن يكون أكبر من صفر');
            }
        });
    }
}
