<?php

namespace App\Http\Controllers\Api\V1\References;

use App\Models\Sector;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class SectorController extends BaseReferenceController
{
    protected string $model = Sector::class;
    protected string $entityName = 'القطاع';

    public function index(): JsonResponse
    {
        return response()->json([
            'data' => Sector::withCount('neighborhoods')->orderBy('label')->get(),
        ]);
    }

    protected function validateData(Request $request, ?Model $current = null): array
    {
        return $request->validate([
            'label' => ['required', 'string', 'max:120', Rule::unique('sectors', 'label')->ignore($current?->id)],
        ]);
    }

    /**
     * The neighborhoods stay; they go back to having no sector.
     *
     * Deleting them with their sector would take the families' addresses
     * with them, and a sector being wrong says nothing about whether its
     * neighborhoods are. The foreign key does this on its own
     * (nullOnDelete); this is here to say so.
     */
    protected function beforeDestroy(Model $item): ?JsonResponse
    {
        return null;
    }
}
