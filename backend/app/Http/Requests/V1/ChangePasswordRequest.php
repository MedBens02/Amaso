<?php

namespace App\Http\Requests\V1;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class ChangePasswordRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            // Knowing the current password is what makes this a password
            // *change* and not an account takeover from a borrowed session.
            'current_password' => ['required', 'string'],
            'password' => ['required', 'string', 'confirmed', Password::min(8)],
        ];
    }

    public function messages(): array
    {
        return [
            'current_password.required' => 'كلمة المرور الحالية مطلوبة',
            'password.required' => 'كلمة المرور الجديدة مطلوبة',
            'password.confirmed' => 'تأكيد كلمة المرور غير مطابق',
            'password.min' => 'كلمة المرور يجب أن تتكون من 8 أحرف على الأقل',
        ];
    }
}
