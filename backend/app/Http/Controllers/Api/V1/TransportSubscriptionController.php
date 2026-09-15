<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\AcademicYear;
use App\Models\OrphanEnrollment;
use App\Models\OrphanTransportSubscription;
use App\Models\TransportRoute;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class TransportSubscriptionController extends Controller
{
    private const RELATIONS = [
        'enrollment.orphan.widow',
        'enrollment.academicYear',
        'enrollment.educationLevel',
        'enrollment.school',
        'route.provider',
        'provider',
    ];

    public function index(Request $request): JsonResponse
    {
        $yearId = $request->integer('academic_year_id') ?: AcademicYear::where('is_current', true)->value('id');

        $subscriptions = OrphanTransportSubscription::with(self::RELATIONS)
            ->when($yearId, fn ($q) => $q->forAcademicYear((int) $yearId))
            ->when($request->filled('route_id'), fn ($q) => $q->where('route_id', $request->integer('route_id')))
            ->when($request->boolean('standalone_only'), fn ($q) => $q->whereNull('route_id'))
            ->when($request->filled('purpose'), fn ($q) => $q->where('purpose', $request->purpose))
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->status))
            ->when($request->filled('paid_by'), fn ($q) => $q->where('paid_by', $request->paid_by))
            ->when($request->filled('provider_id'), function ($q) use ($request) {
                // The transporter can be this arrangement's own or the one
                // running the route it sits on; a filter that only looked at
                // the column would miss every rider on a shared run.
                $providerId = $request->integer('provider_id');
                $q->where(fn ($w) => $w->where('provider_id', $providerId)
                    ->orWhereHas('route', fn ($r) => $r->where('provider_id', $providerId)));
            })
            ->when($request->search, fn ($q, $search) => $q->whereHas(
                'enrollment.orphan',
                fn ($orphan) => $orphan->where('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhereRaw("CONCAT(first_name, ' ', last_name) like ?", ["%{$search}%"])
                    ->orWhere('masar_code', 'like', "%{$search}%"),
            ))
            ->orderBy('id', 'desc')
            ->paginate(min($request->get('per_page', 25), 100));

        return response()->json([
            'data' => $subscriptions->items(),
            'meta' => [
                'current_page' => $subscriptions->currentPage(),
                'last_page' => $subscriptions->lastPage(),
                'per_page' => $subscriptions->perPage(),
                'total' => $subscriptions->total(),
                'academic_year_id' => $yearId,
                'purposes' => OrphanTransportSubscription::PURPOSES,
                'statuses' => OrphanTransportSubscription::STATUSES,
                'payers' => OrphanTransportSubscription::PAYERS,
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $this->validated($request);

        $subscription = DB::transaction(function () use ($validated) {
            $this->guardAgainstDuplicate($validated['enrollment_id'], $validated['purpose']);
            $this->guardCapacity($validated['route_id'] ?? null, $validated['status']);

            return OrphanTransportSubscription::create($validated);
        });

        return response()->json([
            'message' => 'تم تسجيل المستفيد في النقل بنجاح',
            'data' => $subscription->load(self::RELATIONS),
        ], 201);
    }

    public function update(Request $request, OrphanTransportSubscription $transportSubscription): JsonResponse
    {
        $validated = $this->validated($request, $transportSubscription);

        DB::transaction(function () use ($validated, $transportSubscription) {
            $this->guardAgainstDuplicate(
                $validated['enrollment_id'],
                $validated['purpose'],
                $transportSubscription->id,
            );

            // Only when the child is joining a run they were not already on,
            // or coming back to active on one - re-saving a rider who is
            // already counted against that capacity must not be refused by it.
            $routeId = $validated['route_id'] ?? null;
            $joining = $routeId !== null
                && ($transportSubscription->route_id !== $routeId
                    || $transportSubscription->status !== OrphanTransportSubscription::STATUS_ACTIVE);

            if ($joining) {
                $this->guardCapacity($routeId, $validated['status']);
            }

            $transportSubscription->update($validated);
        });

        return response()->json([
            'message' => 'تم تحديث بيانات النقل بنجاح',
            'data' => $transportSubscription->fresh(self::RELATIONS),
        ]);
    }

    public function destroy(OrphanTransportSubscription $transportSubscription): JsonResponse
    {
        $name = trim(
            ($transportSubscription->enrollment?->orphan?->first_name ?? '')
            . ' '
            . ($transportSubscription->enrollment?->orphan?->last_name ?? ''),
        );

        $transportSubscription->delete();

        return response()->json([
            'message' => $name === ''
                ? 'تم حذف سجل النقل بنجاح'
                : "تم حذف سجل النقل الخاص بـ \"{$name}\" بنجاح",
        ]);
    }

    /**
     * One live arrangement per child per destination.
     *
     * Not a unique index, because a child who changes transporter in January
     * should keep both rows - the one that ended and the one that started.
     * What must not happen is two arrangements both claiming to be current,
     * which is the state that makes "who is on the bus" unanswerable. MySQL
     * has no partial unique index to express that, so it is checked here,
     * inside the transaction that writes the row.
     */
    private function guardAgainstDuplicate(int $enrollmentId, string $purpose, ?int $ignoreId = null): void
    {
        $exists = OrphanTransportSubscription::where('enrollment_id', $enrollmentId)
            ->where('purpose', $purpose)
            ->where('status', OrphanTransportSubscription::STATUS_ACTIVE)
            ->when($ignoreId, fn ($q) => $q->where('id', '!=', $ignoreId))
            ->exists();

        if ($exists) {
            $label = OrphanTransportSubscription::PURPOSES[$purpose] ?? $purpose;

            throw ValidationException::withMessages([
                'purpose' => ["لهذا المستفيد سجل نقل جارٍ بنفس الوجهة ({$label}). أنهِ السجل السابق أولاً."],
            ]);
        }
    }

    /** A van with eleven seats does not take a twelfth child. */
    private function guardCapacity(?int $routeId, string $status): void
    {
        if ($routeId === null || $status !== OrphanTransportSubscription::STATUS_ACTIVE) {
            return;
        }

        $route = TransportRoute::lockForUpdate()->find($routeId);

        if ($route === null || $route->capacity === null) {
            return;
        }

        $riders = $route->activeRiders()->count();

        if ($riders >= $route->capacity) {
            throw ValidationException::withMessages([
                'route_id' => ["المسار \"{$route->name}\" مكتمل ({$riders} من {$route->capacity})."],
            ]);
        }
    }

    private function validated(Request $request, ?OrphanTransportSubscription $existing = null): array
    {
        $validated = $request->validate([
            'enrollment_id' => ['required', 'exists:orphan_enrollments,id'],
            'route_id' => ['nullable', 'exists:transport_routes,id'],
            'provider_id' => ['nullable', 'exists:transport_providers,id'],
            'purpose' => ['required', Rule::in(array_keys(OrphanTransportSubscription::PURPOSES))],
            'pickup_point' => ['nullable', 'string', 'max:150'],
            'monthly_cost' => ['nullable', 'numeric', 'min:0', 'max:999999.99'],
            'paid_by' => ['required', Rule::in(array_keys(OrphanTransportSubscription::PAYERS))],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'status' => ['required', Rule::in(array_keys(OrphanTransportSubscription::STATUSES))],
            'notes' => ['nullable', 'string', 'max:1000'],
        ], [
            'enrollment_id.required' => 'المستفيد مطلوب',
            'enrollment_id.exists' => 'لا يوجد تسجيل دراسي لهذا المستفيد في هذه السنة',
            'purpose.required' => 'وجهة النقل مطلوبة',
            'paid_by.required' => 'الجهة المتحملة للكلفة مطلوبة',
            'end_date.after_or_equal' => 'تاريخ الانتهاء لا يمكن أن يسبق تاريخ البداية',
        ]);

        // One transporter, from one place. A rider on a run is carried by the
        // run's transporter; storing a second copy here is how the two come
        // to disagree the next time the contract is re-let.
        if (! empty($validated['route_id'])) {
            $validated['provider_id'] = null;
        }

        $this->guardRouteYearMatches($validated);

        return $validated;
    }

    /**
     * A run belongs to an academic year and so does the enrollment. Putting a
     * 2026/2027 child on a 2025/2026 van makes both years' rosters wrong, and
     * nothing downstream would notice.
     */
    private function guardRouteYearMatches(array $validated): void
    {
        if (empty($validated['route_id'])) {
            return;
        }

        $enrollmentYear = OrphanEnrollment::whereKey($validated['enrollment_id'])->value('academic_year_id');
        $routeYear = TransportRoute::whereKey($validated['route_id'])->value('academic_year_id');

        if ($enrollmentYear !== null && $routeYear !== null && $enrollmentYear !== $routeYear) {
            throw ValidationException::withMessages([
                'route_id' => ['المسار المختار يخص سنة دراسية أخرى غير سنة التسجيل'],
            ]);
        }
    }
}
