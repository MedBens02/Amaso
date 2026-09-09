@extends('pdf.layout')

@php
    use App\Support\PdfFormat;

    $money = fn ($v) => PdfFormat::money($v);
    $financial = $report['financial'];
@endphp

@section('content')

    <table class="meta" width="100%">
        <tr>
            <td class="k">الفترة</td>
            <td class="v">{{ $report['period']['from'] }} إلى {{ $report['period']['to'] }}</td>
            <td class="k">الرصيد</td>
            <td class="v">{{ $money($financial['totals']['balance']) }}</td>
        </tr>
    </table>

    <h2 class="section">المؤشرات المالية</h2>
    <table class="stats" width="100%">
        <tr>
            <td width="25%"><div class="label">الإيرادات</div><div class="value">{{ $money($financial['totals']['income']) }}</div></td>
            <td width="25%"><div class="label">المصروفات</div><div class="value">{{ $money($financial['totals']['expense']) }}</div></td>
            <td width="25%"><div class="label">عدد الإيرادات</div><div class="value">{{ $financial['totals']['income_count'] }}</div></td>
            <td width="25%"><div class="label">عدد المصروفات</div><div class="value">{{ $financial['totals']['expense_count'] }}</div></td>
        </tr>
    </table>

    <h2 class="section">المؤشرات الاجتماعية</h2>
    <table class="stats" width="100%">
        <tr>
            <td width="25%"><div class="label">الأرامل</div><div class="value">{{ $report['beneficiaries']['widows'] }}</div></td>
            <td width="25%"><div class="label">الأيتام</div><div class="value">{{ $report['beneficiaries']['orphans'] }}</div></td>
            <td width="25%"><div class="label">أسر مكفولة</div><div class="value">{{ $report['beneficiaries']['sponsored_widows'] }}</div></td>
            <td width="25%"><div class="label">نسبة التغطية (%)</div><div class="value">{{ PdfFormat::number($report['beneficiaries']['sponsorship_coverage'], 1) }}</div></td>
        </tr>
    </table>

    <div class="section-block">
        <h2 class="section">الحركة الشهرية</h2>
        <table class="data">
            <thead>
                <tr>
                    <th width="25%">الشهر</th>
                    <th width="25%" class="num">الإيرادات</th>
                    <th width="25%" class="num">المصروفات</th>
                    <th width="25%" class="num">الرصيد</th>
                </tr>
            </thead>
            <tbody>
                @forelse ($report['monthly'] as $i => $month)
                    <tr class="{{ $i % 2 ? 'alt' : '' }}">
                        <td>{{ $month['label'] }}</td>
                        <td class="num">{{ $money($month['income']) }}</td>
                        <td class="num">{{ $money($month['expense']) }}</td>
                        <td class="num" style="color: {{ $month['balance'] >= 0 ? '#15803d' : '#b91c1c' }}">{{ $money($month['balance']) }}</td>
                    </tr>
                @empty
                    <tr><td colspan="4" class="empty">لا توجد حركة مسجلة في هذه الفترة.</td></tr>
                @endforelse
            </tbody>
            <tfoot>
                <tr>
                    <td>المجموع</td>
                    <td class="num">{{ $money($financial['totals']['income']) }}</td>
                    <td class="num">{{ $money($financial['totals']['expense']) }}</td>
                    <td class="num">{{ $money($financial['totals']['balance']) }}</td>
                </tr>
            </tfoot>
        </table>
    </div>

    @include('pdf.partials.breakdown', ['heading' => 'الإيرادات حسب الميزانية', 'rows' => $financial['income_by_budget'], 'formatter' => $money])
    @include('pdf.partials.breakdown', ['heading' => 'المصروفات حسب الميزانية', 'rows' => $financial['expense_by_budget'], 'formatter' => $money])

@endsection
