<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\School;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class SchoolController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $schools = School::withCount('enrollments')
            ->when($request->filled('type'), fn ($q) => $q->where('type', $request->type))
            ->when($request->filled('is_private'), fn ($q) => $q->where('is_private', $request->boolean('is_private')))
            ->when($request->filled('is_amaso_linked'), fn ($q) => $q->where('is_amaso_linked', $request->boolean('is_amaso_linked')))
            ->when($request->search, fn ($q, $search) => $q->where('name', 'like', "%{$search}%"))
            ->orderBy('name')
            ->get();

        return response()->json(['data' => $schools]);
    }

    public function store(Request $request): JsonResponse
    {
        $school = School::create($this->validateSchool($request));

        return response()->json([
            'message' => 'تم إنشاء المؤسسة بنجاح',
            'data' => $school,
        ], 201);
    }

    public function update(Request $request, School $school): JsonResponse
    {
        $school->update($this->validateSchool($request, $school->id));

        return response()->json([
            'message' => 'تم تحديث المؤسسة بنجاح',
            'data' => $school,
        ]);
    }

    public function destroy(School $school): JsonResponse
    {
        $enrollmentCount = $school->enrollments()->count();

        if ($enrollmentCount > 0) {
            return response()->json([
                'message' => "لا يمكن حذف هذه المؤسسة لأنها مرتبطة بـ {$enrollmentCount} تسجيل دراسي",
            ], 400);
        }

        $name = $school->name;
        $school->delete();

        return response()->json([
            'message' => "تم حذف المؤسسة \"{$name}\" بنجاح",
        ]);
    }

    private function validateSchool(Request $request, ?int $ignoreId = null): array
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:150', Rule::unique('schools', 'name')->ignore($ignoreId)],
            'type' => ['required', Rule::in([School::TYPE_SCHOOL, School::TYPE_UNIVERSITY])],
            'is_private' => ['boolean'],
            'is_amaso_linked' => ['boolean'],
            'notes' => ['nullable', 'string', 'max:500'],
        ], [
            'name.required' => 'اسم المؤسسة مطلوب',
            'name.unique' => 'توجد مؤسسة بهذا الاسم مسبقاً',
            'type.in' => 'نوع المؤسسة يجب أن يكون: مدرسة أو جامعة',
        ]);

        $validated['is_private'] = $request->boolean('is_private');
        // Only private schools can be flagged as AMASO-linked.
        $validated['is_amaso_linked'] = $validated['is_private'] && $request->boolean('is_amaso_linked');

        return $validated;
    }
}
