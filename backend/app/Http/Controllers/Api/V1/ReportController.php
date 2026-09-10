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
use App\Services\SpreadsheetService;
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
        private readonly SpreadsheetService $spreadsheets,
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
                'entity' => \App\Support\PdfFormat::periodLabel($report['period']['from'], $report['period']['to']),
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
                'entity' => \App\Support\PdfFormat::periodLabel($report['period']['from'], $report['period']['to']),
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
                'entity' => \App\Support\PdfFormat::periodLabel($report['period']['from'], $report['period']['to']),
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
                'entity' => \App\Support\PdfFormat::periodLabel($report['period']['from'], $report['period']['to']),
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
                'entity' => \App\Support\PdfFormat::periodLabel($report['period']['from'], $report['period']['to']),
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
                'entity' => \App\Support\PdfFormat::periodLabel($report['period']['from'], $report['period']['to']),
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
                'entity' => \App\Support\PdfFormat::periodLabel($report['period']['from'], $report['period']['to']),
                'kind' => 'expense',
                'report' => $report,
            ], ['landscape' => true]),
            $this->filename('expenses', $report['period']['from']),
        );
    }

    public function incomeListExcel(Request $request)
    {
        $report = $this->aggregates->incomeList($this->reportFilters($request));

        return $this->downloadSheet(
            $this->spreadsheets->build(
                'سجل الإيرادات',
                'العمليات المسجلة خلال الفترة',
                [
                    ['key' => 'date', 'label' => 'التاريخ', 'width' => 14],
                    ['key' => 'source', 'label' => 'المصدر', 'width' => 28],
                    ['key' => 'budget', 'label' => 'الميزانية', 'width' => 24],
                    ['key' => 'category', 'label' => 'التصنيف', 'width' => 24],
                    ['key' => 'payment_method', 'label' => 'طريقة الأداء', 'width' => 16],
                    ['key' => 'status', 'label' => 'الحالة', 'width' => 14],
                    ['key' => 'amount', 'label' => 'المبلغ', 'width' => 18, 'money' => true],
                ],
                $report['rows'],
                $this->periodCaptions($report),
            ),
            $this->filename('incomes', $report['period']['from'], 'xlsx'),
        );
    }

    public function expenseListExcel(Request $request)
    {
        $report = $this->aggregates->expenseList($this->reportFilters($request));

        return $this->downloadSheet(
            $this->spreadsheets->build(
                'سجل المصروفات',
                'العمليات المسجلة خلال الفترة',
                [
                    ['key' => 'date', 'label' => 'التاريخ', 'width' => 14],
                    ['key' => 'budget', 'label' => 'الميزانية', 'width' => 24],
                    ['key' => 'category', 'label' => 'التصنيف', 'width' => 24],
                    ['key' => 'partner', 'label' => 'الشريك', 'width' => 24],
                    ['key' => 'payment_method', 'label' => 'طريقة الأداء', 'width' => 16],
                    ['key' => 'status', 'label' => 'الحالة', 'width' => 14],
                    ['key' => 'amount', 'label' => 'المبلغ', 'width' => 18, 'money' => true],
                ],
                $report['rows'],
                $this->periodCaptions($report),
            ),
            $this->filename('expenses', $report['period']['from'], 'xlsx'),
        );
    }

    public function widowsExcel(Request $request)
    {
        $report = $this->aggregates->widows($this->reportFilters($request));

        return $this->downloadSheet(
            $this->spreadsheets->build(
                'قائمة الأرامل',
                'الأسر المسجلة لدى الجمعية',
                [
                    ['key' => 'full_name', 'label' => 'الاسم الكامل', 'width' => 30],
                    ['key' => 'phone', 'label' => 'الهاتف', 'width' => 18],
                    ['key' => 'neighborhood', 'label' => 'الحي', 'width' => 22],
                    ['key' => 'orphans_count', 'label' => 'عدد الأيتام', 'width' => 14],
                    ['key' => 'sponsorships_count', 'label' => 'عدد الكفالات', 'width' => 14],
                    ['key' => 'admission_date', 'label' => 'تاريخ الانتساب', 'width' => 16],
                ],
                $report['widows'],
                ['count' => 'عدد الأسر: ' . count($report['widows'])],
            ),
            $this->filename('widows', null, 'xlsx'),
        );
    }

    public function donorsExcel(Request $request)
    {
        $report = $this->aggregates->donors($this->reportFilters($request));

        // The aggregate keys this list 'donors', not 'rows'.
        $rows = array_map(fn (array $row) => $row + [
            'kafil_label' => $row['is_kafil'] ? 'كفيل' : 'متبرع',
        ], $report['donors']);

        return $this->downloadSheet(
            $this->spreadsheets->build(
                'قائمة المتبرعين',
                'المتبرعون والكفلاء ومساهماتهم',
                [
                    ['key' => 'full_name', 'label' => 'الاسم الكامل', 'width' => 30],
                    ['key' => 'kafil_label', 'label' => 'الصفة', 'width' => 12],
                    ['key' => 'phone', 'label' => 'الهاتف', 'width' => 18],
                    ['key' => 'email', 'label' => 'البريد الإلكتروني', 'width' => 28],
                    ['key' => 'period_payments', 'label' => 'عدد الدفعات', 'width' => 14],
                    ['key' => 'period_total', 'label' => 'مساهمات الفترة', 'width' => 18, 'money' => true],
                    ['key' => 'total_given', 'label' => 'مجموع المساهمات', 'width' => 18, 'money' => true],
                ],
                $rows,
                $this->periodCaptions(['period' => $report['period'], 'totals' => ['count' => count($rows)]]),
            ),
            $this->filename('donors', $report['period']['from'], 'xlsx'),
        );
    }

    public function orphansExcel(Request $request)
    {
        $report = $this->aggregates->orphanList($request->only(['gender', 'is_schooled']));

        return $this->downloadSheet(
            $this->spreadsheets->build(
                'قائمة الأيتام',
                'الأيتام المسجلون لدى الجمعية',
                [
                    ['key' => 'full_name', 'label' => 'الاسم الكامل', 'width' => 28],
                    ['key' => 'gender', 'label' => 'الجنس', 'width' => 10],
                    ['key' => 'age', 'label' => 'العمر', 'width' => 10],
                    ['key' => 'birth_date', 'label' => 'تاريخ الميلاد', 'width' => 16],
                    ['key' => 'widow', 'label' => 'الأسرة', 'width' => 28],
                    ['key' => 'schooling', 'label' => 'التمدرس', 'width' => 14],
                    ['key' => 'education_level', 'label' => 'المستوى', 'width' => 18],
                ],
                $report['rows'],
                [
                    'count' => "عدد الأيتام: {$report['totals']['count']}",
                    'split' => "ذكور: {$report['totals']['male']} — إناث: {$report['totals']['female']}",
                    'schooled' => "متمدرسون: {$report['totals']['schooled']}",
                ],
            ),
            $this->filename('orphans', null, 'xlsx'),
        );
    }

    public function orphansPdf(Request $request)
    {
        $report = $this->aggregates->orphanList($request->only(['gender', 'is_schooled']));

        return $this->download(
            $this->pdf->render('pdf.list', [
                'title' => 'قائمة الأيتام',
                'subtitle' => 'الأيتام المسجلون لدى الجمعية',
                'entity' => null,
                'heading' => 'الأيتام',
                'columns' => [
                    ['key' => 'full_name', 'label' => 'الاسم الكامل', 'width' => '24%'],
                    ['key' => 'gender', 'label' => 'الجنس', 'width' => '9%', 'align' => 'center'],
                    ['key' => 'age', 'label' => 'العمر', 'width' => '8%', 'align' => 'center'],
                    ['key' => 'birth_date', 'label' => 'تاريخ الميلاد', 'width' => '13%', 'align' => 'center'],
                    ['key' => 'widow', 'label' => 'الأسرة', 'width' => '24%'],
                    ['key' => 'schooling', 'label' => 'التمدرس', 'width' => '10%', 'align' => 'center'],
                    ['key' => 'education_level', 'label' => 'المستوى', 'width' => '12%'],
                ],
                'rows' => $report['rows'],
                'meta' => ['عدد الأيتام' => $report['totals']['count']],
                'stats' => [
                    ['label' => 'ذكور', 'value' => $report['totals']['male']],
                    ['label' => 'إناث', 'value' => $report['totals']['female']],
                    ['label' => 'متمدرسون', 'value' => $report['totals']['schooled']],
                ],
            ], ['landscape' => true]),
            $this->filename('orphans', null),
        );
    }

    public function financialExcel(Request $request)
    {
        $report = $this->aggregates->financial($this->reportFilters($request));

        return $this->downloadSheet(
            $this->spreadsheets->buildSections(
                'التقرير المالي الشامل',
                'ملخص الإيرادات والمصروفات',
                [
                    $this->breakdown('الإيرادات حسب الميزانية', $report['income_by_budget']),
                    $this->breakdown('الإيرادات حسب التصنيف', $report['income_by_category']),
                    $this->breakdown('المصروفات حسب الميزانية', $report['expense_by_budget']),
                    $this->breakdown('المصروفات حسب التصنيف', $report['expense_by_category']),
                    $this->breakdown('حسب طريقة الأداء', $report['by_payment_method']),
                ],
                [
                    'period' => "الفترة: {$report['period']['from']} — {$report['period']['to']}",
                    'income' => 'مجموع الإيرادات: ' . number_format($report['totals']['income'], 2) . ' د.م',
                    'expense' => 'مجموع المصروفات: ' . number_format($report['totals']['expense'], 2) . ' د.م',
                    'balance' => 'الرصيد: ' . number_format($report['totals']['balance'], 2) . ' د.م',
                ],
            ),
            $this->filename('financial', $report['period']['from'], 'xlsx'),
        );
    }

    public function annualExcel(Request $request)
    {
        $report = $this->aggregates->annual($this->reportFilters($request));
        $financial = $report['financial'] ?? $report;

        return $this->downloadSheet(
            $this->spreadsheets->buildSections(
                'تقرير الأداء السنوي',
                'الأداء المالي والاجتماعي خلال السنة',
                [
                    $this->breakdown('الإيرادات حسب الميزانية', $financial['income_by_budget'] ?? []),
                    $this->breakdown('المصروفات حسب الميزانية', $financial['expense_by_budget'] ?? []),
                    $this->breakdown('التوزيع حسب الحي', $report['widows']['by_neighborhood'] ?? [], 'الحي', 'العدد', false),
                ],
                [
                    'period' => "الفترة: {$financial['period']['from']} — {$financial['period']['to']}",
                ],
            ),
            $this->filename('annual', $financial['period']['from'] ?? null, 'xlsx'),
        );
    }

    /**
     * A label/count/total block as the aggregates return them.
     *
     * @param  array<int, array<string, mixed>>  $rows
     * @return array{heading: string, columns: array, rows: array}
     */
    private function breakdown(
        string $heading,
        array $rows,
        string $labelHeading = 'البند',
        string $valueHeading = 'المبلغ',
        bool $money = true,
    ): array {
        $columns = [
            ['key' => 'label', 'label' => $labelHeading, 'width' => 32],
            ['key' => 'count', 'label' => 'العدد', 'width' => 12],
            ['key' => 'total', 'label' => $valueHeading, 'width' => 20, 'money' => $money],
        ];

        return [
            'heading' => $heading,
            'columns' => $columns,
            'rows' => array_map(fn (array $row) => $row + ['count' => $row['count'] ?? ''], $rows),
        ];
    }

    /** @return array<string, string> */
    private function periodCaptions(array $report): array
    {
        return [
            'period' => 'الفترة: ' . \App\Support\PdfFormat::periodLabel($report['period']['from'], $report['period']['to']),
            'count' => "عدد العمليات: {$report['totals']['count']}",
            'generated' => 'تاريخ الإصدار: ' . now()->format('Y-m-d H:i'),
        ];
    }

    private function downloadSheet(string $contents, string $filename)
    {
        return response($contents, 200, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
            'Access-Control-Expose-Headers' => 'Content-Disposition',
        ]);
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

    private function filename(string $prefix, ?string $suffix, string $extension = 'pdf'): string
    {
        $slug = trim(preg_replace('/[^A-Za-z0-9]+/', '-', (string) $suffix), '-');

        return trim("{$prefix}-{$slug}", '-') . '-' . now()->format('Y-m-d') . '.' . $extension;
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
