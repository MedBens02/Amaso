<?php

namespace App\Http\Requests\V1;

use Illuminate\Foundation\Http\FormRequest;

class StoreSponsorshipRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'kafil_id' => ['required', 'exists:kafils,id'],
            'widow_id' => ['required', 'exists:widows,id'],
            'amount' => ['required', 'numeric', 'min:0'],
        ];
    }
}
