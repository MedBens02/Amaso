<?php

namespace App\Http\Requests\V1;

use Illuminate\Foundation\Http\FormRequest;

class UpdateKafilRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'first_name' => ['required', 'string', 'max:120'],
            'last_name' => ['required', 'string', 'max:120'],
            'phone' => ['nullable', 'string', 'max:30'],
            'email' => ['nullable', 'email', 'max:120'],
            'address' => ['nullable', 'string'],
            // Stored on the donor, not on the kafil - KafilService::update
            // reaches through. max:30 matches the donors.national_id column.
            'national_id' => ['nullable', 'string', 'max:30'],
            'monthly_pledge' => ['required', 'numeric', 'min:0'],
        ];
    }
}
