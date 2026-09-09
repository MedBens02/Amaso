@extends('pdf.layout')

@php
    use App\Support\PdfFormat;

    $pct = fn ($v) => PdfFormat::percent($v);
    $num = fn ($v, $decimals = 2) => PdfFormat::number($v, $decimals);
    $genderLabel = fn ($g) => match ($g) { 'male' => 'ذكور', 'female' => 'إناث', default => $g };
    $semesterLabel = match ($report['semester']) {
        'first' => 'الأسدس الأول',
        'second' => 'الأسدس الثاني',
        default => 'معدل السنة',
    };
@endphp

@section('content')

    <table class="meta" width="100%">
        <tr>
            <td class="k">السنة الدراسية</td>
            <td class="v">{{ $report['academic_year']['label'] ?? '—' }}</td>
            <td class="k">الفترة</td>
            <td class="v">{{ $semesterLabel }}</td>
        </tr>
        <tr>
            <td class="k">نطاق الترتيب</td>
            <td class="v">{{ $report['filters']['top_n'] ? 'الأوائل ' . $report['filters']['top_n'] : 'كل التلاميذ' }}</td>
            <td class="k">التصفية</td>
            <td class="v">{{ $filterSummary }}</td>
        </tr>
    </table>

    <table class="stats" width="100%">
        <tr>
            <td width="20%"><div class="label">التلاميذ</div><div class="value">{{ $report['totals']['students'] }}</div></td>
            <td width="20%"><div class="label">بنقط مسجلة</div><div class="value">{{ $report['totals']['graded'] }}</div></td>
            <td width="20%"><div class="label">بدون نقط</div><div class="value">{{ $report['totals']['ungraded'] }}</div></td>
            <td width="20%"><div class="label">المعدل العام (%)</div><div class="value">{{ $num($report['totals']['average_percentage'], 1) }}</div></td>
            <td width="20%"><div class="label">نسبة النجاح (%)</div><div class="value">{{ $num($report['totals']['pass_rate'], 1) }}</div></td>
        </tr>
    </table>

    @if ($report['totals']['ungraded'] > 0)
        <div class="note">
            {{ $report['totals']['ungraded'] }} تلميذ(ة) بدون نقط مسجلة لهذه الفترة — غير مدرجين في الترتيب أدناه.
        </div>
    @endif

    @if ($report['group_by'] !== 'none' && count($report['groups']) > 0)
        @php
            $groupHeading = match ($report['group_by']) {
                'school' => 'حسب المؤسسة',
                'gender' => 'حسب الجنس',
                default => 'حسب المستوى الدراسي',
            };
        @endphp

        <h2 class="section">
            {{ $report['filters']['top_n'] ? 'الأوائل (' . $report['filters']['top_n'] . ') في كل فئة' : 'الترتيب' }}
            — {{ $groupHeading }}
        </h2>

        @foreach ($report['groups'] as $group)
            <div class="section-block">
                <table class="data">
                    <thead>
                        <tr>
                            <th colspan="7" style="background: #134e4a;">
                                {{ $group['label'] }}
                                — {{ $group['students_listed'] }} من {{ $group['students_total'] }}
                                — المعدل {{ $pct($group['average_percentage']) }}
                            </th>
                        </tr>
                        <tr>
                            <th width="9%" class="center">الترتيب</th>
                            <th width="23%">التلميذ</th>
                            <th width="19%">الأسرة</th>
                            <th width="24%">المؤسسة</th>
                            <th width="8%" class="center">أ.1</th>
                            <th width="8%" class="center">أ.2</th>
                            <th width="9%" class="center">النسبة</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach ($group['students'] as $i => $student)
                            <tr class="{{ $i % 2 ? 'alt' : '' }}">
                                <td class="center {{ $student['rank'] <= 3 ? 'rank-medal' : '' }}">{{ $student['rank'] }}</td>
                                <td>{{ $student['full_name'] }}</td>
                                <td class="muted">{{ $student['family'] ?? '—' }}</td>
                                <td>{{ $student['school'] ?? '—' }}</td>
                                <td class="center">{{ $num($student['first_semester_grade']) }}</td>
                                <td class="center">{{ $num($student['second_semester_grade']) }}</td>
                                <td class="center" style="font-weight: bold;">{{ $pct($student['percentage']) }}</td>
                            </tr>
                        @endforeach
                    </tbody>
                </table>
            </div>
        @endforeach

        <h2 class="section">الترتيب العام</h2>
    @else
        <h2 class="section">{{ $report['filters']['top_n'] ? 'الأوائل (' . $report['filters']['top_n'] . ')' : 'ترتيب التلاميذ' }}</h2>
    @endif

    <table class="data">
        <thead>
            <tr>
                <th width="8%" class="center">الترتيب</th>
                <th width="20%">التلميذ</th>
                <th width="17%">الأسرة</th>
                <th width="22%">المؤسسة</th>
                <th width="13%">المستوى</th>
                <th width="7%" class="center">أ.1</th>
                <th width="7%" class="center">أ.2</th>
                <th width="6%" class="center">النسبة</th>
            </tr>
        </thead>
        <tbody>
            @forelse ($report['students'] as $i => $student)
                <tr class="{{ $i % 2 ? 'alt' : '' }}">
                    <td class="center {{ $student['rank'] <= 3 ? 'rank-medal' : '' }}">{{ $student['rank'] }}</td>
                    <td>{{ $student['full_name'] }}</td>
                    <td class="muted">{{ $student['family'] ?? '—' }}</td>
                    <td>
                        {{ $student['school'] ?? '—' }}
                        @if ($student['school_type'] === 'university')<span class="pill">عالٍ</span>@endif
                        @if ($student['is_private'])<span class="pill">خاص</span>@endif
                    </td>
                    <td>{{ $student['education_level'] ?? $student['specialty'] ?? '—' }}</td>
                    <td class="center">{{ $num($student['first_semester_grade']) }}</td>
                    <td class="center">{{ $num($student['second_semester_grade']) }}</td>
                    <td class="center" style="font-weight: bold;">{{ $pct($student['percentage']) }}</td>
                </tr>
            @empty
                <tr><td colspan="8" class="empty">لا توجد نتائج مطابقة لهذه التصفية.</td></tr>
            @endforelse
        </tbody>
    </table>

    @foreach ([
        'حسب المؤسسة' => $report['by_school'],
        'حسب المستوى' => $report['by_level'],
        'حسب القطاع' => $report['by_sector'],
    ] as $heading => $rows)
        <div class="section-block">
        <h2 class="section">{{ $heading }}</h2>
        <table class="data">
            <thead>
                <tr>
                    <th width="52%">البند</th>
                    <th width="16%" class="center">عدد التلاميذ</th>
                    <th width="16%" class="center">المعدل</th>
                    <th width="16%" class="center">نسبة النجاح</th>
                </tr>
            </thead>
            <tbody>
                @forelse ($rows as $i => $row)
                    <tr class="{{ $i % 2 ? 'alt' : '' }}">
                        <td>{{ $row['label'] }}</td>
                        <td class="center">{{ $row['students'] }}</td>
                        <td class="center">{{ $pct($row['average_percentage']) }}</td>
                        <td class="center">{{ $pct($row['pass_rate']) }}</td>
                    </tr>
                @empty
                    <tr><td colspan="4" class="empty">لا توجد نتائج.</td></tr>
                @endforelse
            </tbody>
        </table>
        </div>
    @endforeach

    <div class="section-block">
    <h2 class="section">حسب الجنس</h2>
    <table class="data">
        <thead>
            <tr>
                <th width="52%">البند</th>
                <th width="16%" class="center">عدد التلاميذ</th>
                <th width="16%" class="center">المعدل</th>
                <th width="16%" class="center">نسبة النجاح</th>
            </tr>
        </thead>
        <tbody>
            @forelse ($report['by_gender'] as $i => $row)
                <tr class="{{ $i % 2 ? 'alt' : '' }}">
                    <td>{{ $genderLabel($row['label']) }}</td>
                    <td class="center">{{ $row['students'] }}</td>
                    <td class="center">{{ $pct($row['average_percentage']) }}</td>
                    <td class="center">{{ $pct($row['pass_rate']) }}</td>
                </tr>
            @empty
                <tr><td colspan="4" class="empty">لا توجد نتائج.</td></tr>
            @endforelse
        </tbody>
    </table>
    </div>

    @if (count($report['ungraded_students']) > 0)
        <h2 class="section">تلاميذ بدون نقط مسجلة</h2>
        <table class="data">
            <thead>
                <tr>
                    <th width="30%">التلميذ</th>
                    <th width="25%">الأسرة</th>
                    <th width="30%">المؤسسة</th>
                    <th width="15%">المستوى</th>
                </tr>
            </thead>
            <tbody>
                @foreach ($report['ungraded_students'] as $i => $student)
                    <tr class="{{ $i % 2 ? 'alt' : '' }}">
                        <td>{{ $student['full_name'] }}</td>
                        <td class="muted">{{ $student['family'] ?? '—' }}</td>
                        <td>{{ $student['school'] ?? '—' }}</td>
                        <td>{{ $student['education_level'] ?? '—' }}</td>
                    </tr>
                @endforeach
            </tbody>
        </table>
    @endif

@endsection
