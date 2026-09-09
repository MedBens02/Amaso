@extends('pdf.layout')

@php
    use App\Support\PdfFormat;

    $money = fn ($v) => PdfFormat::money($v);
@endphp

@section('content')

    <table class="meta" width="100%">
        <tr>
            <td class="k">الفترة</td>
            <td class="v">{{ $report['period']['from'] }} إلى {{ $report['period']['to'] }}</td>
            <td class="k">عدد العمليات</td>
            <td class="v">{{ $report['totals']['income_count'] }} إيراد / {{ $report['totals']['expense_count'] }} مصروف</td>
        </tr>
    </table>

    <table class="stats" width="100%">
        <tr>
            <td width="25%"><div class="label">إجمالي الإيرادات</div><div class="value">{{ $money($report['totals']['income']) }}</div></td>
            <td width="25%"><div class="label">إجمالي المصروفات</div><div class="value">{{ $money($report['totals']['expense']) }}</div></td>
            <td width="25%"><div class="label">الرصيد</div><div class="value" style="color: {{ $report['totals']['balance'] >= 0 ? '#15803d' : '#b91c1c' }}">{{ $money($report['totals']['balance']) }}</div></td>
            <td width="25%"><div class="label">من متبرعين (%)</div><div class="value">{{ PdfFormat::number($report['totals']['from_donors'], 1) }}</div></td>
        </tr>
    </table>

    @include('pdf.partials.breakdown', ['heading' => 'الإيرادات حسب الميزانية', 'rows' => $report['income_by_budget'], 'formatter' => $money])
    @include('pdf.partials.breakdown', ['heading' => 'الإيرادات حسب الفئة', 'rows' => $report['income_by_category'], 'formatter' => $money])
    @include('pdf.partials.breakdown', ['heading' => 'المصروفات حسب الميزانية', 'rows' => $report['expense_by_budget'], 'formatter' => $money])
    @include('pdf.partials.breakdown', ['heading' => 'المصروفات حسب الفئة', 'rows' => $report['expense_by_category'], 'formatter' => $money])
    @include('pdf.partials.breakdown', ['heading' => 'الإيرادات حسب طريقة الدفع', 'rows' => $report['by_payment_method'], 'formatter' => $money])

@endsection
