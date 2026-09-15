<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\AcademicYear;
use App\Models\OrphanTransportSubscription;
use App\Models\TransportRoute;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class TransportRouteController extends Controller
{
    /**
     * The runs for one academic year, each with how many children are on it.
     *
     * withCount rather than loading the riders: a list of runs wants the
     * number, and loading every roster to count it is how the per_page=1000
     * aggregation calls this codebase already removed once came about.
     */
    public function index(Request $request): JsonResponse
    {
        $yearId = $request->integer('academic_year_id') ?: AcademicYear::where('is_current', true)->value('id');

        $routes = TransportRoute::with(['provider', 'school', 'academicYear'])
            ->withCount('activeRiders')
            ->when($yearId, fn ($q) => $q->where('academic_year_id', $yearId))
            ->when($request->filled('provider_id'), fn ($q) => $q->where('provider_id', $request->integer('provider_id')))
            ->when($request->filled('destination_type'), fn ($q) => $q->where('destination_type', $request->destination_type))
            ->when($request->filled('is_active'), fn ($q) => $q->where('is_active', $request->boolean('is_active')))
            ->when($request->search, fn ($q, $search) => $q->where(
                fn ($w) => $w->where('name', 'like', "%{$search}%")
                    ->orWhere('pickup_area', 'like', "%{$search}%"),
            ))
            ->orderBy('name')
            ->get();

        return response()->json([
            'data' => $routes,
            'meta' => [
                'academic_year_id' => $yearId,
                'destinations' => TransportRoute::DESTINATIONS,
            ],
        ]);
    }

    /** One run and everybody on it, for the roster view. */
    public function show(TransportRoute $transportRoute): JsonResponse
    {
        $transportRoute->load([
            'provider',
            'school',
            'academicYear',
            'subscriptions.enrollment.orphan',
            'subscriptions.enrollment.educationLevel',
            'subscriptions.enrollment.school',
        ]);
        $transportRoute->loadCount('activeRiders');

        return response()->json(['data' => $transportRoute]);
    }

    public function store(Request $request): JsonResponse
    {
        $route = TransportRoute::create($this->validated($request));

        return response()->json([
            'message' => 'تم إنشاء مسار النقل بنجاح',
            'data' => $route->load(['provider', 'school'])->loadCount('activeRiders'),
        ], 201);
    }

    public function update(Request $request, TransportRoute $transportRoute): JsonResponse
    {
        $validated = $this->validated($request, $transportRoute);

        // Shrinking a run below the number of children already on it would
        // leave it over capacity with no way to see which seat is the extra
        // one. Take the riders off first, then shrink it.
        $riders = $transportRoute->activeRiders()->count();
        if (($validated['capacity'] ?? null) !== null && $validated['capacity'] < $riders) {
            return response()->json([
                'message' => "لا يمكن جعل الطاقة الاستيعابية {$validated['capacity']} لأن المسار يقل حالياً {$riders} مستفيداً",
                'errors' => ['capacity' => ["المسار يقل حالياً {$riders} مستفيداً"]],
            ], 422);
        }

        $transportRoute->update($validated);

        return response()->json([
            'message' => 'تم تحديث مسار النقل بنجاح',
            'data' => $transportRoute->fresh(['provider', 'school'])->loadCount('activeRiders'),
        ]);
    }

    public function destroy(TransportRoute $transportRoute): JsonResponse
    {
        $riders = $transportRoute->subscriptions()->count();

        if ($riders > 0) {
            return response()->json([
                'message' => "لا يمكن حذف هذا المسار لأن {$riders} مستفيداً مسجلون فيه. يمكن تعطيله بدل حذفه.",
            ], 400);
        }

        $name = $transportRoute->name;
        $transportRoute->delete();

        return response()->json(['message' => "تم حذف المسار \"{$name}\" بنجاح"]);
    }

    /**
     * What transport costs and covers this year.
     *
     * Every figure here is advisory - a planning total built from what was
     * agreed, not from what was paid. What was actually spent lives in the
     * expenses under "نقل مدرسي" and is reached from the accounting screens.
     */
    public function summary(Request $request): JsonResponse
    {
        $yearId = $request->integer('academic_year_id') ?: AcademicYear::where('is_current', true)->value('id');

        $routes = TransportRoute::where('academic_year_id', $yearId)->get();
        $activeRoutes = $routes->where('is_active', true);

        $riders = OrphanTransportSubscription::forAcademicYear((int) $yearId);
        $activeRiders = (clone $riders)->active()->count();

        // A run's price plus whatever standalone arrangements cost on their
        // own. Riders on a run are not added again - the run's price already
        // covers them, and summing both is how a transport budget doubles.
        $routeCost = (float) $activeRoutes->sum('monthly_cost');
        $standaloneCost = (float) OrphanTransportSubscription::forAcademicYear((int) $yearId)
            ->active()
            ->whereNull('route_id')
            ->sum('monthly_cost');

        return response()->json([
            'data' => [
                'academic_year_id' => $yearId,
                'routes_total' => $routes->count(),
                'routes_active' => $activeRoutes->count(),
                'riders_active' => $activeRiders,
                'riders_total' => (clone $riders)->count(),
                'seats_total' => (int) $activeRoutes->whereNotNull('capacity')->sum('capacity'),
                'monthly_cost_routes' => round($routeCost, 2),
                'monthly_cost_standalone' => round($standaloneCost, 2),
                'monthly_cost_total' => round($routeCost + $standaloneCost, 2),
                'by_purpose' => OrphanTransportSubscription::forAcademicYear((int) $yearId)
                    ->active()
                    ->selectRaw('purpose, COUNT(*) as total')
                    ->groupBy('purpose')
                    ->pluck('total', 'purpose'),
            ],
        ]);
    }

    private function validated(Request $request, ?TransportRoute $existing = null): array
    {
        $validated = $request->validate([
            'academic_year_id' => ['required', 'exists:academic_years,id'],
            'provider_id' => ['nullable', 'exists:transport_providers,id'],
            'name' => [
                'required', 'string', 'max:150',
                Rule::unique('transport_routes', 'name')
                    ->where('academic_year_id', $request->integer('academic_year_id'))
                    ->ignore($existing?->id),
            ],
            'destination_type' => ['required', Rule::in(array_keys(TransportRoute::DESTINATIONS))],
            'school_id' => ['nullable', 'exists:schools,id'],
            'capacity' => ['nullable', 'integer', 'min:1', 'max:200'],
            'monthly_cost' => ['nullable', 'numeric', 'min:0', 'max:999999.99'],
            'schedule' => ['nullable', 'string', 'max:255'],
            'pickup_area' => ['nullable', 'string', 'max:150'],
            'is_active' => ['boolean'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ], [
            'academic_year_id.required' => 'السنة الدراسية مطلوبة',
            'name.required' => 'اسم المسار مطلوب',
            'name.unique' => 'يوجد مسار بهذا الاسم في نفس السنة الدراسية',
            'destination_type.required' => 'وجهة المسار مطلوبة',
            'capacity.min' => 'الطاقة الاستيعابية يجب أن تكون 1 على الأقل',
            'monthly_cost.min' => 'الكلفة الشهرية لا يمكن أن تكون سالبة',
        ]);

        // A destination that is not an institution cannot name one - a run to
        // tutoring centres pointed at "ثانوية النهضة" reads as a school run
        // on every screen that shows it.
        if ($validated['destination_type'] !== 'school') {
            $validated['school_id'] = null;
        }

        $validated['is_active'] = $request->boolean('is_active', true);

        return $validated;
    }
}
