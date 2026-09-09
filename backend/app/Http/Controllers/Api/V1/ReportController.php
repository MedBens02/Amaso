<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\FiscalYear;
use App\Models\Kafil;
use App\Services\PdfService;
use App\Services\ReportService;
use App\Services\SchoolPerformanceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    public function __construct(
        private readonly ReportService $reports,
        private readonly SchoolPerformanceService $schoolPerformance,
        private readonly PdfService $pdf,
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

    /** The same statement as a real PDF - selectable, searchable, editable text. */
    public function kafilStatementPdf(Request $request, Kafil $kafil)
    {
        $validated = $request->validate([
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date', 'after_or_equal:from'],
        ]);

        [$from, $to] = $this->resolvePeriod($validated);
        $statement = $this->reports->kafilStatement($kafil, $from, $to);

        return $this->download(
            $this->pdf->render('pdf.kafil-statement', [
                'title' => 'كشف الكفيل',
                'subtitle' => "الفترة: {$from} إلى {$to}",
                'entity' => $statement['kafil']['full_name'],
                'statement' => $statement,
            ]),
            $this->filename('kafil-statement', $statement['kafil']['full_name']),
        );
    }

    /**
     * How the sponsored students are doing, ranked, with the cuts the
     * association actually asks for: by gender, level, school, public vs.
     * private, higher education only, and the top N for excellence awards.
     */
    public function schoolPerformance(Request $request): JsonResponse
    {
        return response()->json([
            'data' => $this->schoolPerformance->report($this->validateSchoolPerformance($request)),
        ]);
    }

    private function validateSchoolPerformance(Request $request): array
    {
        return $request->validate([
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
    }

    public function schoolPerformancePdf(Request $request)
    {
        $validated = $this->validateSchoolPerformance($request);
        $report = $this->schoolPerformance->report($validated);

        return $this->download(
            $this->pdf->render('pdf.school-performance', [
                'title' => 'تقرير الأداء الدراسي',
                'subtitle' => 'ترتيب التلاميذ المكفولين حسب نقط الأسدسين',
                'entity' => $report['academic_year']['label'] ?? null,
                'report' => $report,
                'filterSummary' => $this->describeSchoolFilters($validated),
            ], ['landscape' => true]),
            $this->filename('school-performance', $report['academic_year']['label'] ?? 'report'),
        );
    }

    /** A one-line, human-readable echo of the filters, so a printed report says what it covers. */
    private function describeSchoolFilters(array $filters): string
    {
        $parts = [];

        if (!empty($filters['gender'])) {
            $parts[] = $filters['gender'] === 'male' ? 'ذكور' : 'إناث';
        }
        if (!empty($filters['school_type'])) {
            $parts[] = $filters['school_type'] === 'university' ? 'التعليم العالي' : 'التعليم المدرسي';
        }
        if (array_key_exists('is_private', $filters) && $filters['is_private'] !== null) {
            $parts[] = $filters['is_private'] ? 'مؤسسات خاصة' : 'مؤسسات عمومية';
        }
        if (array_key_exists('is_amaso_linked', $filters) && $filters['is_amaso_linked'] !== null) {
            $parts[] = $filters['is_amaso_linked'] ? 'مؤسسات شريكة' : 'مؤسسات غير شريكة';
        }
        if (!empty($filters['education_level_id'])) {
            $parts[] = 'مستوى: ' . (\App\Models\OrphansEducationLevel::find($filters['education_level_id'])?->name_ar ?? '—');
        }
        if (!empty($filters['school_id'])) {
            $parts[] = 'مؤسسة: ' . (\App\Models\School::find($filters['school_id'])?->name ?? '—');
        }

        return $parts === [] ? 'بدون تصفية' : implode(' — ', $parts);
    }

    private function download(string $pdf, string $filename)
    {
        return response($pdf, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
            // The browser fetches this with an Authorization header, so the
            // frontend reads it as a blob - it needs the name from here.
            'Access-Control-Expose-Headers' => 'Content-Disposition',
        ]);
    }

    private function filename(string $prefix, ?string $suffix): string
    {
        $slug = preg_replace('/[^A-Za-z0-9]+/', '-', trim((string) $suffix)) ?: 'report';

        return trim("{$prefix}-{$slug}", '-') . '-' . now()->format('Y-m-d') . '.pdf';
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
