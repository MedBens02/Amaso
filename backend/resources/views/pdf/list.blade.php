{{-- A plain listing: pass $columns and $rows and it renders in the house style.
     Used where a report is a table of records rather than a set of breakdowns. --}}
@extends('pdf.layout')

@section('content')

    @if (!empty($meta))
        <table class="meta" width="100%">
            <tr>
                @foreach ($meta as $key => $value)
                    <td class="k">{{ $key }}</td>
                    <td class="v">{{ $value }}</td>
                @endforeach
            </tr>
        </table>
    @endif

    @if (!empty($stats))
        <table class="stats" width="100%">
            <tr>
                @foreach ($stats as $stat)
                    <td width="{{ (int) (100 / max(count($stats), 1)) }}%">
                        <div class="label">{{ $stat['label'] }}</div>
                        <div class="value">{{ $stat['value'] }}</div>
                    </td>
                @endforeach
            </tr>
        </table>
    @endif

    <h2 class="section">{{ $heading ?? $title }}</h2>
    <table class="data">
        <thead>
            <tr>
                @foreach ($columns as $column)
                    <th width="{{ $column['width'] ?? '' }}" class="{{ $column['align'] ?? '' }}">{{ $column['label'] }}</th>
                @endforeach
            </tr>
        </thead>
        <tbody>
            @forelse ($rows as $i => $row)
                <tr class="{{ $i % 2 ? 'alt' : '' }}">
                    @foreach ($columns as $column)
                        <td class="{{ $column['align'] ?? '' }}">{{ $row[$column['key']] ?? '—' }}</td>
                    @endforeach
                </tr>
            @empty
                <tr><td colspan="{{ count($columns) }}" class="empty">لا توجد بيانات.</td></tr>
            @endforelse
        </tbody>
    </table>

@endsection
