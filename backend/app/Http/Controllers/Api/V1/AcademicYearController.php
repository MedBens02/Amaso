<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\AcademicYear;
use App\Services\EducationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AcademicYearController extends Controller
{
    public function __construct(private readonly EducationService $education)
    {
    }

    public function index(): JsonResponse
    {
        $years = AcademicYear::withCount('enrollments')
            ->orderBy('start_year', 'desc')
            ->get();

        return response()->json(['data' => $years]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'start_year' => ['required', 'integer', 'min:2000', 'max:2100', 'unique:academic_years,start_year'],
        ], [
            'start_year.unique' => 'هذه السنة الدراسية موجودة مسبقاً',
        ]);

        $year = AcademicYear::create([
            'start_year' => $validated['start_year'],
            'label' => AcademicYear::labelFor($validated['start_year']),
            // The first year created becomes the current one automatically.
            'is_current' => !AcademicYear::where('is_current', true)->exists(),
        ]);

        return response()->json([
            'message' => "تم إنشاء السنة الدراسية {$year->label} بنجاح",
            'data' => $year,
        ], 201);
    }

    /**
     * Close the current academic year and open the next one, promoting
     * passed students and re-enrolling failed ones.
     */
    public function rollover(): JsonResponse
    {
        $result = $this->education->rollover();

        $message = "تم إغلاق السنة الدراسية {$result['closed']} وفتح {$result['opened']}. "
            . "تمت ترقية {$result['promoted']} تلميذاً وإعادة تسجيل {$result['repeated']}.";

        // The counts alone hide the students the rollover deliberately would
        // not decide for - which are exactly the ones needing attention now.
        if ($result['needs_placement'] !== []) {
            $message .= ' ' . count($result['needs_placement']) . ' تلميذ(ة) أنهى مرحلته ويحتاج إلى توجيه.';
        }

        if ($result['needs_school'] !== []) {
            $message .= ' ' . count($result['needs_school']) . ' تلميذ(ة) انتقل إلى سلك جديد ويحتاج إلى تحديد المؤسسة.';
        }

        return response()->json([
            'message' => $message,
            'data' => $result,
        ]);
    }
}
