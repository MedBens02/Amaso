<?php

namespace App\Services;

use App\Exceptions\BusinessRuleException;
use App\Models\Beneficiary;
use App\Models\Illness;
use App\Models\Orphan;
use App\Models\Skill;
use App\Models\Widow;
use App\Models\WidowExpenseCategory;
use App\Models\WidowFiles;
use App\Models\WidowIncomeCategory;
use App\Models\WidowMaouna;
use App\Models\WidowPhone;
use App\Models\WidowSocial;
use App\Models\WidowSocialExpense;
use App\Models\WidowSocialIncome;
use Illuminate\Support\Facades\DB;

/**
 * Creates and updates a family file (the "widow" record, which may in fact
 * be another guardian - see family_liaison) together with all satellite
 * records: file, social/housing situation, orphans, personal income/expense
 * entries, skills, illnesses, aid types, Maouna support and phone numbers.
 *
 * Families are never hard-deleted: archive() soft-deletes the widow and her
 * orphans, recording when and why they left, so history and reports keep
 * working. restore() brings an archived family back.
 */
class WidowService
{
    private const PROFILE_FIELDS = [
        'first_name', 'last_name', 'phone', 'email',
        'address', 'neighborhood', 'admission_date', 'national_id',
        'birth_date', 'marital_status', 'family_liaison', 'education_level',
        'disability_flag', 'disability_type',
    ];

    public function create(array $validated): Widow
    {
        return DB::transaction(function () use ($validated) {
            $widow = Widow::create(
                collect($validated)->only(self::PROFILE_FIELDS)->toArray()
            );

            Beneficiary::firstOrCreate(['type' => 'Widow', 'widow_id' => $widow->id]);

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

            $this->syncExtraPhones($widow, $validated['extra_phones'] ?? []);
            $this->syncChildren($widow, $validated['children'] ?? []);
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

            Beneficiary::firstOrCreate(['type' => 'Widow', 'widow_id' => $widow->id]);

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

            if (array_key_exists('extra_phones', $validated)) {
                $this->syncExtraPhones($widow, $validated['extra_phones'] ?? []);
            }

            if (array_key_exists('children', $validated)) {
                $this->syncChildren($widow, $validated['children'] ?? []);
            }

            // Collection-style sections are replaced wholesale when present.
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
     * Archive a family: record when and why they left, then soft-delete the
     * widow and her orphans. All satellite data is kept so the archive stays
     * fully viewable and past expenses keep resolving.
     *
     * Returns the widow's full name for the confirmation message.
     */
    public function archive(Widow $widow, array $leaving): string
    {
        if ($widow->sponsorships()->exists()) {
            throw new BusinessRuleException('لا يمكن أرشفة الأرملة لأنها مرتبطة بكفالات نشطة. قم بإزالة الكفالات أولاً.', 400);
        }

        return DB::transaction(function () use ($widow, $leaving) {
            $fullName = $widow->full_name;

            $widow->update([
                'leaving_date' => $leaving['leaving_date'],
                'leaving_reason' => $leaving['leaving_reason'],
                'leaving_details' => $leaving['leaving_details'] ?? null,
            ]);

            // Archived families must not receive future group distributions.
            $this->removeFromGroups($widow);

            foreach ($widow->orphans as $orphan) {
                $orphan->delete();
            }
            $widow->delete();

            return $fullName;
        });
    }

    /**
     * Bring an archived family back: restore the widow and the orphans that
     * were archived with her, and clear the leaving information.
     */
    public function restore(Widow $widow): Widow
    {
        return DB::transaction(function () use ($widow) {
            $archivedAt = $widow->deleted_at;

            $widow->restore();
            $widow->update([
                'leaving_date' => null,
                'leaving_reason' => null,
                'leaving_details' => null,
            ]);

            // Only orphans archived together with the family come back -
            // children removed earlier stay removed.
            $widow->orphans()->onlyTrashed()
                ->where('deleted_at', '>=', $archivedAt)
                ->restore();

            return $widow;
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

    /** Replace the additional phone numbers (the primary stays on widows.phone). */
    private function syncExtraPhones(Widow $widow, array $phones): void
    {
        WidowPhone::where('widow_id', $widow->id)->delete();

        foreach ($phones as $entry) {
            $phone = is_array($entry) ? ($entry['phone'] ?? null) : $entry;
            if (!$phone) {
                continue;
            }

            WidowPhone::create([
                'widow_id' => $widow->id,
                'phone' => $phone,
                'label' => is_array($entry) ? ($entry['label'] ?? null) : null,
            ]);
        }
    }

    /**
     * Sync the children by id: update the ones that came back with an id,
     * create the ones without, and archive the ones that were removed.
     * Ids stay stable so education enrollments keep pointing at the right
     * orphan across edits.
     */
    private function syncChildren(Widow $widow, array $children): void
    {
        $keptIds = [];

        foreach ($children as $child) {
            $attributes = $this->orphanAttributes($child);

            if (!empty($child['id'])) {
                $orphan = $widow->orphans()->whereKey($child['id'])->first();
                if ($orphan) {
                    $orphan->update($attributes);
                    $keptIds[] = $orphan->id;
                    continue;
                }
            }

            $orphan = Orphan::create(['widow_id' => $widow->id, ...$attributes]);
            Beneficiary::firstOrCreate(['type' => 'Orphan', 'orphan_id' => $orphan->id]);
            $keptIds[] = $orphan->id;
        }

        $removed = $widow->orphans()->whereNotIn('id', $keptIds)->get();
        foreach ($removed as $orphan) {
            $this->removeOrphanFromGroups($orphan);
            $orphan->delete();
        }
    }

    private function orphanAttributes(array $child): array
    {
        return [
            'first_name' => $child['first_name'],
            'last_name' => $child['last_name'],
            'birth_date' => $child['birth_date'],
            'gender' => $child['gender'],
            'education_level_id' => $child['education_level_id'] ?? null,
            'health_status' => $child['health_status'] ?? null,
            'phone' => $child['phone'] ?? null,
            'cin' => $child['cin'] ?? null,
            'is_working' => $child['is_working'] ?? false,
            'work_type' => ($child['is_working'] ?? false) ? ($child['work_type'] ?? null) : null,
            'is_work_permanent' => ($child['is_working'] ?? false) ? ($child['is_work_permanent'] ?? false) : false,
            'is_married' => $child['is_married'] ?? false,
            'is_schooled' => $child['is_schooled'] ?? true,
            'masar_code' => $child['masar_code'] ?? null,
            'is_not_interested' => $child['is_not_interested'] ?? false,
            'is_inactive' => $child['is_inactive'] ?? false,
        ];
    }

    /** Remove the widow's and her orphans' beneficiary-group memberships. */
    private function removeFromGroups(Widow $widow): void
    {
        $beneficiaryIds = Beneficiary::where('widow_id', $widow->id)
            ->orWhereIn('orphan_id', $widow->orphans()->pluck('id'))
            ->pluck('id');

        if ($beneficiaryIds->isNotEmpty()) {
            DB::table('beneficiary_group_members')->whereIn('beneficiary_id', $beneficiaryIds)->delete();
        }
    }

    private function removeOrphanFromGroups(Orphan $orphan): void
    {
        $beneficiary = Beneficiary::where('orphan_id', $orphan->id)->first();
        if ($beneficiary) {
            DB::table('beneficiary_group_members')->where('beneficiary_id', $beneficiary->id)->delete();
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

    /**
     * Existing illness ids plus ids for any newly named illnesses.
     * The match is on the label alone - matching on is_chronic too (as the
     * old code did) crashed with a unique violation whenever the typed name
     * already existed as a chronic illness.
     */
    private function resolveIllnessIds(array $validated): array
    {
        $ids = $validated['illnesses'] ?? [];

        foreach ($validated['new_illnesses'] ?? [] as $name) {
            $ids[] = Illness::firstOrCreate(['label' => $name], ['is_chronic' => false])->id;
        }

        return $ids;
    }
}
