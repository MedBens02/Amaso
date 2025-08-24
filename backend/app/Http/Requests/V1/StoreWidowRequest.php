<?php

namespace App\Http\Requests\V1;

use Illuminate\Foundation\Http\FormRequest;

class StoreWidowRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            // Basic widow information
            'first_name' => ['required', 'string', 'max:100'],
            'last_name' => ['required', 'string', 'max:100'],
            'phone' => ['nullable', 'string', 'max:20'],
            'email' => ['nullable', 'email', 'max:150'],
            'address' => ['nullable', 'string', 'max:500'],
            'neighborhood' => ['nullable', 'string', 'max:100'],
            'admission_date' => ['required', 'date'],
            'national_id' => ['required', 'string', 'max:20', 'unique:widows,national_id'],
            'birth_date' => ['required', 'date', 'before:today'],
            'marital_status' => ['required', 'string', 'in:Widowed,Divorced,Single'],
            'education_level' => ['nullable', 'string', 'max:100'],
            'disability_flag' => ['boolean'],
            'disability_type' => ['nullable', 'string', 'max:200', 'required_if:disability_flag,true'],

            // Widow Files (social situation)
            'social_situation' => ['required', 'string', 'in:single,widow,divorced,remarried'],
            'has_chronic_disease' => ['boolean'],

            // Social Information
            'housing_type_id' => ['nullable', 'integer', 'exists:housing_types,id'],
            'housing_status' => ['nullable', 'string', 'in:owned,rented,free'],
            'has_water' => ['boolean'],
            'has_electricity' => ['boolean'],
            'has_furniture' => ['integer', 'min:0', 'max:5'],

            // Children/Orphans
            'children' => ['array'],
            'children.*.first_name' => ['required', 'string', 'max:100'],
            'children.*.last_name' => ['required', 'string', 'max:100'],
            'children.*.birth_date' => ['required', 'date', 'before:today'],
            'children.*.gender' => ['required', 'string', 'in:male,female'],
            'children.*.education_level' => ['nullable', 'string', 'max:100'],
            'children.*.health_status' => ['nullable', 'string', 'max:200'],

            // Income and Expenses
            'income' => ['array'],
            'income.*.category_id' => ['required', 'integer', 'exists:widow_income_categories,id'],
            'income.*.amount' => ['required', 'numeric', 'min:0'],
            'income.*.description' => ['nullable', 'string', 'max:500'],

            'expenses' => ['array'],
            'expenses.*.category_id' => ['required', 'integer', 'exists:widow_expense_categories,id'],
            'expenses.*.amount' => ['required', 'numeric', 'min:0'],
            'expenses.*.description' => ['nullable', 'string', 'max:500'],

            // Skills
            'skills' => ['array'],
            'skills.*' => ['integer', 'exists:skills,id'],
            'new_skills' => ['array'],
            'new_skills.*' => ['string', 'max:100'],

            // Illnesses
            'illnesses' => ['array'],
            'illnesses.*' => ['integer', 'exists:illnesses,id'],

            // Aid Types
            'aid_types' => ['array'],
            'aid_types.*' => ['integer', 'exists:aid_types,id'],

            // Maouna
            'maouna' => ['array'],
            'maouna.*.partner_id' => ['required', 'integer', 'exists:partners,id'],
            'maouna.*.amount' => ['required', 'numeric', 'min:0'],
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