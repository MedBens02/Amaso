<?php

namespace App\Services;

use Illuminate\Support\Facades\View;
use Mpdf\Config\ConfigVariables;
use Mpdf\Config\FontVariables;
use Mpdf\Mpdf;
use Mpdf\Output\Destination;

/**
 * Renders reports as real PDFs.
 *
 * The previous approach screenshotted the DOM with html2canvas and pasted the
 * bitmap into a jsPDF page: the text could not be selected, searched, copied
 * or corrected, and a four-page ranking weighed 21 MB. Here the PDF is built
 * from the document structure itself, so the output is selectable, searchable,
 * editable in any PDF editor, and around 1% of the size.
 *
 * Arabic is the reason this runs server-side rather than in the browser: it
 * needs contextual shaping (letters change form by position) and bidirectional
 * layout. mPDF does both natively; the browser-side PDF libraries do not
 * without a pile of pre-processing that still gets edge cases wrong.
 */
class PdfService
{
    /** Bundled so output does not depend on fonts happening to exist on the host. */
    private const FONT_FAMILY = 'notonaskharabic';

    /**
     * @param  string  $view     Blade view under resources/views/pdf
     * @param  array   $data     View data
     * @param  array   $options  landscape: bool
     */
    public function render(string $view, array $data, array $options = []): string
    {
        $html = View::make($view, $this->withBranding($data))->render();

        return $this->fromHtml($html, $options);
    }

    /**
     * Every report carries the association's name and mark. The logo is read
     * off disk rather than linked, so generation never depends on the PDF
     * being able to reach a URL.
     */
    private function withBranding(array $data): array
    {
        $logoPath = config('organization.logo_path');

        return $data + [
            'organization' => config('organization.name'),
            'logo' => is_readable($logoPath)
                ? 'data:image/jpeg;base64,' . base64_encode(file_get_contents($logoPath))
                : null,
        ];
    }

    public function fromHtml(string $html, array $options = []): string
    {
        $mpdf = $this->make($options);
        $mpdf->WriteHTML($html);

        return $mpdf->Output('', Destination::STRING_RETURN);
    }

    private function make(array $options): Mpdf
    {
        $defaultConfig = (new ConfigVariables())->getDefaults();
        $defaultFontConfig = (new FontVariables())->getDefaults();

        $mpdf = new Mpdf([
            'mode' => 'utf-8',
            'format' => ($options['landscape'] ?? false) ? 'A4-L' : 'A4',
            'directionality' => 'rtl',
            'default_font' => self::FONT_FAMILY,
            'default_font_size' => 9,
            'margin_top' => 30,
            'margin_bottom' => 18,
            'margin_left' => 12,
            'margin_right' => 12,
            'margin_header' => 8,
            'margin_footer' => 8,
            'tempDir' => storage_path('app/mpdf'),
            // Noto Naskh covers Arabic only - Latin letters, the minus sign and
            // assorted symbols would otherwise come out as tofu boxes.
            'backupSubsFont' => ['dejavusanscondensed'],
            'fontDir' => array_merge($defaultConfig['fontDir'], [resource_path('fonts')]),
            'fontdata' => $defaultFontConfig['fontdata'] + [
                self::FONT_FAMILY => [
                    'R' => 'NotoNaskhArabic-Regular.ttf',
                    'B' => 'NotoNaskhArabic-Bold.ttf',
                    'useOTL' => 0xFF,   // full OpenType layout: Arabic shaping and ligatures
                    'useKashida' => 75,
                ],
            ],
        ]);

        $mpdf->SetDirectionality('rtl');
        $mpdf->autoScriptToLang = true;
        $mpdf->autoLangToFont = true;
        $mpdf->SetCreator('AMASO');
        $mpdf->SetAuthor('AMASO');

        return $mpdf;
    }
}
