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
            <td class="k">نشِطون في الفترة</td>
            <td class="v">{{ $report['totals']['active_in_period'] }} من {{ $report['totals']['donors'] }}</td>
        </tr>
    </table>

    <table class="stats" width="100%">
        <tr>
            <td width="25%"><div class="label">المتبرعون</div><div class="value">{{ $report['totals']['donors'] }}</div></td>
            <td width="25%"><div class="label">منهم كفلاء</div><div class="value">{{ $report['totals']['kafils'] }}</div></td>
            <td width="25%"><div class="label">إجمالي التبرعات</div><div class="value">{{ $money($report['totals']['given_all_time']) }}</div></td>
            <td width="25%"><div class="label">خلال الفترة</div><div class="value">{{ $money($report['totals']['given_in_period']) }}</div></td>
        </tr>
    </table>

    <h2 class="section">قائمة المتبرعين</h2>
    <table class="data">
        <thead>
            <tr>
                <th width="26%">الاسم</th>
                <th width="16%">الهاتف</th>
                <th width="10%" class="center">كفيل</th>
                <th width="12%" class="center">دفعات الفترة</th>
                <th width="18%" class="num">خلال الفترة</th>
                <th width="18%" class="num">الإجمالي</th>
            </tr>
        </thead>
        <tbody>
            @forelse ($report['donors'] as $i => $donor)
                <tr class="{{ $i % 2 ? 'alt' : '' }}">
                    <td>{{ $donor['full_name'] }}</td>
                    <td>{{ $donor['phone'] ?? '—' }}</td>
                    <td class="center">{{ $donor['is_kafil'] ? 'نعم' : '—' }}</td>
                    <td class="center">{{ $donor['period_payments'] }}</td>
                    <td class="num">{{ $money($donor['period_total']) }}</td>
                    <td class="num">{{ $money($donor['total_given']) }}</td>
                </tr>
            @empty
                <tr><td colspan="6" class="empty">لا يوجد متبرعون.</td></tr>
            @endforelse
        </tbody>
        <tfoot>
            <tr>
                <td colspan="4">المجموع</td>
                <td class="num">{{ $money($report['totals']['given_in_period']) }}</td>
                <td class="num">{{ $money($report['totals']['given_all_time']) }}</td>
            </tr>
        </tfoot>
    </table>

@endsection
