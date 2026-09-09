<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Donor;
use App\Models\Income;
use App\Models\Kafil;
use App\Models\Orphan;
use App\Models\Widow;
use App\Services\PdfService;
use Illuminate\Http\Request;

/**
 * Per-entity information cards as real PDFs.
 *
 * These were screenshots of a hidden DOM tree, which meant a printed card
 * could not be searched or corrected and carried the whole page as a bitmap.
 * They are rendered from Blade now, like the reports.
 */
class CardController extends Controller
{
    public function __construct(private readonly PdfService $pdf)
    {
    }

    public function widow(Request $request, Widow $widow)
    {
        // The card is section-selectable in the UI; anything not named stays on.
        $sections = [
            'personal' => $request->boolean('personal', true),
            'housing' => $request->boolean('housing', true),
            'orphans' => $request->boolean('orphans', true),
            'additional' => $request->boolean('additional', true),
        ];

        $widow->load([
            'orphans.educationLevel',
            'widowSocial.housingType',
            'skills',
            'illnesses',
            'aidTypes',
            'maouna.partner',
            'sponsorships.kafil.donor',
        ]);

        return $this->download(
            $this->pdf->render('pdf.widow-card', [
                'title' => 'بطاقة معلومات الأسرة',
                'entity' => $widow->full_name,
                'widow' => $widow,
                'sections' => $sections,
            ]),
            $this->filename('widow-card', $widow->id),
        );
    }

    public function orphan(Orphan $orphan)
    {
        $orphan->load([
            'widow',
            'educationLevel',
            'currentEnrollment.school',
            'enrollments.academicYear',
            'enrollments.educationLevel',
            'enrollments.school',
        ]);

        return $this->download(
            $this->pdf->render('pdf.orphan-card', [
                'title' => 'بطاقة معلومات اليتيم',
                'entity' => trim("{$orphan->first_name} {$orphan->last_name}"),
                'orphan' => $orphan,
            ]),
            $this->filename('orphan-card', $orphan->id),
        );
    }

    public function donor(Donor $donor)
    {
        $donor->load('kafil');

        $incomes = Income::with(['budget', 'incomeCategory'])
            ->where('donor_id', $donor->id)
            ->orderByDesc('income_date')
            ->get();

        return $this->download(
            $this->pdf->render('pdf.donor-card', [
                'title' => 'بطاقة المتبرع',
                'entity' => trim("{$donor->first_name} {$donor->last_name}"),
                'donor' => $donor,
                'incomes' => $incomes,
            ]),
            $this->filename('donor-card', $donor->id),
        );
    }

    public function kafil(Kafil $kafil)
    {
        $kafil->load(['donor', 'sponsorships.widow.orphans']);

        return $this->download(
            $this->pdf->render('pdf.kafil-card', [
                'title' => 'بطاقة الكفيل',
                'entity' => $kafil->full_name,
                'kafil' => $kafil,
            ]),
            $this->filename('kafil-card', $kafil->id),
        );
    }

    private function download(string $pdf, string $filename)
    {
        return response($pdf, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
            'Access-Control-Expose-Headers' => 'Content-Disposition',
        ]);
    }

    private function filename(string $prefix, int|string $id): string
    {
        return "{$prefix}-{$id}-" . now()->format('Y-m-d') . '.pdf';
    }
}
