{{-- Label/value pairs in two columns; $items is [label => value]. --}}
@php
    $entries = collect($items)->filter(fn ($v) => $v !== null && $v !== '')->all();
    $half = (int) ceil(count($entries) / 2);
    $columns = array_chunk($entries, max($half, 1), true);
@endphp
<div class="section-block">
    <h2 class="section">{{ $heading }}</h2>
    <table width="100%" class="info">
        <tr>
            @foreach ($columns as $column)
                <td width="50%" style="vertical-align: top;">
                    <table width="100%">
                        @foreach ($column as $label => $value)
                            <tr>
                                <td width="45%" class="k">{{ $label }}</td>
                                <td class="v">{{ $value }}</td>
                            </tr>
                        @endforeach
                    </table>
                </td>
            @endforeach
        </tr>
    </table>
</div>
