<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\FiscalYear;
use App\Models\Kafil;
use App\Services\ReportService;
use App\Services\SchoolPerformanceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    public function __construct(
        private readonly ReportService $reports,
        private readonly SchoolPerformanceService $schoolPerformance,
    ) {
    }

    /**
     * A sponsor's statement: what they contributed and how it was designated,
     * alongside what the families they sponsor received from the association.
     */
    public function kafilStatement(Request $request, Kafil $kafil): JsonResponse
    {
        $validated = $request->validate([
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date', 'after_or_equal:from'],
        ], [
            'from.date' => 'تاريخ البداية غير صحيح',
            'to.date' => 'تاريخ النهاية غير صحيح',
            'to.after_or_equal' => 'تاريخ النهاية يجب أن يكون بعد تاريخ البداية',
        ]);

        [$from, $to] = $this->resolvePeriod($validated);

        return response()->json([
            'data' => $this->reports->kafilStatement($kafil, $from, $to),
        ]);
    }

    /**
     * How the sponsored students are doing, ranked, with the cuts the
     * association actually asks for: by gender, level, school, public vs.
     * private, higher education only, and the top N for excellence awards.
     */
    public function schoolPerformance(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'academic_year_id' => ['nullable', 'integer', 'exists:academic_years,id'],
            'gender' => ['nullable', 'in:male,female'],
            'education_level_id' => ['nullable', 'integer', 'exists:orphans_education_level,id'],
            'school_id' => ['nullable', 'integer', 'exists:schools,id'],
            'school_type' => ['nullable', 'in:school,university'],
            'is_private' => ['nullable', 'boolean'],
            'is_amaso_linked' => ['nullable', 'boolean'],
            'semester' => ['nullable', 'in:first,second,average'],
            'top_n' => ['nullable', 'integer', 'min:1', 'max:500'],
        ], [
            'gender.in' => 'الجنس غير صحيح',
            'school_type.in' => 'نوع المؤسسة غير صحيح',
            'semester.in' => 'الأسدس غير صحيح',
            'top_n.max' => 'أقصى عدد في الترتيب هو 500',
        ]);

        return response()->json([
            'data' => $this->schoolPerformance->report($validated),
        ]);
    }

    /**
     * Defaults to the active fiscal year, which is stored as a plain year.
     *
     * @return array{0: string, 1: string}
     */
    private function resolvePeriod(array $validated): array
    {
        if (!empty($validated['from']) && !empty($validated['to'])) {
            return [$validated['from'], $validated['to']];
        }

        $year = FiscalYear::where('is_active', true)->value('year') ?? now()->year;

        return [
            $validated['from'] ?? "{$year}-01-01",
            $validated['to'] ?? "{$year}-12-31",
        ];
    }
}
