<?php

namespace App\Http\Requests\V1;

use App\Models\KafalaChamilaSplit;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class UpdateKafalaChamilaSplitsRequest extends FormRequest
{
    /** Admin-only - enforced in the controller alongside the fiscal-year-close pattern. */
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'splits' => ['required', 'array'],
            'splits.*.id' => ['required', 'integer', 'exists:kafala_chamila_splits,id'],
            'splits.*.percentage' => ['required', 'numeric', 'min:0', 'max:100'],
        ];
    }

    public function messages(): array
    {
        return [
            'splits.required' => 'بيانات التوزيع مطلوبة',
            'splits.*.percentage.required' => 'النسبة مطلوبة',
            'splits.*.percentage.max' => 'النسبة يجب ألا تتجاوز 100',
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $splits = collect($this->input('splits', []));
            if ($splits->isEmpty()) {
                return;
            }

            $expectedIds = KafalaChamilaSplit::pluck('id')->sort()->values();
            $submittedIds = $splits->pluck('id')->filter()->map(fn ($id) => (int) $id)->sort()->values();

            if (!$expectedIds->diff($submittedIds)->isEmpty() || !$submittedIds->diff($expectedIds)->isEmpty()) {
                $validator->errors()->add('splits', 'يجب تحديد نسبة لكل بند من بنود الكفالة الشاملة، لا أكثر ولا أقل. لا يمكن إضافة أو حذف بنود.');
                return;
            }

            $sum = $splits->sum(fn ($split) => (float) ($split['percentage'] ?? 0));
            if (abs($sum - 100.0) > 0.01) {
                $validator->errors()->add('splits', "مجموع النسب يجب أن يساوي 100%. المجموع الحالي: {$sum}%");
            }
        });
    }
}
