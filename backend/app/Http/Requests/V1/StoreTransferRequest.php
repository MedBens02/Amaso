<?php

namespace App\Http\Requests\V1;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreTransferRequest extends FormRequest
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
            'transfer_date' => ['required', 'date'],
            'from_account_id' => ['required', 'exists:bank_accounts,id'],
            'to_account_id' => ['required', 'exists:bank_accounts,id', 'different:from_account_id'],
            'amount' => ['required', 'numeric', 'min:0'],
            'remarks' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
