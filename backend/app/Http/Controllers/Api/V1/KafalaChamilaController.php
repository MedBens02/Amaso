<?php

namespace App\Http\Controllers\Api\V1;

use App\Exceptions\BusinessRuleException;
use App\Http\Controllers\Controller;
use App\Http\Requests\V1\StoreKafalaChamilaIncomeRequest;
use App\Http\Requests\V1\UpdateKafalaChamilaSplitsRequest;
use App\Models\KafalaChamilaSplit;
use App\Services\KafalaChamilaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class KafalaChamilaController extends Controller
{
    public function __construct(private readonly KafalaChamilaService $kafalaChamila)
    {
    }

    /**
     * The 7-part split rule, for the income form's live preview and the
     * admin settings screen. Any authenticated user may read it.
     */
    public function splits(): JsonResponse
    {
        $splits = KafalaChamilaSplit::with(['budget', 'incomeCategory'])
            ->orderBy('sort_order')
            ->get();

        return response()->json(['data' => $splits]);
    }

    /**
     * The current balance of each part: approved money in minus approved
     * money out, one shared pool per part across every kafil - not a
     * per-widow or per-kafil wallet. Any authenticated user may read it.
     */
    public function balances(): JsonResponse
    {
        return response()->json(['data' => $this->kafalaChamila->balances()]);
    }

    /**
     * Per-family view of the shared pools: what each family brought in and
     * what has already been spent on them out of it. Advisory - see
     * KafalaChamilaService::familyBalances().
     */
    public function familyBalances(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'widow_ids' => ['required', 'array', 'min:1', 'max:200'],
            'widow_ids.*' => ['integer'],
        ], [
            'widow_ids.required' => 'يجب تحديد أسرة واحدة على الأقل',
        ]);

        return response()->json([
            'data' => array_values($this->kafalaChamila->familyBalances($validated['widow_ids'])),
        ]);
    }

    /**
     * Change the percentage each part gets. Admin-only: this reallocates
     * where every future kafala chamila payment's money is booked.
     */
    public function updateSplits(UpdateKafalaChamilaSplitsRequest $request): JsonResponse
    {
        $this->requireAdmin();

        $splits = $this->kafalaChamila->updateSplits($request->validated()['splits']);

        return response()->json([
            'message' => 'تم تحديث نسب توزيع الكفالة الشاملة بنجاح',
            'data' => $splits,
        ]);
    }

    /**
     * Add a part to the split.
     *
     * The seven were fixed in the schema and in the wording around it, which
     * was right while nobody had asked for an eighth. It comes in at zero
     * percent: the percentages must total exactly 100, and a new part cannot
     * know whose share it is taking.
     */
    public function storeSplit(Request $request): JsonResponse
    {
        $this->requireAdmin();

        $validated = $request->validate([
            'label' => ['required', 'string', 'max:120', Rule::unique('kafala_chamila_splits', 'label')],
        ], [
            'label.required' => 'اسم البند مطلوب',
            'label.unique' => 'يوجد بند بهذا الاسم',
        ]);

        $split = $this->kafalaChamila->createSplit($validated['label']);

        return response()->json([
            'message' => 'تم إضافة البند بنسبة 0%. عدّل النسب ليصبح مجموعها 100%.',
            'data' => $split->load(['budget', 'incomeCategory']),
        ], 201);
    }

    /** Rename a part, and the budget and category that carry its money. */
    public function updateSplit(Request $request, KafalaChamilaSplit $split): JsonResponse
    {
        $this->requireAdmin();

        $validated = $request->validate([
            'label' => ['required', 'string', 'max:120', Rule::unique('kafala_chamila_splits', 'label')->ignore($split->id)],
        ], [
            'label.required' => 'اسم البند مطلوب',
            'label.unique' => 'يوجد بند بهذا الاسم',
        ]);

        return response()->json([
            'message' => 'تم تحديث البند بنجاح',
            'data' => $this->kafalaChamila->renameSplit($split, $validated['label']),
        ]);
    }

    /**
     * Remove a part - only while no money has gone through it, and never
     * the last one, and never one still holding a share of the split.
     */
    public function destroySplit(KafalaChamilaSplit $split): JsonResponse
    {
        $this->requireAdmin();

        if (KafalaChamilaSplit::count() <= 1) {
            throw new BusinessRuleException('لا يمكن حذف آخر بند في توزيع الكفالة الشاملة.', 422);
        }

        if ((float) $split->percentage > 0.001) {
            throw new BusinessRuleException(
                "لا يمكن حذف \"{$split->label}\" وله نسبة {$split->percentage}%. أعد توزيع نسبته على البنود الأخرى أولاً.",
                422,
            );
        }

        $usage = $this->kafalaChamila->splitUsage($split);

        if ($usage['incomes'] + $usage['expenses'] > 0) {
            throw new BusinessRuleException(
                "لا يمكن حذف \"{$split->label}\": سُجّل عليه {$usage['incomes']} إيراد و{$usage['expenses']} مصروف. ميزانيته هي سجل أين ذهب ذلك المال.",
                422,
            );
        }

        $label = $split->label;
        $this->kafalaChamila->deleteSplit($split);

        return response()->json(['message' => "تم حذف البند \"{$label}\" بنجاح"]);
    }

    private function requireAdmin(): void
    {
        if (!auth()->user()?->isAdmin()) {
            throw new BusinessRuleException('غير مخول لتعديل توزيع الكفالة الشاملة. هذه العملية مقتصرة على المديرين فقط.', 403);
        }
    }

    /**
     * Record a kafil's kafala chamila payment as one income per split part.
     */
    public function storeIncome(StoreKafalaChamilaIncomeRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $splits = $validated['splits'];
        unset($validated['splits']);

        $incomes = $this->kafalaChamila->createIncomeBatch($validated, $splits);

        if ($incomes->isEmpty()) {
            throw new BusinessRuleException('لم يتم إدخال أي مبلغ في بنود التوزيع', 422);
        }

        return response()->json([
            'message' => "تم إنشاء {$incomes->count()} إيرادات موزعة على بنود الكفالة الشاملة بنجاح، وهي في انتظار الموافقة",
            'data' => $incomes,
        ], 201);
    }
}
