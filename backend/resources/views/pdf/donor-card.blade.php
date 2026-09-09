@extends('pdf.layout')

@php
    use App\Support\PdfFormat;

    $or = fn ($v) => $v === null || $v === '' ? 'غير محدد' : $v;
@endphp

@section('content')

    <div class="identity">
        <div class="name">{{ trim("{$donor->first_name} {$donor->last_name}") }}</div>
        <div class="sub">{{ $donor->kafil ? 'متبرع وكفيل' : 'متبرع' }}</div>
    </div>

    @include('pdf.partials.info', [
        'heading' => 'بيانات المتبرع',
        'items' => [
            'الاسم الكامل' => trim("{$donor->first_name} {$donor->last_name}"),
            'رقم الهاتف' => $or($donor->phone),
            'البريد الإلكتروني' => $or($donor->email),
            'العنوان' => $or($donor->address),
            'إجمالي التبرعات' => PdfFormat::money($donor->total_given),
            'كفيل' => $donor->kafil ? 'نعم' : 'لا',
        ],
    ])

    <div class="section-block">
        <h2 class="section">سجل المساهمات</h2>
        <table class="data">
            <thead>
                <tr>
                    <th width="18%">التاريخ</th>
                    <th width="28%">الميزانية</th>
                    <th width="24%">الفئة</th>
                    <th width="14%" class="center">الحالة</th>
                    <th width="16%" class="num">المبلغ</th>
                </tr>
            </thead>
            <tbody>
                @forelse ($incomes as $i => $income)
                    <tr class="{{ $i % 2 ? 'alt' : '' }}">
                        <td>{{ $income->income_date?->format('Y-m-d') }}</td>
                        <td>{{ $income->budget?->label ?? '—' }}</td>
                        <td>{{ $income->incomeCategory?->label ?? '—' }}</td>
                        <td class="center">{{ $income->status === 'Approved' ? 'معتمد' : ($income->status === 'Draft' ? 'مسودة' : 'مرفوض') }}</td>
                        <td class="num">{{ PdfFormat::money($income->amount) }}</td>
                    </tr>
                @empty
                    <tr><td colspan="5" class="empty">لا توجد مساهمات مسجلة.</td></tr>
                @endforelse
            </tbody>
            <tfoot>
                <tr>
                    <td colspan="4">مجموع المساهمات المعتمدة</td>
                    <td class="num">{{ PdfFormat::money($incomes->where('status', 'Approved')->sum('amount')) }}</td>
                </tr>
            </tfoot>
        </table>
    </div>

@endsection
