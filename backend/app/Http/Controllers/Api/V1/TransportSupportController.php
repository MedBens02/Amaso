<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\AcademicYear;
use App\Models\TransportMonth;
use App\Models\TransportSupport;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class TransportSupportController extends Controller
{
    private const RELATIONS = [
        'enrollment.orphan.widow',
        'enrollment.academicYear',
        'enrollment.educationLevel',
    ];

    public function index(Request $request): JsonResponse
    {
        $yearId = $request->integer('academic_year_id') ?: AcademicYear::where('is_current', true)->value('id');

        $support = TransportSupport::with(self::RELATIONS)
            ->when($yearId, fn ($q) => $q->forAcademicYear((int) $yearId))
            ->when($request->filled('mode'), fn ($q) => $q->where('mode', $request->mode))
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->status))
            ->when($request->search, fn ($q, $search) => $q->whereHas(
                'enrollment.orphan',
                fn ($orphan) => $orphan->where('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhereRaw("CONCAT(first_name, ' ', last_name) like ?", ["%{$search}%"])
                    ->orWhere('masar_code', 'like', "%{$search}%"),
            ))
            ->orderBy('mode')
            ->orderBy('id', 'desc')
            ->paginate(min($request->get('per_page', 50), 200));

        return response()->json([
            'data' => $support->items(),
            'meta' => [
                'current_page' => $support->currentPage(),
                'last_page' => $support->lastPage(),
                'per_page' => $support->perPage(),
                'total' => $support->total(),
                'academic_year_id' => $yearId,
                'modes' => TransportSupport::MODES,
                'statuses' => TransportSupport::STATUSES,
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $this->validated($request);

        $support = DB::transaction(function () use ($validated) {
            $this->guardOneLiveArrangement($validated['enrollment_id'], $validated['status']);

            return TransportSupport::create($validated);
        });

        return response()->json([
            'message' => 'تم تسجيل المستفيد في النقل بنجاح',
            'data' => $support->load(self::RELATIONS),
        ], 201);
    }

    public function update(Request $request, TransportSupport $transportSupport): JsonResponse
    {
        $validated = $this->validated($request, $transportSupport);

        DB::transaction(function () use ($validated, $transportSupport) {
            $this->guardOneLiveArrangement(
                $validated['enrollment_id'],
                $validated['status'],
                $transportSupport->id,
            );

            $transportSupport->update($validated);
        });

        return response()->json([
            'message' => 'تم تحديث بيانات النقل بنجاح',
            'data' => $transportSupport->fresh(self::RELATIONS),
        ]);
    }

    /**
     * Deleting is refused once a settled month has paid against this record,
     * because the line that carries the amount hangs off it and would go
     * with it - taking a piece of a month that has already been turned into
     * an expense. Ending the arrangement is what the staff want anyway.
     */
    public function destroy(TransportSupport $transportSupport): JsonResponse
    {
        // status is derived from the two settlement timestamps, not stored,
        // so the question has to be asked of them: has the half of any month
        // that this child belongs to already been paid out?
        $column = $transportSupport->mode === TransportSupport::MODE_BUS
            ? 'bus_settled_at'
            : 'allowance_settled_at';

        $settled = $transportSupport->monthLines()
            ->whereHas('month', fn ($q) => $q->whereNotNull($column))
            ->count();

        if ($settled > 0) {
            return response()->json([
                'message' => "لا يمكن حذف هذا السجل لأنه يظهر في {$settled} شهراً مُرحَّلاً. غيّر حالته إلى \"منتهٍ\" بدل حذفه.",
            ], 400);
        }

        $orphan = $transportSupport->enrollment?->orphan;
        $name = trim(($orphan->first_name ?? '') . ' ' . ($orphan->last_name ?? ''));
        $transportSupport->delete();

        return response()->json([
            'message' => $name === '' ? 'تم حذف سجل النقل' : "تم حذف سجل النقل الخاص بـ \"{$name}\"",
        ]);
    }

    /**
     * A child is on the bus or on an allowance, not both.
     *
     * Two live arrangements would put the same child in the month's sheet
     * twice - counted once in the division and once again as an allowance -
     * and the month's total would exceed what was spent. A child who changes
     * from one to the other ends the first and starts the second, which
     * leaves both rows in the record and only one of them live.
     */
    private function guardOneLiveArrangement(int $enrollmentId, string $status, ?int $ignoreId = null): void
    {
        if ($status !== TransportSupport::STATUS_ACTIVE) {
            return;
        }

        $exists = TransportSupport::where('enrollment_id', $enrollmentId)
            ->where('status', TransportSupport::STATUS_ACTIVE)
            ->when($ignoreId, fn ($q) => $q->where('id', '!=', $ignoreId))
            ->exists();

        if ($exists) {
            throw ValidationException::withMessages([
                'enrollment_id' => ['لهذا المستفيد سجل نقل جارٍ بالفعل. أنهِ السجل السابق قبل إضافة آخر.'],
            ]);
        }
    }

    private function validated(Request $request, ?TransportSupport $existing = null): array
    {
        $validated = $request->validate([
            'enrollment_id' => ['required', 'exists:orphan_enrollments,id'],
            'mode' => ['required', Rule::in(array_keys(TransportSupport::MODES))],
            'pickup_point' => ['nullable', 'string', 'max:150'],
            'allowance_rate' => ['nullable', 'numeric', 'min:0', 'max:9999.99'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'status' => ['required', Rule::in(array_keys(TransportSupport::STATUSES))],
            'notes' => ['nullable', 'string', 'max:1000'],
        ], [
            'enrollment_id.required' => 'المستفيد مطلوب',
            'enrollment_id.exists' => 'لا يوجد تسجيل دراسي لهذا المستفيد في هذه السنة',
            'mode.required' => 'نوع الدعم مطلوب',
            'status.required' => 'الحالة مطلوبة',
            'end_date.after_or_equal' => 'تاريخ الانتهاء لا يمكن أن يسبق تاريخ البداية',
        ]);

        if ($validated['mode'] === TransportSupport::MODE_ALLOWANCE) {
            if (($validated['allowance_rate'] ?? null) === null) {
                throw ValidationException::withMessages([
                    'allowance_rate' => ['قيمة المنحة عن كل حضور مطلوبة'],
                ]);
            }
            // The bus stops nowhere for a child who makes their own way.
            $validated['pickup_point'] = null;
        } else {
            // A rate on a bus rider would be a second answer to what they
            // cost, disagreeing with their share of the month's pot.
            $validated['allowance_rate'] = null;
        }

        return $validated;
    }
}
