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
use App\Support\Attachment;
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
            'admission_to.after_or_equal' => 'تاريخ نهاية الانتساب يجب أن يكون بعد تاريخ البداية',
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
            $this->reportName('كشف الكفيل', $statement['kafil']['full_name']),
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
            $this->reportName('تقرير الأداء الدراسي', $report['academic_year']['label'] ?? null),
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
            $this->reportName('تقرير الأرامل والأيتام', null),
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
            $this->reportName('التقرير المالي الشامل', $report['period']['from']),
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
            $this->reportName('تقرير الكفلاء والمتبرعين', $report['period']['from']),
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
            $this->reportName('تقرير الأداء السنوي', $report['period']['from']),
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
            $this->reportName('تقرير نقص الكفالة', null),
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
            $this->reportName('متابعة التزامات الكفلاء', $report['period']['from']),
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
            $this->reportName('تقرير استعمال الميزانيات', $report['period']['from']),
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
            $this->reportName('سجل الإيرادات', $report['period']['from']),
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
            $this->reportName('سجل المصروفات', $report['period']['from']),
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
            $this->reportName('سجل الإيرادات', $report['period']['from']),
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
            $this->reportName('سجل المصروفات', $report['period']['from']),
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
                    ['key' => 'sector', 'label' => 'القطاع', 'width' => 20],
                    ['key' => 'neighborhood', 'label' => 'الحي', 'width' => 22],
                    ['key' => 'orphans_count', 'label' => 'عدد الأيتام', 'width' => 14],
                    ['key' => 'sponsorships_count', 'label' => 'عدد الكفالات', 'width' => 14],
                    ['key' => 'admission_date', 'label' => 'تاريخ الانتساب', 'width' => 16],
                ],
                $report['widows'],
                ['count' => 'عدد الأسر: ' . count($report['widows'])],
            ),
            $this->reportName('تقرير الأرامل والأيتام', null),
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
            $this->reportName('تقرير الكفلاء والمتبرعين', $report['period']['from']),
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
            $this->reportName('قائمة الأيتام', null),
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
            $this->reportName('قائمة الأيتام', null),
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
            $this->reportName('التقرير المالي الشامل', $report['period']['from']),
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
            $this->reportName('تقرير الأداء السنوي', $financial['period']['from'] ?? null),
        );
    }

    /**
     * The same five reports as spreadsheets.
     *
     * They could only be downloaded as PDF, which is right for handing to
     * somebody and wrong for anyone who then has to add a column, sort by
     * a different figure or paste the numbers into next year's plan. Each
     * one is built from the same aggregate as its PDF, so the two cannot
     * say different things.
     */
    public function sponsorshipGapsExcel(Request $request)
    {
        $filters = $this->reportFilters($request);
        $report = $this->aggregates->sponsorshipGaps($filters);

        return $this->downloadSheet(
            $this->spreadsheets->build(
                'تقرير نقص الكفالة',
                'الأسر غير المكفولة والأسر ذات التغطية الناقصة',
                [
                    ['key' => 'full_name', 'label' => 'الأسرة', 'width' => 30],
                    ['key' => 'phone', 'label' => 'الهاتف', 'width' => 18],
                    ['key' => 'neighborhood', 'label' => 'الحي', 'width' => 22],
                    ['key' => 'orphans_count', 'label' => 'الأيتام', 'width' => 12],
                    ['key' => 'kafils_count', 'label' => 'الكفلاء', 'width' => 12],
                    ['key' => 'covered', 'label' => 'المغطّى', 'width' => 18, 'money' => true],
                    ['key' => 'shortfall', 'label' => 'النقص', 'width' => 18, 'money' => true],
                ],
                $report['families'],
                array_filter([
                    'target' => 'السقف الشهري: ' . number_format($report['target'], 2) . ' د.م',
                    'scope' => $this->gapsScope($filters),
                    'families' => 'أسر بها نقص: ' . $report['totals']['families_with_gap'],
                    'shortfall' => 'مجموع النقص: ' . number_format($report['totals']['total_shortfall'], 2) . ' د.م',
                ]),
            ),
            $this->reportName('تقرير نقص الكفالة', null),
        );
    }

    public function kafilFollowUpExcel(Request $request)
    {
        $report = $this->aggregates->kafilFollowUp($this->reportFilters($request));

        return $this->downloadSheet(
            $this->spreadsheets->build(
                'متابعة التزامات الكفلاء',
                'المتوقّع مقابل المحصّل خلال الفترة',
                [
                    ['key' => 'full_name', 'label' => 'الكفيل', 'width' => 30],
                    ['key' => 'phone', 'label' => 'الهاتف', 'width' => 18],
                    ['key' => 'families', 'label' => 'الأسر', 'width' => 12],
                    ['key' => 'expected', 'label' => 'المتوقّع', 'width' => 18, 'money' => true],
                    ['key' => 'paid', 'label' => 'المحصّل', 'width' => 18, 'money' => true],
                    ['key' => 'balance', 'label' => 'الفارق', 'width' => 18, 'money' => true],
                    ['key' => 'last_payment', 'label' => 'آخر دفعة', 'width' => 16],
                ],
                $report['kafils'],
                [
                    'period' => "الفترة: {$report['period']['from']} — {$report['period']['to']}",
                    'expected' => 'المتوقّع: ' . number_format($report['totals']['expected'], 2) . ' د.م',
                    'paid' => 'المحصّل: ' . number_format($report['totals']['paid'], 2) . ' د.م',
                    'behind' => 'متأخرون: ' . $report['totals']['behind'],
                ],
            ),
            $this->reportName('متابعة التزامات الكفلاء', $report['period']['from']),
        );
    }

    public function budgetUtilizationExcel(Request $request)
    {
        $report = $this->aggregates->budgetUtilization($this->reportFilters($request));

        return $this->downloadSheet(
            $this->spreadsheets->build(
                'تقرير استعمال الميزانيات',
                'الوارد والمصروف والمتبقي في كل ميزانية',
                [
                    ['key' => 'label', 'label' => 'الميزانية', 'width' => 32],
                    ['key' => 'income', 'label' => 'الإيرادات', 'width' => 18, 'money' => true],
                    ['key' => 'expense', 'label' => 'المصروفات', 'width' => 18, 'money' => true],
                    ['key' => 'remaining', 'label' => 'المتبقي', 'width' => 18, 'money' => true],
                    ['key' => 'utilization', 'label' => 'نسبة الصرف %', 'width' => 16],
                ],
                $report['budgets'],
                [
                    'period' => "الفترة: {$report['period']['from']} — {$report['period']['to']}",
                    'remaining' => 'المتبقي الإجمالي: ' . number_format($report['totals']['remaining'], 2) . ' د.م',
                    'overspent' => 'ميزانيات متجاوزة: ' . $report['totals']['overspent'],
                ],
            ),
            $this->reportName('تقرير استعمال الميزانيات', $report['period']['from']),
        );
    }

    public function schoolPerformanceExcel(Request $request)
    {
        $report = $this->schoolPerformance->report($this->validateSchoolPerformance($request));

        return $this->downloadSheet(
            $this->spreadsheets->buildSections(
                'تقرير الأداء الدراسي',
                'نتائج الأيتام المتمدرسين',
                [
                    [
                        'heading' => 'ترتيب التلاميذ',
                        'columns' => [
                            ['key' => 'rank', 'label' => 'الترتيب', 'width' => 10],
                            ['key' => 'full_name', 'label' => 'التلميذ', 'width' => 28],
                            ['key' => 'family', 'label' => 'الأسرة', 'width' => 26],
                            ['key' => 'school', 'label' => 'المؤسسة', 'width' => 26],
                            ['key' => 'education_level', 'label' => 'المستوى', 'width' => 22],
                            ['key' => 'grade', 'label' => 'النقطة', 'width' => 12],
                            ['key' => 'percentage', 'label' => 'النسبة %', 'width' => 12],
                        ],
                        'rows' => $report['students'] ?? [],
                    ],
                    $this->averages('حسب المؤسسة', 'المؤسسة', $report['by_school'] ?? []),
                    $this->averages('حسب المستوى', 'المستوى', $report['by_level'] ?? []),
                    $this->averages('حسب الجنس', 'الجنس', $report['by_gender'] ?? []),
                ],
                ['year' => 'السنة الدراسية: ' . ($report['academic_year']['label'] ?? '—')],
            ),
            $this->reportName('تقرير الأداء الدراسي', null),
        );
    }

    public function kafilStatementExcel(Request $request, Kafil $kafil)
    {
        $validated = $request->validate([
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date', 'after_or_equal:from'],
        ]);

        [$from, $to] = $this->resolvePeriod($validated);
        $statement = $this->reports->kafilStatement($kafil, $from, $to);

        return $this->downloadSheet(
            $this->spreadsheets->buildSections(
                'كشف الكفيل',
                $statement['kafil']['full_name'],
                [
                    [
                        'heading' => 'المساهمات حسب الميزانية',
                        'columns' => [
                            ['key' => 'label', 'label' => 'الميزانية', 'width' => 30],
                            ['key' => 'amount', 'label' => 'المبلغ', 'width' => 20, 'money' => true],
                        ],
                        // by_budget comes back as a Collection; the sheet
                        // builder wants a plain array.
                        'rows' => collect($statement['contributions']['by_budget'] ?? [])->all(),
                    ],
                    [
                        'heading' => 'الأسر المكفولة',
                        'columns' => [
                            ['key' => 'full_name', 'label' => 'الأسرة', 'width' => 30],
                            ['key' => 'orphans_count', 'label' => 'الأيتام', 'width' => 12],
                            ['key' => 'sponsorship_amount', 'label' => 'الكفالة الشهرية', 'width' => 18, 'money' => true],
                            ['key' => 'designated_total', 'label' => 'المخصّص لها', 'width' => 18, 'money' => true],
                            ['key' => 'received_total', 'label' => 'ما تلقّته خلال الفترة', 'width' => 22, 'money' => true],
                        ],
                        // Flattened: `received` is a nested total and a
                        // breakdown, and a sheet column needs one number.
                        'rows' => collect($statement['families'] ?? [])
                            ->map(fn ($family) => [
                                'full_name' => $family['full_name'] ?? '—',
                                'orphans_count' => $family['orphans_count'] ?? 0,
                                'sponsorship_amount' => $family['sponsorship_amount'] ?? 0,
                                'designated_total' => $family['designated_total'] ?? 0,
                                'received_total' => $family['received']['total'] ?? 0,
                            ])
                            ->all(),
                    ],
                ],
                [
                    'period' => "الفترة: {$from} — {$to}",
                    'contributed' => 'مجموع المساهمات: '
                        . number_format($statement['totals']['contributed'] ?? 0, 2) . ' د.م',
                    'received' => 'ما تلقّته الأسر: '
                        . number_format($statement['totals']['received_by_families'] ?? 0, 2) . ' د.م',
                ],
            ),
            $this->reportName('كشف الكفيل', $statement['kafil']['full_name']),
        );
    }

    public function familyFinancialExcel(Request $request, Widow $widow)
    {
        [$from, $to] = $this->resolvePeriod($this->reportFilters($request));
        $report = $this->familyReports->financial($widow, $from, $to);

        return $this->downloadSheet(
            $this->spreadsheets->build(
                'الكشف المالي للأسرة',
                $report['family']['full_name'],
                [
                    ['key' => 'date', 'label' => 'التاريخ', 'width' => 16],
                    ['key' => 'budget', 'label' => 'الميزانية', 'width' => 22],
                    ['key' => 'category', 'label' => 'الفئة', 'width' => 24],
                    ['key' => 'beneficiary', 'label' => 'المستفيد', 'width' => 26],
                    ['key' => 'amount', 'label' => 'المبلغ', 'width' => 18, 'money' => true],
                ],
                $report['expenses']['rows'] ?? [],
                [
                    'period' => "الفترة: {$report['period']['from']} — {$report['period']['to']}",
                ],
            ),
            $this->reportName('الكشف المالي للأسرة', $widow->id),
        );
    }

    /**
     * A school-performance cut: how many students, what they averaged, and
     * how many passed. Not the label/count/total shape `breakdown()` builds,
     * because an average is not a sum and must not be totalled.
     *
     * @param  array<int, array<string, mixed>>  $rows
     * @return array{heading: string, columns: array, rows: array}
     */
    private function averages(string $heading, string $labelHeading, array $rows): array
    {
        return [
            'heading' => $heading,
            'columns' => [
                ['key' => 'label', 'label' => $labelHeading, 'width' => 30],
                ['key' => 'students', 'label' => 'عدد التلاميذ', 'width' => 14],
                ['key' => 'average_percentage', 'label' => 'المعدل %', 'width' => 14],
                ['key' => 'pass_rate', 'label' => 'نسبة النجاح %', 'width' => 16],
            ],
            'rows' => $rows,
        ];
    }

    /** One line saying what the kafala shortfall report was narrowed to. */
    private function gapsScope(array $filters): ?string
    {
        $parts = [];

        if (!empty($filters['kafil_id'])) {
            $parts[] = 'الكفيل: ' . (Kafil::find($filters['kafil_id'])?->full_name ?? $filters['kafil_id']);
        }

        if (!empty($filters['admission_from']) || !empty($filters['admission_to'])) {
            $parts[] = 'الانتساب: ' . ($filters['admission_from'] ?? '—') . ' — ' . ($filters['admission_to'] ?? '—');
        }

        return $parts === [] ? null : implode('  |  ', $parts);
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

    private function downloadSheet(string $contents, string $name)
    {
        return Attachment::sheet($contents, $name);
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
            $this->reportName('الكشف المالي للأسرة', $widow->id),
        );
    }

    private function reportFilters(Request $request): array
    {
        return $request->validate([
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date', 'after_or_equal:from'],
            'fiscal_year_id' => ['nullable', 'integer', 'exists:fiscal_years,id'],
            'neighborhood' => ['nullable', 'string', 'max:120'],
            'sector_id' => ['nullable', 'integer', 'exists:sectors,id'],
            'disability_flag' => ['nullable', 'boolean'],
            // The widows report's own selectors. They were being sent by the
            // dialog and silently ignored here, which is why filtering it
            // appeared to do nothing.
            'education_level' => ['nullable', 'string', 'max:120'],
            'has_kafil' => ['nullable', 'boolean'],
            'min_age' => ['nullable', 'integer', 'min:0', 'max:120'],
            // gte, so an inverted range is refused rather than quietly
            // returning nothing and looking like there is no such family.
            'max_age' => ['nullable', 'integer', 'min:0', 'max:120', 'gte:min_age'],
            'admission_from' => ['nullable', 'date'],
            'admission_to' => ['nullable', 'date', 'after_or_equal:admission_from'],
            'target' => ['nullable', 'numeric', 'min:0'],
            'kafil_id' => ['nullable', 'integer', 'exists:kafils,id'],
            'status' => ['nullable', 'in:Draft,Approved,Rejected'],
            'budget_id' => ['nullable', 'integer', 'exists:budgets,id'],
        ], [
            'to.after_or_equal' => 'تاريخ النهاية يجب أن يكون بعد تاريخ البداية',
            'admission_to.after_or_equal' => 'تاريخ نهاية الانتساب يجب أن يكون بعد تاريخ البداية',
            'max_age.gte' => 'أكبر عمر يجب أن يكون أكبر من أصغر عمر أو مساوياً له',
        ]);
    }

    private function download(string $pdf, string $name)
    {
        return Attachment::pdf($pdf, $name);
    }

    /**
     * What the downloaded file is called, in the words of the report it came
     * from. Attachment adds the date and the extension.
     *
     * The suffix is whatever narrows this copy from every other copy of the
     * same report - a sponsor's name, a family's, the start of the period.
     * It used to be run through a slug that kept only A-Z and digits, which
     * for an Arabic name left nothing at all: every sponsor's statement was
     * called kafil-statement--2026-09-22.pdf.
     */
    private function reportName(string $name, int|string|null $suffix = null): string
    {
        $suffix = trim((string) $suffix);

        return $suffix === '' ? $name : "{$name} - {$suffix}";
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
