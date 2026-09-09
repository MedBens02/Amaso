<?php

namespace App\Http\Requests\V1;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:120'],
            'email' => [
                'required', 'email', 'max:120',
                Rule::unique('users', 'email')->ignore($this->route('user')->id),
            ],
            'role' => ['required', Rule::in(User::ROLES)],
            'phone' => ['nullable', 'string', 'max:30'],
            'address' => ['nullable', 'string', 'max:255'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'الاسم مطلوب',
            'email.required' => 'البريد الإلكتروني مطلوب',
            'email.unique' => 'البريد الإلكتروني مستعمل من طرف حساب آخر',
            'role.required' => 'الصلاحية مطلوبة',
            'role.in' => 'الصلاحية غير صحيحة',
        ];
    }
}
