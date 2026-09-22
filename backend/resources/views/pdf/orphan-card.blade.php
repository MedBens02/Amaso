@extends('pdf.layout')

@php
    $yesNo = fn ($v) => $v ? 'نعم' : 'لا';
    $or = fn ($v) => $v === null || $v === '' ? 'غير محدد' : $v;
@endphp

@section('content')

    <div class="identity">
        <div class="name">{{ trim("{$orphan->first_name} {$orphan->last_name}") }}</div>
        <div class="sub">الأسرة: {{ $orphan->widow?->full_name ?? 'غير محددة' }}</div>
    </div>

    @include('pdf.partials.info', [
        'heading' => 'المعلومات الشخصية',
        'items' => [
            'الاسم الكامل' => trim("{$orphan->first_name} {$orphan->last_name}"),
            'الجنس' => $orphan->gender === 'male' ? 'ذكر' : 'أنثى',
            'تاريخ الميلاد' => $orphan->birth_date?->format('Y-m-d'),
            'رقم البطاقة الوطنية' => $or($orphan->cin),
            'رقم الهاتف' => $or($orphan->phone),
            'الحالة الصحية' => $or($orphan->health_status),
            'متزوج/ة' => $yesNo($orphan->is_married),
            'يعمل' => $orphan->is_working ? $or($orphan->work_type) : 'لا',
        ],
    ])

    @include('pdf.partials.info', [
        'heading' => 'المعلومات الدراسية',
        'items' => [
            'متمدرس' => $yesNo($orphan->is_schooled),
            'المستوى الدراسي' => $or($orphan->educationLevel?->name_ar),
            'رمز مسار' => $or($orphan->masar_code),
            'المؤسسة الحالية' => $or($orphan->currentEnrollment?->school?->name),
            'التخصص' => $or($orphan->currentEnrollment?->specialty),
            'مسجل لكن لا يدرس' => $yesNo($orphan->is_inactive),
        ],
    ])

    @if ($orphan->enrollments->count() > 0)
        <div class="section-block">
            <h2 class="section">المسار الدراسي</h2>
            <table class="data">
                <thead>
                    <tr>
                        <th width="16%">السنة</th>
                        <th width="24%">المستوى</th>
                        <th width="36%">المؤسسة</th>
                        {{-- One figure rather than two semester columns: a
                             baccalaureate year is marked on exams and has no
                             semesters to put in them, while every year has a
                             mark for the year. --}}
                        <th width="12%" class="center">المعدل</th>
                        <th width="12%" class="center">النتيجة</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach ($orphan->enrollments as $i => $enrollment)
                        <tr class="{{ $i % 2 ? 'alt' : '' }}">
                            <td>{{ $enrollment->academicYear?->label ?? '—' }}</td>
                            <td>{{ $enrollment->educationLevel?->name_ar ?? '—' }}</td>
                            <td>{{ $enrollment->school?->name ?? '—' }}</td>
                            <td class="center">{{ $enrollment->average_grade === null
                                ? '—'
                                : number_format($enrollment->average_grade, 2) . ' / ' . number_format((float) ($enrollment->grade_scale ?: 20), 0) }}</td>
                            <td class="center">{{ match ($enrollment->status) {
                                'passed' => 'ناجح', 'failed' => 'راسب', 'left' => 'غادر', default => 'مسجل',
                            } }}</td>
                        </tr>
                    @endforeach
                </tbody>
            </table>
        </div>
    @endif

@endsection
