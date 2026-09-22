<?php

namespace App\Http\Controllers\Api\V1\References;

use App\Http\Controllers\Controller;
use App\Models\Neighborhood;
use App\Models\Widow;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

/**
 * Not a BaseReferenceController, because renaming one of these is not just
 * a row: the families carry the neighborhood as text, so the name has to
 * move on both sides at once or the list and the records disagree.
 */
class NeighborhoodController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $neighborhoods = Neighborhood::with('sector')
            ->when($request->filled('sector_id'), fn ($q) => $q->where('sector_id', $request->sector_id))
            ->orderBy('label')
            ->get();

        // How many families are on each name, counted in one query rather
        // than one per row. It is what makes "can I delete this?" answerable.
        $families = Widow::query()->regular()
            ->selectRaw('neighborhood, COUNT(*) as total')
            ->groupBy('neighborhood')
            ->pluck('total', 'neighborhood');

        return response()->json([
            'data' => $neighborhoods->map(fn (Neighborhood $item) => [
                ...$item->toArray(),
                'widows_count' => (int) ($families[$item->label] ?? 0),
            ]),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $neighborhood = Neighborhood::create($this->validated($request));

        return response()->json([
            'message' => 'تم إنشاء الحي بنجاح',
            'data' => $neighborhood->load('sector'),
        ], 201);
    }

    public function update(Request $request, Neighborhood $neighborhood): JsonResponse
    {
        $data = $this->validated($request, $neighborhood);
        $previous = $neighborhood->label;

        $moved = DB::transaction(function () use ($neighborhood, $data, $previous) {
            $neighborhood->update($data);

            if ($data['label'] === $previous) {
                return 0;
            }

            return Widow::where('neighborhood', $previous)->update(['neighborhood' => $data['label']]);
        });

        return response()->json([
            'message' => $moved > 0
                ? "تم تحديث الحي بنجاح، وتم تحديث {$moved} أسرة مسجلة به."
                : 'تم تحديث الحي بنجاح',
            'data' => $neighborhood->fresh()->load('sector'),
        ]);
    }

    /**
     * Removing a name from the list is not the same as removing it from the
     * families living there - there is nowhere to move them to, and their
     * address is not wrong just because somebody is tidying a list. So the
     * families keep the text they have and the name stops being offered.
     */
    public function destroy(Neighborhood $neighborhood): JsonResponse
    {
        // Every family on the name, عدة cases included: a name still
        // attached to one of them is still in use, and deleting it would
        // leave her address pointing at nothing.
        $inUse = Widow::where('neighborhood', $neighborhood->label)->count();

        if ($inUse > 0) {
            return response()->json([
                'message' => "لا يمكن حذف \"{$neighborhood->label}\": {$inUse} أسرة مسجلة به. غيّر حيّها أولاً.",
            ], 422);
        }

        $label = $neighborhood->label;
        $neighborhood->delete();

        return response()->json(['message' => "تم حذف الحي \"{$label}\" بنجاح"]);
    }

    private function validated(Request $request, ?Neighborhood $current = null): array
    {
        return $request->validate([
            'label' => ['required', 'string', 'max:120', Rule::unique('neighborhoods', 'label')->ignore($current?->id)],
            'sector_id' => ['nullable', 'integer', 'exists:sectors,id'],
        ]);
    }
}
