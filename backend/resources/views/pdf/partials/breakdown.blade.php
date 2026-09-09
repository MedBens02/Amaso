{{-- A labelled breakdown: the same shape recurs in every financial report. --}}
<div class="section-block">
    <h2 class="section">{{ $heading }}</h2>
    <table class="data">
        <thead>
            <tr>
                <th width="{{ $showCount ?? true ? '54%' : '70%' }}">{{ $labelHeading ?? 'البند' }}</th>
                @if ($showCount ?? true)
                    <th width="16%" class="center">العدد</th>
                @endif
                <th width="30%" class="num">{{ $valueHeading ?? 'المبلغ' }}</th>
            </tr>
        </thead>
        <tbody>
            @forelse ($rows as $i => $row)
                <tr class="{{ $i % 2 ? 'alt' : '' }}">
                    <td>{{ $row['label'] }}</td>
                    @if ($showCount ?? true)
                        <td class="center">{{ $row['count'] ?? $row['total'] }}</td>
                    @endif
                    <td class="num">{{ ($formatter ?? null) ? ($formatter)($row['total']) : $row['total'] }}</td>
                </tr>
            @empty
                <tr><td colspan="{{ ($showCount ?? true) ? 3 : 2 }}" class="empty">لا توجد بيانات.</td></tr>
            @endforelse
        </tbody>
    </table>
</div>
