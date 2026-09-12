{{--
    Shared shell for every generated report.

    mPDF supports a practical subset of CSS - no flexbox or grid - so the
    layout leans on tables and block elements, which is also what paginates
    predictably across page breaks.
--}}
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="utf-8">
    <style>
        /* mPDF binds named blocks per page side, not with a plain header/footer property. */
        @page {
            odd-header-name: html_header;
            even-header-name: html_header;
            odd-footer-name: html_footer;
            even-footer-name: html_footer;
        }

        body {
            font-family: notonaskharabic, sans-serif;
            font-size: 9pt;
            color: #1f2937;
            line-height: 1.6;
        }

        /* ---------- header / footer ---------- */
        .doc-header {
            border-bottom: 0.5mm solid #0f766e;
            padding-bottom: 2mm;
            color: #0f766e;
        }
        .doc-header .org {
            font-size: 8pt;
            color: #6b7280;
        }
        .doc-header .title {
            font-size: 15pt;
            font-weight: bold;
        }
        .doc-header .subtitle {
            font-size: 9pt;
            color: #4b5563;
        }
        .doc-footer {
            border-top: 1px solid #e5e7eb;
            padding-top: 2mm;
            font-size: 7.5pt;
            color: #9ca3af;
        }
        .doc-footer .contact {
            font-size: 6.5pt;
            color: #9ca3af;
        }

        /* ---------- meta strip ---------- */
        .meta {
            background: #f0fdfa;
            border: 1px solid #99f6e4;
            border-radius: 2mm;
            padding: 3mm 4mm;
            margin-bottom: 5mm;
        }
        .meta td {
            font-size: 8.5pt;
            padding: 0.6mm 0;
        }
        .meta .k { color: #6b7280; width: 32mm; }
        .meta .v { font-weight: bold; color: #134e4a; }

        /* ---------- stat cards ---------- */
        .stats { width: 100%; margin-bottom: 5mm; }
        .stats td {
            border: 1px solid #e5e7eb;
            border-radius: 2mm;
            padding: 2.5mm 2mm;
            text-align: center;
            background: #fafafa;
        }
        .stats .label { font-size: 7.5pt; color: #6b7280; }
        .stats .value { font-size: 13pt; font-weight: bold; color: #0f766e; padding-top: 1mm; }

        /* ---------- sections ---------- */
        .section-block { page-break-inside: avoid; }
        h2.section {
            font-size: 11pt;
            font-weight: bold;
            color: #0f766e;
            margin: 6mm 0 2mm;
            padding-bottom: 1mm;
            border-bottom: 1px solid #ccfbf1;
        }

        /* ---------- data tables ---------- */
        table.data {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 3mm;
        }
        table.data thead th {
            background: #0f766e;
            color: #ffffff;
            font-size: 8pt;
            font-weight: bold;
            padding: 2mm 1.5mm;
            text-align: right;
            border: 0.2mm solid #0f766e;
        }
        table.data tbody td {
            padding: 1.8mm 1.5mm;
            border-bottom: 0.2mm solid #e5e7eb;
            font-size: 8.5pt;
        }
        table.data tbody tr.alt td { background: #f9fafb; }
        table.data tfoot td {
            padding: 2mm 1.5mm;
            border-top: 0.4mm solid #0f766e;
            font-weight: bold;
            background: #f0fdfa;
        }
        .num { text-align: left; }
        .ltr { direction: ltr; }
        .center { text-align: center; }
        .muted { color: #9ca3af; }
        table.data tbody tr td.rank-medal,
        table.data tbody tr.alt td.rank-medal {
            background: #f59e0b;
            color: #ffffff;
            font-weight: bold;
        }
        .pill {
            font-size: 7pt;
            color: #0f766e;
        }
        .note {
            background: #fffbeb;
            border: 0.2mm solid #fde68a;
            color: #92400e;
            padding: 2.5mm 3mm;
            border-radius: 2mm;
            font-size: 8pt;
            margin-bottom: 4mm;
        }
        .disclosure {
            background: #f9fafb;
            border-right: 1mm solid #0f766e;
            padding: 2.5mm 3mm;
            font-size: 7.5pt;
            color: #4b5563;
            margin-top: 4mm;
        }
        .empty { color: #9ca3af; text-align: center; padding: 4mm; font-size: 8.5pt; }

        /* ---------- entity cards ---------- */
        table.info td { padding: 0.5mm 1mm; font-size: 8.5pt; vertical-align: top; }
        table.info .k { color: #6b7280; }
        table.info .v { font-weight: bold; color: #1f2937; }
        .identity {
            background: #f0fdfa;
            border: 0.2mm solid #99f6e4;
            border-radius: 2mm;
            padding: 3mm 4mm;
            margin-bottom: 4mm;
            text-align: center;
        }
        .identity .name { font-size: 13pt; font-weight: bold; color: #134e4a; }
        .identity .sub { font-size: 8.5pt; color: #4b5563; }
    </style>
</head>
<body>

<htmlpageheader name="header">
    <table class="doc-header" width="100%">
        <tr>
            @isset($logo)
                <td width="15mm" style="vertical-align: middle; padding-left: 3mm;">
                    <img src="{{ $logo }}" width="12mm" height="12mm">
                </td>
            @endisset
            <td style="vertical-align: middle;">
                <div class="org">{{ $organization }}</div>
                <div class="title">{{ $title }}</div>
                @isset($subtitle)
                    <div class="subtitle">{{ $subtitle }}</div>
                @endisset
            </td>
            <td width="38%" style="text-align: left; vertical-align: bottom;">
                @isset($entity)
                    <div class="subtitle" style="font-weight: bold;">{{ $entity }}</div>
                @endisset
                <div class="org">حُرِّر في {{ now()->format('Y-m-d') }}</div>
            </td>
        </tr>
    </table>
</htmlpageheader>

<htmlpagefooter name="footer">
    <table class="doc-footer" width="100%">
        <tr>
            <td>
                {{ $organization }}
                @isset($contact)
                    <div class="contact">{{ $contact }}</div>
                @endisset
            </td>
            <td style="text-align: left; vertical-align: top;">صفحة {PAGENO} من {nbpg}</td>
        </tr>
    </table>
</htmlpagefooter>

@yield('content')

</body>
</html>
