<?php

namespace App\Services;

use App\Support\OrganizationSettings;
use PhpOffice\PhpSpreadsheet\Cell\DataType;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Worksheet\Drawing;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

/**
 * Workbooks that look like the association's reports rather than a database
 * dump: the same mark, the same teal, the same period line as the PDFs.
 *
 * Built here rather than in the browser because the data, the filters and the
 * logo are already on this side - the sheet and the PDF are then two renderings
 * of one report instead of two reports that have to be kept in step.
 */
class SpreadsheetService
{
    private const TEAL = '0F766E';
    private const TEAL_LIGHT = 'CCFBF1';
    private const INK = '0F172A';
    private const MUTED = '64748B';
    private const ZEBRA = 'F8FAFC';

    /** Moroccan dirham, thousands separated, two decimals. */
    private const MONEY_FORMAT = '#,##0.00\ "د.م"';

    /**
     * @param  array<int, array{key: string, label: string, width?: int, money?: bool}>  $columns
     * @param  array<int, array<string, mixed>>  $rows
     * @param  array<string, string>  $meta  extra caption lines under the title
     */
    public function build(
        string $title,
        string $subtitle,
        array $columns,
        array $rows,
        array $meta = [],
    ): string {
        $book = new Spreadsheet();
        $sheet = $book->getActiveSheet();

        // Arabic reads right to left, and so should the sheet - otherwise
        // column A lands on the left and the whole table reads backwards.
        $sheet->setRightToLeft(true);
        $sheet->setTitle($this->safeSheetTitle($title));

        $lastColumn = $this->columnLetter(count($columns));
        $row = $this->writeHeader($sheet, $title, $subtitle, $meta, $lastColumn);

        $headerRow = $row;
        $this->writeColumnHeadings($sheet, $columns, $headerRow);

        $firstDataRow = $headerRow + 1;
        $this->writeRows($sheet, $columns, $rows, $firstDataRow);

        $lastDataRow = $firstDataRow + count($rows) - 1;
        if ($rows !== []) {
            $this->writeTotals($sheet, $columns, $firstDataRow, $lastDataRow);
            // Freeze under the headings so they stay put while scrolling, and
            // give every column a filter dropdown.
            $sheet->freezePane("A{$firstDataRow}");
            $sheet->setAutoFilter("A{$headerRow}:{$lastColumn}{$lastDataRow}");
        }

        $this->applyWidths($sheet, $columns);
        $sheet->getPageSetup()->setFitToWidth(1)->setFitToHeight(0);

        return $this->toString($book);
    }

    /**
     * A report made of several labelled tables rather than one long list -
     * the shape the financial and annual summaries take.
     *
     * @param  array<int, array{heading: string, columns: array, rows: array}>  $sections
     * @param  array<string, string>  $meta
     */
    public function buildSections(
        string $title,
        string $subtitle,
        array $sections,
        array $meta = [],
    ): string {
        $book = new Spreadsheet();
        $sheet = $book->getActiveSheet();
        $sheet->setRightToLeft(true);
        $sheet->setTitle($this->safeSheetTitle($title));

        $widest = max(1, max(array_map(fn ($s) => count($s['columns']), $sections) ?: [1]));
        $row = $this->writeHeader($sheet, $title, $subtitle, $meta, $this->columnLetter($widest));

        foreach ($sections as $section) {
            $sheet->setCellValue('A' . $row, $section['heading']);
            $sheet->getStyle('A' . $row)->getFont()->setBold(true)->setSize(11)
                ->getColor()->setRGB(self::TEAL);
            $row += 1;

            $this->writeColumnHeadings($sheet, $section['columns'], $row);
            $firstDataRow = $row + 1;
            $this->writeRows($sheet, $section['columns'], $section['rows'], $firstDataRow);

            // A blank row between blocks so they read as separate tables.
            $row = $firstDataRow + max(count($section['rows']), 1) + 1;
        }

        foreach ($sections as $section) {
            $this->applyWidths($sheet, $section['columns']);
        }
        $sheet->getPageSetup()->setFitToWidth(1)->setFitToHeight(0);

        return $this->toString($book);
    }

    /** Title block: the mark, the association, the report and its period. */
    private function writeHeader(
        Worksheet $sheet,
        string $title,
        string $subtitle,
        array $meta,
        string $lastColumn,
    ): int {
        $sheet->mergeCells("A1:{$lastColumn}1");
        $sheet->setCellValue('A1', OrganizationSettings::name());
        $sheet->getStyle('A1')->getFont()->setBold(true)->setSize(15)->getColor()->setRGB(self::TEAL);
        $sheet->getStyle('A1')->getAlignment()->setVertical(Alignment::VERTICAL_CENTER);
        $sheet->getRowDimension(1)->setRowHeight(34);

        $sheet->mergeCells("A2:{$lastColumn}2");
        $sheet->setCellValue('A2', $title);
        $sheet->getStyle('A2')->getFont()->setBold(true)->setSize(12)->getColor()->setRGB(self::INK);

        $line = 3;

        // The settings screen promises the address, phone and email will
        // show up on reports; this was the one export that never carried
        // them past the association's name. Kept out of the caption loop
        // below and given an explicit reading order, because it is the one
        // line here that is not necessarily Arabic prose: a Latin-script
        // address on a sheet set right-to-left is exactly the case where a
        // trailing number can fold back past the phone and email that come
        // after it in the same cell.
        $org = OrganizationSettings::all();
        $contact = implode(' · ', array_filter([
            $org['address'] ?? null,
            $org['phone'] ?? null,
            $org['email'] ?? null,
        ])) ?: null;

        if ($contact !== null) {
            $sheet->mergeCells("A{$line}:{$lastColumn}{$line}");
            $sheet->setCellValue("A{$line}", $contact);
            $sheet->getStyle("A{$line}")->getFont()->setSize(10)->getColor()->setRGB(self::MUTED);
            $sheet->getStyle("A{$line}")->getAlignment()->setReadOrder(Alignment::READORDER_LTR);
            $line++;
        }

        $captions = array_values(array_filter([$subtitle, ...array_values($meta)]));
        foreach ($captions as $caption) {
            $sheet->mergeCells("A{$line}:{$lastColumn}{$line}");
            $sheet->setCellValue("A{$line}", $caption);
            $sheet->getStyle("A{$line}")->getFont()->setSize(10)->getColor()->setRGB(self::MUTED);
            $line++;
        }

        $this->placeLogo($sheet, $lastColumn);

        // A rule under the block, then a blank row before the table.
        $sheet->getStyle("A{$line}:{$lastColumn}{$line}")
            ->getBorders()->getBottom()
            ->setBorderStyle(Border::BORDER_MEDIUM)
            ->getColor()->setRGB(self::TEAL);

        return $line + 2;
    }

    /**
     * The logo floats over the header block. It is anchored to the last
     * column so it sits on the side opposite the title in a right-to-left
     * sheet, and skipped rather than failing the export if unreadable.
     */
    private function placeLogo(Worksheet $sheet, string $lastColumn): void
    {
        $path = config('organization.logo_path');
        if (!is_string($path) || !is_readable($path)) {
            return;
        }

        $logo = new Drawing();
        $logo->setName('logo');
        $logo->setDescription(OrganizationSettings::name());
        $logo->setPath($path);
        $logo->setHeight(52);
        $logo->setCoordinates("{$lastColumn}1");
        $logo->setOffsetX(6);
        $logo->setOffsetY(4);
        $logo->setWorksheet($sheet);
    }

    private function writeColumnHeadings(Worksheet $sheet, array $columns, int $row): void
    {
        foreach ($columns as $index => $column) {
            $sheet->setCellValue($this->columnLetter($index + 1) . $row, $column['label']);
        }

        $last = $this->columnLetter(count($columns));
        $style = $sheet->getStyle("A{$row}:{$last}{$row}");
        $style->getFont()->setBold(true)->getColor()->setRGB('FFFFFF');
        $style->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setRGB(self::TEAL);
        $style->getAlignment()
            ->setHorizontal(Alignment::HORIZONTAL_CENTER)
            ->setVertical(Alignment::VERTICAL_CENTER);
        $sheet->getRowDimension($row)->setRowHeight(24);
    }

    private function writeRows(Worksheet $sheet, array $columns, array $rows, int $firstRow): void
    {
        foreach ($rows as $offset => $data) {
            $row = $firstRow + $offset;

            foreach ($columns as $index => $column) {
                $cell = $this->columnLetter($index + 1) . $row;
                $value = $data[$column['key']] ?? null;

                if (!empty($column['money'])) {
                    $sheet->setCellValue($cell, (float) $value);
                    $sheet->getStyle($cell)->getNumberFormat()->setFormatCode(self::MONEY_FORMAT);
                    continue;
                }

                // Written as text so a reference like "0612..." keeps its
                // leading zero instead of being read as a number.
                $sheet->setCellValueExplicit($cell, (string) ($value ?? '—'), DataType::TYPE_STRING);
            }

            if ($offset % 2 === 1) {
                $last = $this->columnLetter(count($columns));
                $sheet->getStyle("A{$row}:{$last}{$row}")
                    ->getFill()->setFillType(Fill::FILL_SOLID)
                    ->getStartColor()->setRGB(self::ZEBRA);
            }
        }

        $last = $this->columnLetter(count($columns));
        $lastRow = $firstRow + max(count($rows) - 1, 0);
        $sheet->getStyle("A{$firstRow}:{$last}{$lastRow}")
            ->getBorders()->getAllBorders()
            ->setBorderStyle(Border::BORDER_THIN)
            ->getColor()->setRGB('E2E8F0');
    }

    /** A SUM under each money column, so the sheet keeps adding up when edited. */
    private function writeTotals(Worksheet $sheet, array $columns, int $firstRow, int $lastRow): void
    {
        $row = $lastRow + 1;
        $last = $this->columnLetter(count($columns));

        $sheet->setCellValue('A' . $row, 'المجموع');

        foreach ($columns as $index => $column) {
            if (empty($column['money'])) {
                continue;
            }
            $letter = $this->columnLetter($index + 1);
            $sheet->setCellValue("{$letter}{$row}", "=SUM({$letter}{$firstRow}:{$letter}{$lastRow})");
            $sheet->getStyle("{$letter}{$row}")->getNumberFormat()->setFormatCode(self::MONEY_FORMAT);
        }

        $style = $sheet->getStyle("A{$row}:{$last}{$row}");
        $style->getFont()->setBold(true)->getColor()->setRGB(self::INK);
        $style->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setRGB(self::TEAL_LIGHT);
        $style->getBorders()->getTop()->setBorderStyle(Border::BORDER_MEDIUM)->getColor()->setRGB(self::TEAL);
    }

    private function applyWidths(Worksheet $sheet, array $columns): void
    {
        foreach ($columns as $index => $column) {
            $sheet->getColumnDimension($this->columnLetter($index + 1))
                ->setWidth($column['width'] ?? 20);
        }
    }

    private function columnLetter(int $index): string
    {
        return \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($index);
    }

    /** Excel rejects these characters in a tab name, and caps it at 31 chars. */
    private function safeSheetTitle(string $title): string
    {
        return mb_substr(str_replace(['*', ':', '/', '\\', '?', '[', ']'], ' ', $title), 0, 31);
    }

    private function toString(Spreadsheet $book): string
    {
        $writer = new Xlsx($book);
        $writer->setPreCalculateFormulas(false);

        ob_start();
        $writer->save('php://output');
        $contents = (string) ob_get_clean();

        $book->disconnectWorksheets();

        return $contents;
    }
}
