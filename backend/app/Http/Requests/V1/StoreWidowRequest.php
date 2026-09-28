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
            // A family cannot join the association before she was widowed.
            // Enforced whenever a death date is on record, which is every
            // يتيم جديد case - the date is required for one - and also
            // catches the same nonsense on an ordinary family if somebody
            // records a death date there. Silent when no death date is
            // known, so the older families are not held to a date nobody
            // ever entered for them.
            'admission_date' => ['required', 'date', 'after_or_equal:husband_death_date'],
            'national_id' => ['required', 'string', 'max:20', 'unique:widows,national_id'],
            'birth_date' => ['required', 'date', 'before:today'],
            'marital_status' => ['required', 'string', 'in:Widowed,Divorced,Single'],

            // When she was widowed. Worth recording on any family, not only
            // the ones registered while still in عدة.
            'husband_death_date' => [
                'nullable',
                // Without it a يتيم جديد case has nothing to date the عدة
                // from, and the admission-date rule above has nothing to
                // compare against.
                'required_if:is_idda_case,true',
                'date',
                'before_or_equal:today',
            ],

            // A family registered as a يتيم جديد case: supported through عدة
            // and kept off the beneficiary lists until the association
            // decides. The end date is required for one, because it is what
            // the allowance and the whole screen run on.
            'is_idda_case' => ['boolean'],
            'idda_end_date' => [
                'nullable',
                'required_if:is_idda_case,true',
                'date',
                'after_or_equal:husband_death_date',
            ],
            'family_liaison' => ['nullable', 'string', 'max:100'],
            'education_level' => ['nullable', 'string', 'max:100'],
            'disability_flag' => ['boolean'],
            'disability_type' => ['nullable', 'string', 'max:200', 'required_if:disability_flag,true'],

            // Additional phone numbers (primary stays in `phone`)
            'extra_phones' => ['array'],
            'extra_phones.*' => ['string', 'max:30'],

            // Widow Files (social situation)
            'social_situation' => ['required', 'string', 'in:single,widow,divorced,remarried'],
            'has_chronic_disease' => ['boolean'],
            'has_maouna' => ['boolean'],

            // Social Information
            'housing_type_id' => ['nullable', 'integer', 'exists:housing_types,id'],
            'housing_status' => ['nullable', 'string', 'in:owned,rented,free'],
            'has_water' => ['boolean'],
            'has_electricity' => ['boolean'],
            'has_furniture' => ['integer', 'min:0', 'max:5'],

            // Children/Orphans
            'children' => ['array'],
            'children.*.id' => ['nullable', 'integer'],
            'children.*.first_name' => ['required', 'string', 'max:100'],
            'children.*.last_name' => ['required', 'string', 'max:100'],
            'children.*.birth_date' => ['required', 'date', 'before:today'],
            'children.*.gender' => ['required', 'string', 'in:male,female'],
            'children.*.education_level_id' => ['nullable', 'integer', 'exists:orphans_education_level,id'],
            // Feeds the current year's enrollment, not the orphan row itself.
            'children.*.school_id' => ['nullable', 'integer', 'exists:schools,id'],
            'children.*.specialty' => ['nullable', 'string', 'max:150'],
            'children.*.health_status' => ['nullable', 'string', 'max:200'],
            'children.*.phone' => ['nullable', 'string', 'max:30'],
            'children.*.cin' => ['nullable', 'string', 'max:30'],
            'children.*.is_working' => ['boolean'],
            'children.*.work_type' => ['nullable', 'string', 'max:120'],
            'children.*.is_work_permanent' => ['boolean'],
            'children.*.is_married' => ['boolean'],
            'children.*.is_schooled' => ['boolean'],
            'children.*.masar_code' => ['nullable', 'string', 'max:30'],
            'children.*.is_not_interested' => ['boolean'],
            'children.*.is_inactive' => ['boolean'],

            // Income and Expenses
            'income' => ['array'],
            'income.*.category_id' => ['nullable', 'integer', 'exists:widow_income_categories,id'],
            'income.*.category_name' => ['nullable', 'string', 'max:100'],
            'income.*.amount' => ['required', 'numeric', 'min:0'],
            'income.*.description' => ['nullable', 'string', 'max:500'],

            'expenses' => ['array'],
            'expenses.*.category_id' => ['nullable', 'integer', 'exists:widow_expense_categories,id'],
            'expenses.*.category_name' => ['nullable', 'string', 'max:100'],
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
            'new_illnesses' => ['array'],
            'new_illnesses.*' => ['string', 'max:100'],

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
            'admission_date.after_or_equal' => 'تاريخ الانتساب لا يمكن أن يسبق تاريخ وفاة الزوج',
            'husband_death_date.required_if' => 'تاريخ وفاة الزوج مطلوب لحالة يتيم جديد',
            'national_id.required' => 'رقم البطاقة الوطنية مطلوب',
            'national_id.unique' => 'رقم البطاقة الوطنية مسجل مسبقاً',
            'national_id.max' => 'رقم البطاقة الوطنية يجب أن يكون أقل من 20 رقم',
            'birth_date.required' => 'تاريخ الميلاد مطلوب',
            'birth_date.date' => 'تاريخ الميلاد يجب أن يكون تاريخاً صحيحاً',
            'birth_date.before' => 'تاريخ الميلاد يجب أن يكون قبل اليوم',
            'marital_status.required' => 'الحالة الاجتماعية مطلوبة',
            'husband_death_date.before_or_equal' => 'تاريخ وفاة الزوج لا يمكن أن يكون في المستقبل',
            'idda_end_date.required_if' => 'تاريخ انتهاء العدة مطلوب لحالة يتيم جديد',
            'idda_end_date.after_or_equal' => 'تاريخ انتهاء العدة يجب أن يكون بعد تاريخ وفاة الزوج',
            'marital_status.in' => 'الحالة الاجتماعية يجب أن تكون: أرملة، مطلقة، أو عزباء',
            'education_level.max' => 'المستوى التعليمي يجب أن يكون أقل من 100 حرف',
            'disability_type.max' => 'نوع الإعاقة يجب أن يكون أقل من 200 حرف',
            'disability_type.required_if' => 'نوع الإعاقة مطلوب عند وجود إعاقة',
        ];
    }
}