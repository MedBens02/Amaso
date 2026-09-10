{{-- Shared listing for the income and expense ledgers; $kind switches the columns. --}}
@extends('pdf.layout')

@php
    use App\Support\PdfFormat;

    $status = fn ($s) => match ($s) {
        'Approved' => 'معتمد', 'Draft' => 'مسودة', 'Rejected' => 'مرفوض', default => $s,
    };
    $method = fn ($m) => match ($m) {
        'Cash' => 'نقدي', 'Cheque' => 'شيك', 'BankWire' => 'تحويل بنكي', default => $m ?? '—',
    };
@endphp

@section('content')

    <table class="meta" width="100%">
        <tr>
            <td class="k">الفترة</td>
            <td class="v">{{ PdfFormat::periodLabel($report['period']['from'], $report['period']['to']) }}</td>
            <td class="k">عدد العمليات</td>
            <td class="v">{{ $report['totals']['count'] }}</td>
        </tr>
    </table>

    <table class="stats" width="100%">
        <tr>
            <td width="33%"><div class="label">المجموع</div><div class="value">{{ PdfFormat::money($report['totals']['total']) }}</div></td>
            <td width="33%"><div class="label">المعتمد</div><div class="value" style="color: #15803d">{{ PdfFormat::money($report['totals']['approved']) }}</div></td>
            <td width="34%"><div class="label">المسودات</div><div class="value" style="color: #b45309">{{ PdfFormat::money($report['totals']['draft']) }}</div></td>
        </tr>
    </table>

    <h2 class="section">{{ $kind === 'income' ? 'سجل الإيرادات' : 'سجل المصروفات' }}</h2>
    <table class="data">
        <thead>
            <tr>
                <th width="11%">التاريخ</th>
                @if ($kind === 'income')
                    <th width="21%">المصدر</th>
                @else
                    <th width="17%">الشريك</th>
                    <th width="7%" class="center">مستفيدون</th>
                @endif
                <th width="21%">الميزانية</th>
                <th width="19%">الفئة</th>
                <th width="10%" class="center">الأداء</th>
                <th width="9%" class="center">الحالة</th>
                <th width="12%" class="num">المبلغ</th>
            </tr>
        </thead>
        <tbody>
            @forelse ($report['rows'] as $i => $row)
                <tr class="{{ $i % 2 ? 'alt' : '' }}">
                    <td>{{ $row['date'] }}</td>
                    @if ($kind === 'income')
                        <td>{{ $row['source'] }}</td>
                    @else
                        <td>{{ $row['partner'] ?? '—' }}</td>
                        <td class="center">{{ $row['beneficiaries'] ?: '—' }}</td>
                    @endif
                    <td>{{ $row['budget'] ?? '—' }}</td>
                    <td>{{ $row['category'] ?? '—' }}</td>
                    <td class="center">{{ $method($row['payment_method']) }}</td>
                    <td class="center" style="color: {{ $row['status'] === 'Approved' ? '#15803d' : '#b45309' }}">
                        {{ $status($row['status']) }}
                    </td>
                    <td class="num">{{ PdfFormat::money($row['amount']) }}</td>
                </tr>
            @empty
                <tr><td colspan="{{ $kind === 'income' ? 7 : 8 }}" class="empty">لا توجد عمليات في هذه الفترة.</td></tr>
            @endforelse
        </tbody>
        <tfoot>
            <tr>
                <td colspan="{{ $kind === 'income' ? 6 : 7 }}">المجموع</td>
                <td class="num">{{ PdfFormat::money($report['totals']['total']) }}</td>
            </tr>
        </tfoot>
    </table>

@endsection
