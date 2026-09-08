<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\FiscalYear;
use App\Models\Kafil;
use App\Services\ReportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    public function __construct(private readonly ReportService $reports)
    {
    }

    /**
     * A sponsor's statement: what they contributed and how it was designated,
     * alongside what the families they sponsor received from the association.
     */
    public function kafilStatement(Request $request, Kafil $kafil): JsonResponse
    {
        $validated = $request->validate([
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date', 'after_or_equal:from'],
        ], [
            'from.date' => 'تاريخ البداية غير صحيح',
            'to.date' => 'تاريخ النهاية غير صحيح',
            'to.after_or_equal' => 'تاريخ النهاية يجب أن يكون بعد تاريخ البداية',
        ]);

        [$from, $to] = $this->resolvePeriod($validated);

        return response()->json([
            'data' => $this->reports->kafilStatement($kafil, $from, $to),
        ]);
    }

    /**
     * Defaults to the active fiscal year, which is stored as a plain year.
     *
     * @return array{0: string, 1: string}
     */
    private function resolvePeriod(array $validated): array
    {
        if (!empty($validated['from']) && !empty($validated['to'])) {
            return [$validated['from'], $validated['to']];
        }

        $year = FiscalYear::where('is_active', true)->value('year') ?? now()->year;

        return [
            $validated['from'] ?? "{$year}-01-01",
            $validated['to'] ?? "{$year}-12-31",
        ];
    }
}
