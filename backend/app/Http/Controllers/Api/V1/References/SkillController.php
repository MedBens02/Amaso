<?php

namespace App\Http\Controllers\Api\V1\References;

use App\Models\Skill;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class SkillController extends BaseReferenceController
{
    protected string $model = Skill::class;
    protected string $entityName = 'المهارة';

    protected function validateData(Request $request, ?Model $current = null): array
    {
        return $request->validate([
            'label' => ['required', 'string', 'max:255', Rule::unique('skills', 'label')->ignore($current?->id)],
        ]);
    }

    protected function beforeDestroy(Model $item): ?JsonResponse
    {
        DB::table('widow_skill')->where('skill_id', $item->id)->delete();

        return null;
    }
}
