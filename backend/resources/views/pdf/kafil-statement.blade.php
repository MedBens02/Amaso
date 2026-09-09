@extends('pdf.layout')

@php
    use App\Support\PdfFormat;

    $money = fn ($v) => PdfFormat::money($v);
@endphp

@section('content')

    <table class="meta" width="100%">
        <tr>
            <td class="k">الكفيل</td>
            <td class="v">{{ $statement['kafil']['full_name'] }}</td>
            <td class="k">الفترة</td>
            <td class="v">{{ $statement['period']['from'] }} إلى {{ $statement['period']['to'] }}</td>
        </tr>
        <tr>
            <td class="k">الهاتف</td>
            <td class="v">{{ $statement['kafil']['phone'] ?? '—' }}</td>
            <td class="k">الالتزام الشهري</td>
            <td class="v">{{ $money($statement['kafil']['monthly_pledge']) }}</td>
        </tr>
    </table>

    <table class="stats" width="100%">
        <tr>
            <td width="33%"><div class="label">إجمالي المساهمات</div><div class="value">{{ $money($statement['totals']['contributed']) }}</div></td>
            <td width="33%"><div class="label">عدد الدفعات</div><div class="value">{{ $statement['contributions']['payments_count'] }}</div></td>
            <td width="34%"><div class="label">ما تلقّته الأسر</div><div class="value">{{ $money($statement['totals']['received_by_families']) }}</div></td>
        </tr>
    </table>

    <h2 class="section">توزيع المساهمات على الميزانيات</h2>
    <table class="data">
        <thead>
            <tr><th width="70%">الميزانية</th><th width="30%" class="num">المبلغ</th></tr>
        </thead>
        <tbody>
            @forelse ($statement['contributions']['by_budget'] as $i => $row)
                <tr class="{{ $i % 2 ? 'alt' : '' }}">
                    <td>{{ $row['label'] }}</td>
                    <td class="num">{{ $money($row['amount']) }}</td>
                </tr>
            @empty
                <tr><td colspan="2" class="empty">لا توجد مساهمات مسجلة في هذه الفترة.</td></tr>
            @endforelse
        </tbody>
        <tfoot>
            <tr><td>المجموع</td><td class="num">{{ $money($statement['contributions']['total']) }}</td></tr>
        </tfoot>
    </table>

    @foreach ($statement['families'] as $family)
        <h2 class="section">الأسرة المكفولة: {{ $family['full_name'] }}</h2>

        <table class="meta" width="100%">
            <tr>
                <td class="k">عدد الأيتام</td>
                <td class="v">{{ $family['orphans_count'] }}</td>
                <td class="k">مبلغ الكفالة المتفق عليه</td>
                <td class="v">{{ $money($family['sponsorship_amount']) }}</td>
            </tr>
        </table>

        <table class="data">
            <thead>
                <tr><th width="70%">نوع المساعدة</th><th width="30%" class="num">المبلغ</th></tr>
            </thead>
            <tbody>
                @forelse ($family['received']['by_category'] as $i => $row)
                    <tr class="{{ $i % 2 ? 'alt' : '' }}">
                        <td>{{ $row['label'] }}</td>
                        <td class="num">{{ $money($row['amount']) }}</td>
                    </tr>
                @empty
                    <tr><td colspan="2" class="empty">لا توجد مساعدات مسجلة في هذه الفترة.</td></tr>
                @endforelse
            </tbody>
            <tfoot>
                <tr><td>مجموع ما تلقّته الأسرة</td><td class="num">{{ $money($family['received']['total']) }}</td></tr>
            </tfoot>
        </table>

        @if (count($family['orphans']) > 0)
            <table class="data">
                <thead>
                    <tr>
                        <th width="45%">الأيتام</th>
                        <th width="30%">تاريخ الميلاد</th>
                        <th width="25%" class="center">متمدرس</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach ($family['orphans'] as $i => $orphan)
                        <tr class="{{ $i % 2 ? 'alt' : '' }}">
                            <td>{{ $orphan['full_name'] }}</td>
                            <td>{{ $orphan['birth_date'] ?? '—' }}</td>
                            <td class="center">{{ $orphan['is_schooled'] ? 'نعم' : 'لا' }}</td>
                        </tr>
                    @endforeach
                </tbody>
            </table>
        @endif
    @endforeach

    <div class="disclosure">
        <strong>ملاحظة:</strong>
        تُجمع كل المساهمات في ميزانية الجمعية. المبالغ المذكورة كمساعدات تلقتها الأسرة تُصرف من موارد الجمعية
        الإجمالية، ولا تمثل بالضرورة صرفاً مباشراً لمساهمة هذا الكفيل.
    </div>

@endsection
