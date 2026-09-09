@extends('pdf.layout')

@php
    use App\Support\PdfFormat;
@endphp

@section('content')

    <table class="meta" width="100%">
        <tr>
            <td class="k">الفترة</td>
            <td class="v">{{ $report['period']['from'] }} إلى {{ $report['period']['to'] }}</td>
            <td class="k">ميزانيات متجاوزة</td>
            <td class="v">{{ $report['totals']['overspent'] }}</td>
        </tr>
    </table>

    <table class="stats" width="100%">
        <tr>
            <td width="33%"><div class="label">مجموع الإيرادات</div><div class="value">{{ PdfFormat::money($report['totals']['income']) }}</div></td>
            <td width="33%"><div class="label">مجموع المصروفات</div><div class="value">{{ PdfFormat::money($report['totals']['expense']) }}</div></td>
            <td width="34%"><div class="label">المتبقي</div><div class="value" style="color: {{ $report['totals']['remaining'] >= 0 ? '#15803d' : '#b91c1c' }}">{{ PdfFormat::money($report['totals']['remaining']) }}</div></td>
        </tr>
    </table>

    <h2 class="section">استعمال الميزانيات</h2>
    <table class="data">
        <thead>
            <tr>
                <th width="34%">الميزانية</th>
                <th width="18%" class="num">الإيرادات</th>
                <th width="18%" class="num">المصروفات</th>
                <th width="18%" class="num">المتبقي</th>
                <th width="12%" class="center">نسبة الصرف</th>
            </tr>
        </thead>
        <tbody>
            @forelse ($report['budgets'] as $i => $budget)
                <tr class="{{ $i % 2 ? 'alt' : '' }}">
                    <td>
                        {{ $budget['label'] }}
                        @if ($budget['is_default'])<span class="pill">افتراضية</span>@endif
                    </td>
                    <td class="num">{{ PdfFormat::money($budget['income']) }}</td>
                    <td class="num">{{ PdfFormat::money($budget['expense']) }}</td>
                    <td class="num" style="font-weight: bold; color: {{ $budget['remaining'] >= 0 ? '#15803d' : '#b91c1c' }}">
                        {{ PdfFormat::money($budget['remaining']) }}
                    </td>
                    <td class="center">{{ $budget['utilization'] === null ? '—' : PdfFormat::percent($budget['utilization']) }}</td>
                </tr>
            @empty
                <tr><td colspan="5" class="empty">لا توجد ميزانيات.</td></tr>
            @endforelse
        </tbody>
        <tfoot>
            <tr>
                <td>المجموع</td>
                <td class="num">{{ PdfFormat::money($report['totals']['income']) }}</td>
                <td class="num">{{ PdfFormat::money($report['totals']['expense']) }}</td>
                <td class="num">{{ PdfFormat::money($report['totals']['remaining']) }}</td>
                <td></td>
            </tr>
        </tfoot>
    </table>

@endsection
