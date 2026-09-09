@extends('pdf.layout')

@php
    use App\Support\PdfFormat;

    $yesNo = fn ($v) => $v ? 'نعم' : 'لا';
    $or = fn ($v) => $v === null || $v === '' ? 'غير محدد' : $v;
    // Stored in English on the record; the card is Arabic throughout.
    $maritalStatus = fn ($v) => match ($v) {
        'Widowed' => 'أرملة',
        'Divorced' => 'مطلقة',
        'Single' => 'عزباء',
        default => $v,
    };
@endphp

@section('content')

    <div class="identity">
        <div class="name">{{ $widow->full_name }}</div>
        <div class="sub">رقم البطاقة الوطنية: {{ $or($widow->national_id) }}</div>
    </div>

    @if ($sections['personal'] ?? true)
        @include('pdf.partials.info', [
            'heading' => 'المعلومات الشخصية',
            'items' => [
                'الاسم الكامل' => $widow->full_name,
                'تاريخ الميلاد' => $widow->birth_date?->format('Y-m-d'),
                'الحالة الاجتماعية' => $or($maritalStatus($widow->marital_status)),
                'المستوى التعليمي' => $or($widow->education_level),
                'رقم الهاتف' => $or($widow->phone),
                'العنوان' => $or($widow->address),
                'الحي' => $or($widow->neighborhood),
                'الإعاقة' => $widow->disability_flag ? $or($widow->disability_type) : 'لا توجد',
                'تاريخ الانخراط' => $widow->admission_date?->format('Y-m-d'),
                'مسؤول الأسرة' => $or($widow->family_liaison),
            ],
        ])
    @endif

    @if (($sections['housing'] ?? true) && $widow->widowSocial)
        @include('pdf.partials.info', [
            'heading' => 'معلومات السكن والوضع الاجتماعي',
            'items' => [
                'نوع السكن' => $or($widow->widowSocial->housingType?->name),
                'وضعية السكن' => $or($widow->widowSocial->housing_status),
                'الكهرباء' => $yesNo($widow->widowSocial->has_electricity),
                'الماء الصالح للشرب' => $yesNo($widow->widowSocial->has_water),
                'الأثاث' => $yesNo($widow->widowSocial->has_furniture),
            ],
        ])
    @endif

    @if ($sections['orphans'] ?? true)
        <div class="section-block">
            <h2 class="section">الأيتام ({{ $widow->orphans->count() }})</h2>
            <table class="data">
                <thead>
                    <tr>
                        <th width="30%">الاسم</th>
                        <th width="12%" class="center">الجنس</th>
                        <th width="18%">تاريخ الميلاد</th>
                        <th width="25%">المستوى الدراسي</th>
                        <th width="15%" class="center">متمدرس</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse ($widow->orphans as $i => $orphan)
                        <tr class="{{ $i % 2 ? 'alt' : '' }}">
                            <td>{{ trim("{$orphan->first_name} {$orphan->last_name}") }}</td>
                            <td class="center">{{ $orphan->gender === 'male' ? 'ذكر' : 'أنثى' }}</td>
                            <td>{{ $orphan->birth_date?->format('Y-m-d') ?? '—' }}</td>
                            <td>{{ $orphan->educationLevel?->name_ar ?? '—' }}</td>
                            <td class="center">{{ $yesNo($orphan->is_schooled) }}</td>
                        </tr>
                    @empty
                        <tr><td colspan="5" class="empty">لا يوجد أيتام مسجلون.</td></tr>
                    @endforelse
                </tbody>
            </table>
        </div>
    @endif

    @if ($sections['additional'] ?? true)
        <div class="section-block">
            <h2 class="section">المهارات والأمراض والمساعدات</h2>
            <table class="data">
                <thead>
                    <tr><th width="30%">البند</th><th width="70%">التفاصيل</th></tr>
                </thead>
                <tbody>
                    <tr>
                        <td>المهارات</td>
                        <td>{{ $widow->skills->pluck('name')->join('، ') ?: '—' }}</td>
                    </tr>
                    <tr class="alt">
                        <td>الأمراض</td>
                        <td>{{ $widow->illnesses->pluck('name')->join('، ') ?: '—' }}</td>
                    </tr>
                    <tr>
                        <td>أنواع المساعدات</td>
                        <td>{{ $widow->aidTypes->pluck('name')->join('، ') ?: '—' }}</td>
                    </tr>
                    <tr class="alt">
                        <td>معونات الشركاء</td>
                        <td>{{ $widow->maouna->map(fn ($m) => trim(($m->partner?->name ?? 'شريك') . ' — ' . number_format((float) $m->amount, 2) . ' د.م'))->join('، ') ?: '—' }}</td>
                    </tr>
                </tbody>
            </table>
        </div>

        @if ($widow->sponsorships->count() > 0)
            <div class="section-block">
                <h2 class="section">الكفلاء</h2>
                <table class="data">
                    <thead>
                        <tr><th width="60%">الكفيل</th><th width="40%" class="num">مبلغ الكفالة</th></tr>
                    </thead>
                    <tbody>
                        @foreach ($widow->sponsorships as $i => $sponsorship)
                            <tr class="{{ $i % 2 ? 'alt' : '' }}">
                                <td>{{ $sponsorship->kafil?->full_name ?? '—' }}</td>
                                <td class="num">{{ PdfFormat::money($sponsorship->amount) }}</td>
                            </tr>
                        @endforeach
                    </tbody>
                </table>
            </div>
        @endif
    @endif

@endsection
