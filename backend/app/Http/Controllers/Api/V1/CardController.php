<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Donor;
use App\Models\Income;
use App\Models\Kafil;
use App\Models\Orphan;
use App\Models\Widow;
use App\Support\Attachment;
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
            $this->cardName('بطاقة الأسرة', $widow->full_name),
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
            // The year's mark is worked out from these.
            'enrollments.grades',
        ]);

        return $this->download(
            $this->pdf->render('pdf.orphan-card', [
                'title' => 'بطاقة معلومات اليتيم',
                'entity' => trim("{$orphan->first_name} {$orphan->last_name}"),
                'orphan' => $orphan,
            ]),
            $this->cardName('بطاقة اليتيم', trim("{$orphan->first_name} {$orphan->last_name}")),
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
            $this->cardName('بطاقة المتبرع', trim("{$donor->first_name} {$donor->last_name}")),
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
            $this->cardName('بطاقة الكفيل', $kafil->full_name),
        );
    }

    private function download(string $pdf, string $name)
    {
        return Attachment::pdf($pdf, $name, 'card');
    }

    /**
     * A card is about one person, so it is named after them. It used to be
     * named after their row id - widow-card-17.pdf - which is unfindable in
     * a folder of thirty of them.
     */
    private function cardName(string $kind, string $who): string
    {
        return trim("{$kind} - {$who}");
    }
}
