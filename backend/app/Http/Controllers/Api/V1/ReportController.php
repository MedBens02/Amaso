<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\FiscalYear;
use App\Models\Kafil;
use App\Models\Widow;
use App\Services\FamilyReportService;
use App\Services\PdfService;
use App\Services\ReportAggregateService;
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
        private readonly ReportAggregateService $aggregates,
        private readonly FamilyReportService $familyReports,
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
            'group_by' => ['nullable', 'in:none,level,school,gender'],
            'top_n' => ['nullable', 'integer', 'min:1', 'max:500'],
        ], [
            'gender.in' => 'الجنس غير صحيح',
            'school_type.in' => 'نوع المؤسسة غير صحيح',
            'semester.in' => 'الأسدس غير صحيح',
            'group_by.in' => 'التجميع غير صحيح',
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

    /**
     * The association-wide reports. Each has a JSON form for the dialog to
     * preview and a .pdf form that renders the same aggregate - both read the
     * one service, so the screen and the printout can never disagree.
     */
    public function widows(Request $request): JsonResponse
    {
        return response()->json(['data' => $this->aggregates->widows($this->reportFilters($request))]);
    }

    public function widowsPdf(Request $request)
    {
        $report = $this->aggregates->widows($this->reportFilters($request));

        return $this->download(
            $this->pdf->render('pdf.widows', [
                'title' => 'تقرير الأرامل والأيتام',
                'subtitle' => 'إحصائيات الأسر والأطفال المسجلين',
                'report' => $report,
            ]),
            $this->filename('widows-report', null),
        );
    }

    public function financial(Request $request): JsonResponse
    {
        return response()->json(['data' => $this->aggregates->financial($this->reportFilters($request))]);
    }

    public function financialPdf(Request $request)
    {
        $filters = $this->reportFilters($request);
        $report = $this->aggregates->financial($filters);

        return $this->download(
            $this->pdf->render('pdf.financial', [
                'title' => 'التقرير المالي الشامل',
                'subtitle' => 'الإيرادات والمصروفات المعتمدة',
                'entity' => "{$report['period']['from']} — {$report['period']['to']}",
                'report' => $report,
            ]),
            $this->filename('financial-report', $report['period']['from']),
        );
    }

    public function donors(Request $request): JsonResponse
    {
        return response()->json(['data' => $this->aggregates->donors($this->reportFilters($request))]);
    }

    public function donorsPdf(Request $request)
    {
        $report = $this->aggregates->donors($this->reportFilters($request));

        return $this->download(
            $this->pdf->render('pdf.donors', [
                'title' => 'تقرير الكفلاء والمتبرعين',
                'subtitle' => 'المساهمات المسجلة خلال الفترة',
                'entity' => "{$report['period']['from']} — {$report['period']['to']}",
                'report' => $report,
            ]),
            $this->filename('donors-report', $report['period']['from']),
        );
    }

    public function annual(Request $request): JsonResponse
    {
        return response()->json(['data' => $this->aggregates->annual($this->reportFilters($request))]);
    }

    public function annualPdf(Request $request)
    {
        $report = $this->aggregates->annual($this->reportFilters($request));

        return $this->download(
            $this->pdf->render('pdf.annual', [
                'title' => 'تقرير الأداء السنوي',
                'subtitle' => 'الأداء المالي والاجتماعي',
                'entity' => "{$report['period']['from']} — {$report['period']['to']}",
                'report' => $report,
            ]),
            $this->filename('annual-report', $report['period']['from']),
        );
    }

    public function sponsorshipGaps(Request $request): JsonResponse
    {
        return response()->json(['data' => $this->aggregates->sponsorshipGaps($this->reportFilters($request))]);
    }

    public function sponsorshipGapsPdf(Request $request)
    {
        $report = $this->aggregates->sponsorshipGaps($this->reportFilters($request));

        return $this->download(
            $this->pdf->render('pdf.sponsorship-gaps', [
                'title' => 'تقرير نقص الكفالة',
                'subtitle' => 'الأسر غير المكفولة والأسر ذات التغطية الناقصة',
                'report' => $report,
            ], ['landscape' => true]),
            $this->filename('sponsorship-gaps', null),
        );
    }

    public function kafilFollowUp(Request $request): JsonResponse
    {
        return response()->json(['data' => $this->aggregates->kafilFollowUp($this->reportFilters($request))]);
    }

    public function kafilFollowUpPdf(Request $request)
    {
        $report = $this->aggregates->kafilFollowUp($this->reportFilters($request));

        return $this->download(
            $this->pdf->render('pdf.kafil-follow-up', [
                'title' => 'متابعة التزامات الكفلاء',
                'subtitle' => 'المتوقّع مقابل المحصّل خلال الفترة',
                'entity' => "{$report['period']['from']} — {$report['period']['to']}",
                'report' => $report,
            ], ['landscape' => true]),
            $this->filename('kafil-follow-up', $report['period']['from']),
        );
    }

    public function budgetUtilization(Request $request): JsonResponse
    {
        return response()->json(['data' => $this->aggregates->budgetUtilization($this->reportFilters($request))]);
    }

    public function budgetUtilizationPdf(Request $request)
    {
        $report = $this->aggregates->budgetUtilization($this->reportFilters($request));

        return $this->download(
            $this->pdf->render('pdf.budget-utilization', [
                'title' => 'تقرير استعمال الميزانيات',
                'subtitle' => 'الوارد والمصروف والمتبقي في كل ميزانية',
                'entity' => "{$report['period']['from']} — {$report['period']['to']}",
                'report' => $report,
            ]),
            $this->filename('budget-utilization', $report['period']['from']),
        );
    }

    /** The income ledger as a PDF - the pages could only produce CSV before. */
    public function incomeListPdf(Request $request)
    {
        $report = $this->aggregates->incomeList($this->reportFilters($request));

        return $this->download(
            $this->pdf->render('pdf.transactions', [
                'title' => 'سجل الإيرادات',
                'subtitle' => 'العمليات المسجلة خلال الفترة',
                'entity' => "{$report['period']['from']} — {$report['period']['to']}",
                'kind' => 'income',
                'report' => $report,
            ], ['landscape' => true]),
            $this->filename('incomes', $report['period']['from']),
        );
    }

    public function expenseListPdf(Request $request)
    {
        $report = $this->aggregates->expenseList($this->reportFilters($request));

        return $this->download(
            $this->pdf->render('pdf.transactions', [
                'title' => 'سجل المصروفات',
                'subtitle' => 'العمليات المسجلة خلال الفترة',
                'entity' => "{$report['period']['from']} — {$report['period']['to']}",
                'kind' => 'expense',
                'report' => $report,
            ], ['landscape' => true]),
            $this->filename('expenses', $report['period']['from']),
        );
    }

    /** Everything the association has done for one family, in one document. */
    public function familyFinancial(Request $request, Widow $widow): JsonResponse
    {
        [$from, $to] = $this->resolvePeriod($this->reportFilters($request));

        return response()->json(['data' => $this->familyReports->financial($widow, $from, $to)]);
    }

    public function familyFinancialPdf(Request $request, Widow $widow)
    {
        [$from, $to] = $this->resolvePeriod($this->reportFilters($request));
        $report = $this->familyReports->financial($widow, $from, $to);

        return $this->download(
            $this->pdf->render('pdf.family-financial', [
                'title' => 'التقرير المالي للأسرة',
                'subtitle' => "الفترة: {$from} إلى {$to}",
                'entity' => $widow->full_name,
                'report' => $report,
            ]),
            $this->filename('family-financial', $widow->id),
        );
    }

    private function reportFilters(Request $request): array
    {
        return $request->validate([
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date', 'after_or_equal:from'],
            'fiscal_year_id' => ['nullable', 'integer', 'exists:fiscal_years,id'],
            'neighborhood' => ['nullable', 'string', 'max:120'],
            'disability_flag' => ['nullable', 'boolean'],
            'target' => ['nullable', 'numeric', 'min:0'],
            'status' => ['nullable', 'in:Draft,Approved,Rejected'],
            'budget_id' => ['nullable', 'integer', 'exists:budgets,id'],
        ], [
            'to.after_or_equal' => 'تاريخ النهاية يجب أن يكون بعد تاريخ البداية',
        ]);
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
        $slug = trim(preg_replace('/[^A-Za-z0-9]+/', '-', (string) $suffix), '-');

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
