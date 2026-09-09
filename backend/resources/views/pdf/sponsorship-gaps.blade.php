@extends('pdf.layout')

@php
    use App\Support\PdfFormat;
@endphp

@section('content')

    <table class="meta" width="100%">
        <tr>
            <td class="k">الكفالة المرجعية للأسرة</td>
            <td class="v">{{ PdfFormat::money($report['target']) }}</td>
            <td class="k">أسر بدون أي كفيل</td>
            <td class="v">{{ $report['totals']['unsponsored'] }}</td>
        </tr>
    </table>

    <table class="stats" width="100%">
        <tr>
            <td width="25%"><div class="label">أسر بها نقص</div><div class="value">{{ $report['totals']['families_with_gap'] }}</div></td>
            <td width="25%"><div class="label">بدون أي كفيل</div><div class="value">{{ $report['totals']['unsponsored'] }}</div></td>
            <td width="25%"><div class="label">أيتام معنيون</div><div class="value">{{ $report['totals']['orphans_affected'] }}</div></td>
            <td width="25%"><div class="label">مجموع النقص</div><div class="value">{{ PdfFormat::money($report['totals']['total_shortfall']) }}</div></td>
        </tr>
    </table>

    <div class="note">
        الأسر مرتّبة حسب حجم النقص، والأكثر حاجة أولاً. الأسر المغطاة بالكامل غير مدرجة.
    </div>

    <h2 class="section">الأسر ذات النقص في الكفالة</h2>
    <table class="data">
        <thead>
            <tr>
                <th width="24%">الأسرة</th>
                <th width="14%">الهاتف</th>
                <th width="16%">الحي</th>
                <th width="10%" class="center">الأيتام</th>
                <th width="10%" class="center">الكفلاء</th>
                <th width="13%" class="num">المغطّى</th>
                <th width="13%" class="num">النقص</th>
            </tr>
        </thead>
        <tbody>
            @forelse ($report['families'] as $i => $family)
                <tr class="{{ $i % 2 ? 'alt' : '' }}">
                    <td>{{ $family['full_name'] }}</td>
                    <td>{{ $family['phone'] ?? '—' }}</td>
                    <td>{{ $family['neighborhood'] ?? '—' }}</td>
                    <td class="center">{{ $family['orphans_count'] }}</td>
                    <td class="center">{{ $family['kafils_count'] ?: '—' }}</td>
                    <td class="num">{{ PdfFormat::money($family['covered']) }}</td>
                    <td class="num" style="color: #b91c1c; font-weight: bold;">{{ PdfFormat::money($family['shortfall']) }}</td>
                </tr>
            @empty
                <tr><td colspan="7" class="empty">كل الأسر مغطاة بالكامل.</td></tr>
            @endforelse
        </tbody>
        <tfoot>
            <tr>
                <td colspan="6">مجموع النقص</td>
                <td class="num">{{ PdfFormat::money($report['totals']['total_shortfall']) }}</td>
            </tr>
        </tfoot>
    </table>

@endsection
