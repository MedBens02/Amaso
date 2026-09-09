<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\V1\UpdateOrganizationSettingsRequest;
use App\Models\Setting;
use App\Support\OrganizationSettings;
use Illuminate\Http\JsonResponse;

class SettingsController extends Controller
{
    /**
     * Readable by any signed-in user - the association's name and contact
     * details appear on screens everyone uses. Writing is admin-only, via
     * the `role:admin` middleware on the route.
     */
    public function organization(): JsonResponse
    {
        return response()->json(['data' => OrganizationSettings::all()]);
    }

    public function updateOrganization(UpdateOrganizationSettingsRequest $request): JsonResponse
    {
        $validated = $request->validated();

        Setting::putMany([
            'org.name' => $validated['name'],
            'org.address' => $validated['address'] ?? null,
            'org.phone' => $validated['phone'] ?? null,
            'org.email' => $validated['email'] ?? null,
        ]);

        return response()->json([
            'message' => 'تم حفظ معلومات الجمعية بنجاح',
            'data' => OrganizationSettings::all(),
        ]);
    }
}
