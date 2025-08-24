<?php

namespace App\Http\Requests\V1;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateWidowRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'first_name' => ['sometimes', 'required', 'string', 'max:100'],
            'last_name' => ['sometimes', 'required', 'string', 'max:100'],
            'phone' => ['nullable', 'string', 'max:20'],
            'email' => ['nullable', 'email', 'max:150'],
            'address' => ['nullable', 'string', 'max:500'],
            'neighborhood' => ['nullable', 'string', 'max:100'],
            'admission_date' => ['sometimes', 'required', 'date'],
            'national_id' => [
                'sometimes', 
                'required', 
                'string', 
                'max:20',
                Rule::unique('widows', 'national_id')->ignore($this->widow->id ?? null)
            ],
            'birth_date' => ['sometimes', 'required', 'date', 'before:today'],
            'marital_status' => ['sometimes', 'required', 'string', 'in:Widowed,Divorced,Single'],
            'education_level' => ['nullable', 'string', 'max:100'],
            'disability_flag' => ['boolean'],
            'disability_type' => ['nullable', 'string', 'max:200', 'required_if:disability_flag,true'],
        ];
    }

    public function messages(): array
    {
        return [
            'first_name.required' => 'الاسم الأول مطلوب',
            'first_name.max' => 'الاسم الأول يجب أن يكون أقل من 100 حرف',
            'last_name.required' => 'اسم العائلة مطلوب',
            'last_name.max' => 'اسم العائلة يجب أن يكون أقل من 100 حرف',
            'phone.max' => 'رقم الهاتف يجب أن يكون أقل من 20 رقم',
            'email.email' => 'البريد الإلكتروني غير صحيح',
            'email.max' => 'البريد الإلكتروني يجب أن يكون أقل من 150 حرف',
            'address.max' => 'العنوان يجب أن يكون أقل من 500 حرف',
            'neighborhood.max' => 'الحي يجب أن يكون أقل من 100 حرف',
            'admission_date.required' => 'تاريخ الانتساب مطلوب',
            'admission_date.date' => 'تاريخ الانتساب يجب أن يكون تاريخاً صحيحاً',
            'national_id.required' => 'رقم الهوية مطلوب',
            'national_id.unique' => 'رقم الهوية مسجل مسبقاً',
            'national_id.max' => 'رقم الهوية يجب أن يكون أقل من 20 رقم',
            'birth_date.required' => 'تاريخ الميلاد مطلوب',
            'birth_date.date' => 'تاريخ الميلاد يجب أن يكون تاريخاً صحيحاً',
            'birth_date.before' => 'تاريخ الميلاد يجب أن يكون قبل اليوم',
            'marital_status.required' => 'الحالة الاجتماعية مطلوبة',
            'marital_status.in' => 'الحالة الاجتماعية يجب أن تكون: أرملة، مطلقة، أو عزباء',
            'education_level.max' => 'المستوى التعليمي يجب أن يكون أقل من 100 حرف',
            'disability_type.max' => 'نوع الإعاقة يجب أن يكون أقل من 200 حرف',
            'disability_type.required_if' => 'نوع الإعاقة مطلوب عند وجود إعاقة',
        ];
    }
}