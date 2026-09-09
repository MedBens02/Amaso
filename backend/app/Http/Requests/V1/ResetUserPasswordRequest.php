<?php

namespace App\Http\Requests\V1;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class ResetUserPasswordRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        // An admin resetting someone else's password does not know their
        // current one - that is the point of a reset.
        return [
            'password' => ['required', 'string', 'confirmed', Password::min(8)],
        ];
    }

    public function messages(): array
    {
        return [
            'password.required' => 'كلمة المرور الجديدة مطلوبة',
            'password.confirmed' => 'تأكيد كلمة المرور غير مطابق',
            'password.min' => 'كلمة المرور يجب أن تتكون من 8 أحرف على الأقل',
        ];
    }
}
