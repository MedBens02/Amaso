<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\TransportProvider;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class TransportProviderController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $providers = TransportProvider::withCount(['routes', 'subscriptions'])
            ->when($request->filled('type'), fn ($q) => $q->where('type', $request->type))
            ->when($request->filled('is_active'), fn ($q) => $q->where('is_active', $request->boolean('is_active')))
            ->when($request->search, fn ($q, $search) => $q->where(
                fn ($w) => $w->where('name', 'like', "%{$search}%")
                    ->orWhere('contact_name', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%"),
            ))
            ->orderBy('name')
            ->get();

        return response()->json([
            'data' => $providers,
            'meta' => ['types' => TransportProvider::TYPES],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $provider = TransportProvider::create($this->validated($request));

        return response()->json([
            'message' => 'تم إضافة الناقل بنجاح',
            'data' => $provider,
        ], 201);
    }

    public function update(Request $request, TransportProvider $transportProvider): JsonResponse
    {
        $transportProvider->update($this->validated($request, $transportProvider->id));

        return response()->json([
            'message' => 'تم تحديث بيانات الناقل بنجاح',
            'data' => $transportProvider->fresh(),
        ]);
    }

    /**
     * Deleting a transporter that has carried children would take the record
     * of who they carried with it, so it is refused - the same guard schools
     * have. Somebody who has stopped working with the association is marked
     * inactive instead, which keeps them out of the dropdowns without
     * rewriting history.
     */
    public function destroy(TransportProvider $transportProvider): JsonResponse
    {
        $inUse = $transportProvider->routes()->count() + $transportProvider->subscriptions()->count();

        if ($inUse > 0) {
            return response()->json([
                'message' => "لا يمكن حذف هذا الناقل لأنه مرتبط بـ {$inUse} سجل نقل. يمكن تعطيله بدل حذفه.",
            ], 400);
        }

        $name = $transportProvider->name;
        $transportProvider->delete();

        return response()->json(['message' => "تم حذف الناقل \"{$name}\" بنجاح"]);
    }

    private function validated(Request $request, ?int $ignoreId = null): array
    {
        $validated = $request->validate([
            'name' => [
                'required', 'string', 'max:150',
                Rule::unique('transport_providers', 'name')->ignore($ignoreId),
            ],
            'type' => ['required', Rule::in(array_keys(TransportProvider::TYPES))],
            'contact_name' => ['nullable', 'string', 'max:150'],
            'phone' => ['nullable', 'string', 'max:30'],
            'is_active' => ['boolean'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ], [
            'name.required' => 'اسم الناقل مطلوب',
            'name.unique' => 'يوجد ناقل بهذا الاسم مسبقاً',
            'type.required' => 'نوع الناقل مطلوب',
            'type.in' => 'نوع الناقل غير صالح',
        ]);

        $validated['is_active'] = $request->boolean('is_active', true);

        return $validated;
    }
}
