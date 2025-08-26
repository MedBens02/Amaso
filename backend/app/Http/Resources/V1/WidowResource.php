<?php

namespace App\Http\Resources\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class WidowResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'first_name' => $this->first_name,
            'last_name' => $this->last_name,
            'full_name' => $this->full_name,
            'phone' => $this->phone,
            'email' => $this->email,
            'address' => $this->address,
            'neighborhood' => $this->neighborhood,
            'admission_date' => $this->admission_date?->format('Y-m-d'),
            'national_id' => $this->national_id,
            'birth_date' => $this->birth_date?->format('Y-m-d'),
            'age' => $this->birth_date ? $this->birth_date->diffInYears(now()) : null,
            'marital_status' => $this->marital_status,
            'education_level' => $this->education_level,
            'disability_flag' => $this->disability_flag,
            'disability_type' => $this->disability_type,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
            
            // Relationships
            
            'orphans' => $this->whenLoaded('orphans', function () {
                return $this->orphans->map(function ($orphan) {
                    return [
                        'id' => $orphan->id,
                        'first_name' => $orphan->first_name,
                        'last_name' => $orphan->last_name,
                        'birth_date' => $orphan->birth_date?->format('Y-m-d'),
                        'age' => $orphan->birth_date ? $orphan->birth_date->diffInYears(now()) : null,
                        'gender' => $orphan->gender,
                        'education_level' => $orphan->educationLevel ? $orphan->educationLevel->name_ar : null,
                        'education_level_id' => $orphan->education_level_id,
                        'health_status' => $orphan->health_status,
                    ];
                });
            }),
            
            'sponsorships' => $this->whenLoaded('sponsorships', function () {
                return $this->sponsorships->map(function ($sponsorship) {
                    return [
                        'id' => $sponsorship->id,
                        'amount' => $sponsorship->amount,
                        'kafil' => $sponsorship->relationLoaded('kafil') && $sponsorship->kafil ? [
                            'id' => $sponsorship->kafil->id,
                            'first_name' => $sponsorship->kafil->first_name,
                            'last_name' => $sponsorship->kafil->last_name,
                            'phone' => $sponsorship->kafil->phone,
                            'monthly_pledge' => $sponsorship->kafil->monthly_pledge,
                            'donor' => $sponsorship->kafil->relationLoaded('donor') && $sponsorship->kafil->donor ? [
                                'id' => $sponsorship->kafil->donor->id,
                                'first_name' => $sponsorship->kafil->donor->first_name,
                                'last_name' => $sponsorship->kafil->donor->last_name,
                            ] : null,
                        ] : null,
                        'created_at' => $sponsorship->created_at?->toISOString(),
                    ];
                });
            }),
            
            // Widow Files (social situation and chronic disease)
            'widow_files' => $this->whenLoaded('widowFiles', function () {
                return $this->widowFiles ? [
                    'social_situation' => $this->widowFiles->social_situation,
                    'has_chronic_disease' => $this->widowFiles->has_chronic_disease,
                    'has_maouna' => $this->widowFiles->has_maouna ?? false,
                ] : null;
            }),

            // Social Information
            'widow_social' => $this->whenLoaded('widowSocial', function () {
                return $this->widowSocial ? [
                    'housing_type' => $this->widowSocial->housingType ? [
                        'id' => $this->widowSocial->housingType->id,
                        'label' => $this->widowSocial->housingType->label,
                    ] : null,
                    'housing_status' => $this->widowSocial->housing_status,
                    'has_water' => $this->widowSocial->has_water,
                    'has_electricity' => $this->widowSocial->has_electricity,
                    'has_furniture' => $this->widowSocial->has_furniture,
                ] : null;
            }),

            // Skills
            'skills' => $this->whenLoaded('skills', function () {
                return $this->skills->map(function ($skill) {
                    return [
                        'id' => $skill->id,
                        'label' => $skill->label,
                    ];
                });
            }),

            // Illnesses
            'illnesses' => $this->whenLoaded('illnesses', function () {
                return $this->illnesses->map(function ($illness) {
                    return [
                        'id' => $illness->id,
                        'label' => $illness->label,
                        'is_chronic' => $illness->is_chronic ?? false,
                    ];
                });
            }),

            // Aid Types
            'aid_types' => $this->whenLoaded('aidTypes', function () {
                return $this->aidTypes->map(function ($aidType) {
                    return [
                        'id' => $aidType->id,
                        'label' => $aidType->label,
                        'is_active' => $aidType->pivot->is_active ?? null,
                    ];
                });
            }),

            // Social Income
            'social_income' => $this->whenLoaded('socialIncome', function () {
                return $this->socialIncome->map(function ($income) {
                    return [
                        'id' => $income->id,
                        'amount' => $income->amount,
                        'remarks' => $income->remarks,
                        'category' => $income->category ? [
                            'id' => $income->category->id,
                            'name' => $income->category->name,
                        ] : null,
                    ];
                });
            }),

            // Social Expenses
            'social_expenses' => $this->whenLoaded('socialExpenses', function () {
                return $this->socialExpenses->map(function ($expense) {
                    return [
                        'id' => $expense->id,
                        'amount' => $expense->amount,
                        'remarks' => $expense->remarks,
                        'category' => $expense->category ? [
                            'id' => $expense->category->id,
                            'name' => $expense->category->name,
                        ] : null,
                    ];
                });
            }),

            // Active Maouna (allowances)
            'active_maouna' => $this->whenLoaded('activeMaouna', function () {
                return $this->activeMaouna->map(function ($maouna) {
                    return [
                        'id' => $maouna->id,
                        'amount' => $maouna->amount,
                        'is_active' => $maouna->is_active,
                        'partner' => $maouna->partner ? [
                            'id' => $maouna->partner->id,
                            'name' => $maouna->partner->name,
                        ] : null,
                    ];
                });
            }),

            // Statistics
            'orphans_count' => $this->whenLoaded('orphans', fn() => $this->orphans->count()),
            'sponsorships_count' => $this->whenLoaded('sponsorships', fn() => $this->sponsorships->count()),
            'total_sponsorship_amount' => $this->whenLoaded('sponsorships', function () {
                return $this->sponsorships->sum('amount');
            }),
            'skills_count' => $this->whenLoaded('skills', fn() => $this->skills->count()),
            'illnesses_count' => $this->whenLoaded('illnesses', fn() => $this->illnesses->count()),
            'total_income' => $this->whenLoaded('socialIncome', function () {
                return $this->socialIncome->sum('amount');
            }),
            'total_expenses' => $this->whenLoaded('socialExpenses', function () {
                return $this->socialExpenses->sum('amount');
            }),
        ];
    }
}