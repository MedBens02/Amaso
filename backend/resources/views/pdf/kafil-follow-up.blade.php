@extends('pdf.layout')

@php
    use App\Support\PdfFormat;
@endphp

@section('content')

    <table class="meta" width="100%">
        <tr>
            <td class="k">الفترة</td>
            <td class="v">{{ $report['period']['from'] }} إلى {{ $report['period']['to'] }}</td>
            <td class="k">عدد الأشهر</td>
            <td class="v">{{ $report['months'] }}</td>
        </tr>
    </table>

    <table class="stats" width="100%">
        <tr>
            <td width="20%"><div class="label">الكفلاء</div><div class="value">{{ $report['totals']['kafils'] }}</div></td>
            <td width="20%"><div class="label">متأخرون</div><div class="value" style="color: #b91c1c">{{ $report['totals']['behind'] }}</div></td>
            <td width="20%"><div class="label">لم يدفعوا</div><div class="value" style="color: #b91c1c">{{ $report['totals']['never_paid'] }}</div></td>
            <td width="20%"><div class="label">المتوقّع</div><div class="value">{{ PdfFormat::money($report['totals']['expected']) }}</div></td>
            <td width="20%"><div class="label">المحصّل</div><div class="value">{{ PdfFormat::money($report['totals']['paid']) }}</div></td>
        </tr>
    </table>

    <div class="note">
        المتوقّع = مجموع الكفالات المتفق عليها × عدد أشهر الفترة. الكفلاء مرتّبون بالأكثر تأخراً أولاً.
    </div>

    <h2 class="section">متابعة التزامات الكفلاء</h2>
    <table class="data">
        <thead>
            <tr>
                <th width="21%">الكفيل</th>
                <th width="13%">الهاتف</th>
                <th width="8%" class="center">الأسر</th>
                <th width="13%" class="num">الالتزام/شهر</th>
                <th width="13%" class="num">المتوقّع</th>
                <th width="13%" class="num">المحصّل</th>
                <th width="10%" class="center">التغطية</th>
                <th width="9%">آخر دفعة</th>
            </tr>
        </thead>
        <tbody>
            @forelse ($report['kafils'] as $i => $kafil)
                <tr class="{{ $i % 2 ? 'alt' : '' }}">
                    <td>{{ $kafil['full_name'] }}</td>
                    <td>{{ $kafil['phone'] ?? '—' }}</td>
                    <td class="center">{{ $kafil['families'] }}</td>
                    <td class="num">{{ PdfFormat::money($kafil['monthly_commitment']) }}</td>
                    <td class="num">{{ PdfFormat::money($kafil['expected']) }}</td>
                    <td class="num">{{ PdfFormat::money($kafil['paid']) }}</td>
                    <td class="center" style="font-weight: bold; color: {{ ($kafil['coverage'] ?? 0) >= 99 ? '#15803d' : '#b91c1c' }}">
                        {{ $kafil['coverage'] === null ? '—' : PdfFormat::percent($kafil['coverage']) }}
                    </td>
                    <td>{{ $kafil['last_payment'] ? \Illuminate\Support\Str::substr($kafil['last_payment'], 0, 10) : '—' }}</td>
                </tr>
            @empty
                <tr><td colspan="8" class="empty">لا يوجد كفلاء مسجلون.</td></tr>
            @endforelse
        </tbody>
        <tfoot>
            <tr>
                <td colspan="4">المجموع</td>
                <td class="num">{{ PdfFormat::money($report['totals']['expected']) }}</td>
                <td class="num">{{ PdfFormat::money($report['totals']['paid']) }}</td>
                <td colspan="2"></td>
            </tr>
        </tfoot>
    </table>

@endsection
