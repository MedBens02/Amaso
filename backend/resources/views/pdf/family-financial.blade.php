@extends('pdf.layout')

@php
    use App\Support\PdfFormat;
@endphp

@section('content')

    <div class="identity">
        <div class="name">{{ $report['family']['full_name'] }}</div>
        <div class="sub">
            {{ $report['family']['neighborhood'] ?? 'غير محدد' }}
            — {{ $report['family']['orphans_count'] }} يتيم
            @if ($report['family']['phone']) — {{ $report['family']['phone'] }} @endif
        </div>
    </div>

    <table class="stats" width="100%">
        <tr>
            <td width="33%"><div class="label">الكفالة المتفق عليها</div><div class="value">{{ PdfFormat::money($report['totals']['sponsorship_agreed']) }}</div></td>
            <td width="33%"><div class="label">وارد موجّه للأسرة</div><div class="value">{{ PdfFormat::money($report['totals']['designated_income']) }}</div></td>
            <td width="34%"><div class="label">ما صُرف على الأسرة</div><div class="value">{{ PdfFormat::money($report['totals']['received']) }}</div></td>
        </tr>
    </table>

    <div class="section-block">
        <h2 class="section">الكفلاء</h2>
        <table class="data">
            <thead>
                <tr><th width="45%">الكفيل</th><th width="30%">الهاتف</th><th width="25%" class="num">مبلغ الكفالة</th></tr>
            </thead>
            <tbody>
                @forelse ($report['sponsorships'] as $i => $sponsorship)
                    <tr class="{{ $i % 2 ? 'alt' : '' }}">
                        <td>{{ $sponsorship['kafil'] }}</td>
                        <td>{{ $sponsorship['phone'] ?? '—' }}</td>
                        <td class="num">{{ PdfFormat::money($sponsorship['amount']) }}</td>
                    </tr>
                @empty
                    <tr><td colspan="3" class="empty">هذه الأسرة غير مكفولة حالياً.</td></tr>
                @endforelse
            </tbody>
        </table>
    </div>

    @if ($report['kafala_balance'])
        <div class="section-block">
            <h2 class="section">رصيد الكفالة الشاملة حسب البند</h2>
            <table class="data">
                <thead>
                    <tr>
                        <th width="34%">البند</th>
                        <th width="22%" class="num">ما وَرَد للأسرة</th>
                        <th width="22%" class="num">ما صُرف</th>
                        <th width="22%" class="num">المتبقي</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach ($report['kafala_balance']['parts'] as $i => $part)
                        <tr class="{{ $i % 2 ? 'alt' : '' }}">
                            <td>{{ $part['label'] }}</td>
                            <td class="num">{{ PdfFormat::money($part['credited']) }}</td>
                            <td class="num">{{ PdfFormat::money($part['spent']) }}</td>
                            <td class="num" style="font-weight: bold; color: {{ $part['remaining'] >= 0 ? '#15803d' : '#b91c1c' }}">
                                {{ PdfFormat::money($part['remaining']) }}
                            </td>
                        </tr>
                    @endforeach
                </tbody>
                <tfoot>
                    <tr>
                        <td>المجموع</td>
                        <td class="num">{{ PdfFormat::money($report['kafala_balance']['total_credited']) }}</td>
                        <td class="num">{{ PdfFormat::money($report['kafala_balance']['total_spent']) }}</td>
                        <td class="num">{{ PdfFormat::money($report['kafala_balance']['total_remaining']) }}</td>
                    </tr>
                </tfoot>
            </table>
            <p style="font-size: 7.5pt; color: #6b7280; margin-top: 1mm;">
                رصيد تقديري: يُحتسب من الكفالات الموجّهة لهذه الأسرة ناقص ما صُرف عليها من نفس البند.
                المبالغ فعلياً مُجمّعة في الميزانيات المشتركة.
            </p>
        </div>
    @endif

    @if (count($report['designated_income']) > 0)
        <div class="section-block">
            <h2 class="section">الواردات الموجّهة لهذه الأسرة</h2>
            <table class="data">
                <thead>
                    <tr>
                        <th width="18%">التاريخ</th>
                        <th width="30%">الكفيل</th>
                        <th width="34%">الميزانية</th>
                        <th width="18%" class="num">المبلغ</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach ($report['designated_income'] as $i => $income)
                        <tr class="{{ $i % 2 ? 'alt' : '' }}">
                            <td>{{ $income['date'] }}</td>
                            <td>{{ $income['kafil'] }}</td>
                            <td>{{ $income['budget'] ?? '—' }}</td>
                            <td class="num">{{ PdfFormat::money($income['amount']) }}</td>
                        </tr>
                    @endforeach
                </tbody>
                <tfoot>
                    <tr>
                        <td colspan="3">المجموع</td>
                        <td class="num">{{ PdfFormat::money($report['totals']['designated_income']) }}</td>
                    </tr>
                </tfoot>
            </table>
        </div>
    @endif

    @include('pdf.partials.breakdown', [
        'heading' => 'ما صُرف على الأسرة حسب الفئة',
        'rows' => $report['received']['by_category'],
        'labelHeading' => 'فئة المصروف',
        'formatter' => fn ($v) => PdfFormat::money($v),
    ])

    <div class="section-block">
        <h2 class="section">تفصيل المصروفات على الأسرة</h2>
        <table class="data">
            <thead>
                <tr>
                    <th width="15%">التاريخ</th>
                    <th width="24%">المستفيد</th>
                    <th width="23%">الميزانية</th>
                    <th width="23%">الفئة</th>
                    <th width="15%" class="num">المبلغ</th>
                </tr>
            </thead>
            <tbody>
                @forelse ($report['received']['rows'] as $i => $row)
                    <tr class="{{ $i % 2 ? 'alt' : '' }}">
                        <td>{{ $row['date'] }}</td>
                        <td>{{ $row['beneficiary'] }}</td>
                        <td>{{ $row['budget'] ?? '—' }}</td>
                        <td>{{ $row['category'] ?? '—' }}</td>
                        <td class="num">{{ PdfFormat::money($row['amount']) }}</td>
                    </tr>
                @empty
                    <tr><td colspan="5" class="empty">لا توجد مصروفات مسجلة على هذه الأسرة في هذه الفترة.</td></tr>
                @endforelse
            </tbody>
            <tfoot>
                <tr>
                    <td colspan="4">المجموع</td>
                    <td class="num">{{ PdfFormat::money($report['totals']['received']) }}</td>
                </tr>
            </tfoot>
        </table>
    </div>

    <div class="disclosure">
        <strong>ملاحظة:</strong>
        تُجمع كل المساهمات في ميزانيات الجمعية. المبالغ المصروفة على هذه الأسرة تُصرف من موارد الجمعية
        الإجمالية، ولا تمثل بالضرورة صرفاً مباشراً لمساهمة كفيل بعينه.
    </div>

@endsection
