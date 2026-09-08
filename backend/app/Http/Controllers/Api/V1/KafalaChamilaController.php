<?php

namespace App\Http\Controllers\Api\V1;

use App\Exceptions\BusinessRuleException;
use App\Http\Controllers\Controller;
use App\Http\Requests\V1\StoreKafalaChamilaIncomeRequest;
use App\Http\Requests\V1\UpdateKafalaChamilaSplitsRequest;
use App\Models\KafalaChamilaSplit;
use App\Services\KafalaChamilaService;
use Illuminate\Http\JsonResponse;

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
        $splits = KafalaChamilaSplit::with(['subBudget', 'incomeCategory'])
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
     * Change the percentage each part gets. Admin-only: this reallocates
     * where every future kafala chamila payment's money is booked.
     */
    public function updateSplits(UpdateKafalaChamilaSplitsRequest $request): JsonResponse
    {
        if (!auth()->user()?->isAdmin()) {
            throw new BusinessRuleException('غير مخول لتعديل نسب توزيع الكفالة الشاملة. هذه العملية مقتصرة على المديرين فقط.', 403);
        }

        $splits = $this->kafalaChamila->updateSplits($request->validated()['splits']);

        return response()->json([
            'message' => 'تم تحديث نسب توزيع الكفالة الشاملة بنجاح',
            'data' => $splits,
        ]);
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
