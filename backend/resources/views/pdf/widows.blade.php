@extends('pdf.layout')

@php
    use App\Support\PdfFormat;
@endphp

@section('content')

    <table class="stats" width="100%">
        <tr>
            <td width="17%"><div class="label">الأرامل</div><div class="value">{{ $report['totals']['widows'] }}</div></td>
            <td width="17%"><div class="label">الأيتام</div><div class="value">{{ $report['totals']['orphans'] }}</div></td>
            <td width="17%"><div class="label">أسر لديها أيتام</div><div class="value">{{ $report['totals']['families_with_orphans'] }}</div></td>
            <td width="17%"><div class="label">متوسط الأيتام</div><div class="value">{{ PdfFormat::number($report['totals']['average_orphans'], 2) }}</div></td>
            <td width="16%"><div class="label">نسبة التغطية (%)</div><div class="value">{{ PdfFormat::number($report['totals']['sponsorship_coverage'], 1) }}</div></td>
            <td width="16%"><div class="label">نسبة الإعاقة (%)</div><div class="value">{{ PdfFormat::number($report['totals']['disability_rate'], 1) }}</div></td>
        </tr>
    </table>

    @include('pdf.partials.breakdown', [
        'heading' => 'التوزيع حسب الحي',
        'rows' => $report['by_neighborhood'],
        'labelHeading' => 'الحي',
        'valueHeading' => 'عدد الأرامل',
        'showCount' => false,
    ])

    @include('pdf.partials.breakdown', [
        'heading' => 'الأيتام حسب الجنس',
        'rows' => $report['orphans_by_gender'],
        'labelHeading' => 'الجنس',
        'valueHeading' => 'العدد',
        'showCount' => false,
    ])

    @include('pdf.partials.breakdown', [
        'heading' => 'الأيتام حسب التمدرس',
        'rows' => $report['orphans_by_schooling'],
        'labelHeading' => 'الحالة',
        'valueHeading' => 'العدد',
        'showCount' => false,
    ])

    <h2 class="section">قائمة الأرامل</h2>
    <table class="data">
        <thead>
            <tr>
                <th width="28%">الاسم</th>
                <th width="16%">الهاتف</th>
                <th width="20%">الحي</th>
                <th width="12%" class="center">الأيتام</th>
                <th width="12%" class="center">الكفلاء</th>
                <th width="12%">تاريخ الانخراط</th>
            </tr>
        </thead>
        <tbody>
            @forelse ($report['widows'] as $i => $widow)
                <tr class="{{ $i % 2 ? 'alt' : '' }}">
                    <td>{{ $widow['full_name'] }}</td>
                    <td>{{ $widow['phone'] ?? '—' }}</td>
                    <td>{{ $widow['neighborhood'] ?? '—' }}</td>
                    <td class="center">{{ $widow['orphans_count'] }}</td>
                    <td class="center">{{ $widow['sponsorships_count'] }}</td>
                    <td>{{ $widow['admission_date'] ?? '—' }}</td>
                </tr>
            @empty
                <tr><td colspan="6" class="empty">لا توجد أرامل مسجلة.</td></tr>
            @endforelse
        </tbody>
    </table>

@endsection
