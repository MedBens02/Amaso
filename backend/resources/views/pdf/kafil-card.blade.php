@extends('pdf.layout')

@php
    use App\Support\PdfFormat;

    $or = fn ($v) => $v === null || $v === '' ? 'غير محدد' : $v;
@endphp

@section('content')

    <div class="identity">
        <div class="name">{{ $kafil->full_name }}</div>
        <div class="sub">عدد الأسر المكفولة: {{ $kafil->sponsorships->count() }}</div>
    </div>

    @include('pdf.partials.info', [
        'heading' => 'بيانات الكفيل',
        'items' => [
            'الاسم الكامل' => $kafil->full_name,
            'رقم الهاتف' => $or($kafil->phone),
            'البريد الإلكتروني' => $or($kafil->email),
            'الالتزام الشهري' => PdfFormat::money($kafil->monthly_pledge),
            'مجموع الكفالات' => PdfFormat::money($kafil->sponsorships->sum('amount')),
            'عدد الأسر' => $kafil->sponsorships->count(),
        ],
    ])

    <div class="section-block">
        <h2 class="section">الأسر المكفولة</h2>
        <table class="data">
            <thead>
                <tr>
                    <th width="34%">الأسرة</th>
                    <th width="18%">الهاتف</th>
                    <th width="16%" class="center">عدد الأيتام</th>
                    <th width="16%">الحي</th>
                    <th width="16%" class="num">مبلغ الكفالة</th>
                </tr>
            </thead>
            <tbody>
                @forelse ($kafil->sponsorships as $i => $sponsorship)
                    <tr class="{{ $i % 2 ? 'alt' : '' }}">
                        <td>{{ $sponsorship->widow?->full_name ?? '—' }}</td>
                        <td>{{ $sponsorship->widow?->phone ?? '—' }}</td>
                        <td class="center">{{ $sponsorship->widow?->orphans->count() ?? 0 }}</td>
                        <td>{{ $sponsorship->widow?->neighborhood ?? '—' }}</td>
                        <td class="num">{{ PdfFormat::money($sponsorship->amount) }}</td>
                    </tr>
                @empty
                    <tr><td colspan="5" class="empty">لا توجد أسر مكفولة.</td></tr>
                @endforelse
            </tbody>
            <tfoot>
                <tr>
                    <td colspan="4">المجموع</td>
                    <td class="num">{{ PdfFormat::money($kafil->sponsorships->sum('amount')) }}</td>
                </tr>
            </tfoot>
        </table>
    </div>

@endsection
