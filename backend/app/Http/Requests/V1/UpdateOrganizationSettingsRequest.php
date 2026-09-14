<?php

namespace App\Http\Requests\V1;

use App\Support\OrganizationSettings;
use Illuminate\Foundation\Http\FormRequest;

class UpdateOrganizationSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Strip invisible bidi-control marks before they ever reach the
     * database - see OrganizationSettings::stripBidiControls(). A mark like
     * this leaves the field looking exactly as typed on the settings
     * screen, which is exactly why it survives unnoticed until a report
     * folds a line of Latin text back over itself around it.
     */
    protected function prepareForValidation(): void
    {
        foreach (['name', 'address', 'phone', 'email'] as $field) {
            if (is_string($this->input($field))) {
                $this->merge([$field => OrganizationSettings::stripBidiControls($this->input($field))]);
            }
        }
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:150'],
            'address' => ['nullable', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:40'],
            'email' => ['nullable', 'email', 'max:120'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'اسم الجمعية مطلوب',
            'email.email' => 'البريد الإلكتروني غير صحيح',
        ];
    }
}
