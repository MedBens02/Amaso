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
            // Basic widow information (using 'sometimes' for optional updates)
            'first_name' => ['sometimes', 'required', 'string', 'max:100'],
            'last_name' => ['sometimes', 'required', 'string', 'max:100'],
            'phone' => ['nullable', 'string', 'max:20'],
            'email' => ['nullable', 'email', 'max:150'],
            'address' => ['nullable', 'string', 'max:500'],
            'neighborhood' => ['nullable', 'string', 'max:100'],
            // The "not before she was widowed" rule is in withValidator
            // below rather than here. A declarative after_or_equal only sees
            // the request, and an edit that changes the admission date alone
            // does not carry the death date - so the rule compared against
            // nothing and passed. See the note there.
            'admission_date' => ['sometimes', 'date'],
            'national_id' => [
                'sometimes', 
                'string', 
                'max:20',
                Rule::unique('widows', 'national_id')->ignore($this->widow->id ?? null)
            ],
            'birth_date' => ['sometimes', 'date', 'before:today'],
            'marital_status' => ['sometimes', 'string', 'in:Widowed,Divorced,Single'],

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
            'extra_phones' => ['sometimes', 'array'],
            'extra_phones.*' => ['string', 'max:30'],

            // Widow Files (social situation)
            'social_situation' => ['sometimes', 'string', 'in:single,widow,divorced,remarried'],
            'has_chronic_disease' => ['boolean'],
            'has_maouna' => ['boolean'],

            // Social Information
            'housing_type_id' => ['nullable', 'integer', 'exists:housing_types,id'],
            'housing_status' => ['nullable', 'string', 'in:owned,rented,free'],
            'has_water' => ['boolean'],
            'has_electricity' => ['boolean'],
            'has_furniture' => ['integer', 'min:0', 'max:5'],

            // Children/Orphans (synced by id: existing rows update, missing rows archive)
            'children' => ['sometimes', 'array'],
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

            // Income and Expenses (can be updated completely)
            'income' => ['sometimes', 'array'],
            'income.*.category_id' => ['nullable', 'integer', 'exists:widow_income_categories,id'],
            'income.*.category_name' => ['nullable', 'string', 'max:100'],
            'income.*.amount' => ['required', 'numeric', 'min:0'],
            'income.*.description' => ['nullable', 'string', 'max:500'],

            'expenses' => ['sometimes', 'array'],
            'expenses.*.category_id' => ['nullable', 'integer', 'exists:widow_expense_categories,id'],
            'expenses.*.category_name' => ['nullable', 'string', 'max:100'],
            'expenses.*.amount' => ['required', 'numeric', 'min:0'],
            'expenses.*.description' => ['nullable', 'string', 'max:500'],

            // Skills
            'skills' => ['sometimes', 'array'],
            'skills.*' => ['integer', 'exists:skills,id'],
            'new_skills' => ['sometimes', 'array'],
            'new_skills.*' => ['string', 'max:100'],

            // Illnesses
            'illnesses' => ['sometimes', 'array'],
            'illnesses.*' => ['integer', 'exists:illnesses,id'],
            'new_illnesses' => ['sometimes', 'array'],
            'new_illnesses.*' => ['string', 'max:100'],

            // Aid Types
            'aid_types' => ['sometimes', 'array'],
            'aid_types.*' => ['integer', 'exists:aid_types,id'],

            // Maouna
            'maouna' => ['sometimes', 'array'],
            'maouna.*.partner_id' => ['required', 'integer', 'exists:partners,id'],
            'maouna.*.amount' => ['required', 'numeric', 'min:0'],
            
            // Kafils (for reference, but handled via separate sponsorship endpoints)
            'kafils' => ['sometimes', 'array'],
            'kafils.*.kafil_id' => ['required', 'string'],
            'kafils.*.amount' => ['required', 'numeric', 'min:0'],
        ];
    }

    /**
     * The admission date against the death date, using whichever values the
     * record will actually end up with.
     *
     * This cannot be an `after_or_equal:husband_death_date` rule. That
     * compares two fields of the *request*, and an update carries only what
     * changed: editing the admission date alone sends no death date, the
     * rule finds nothing to compare against, and passes. The date it has to
     * be checked against is the one already on the row.
     *
     * Both directions matter, because either field can be the one being
     * moved - pushing the death date past a fixed admission date is the same
     * mistake seen from the other side.
     */
    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            $widow = $this->route('widow');

            $admission = $this->has('admission_date')
                ? $this->input('admission_date')
                : $widow?->admission_date?->format('Y-m-d');

            $death = $this->has('husband_death_date')
                ? $this->input('husband_death_date')
                : $widow?->husband_death_date?->format('Y-m-d');

            if (! $admission || ! $death) {
                return;
            }

            if (strtotime($admission) < strtotime($death)) {
                $validator->errors()->add(
                    $this->has('admission_date') ? 'admission_date' : 'husband_death_date',
                    'تاريخ الانتساب لا يمكن أن يسبق تاريخ وفاة الزوج',
                );
            }
        });
    }

    public function messages(): array
    {
        return [
            // Basic widow information messages
            'first_name.required' => 'الاسم الأول مطلوب',
            'first_name.max' => 'الاسم الأول يجب أن يكون أقل من 100 حرف',
            'last_name.required' => 'اسم العائلة مطلوب',
            'last_name.max' => 'اسم العائلة يجب أن يكون أقل من 100 حرف',
            'phone.max' => 'رقم الهاتف يجب أن يكون أقل من 20 رقم',
            'email.email' => 'البريد الإلكتروني غير صحيح',
            'email.max' => 'البريد الإلكتروني يجب أن يكون أقل من 150 حرف',
            'address.max' => 'العنوان يجب أن يكون أقل من 500 حرف',
            'neighborhood.max' => 'الحي يجب أن يكون أقل من 100 حرف',
            'admission_date.date' => 'تاريخ الانتساب يجب أن يكون تاريخاً صحيحاً',
            'admission_date.after_or_equal' => 'تاريخ الانتساب لا يمكن أن يسبق تاريخ وفاة الزوج',
            'husband_death_date.required_if' => 'تاريخ وفاة الزوج مطلوب لحالة يتيم جديد',
            'husband_death_date.before_or_equal' => 'تاريخ وفاة الزوج لا يمكن أن يكون في المستقبل',
            'national_id.unique' => 'رقم البطاقة الوطنية مسجل مسبقاً',
            'national_id.max' => 'رقم البطاقة الوطنية يجب أن يكون أقل من 20 رقم',
            'birth_date.date' => 'تاريخ الميلاد يجب أن يكون تاريخاً صحيحاً',
            'birth_date.before' => 'تاريخ الميلاد يجب أن يكون قبل اليوم',
            'marital_status.in' => 'الحالة الاجتماعية يجب أن تكون: أرملة، مطلقة، أو عزباء',
            'education_level.max' => 'المستوى التعليمي يجب أن يكون أقل من 100 حرف',
            'disability_type.max' => 'نوع الإعاقة يجب أن يكون أقل من 200 حرف',
            'disability_type.required_if' => 'نوع الإعاقة مطلوب عند وجود إعاقة',

            // Children validation messages
            'children.*.first_name.required' => 'اسم الطفل الأول مطلوب',
            'children.*.last_name.required' => 'اسم عائلة الطفل مطلوب',
            'children.*.birth_date.required' => 'تاريخ ميلاد الطفل مطلوب',
            'children.*.gender.required' => 'جنس الطفل مطلوب',

            // Income/Expense validation messages
            'income.*.amount.required' => 'مبلغ الدخل مطلوب',
            'income.*.amount.min' => 'مبلغ الدخل يجب أن يكون موجباً',
            'expenses.*.amount.required' => 'مبلغ المصروف مطلوب',
            'expenses.*.amount.min' => 'مبلغ المصروف يجب أن يكون موجباً',

            // Maouna validation messages
            'maouna.*.partner_id.required' => 'شريك المؤونة مطلوب',
            'maouna.*.amount.required' => 'مبلغ المؤونة مطلوب',
            'maouna.*.amount.min' => 'مبلغ المؤونة يجب أن يكون موجباً',

            // Housing validation messages
            'housing_type_id.exists' => 'نوع السكن غير موجود',
            'housing_status.in' => 'حالة السكن يجب أن تكون: ملك، إيجار، أو مجاني',
            'has_furniture.min' => 'تقييم الأثاث يجب أن يكون من 0 إلى 5',
            'has_furniture.max' => 'تقييم الأثاث يجب أن يكون من 0 إلى 5',
        ];
    }
}