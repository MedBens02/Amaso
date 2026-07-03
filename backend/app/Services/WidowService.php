<?php

namespace App\Services;

use App\Exceptions\BusinessRuleException;
use App\Models\Illness;
use App\Models\Orphan;
use App\Models\Skill;
use App\Models\Widow;
use App\Models\WidowExpenseCategory;
use App\Models\WidowFiles;
use App\Models\WidowIncomeCategory;
use App\Models\WidowMaouna;
use App\Models\WidowSocial;
use App\Models\WidowSocialExpense;
use App\Models\WidowSocialIncome;
use Illuminate\Support\Facades\DB;

/**
 * Creates and updates a widow together with all of her satellite records:
 * file, social/housing situation, orphans, personal income/expense entries,
 * skills, illnesses, aid types and Maouna support.
 */
class WidowService
{
    private const PROFILE_FIELDS = [
        'first_name', 'last_name', 'phone', 'email',
        'address', 'neighborhood', 'admission_date', 'national_id',
        'birth_date', 'marital_status', 'education_level',
        'disability_flag', 'disability_type',
    ];

    public function create(array $validated): Widow
    {
        return DB::transaction(function () use ($validated) {
            $widow = Widow::create(
                collect($validated)->only(self::PROFILE_FIELDS)->toArray()
            );

            WidowFiles::create([
                'widow_id' => $widow->id,
                'social_situation' => $validated['social_situation'],
                'has_chronic_disease' => $validated['has_chronic_disease'] ?? false,
                'has_maouna' => $validated['has_maouna'] ?? false,
            ]);

            if (!empty($validated['housing_type_id'])) {
                WidowSocial::create([
                    'widow_id' => $widow->id,
                    ...$this->socialAttributes($validated),
                ]);
            }

            $this->createOrphans($widow, $validated['children'] ?? []);
            $this->createIncomeEntries($widow, $validated['income'] ?? []);
            $this->createExpenseEntries($widow, $validated['expenses'] ?? []);

            $widow->skills()->attach($this->resolveSkillIds($validated));
            $widow->illnesses()->attach($this->resolveIllnessIds($validated));

            if (!empty($validated['aid_types'])) {
                $widow->aidTypes()->attach($validated['aid_types']);
            }

            $this->createMaounaEntries($widow, $validated['maouna'] ?? []);

            return $widow;
        });
    }

    public function update(Widow $widow, array $validated): Widow
    {
        return DB::transaction(function () use ($widow, $validated) {
            $widow->update(
                collect($validated)->only(self::PROFILE_FIELDS)->toArray()
            );

            $widow->widowFiles()->updateOrCreate(
                ['widow_id' => $widow->id],
                [
                    'social_situation' => $validated['social_situation'] ?? 'widow',
                    'has_chronic_disease' => $validated['has_chronic_disease'] ?? false,
                    'has_maouna' => $validated['has_maouna'] ?? false,
                ]
            );

            if (!empty($validated['housing_type_id'])) {
                $widow->widowSocial()->updateOrCreate(
                    ['widow_id' => $widow->id],
                    $this->socialAttributes($validated)
                );
            }

            // Collection-style sections are replaced wholesale when present.
            if (array_key_exists('children', $validated)) {
                $widow->orphans()->delete();
                $this->createOrphans($widow, $validated['children'] ?? []);
            }

            if (array_key_exists('income', $validated)) {
                WidowSocialIncome::where('widow_id', $widow->id)->delete();
                $this->createIncomeEntries($widow, $validated['income'] ?? []);
            }

            if (array_key_exists('expenses', $validated)) {
                WidowSocialExpense::where('widow_id', $widow->id)->delete();
                $this->createExpenseEntries($widow, $validated['expenses'] ?? []);
            }

            if (array_key_exists('skills', $validated) || array_key_exists('new_skills', $validated)) {
                $widow->skills()->sync($this->resolveSkillIds($validated));
            }

            if (array_key_exists('illnesses', $validated) || array_key_exists('new_illnesses', $validated)) {
                $widow->illnesses()->sync($this->resolveIllnessIds($validated));
            }

            if (array_key_exists('aid_types', $validated)) {
                $widow->aidTypes()->sync($validated['aid_types'] ?? []);
            }

            if (array_key_exists('maouna', $validated)) {
                WidowMaouna::where('widow_id', $widow->id)->delete();
                $this->createMaounaEntries($widow, $validated['maouna'] ?? []);
            }

            // Kafil sponsorships are managed through the sponsorships API.

            return $widow;
        });
    }

    /**
     * Delete a widow and all satellite records. Returns her full name for
     * the confirmation message.
     */
    public function delete(Widow $widow): string
    {
        if ($widow->sponsorships()->exists()) {
            throw new BusinessRuleException('لا يمكن حذف الأرملة لأنها مرتبطة بكفالات نشطة', 400);
        }

        return DB::transaction(function () use ($widow) {
            $fullName = $widow->full_name;

            $widow->skills()->detach();
            $widow->illnesses()->detach();
            $widow->aidTypes()->detach();
            WidowMaouna::where('widow_id', $widow->id)->delete();
            WidowSocialIncome::where('widow_id', $widow->id)->delete();
            WidowSocialExpense::where('widow_id', $widow->id)->delete();
            WidowSocial::where('widow_id', $widow->id)->delete();
            WidowFiles::where('widow_id', $widow->id)->delete();
            $widow->orphans()->delete();
            $widow->delete();

            return $fullName;
        });
    }

    private function socialAttributes(array $validated): array
    {
        return [
            'housing_type_id' => $validated['housing_type_id'],
            'housing_status' => $validated['housing_status'] ?? 'owned',
            'has_water' => $validated['has_water'] ?? false,
            'has_electricity' => $validated['has_electricity'] ?? false,
            'has_furniture' => $validated['has_furniture'] ?? 0,
        ];
    }

    private function createOrphans(Widow $widow, array $children): void
    {
        foreach ($children as $child) {
            Orphan::create([
                'widow_id' => $widow->id,
                'first_name' => $child['first_name'],
                'last_name' => $child['last_name'],
                'birth_date' => $child['birth_date'],
                'gender' => $child['gender'],
                'education_level_id' => $child['education_level_id'] ?? null,
                'health_status' => $child['health_status'] ?? null,
            ]);
        }
    }

    private function createIncomeEntries(Widow $widow, array $entries): void
    {
        foreach ($entries as $entry) {
            $categoryId = $entry['category_id']
                ?: $this->categoryIdFromName(WidowIncomeCategory::class, $entry['category_name'] ?? null);

            if ($categoryId) {
                WidowSocialIncome::create([
                    'widow_id' => $widow->id,
                    'income_category_id' => $categoryId,
                    'amount' => $entry['amount'],
                    'remarks' => $entry['description'] ?? null,
                ]);
            }
        }
    }

    private function createExpenseEntries(Widow $widow, array $entries): void
    {
        foreach ($entries as $entry) {
            $categoryId = $entry['category_id']
                ?: $this->categoryIdFromName(WidowExpenseCategory::class, $entry['category_name'] ?? null);

            if ($categoryId) {
                WidowSocialExpense::create([
                    'widow_id' => $widow->id,
                    'expense_category_id' => $categoryId,
                    'amount' => $entry['amount'],
                    'remarks' => $entry['description'] ?? null,
                ]);
            }
        }
    }

    private function categoryIdFromName(string $model, ?string $name): ?int
    {
        if (empty($name)) {
            return null;
        }

        return $model::firstOrCreate(['name' => $name])->id;
    }

    private function createMaounaEntries(Widow $widow, array $entries): void
    {
        foreach ($entries as $entry) {
            WidowMaouna::create([
                'widow_id' => $widow->id,
                'partner_id' => $entry['partner_id'],
                'amount' => $entry['amount'],
                'is_active' => true,
            ]);
        }
    }

    /** Existing skill ids plus ids for any newly named skills. */
    private function resolveSkillIds(array $validated): array
    {
        $ids = $validated['skills'] ?? [];

        foreach ($validated['new_skills'] ?? [] as $name) {
            $ids[] = Skill::firstOrCreate(['label' => $name])->id;
        }

        return $ids;
    }

    /** Existing illness ids plus ids for any newly named illnesses. */
    private function resolveIllnessIds(array $validated): array
    {
        $ids = $validated['illnesses'] ?? [];

        foreach ($validated['new_illnesses'] ?? [] as $name) {
            $ids[] = Illness::firstOrCreate(['label' => $name, 'is_chronic' => false])->id;
        }

        return $ids;
    }
}
