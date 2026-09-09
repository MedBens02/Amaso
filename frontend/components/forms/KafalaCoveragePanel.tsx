"use client"

import { useEffect, useState } from "react"
import { AlertTriangle, HandCoins } from "lucide-react"
import api from "@/lib/api"

export interface FamilyAllocation {
  widowId: number
  widowName: string
  amount: number
}

interface KafalaCoveragePanelProps {
  /** The sub-budget the expense is booked to. */
  budgetId?: number
  /** How much of this expense is going to each family. */
  allocations: FamilyAllocation[]
}

const money = (value: number) =>
  `${Number(value || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} د.م`

/**
 * Shown only when the expense is booked to one of the kafala chamila
 * budgets. Puts the shared pool and each family's own contribution side
 * by side, and warns - without blocking - when an expense would take more
 * for a family than that family brought in, because the difference comes out
 * of the pool other kafils funded.
 */
export function KafalaCoveragePanel({ budgetId, allocations }: KafalaCoveragePanelProps) {
  const [pool, setPool] = useState<any | null>(null)
  const [families, setFamilies] = useState<Record<number, any>>({})
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    if (!budgetId) {
      setPool(null)
      setChecked(true)
      return
    }

    api
      .getKafalaChamilaBalances()
      .then((res) => {
        const match = (res.data || []).find((b: any) => b.budget?.id === budgetId)
        setPool(match || null)
      })
      .catch(() => setPool(null))
      .finally(() => setChecked(true))
  }, [budgetId])

  const widowIds = allocations.map((a) => a.widowId)
  const widowKey = widowIds.slice().sort((a, b) => a - b).join(",")

  useEffect(() => {
    if (!pool || widowIds.length === 0) {
      setFamilies({})
      return
    }

    api
      .getKafalaChamilaFamilyBalances(widowIds)
      .then((res) => {
        const byWidow: Record<number, any> = {}
        for (const family of res.data || []) {
          byWidow[family.widow_id] = family
        }
        setFamilies(byWidow)
      })
      .catch(() => setFamilies({}))
    // widowKey keeps this stable when the same families are re-rendered.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [widowKey, pool])

  // Not a kafala chamila sub-budget - nothing to say.
  if (!checked || !pool) {
    return null
  }

  const remainingForFamily = (widowId: number): number | null => {
    const family = families[widowId]
    if (!family) return null
    const part = family.parts.find((p: any) => p.budget_id === budgetId)
    return part ? part.remaining : 0
  }

  const overspending = allocations.filter((a) => {
    const remaining = remainingForFamily(a.widowId)
    return remaining !== null && a.amount > remaining + 0.001
  })

  return (
    <div className="rounded-xl border border-teal-200 bg-teal-50/60 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HandCoins className="h-5 w-5 text-teal-700" />
          <h4 className="font-semibold text-teal-900">تغطية الكفالة الشاملة — {pool.label}</h4>
        </div>
        <div className="text-left">
          <p className="text-xs text-gray-600">الرصيد المشترك في هذا البند</p>
          <p className="font-bold text-teal-800">{money(pool.remaining)}</p>
        </div>
      </div>

      {allocations.length === 0 ? (
        <p className="text-sm text-gray-600">حدد المستفيدين لعرض رصيد كل أسرة في هذا البند.</p>
      ) : (
        <div className="space-y-1">
          {allocations.map((allocation) => {
            const remaining = remainingForFamily(allocation.widowId)
            const isOver = remaining !== null && allocation.amount > remaining + 0.001

            return (
              <div
                key={allocation.widowId}
                className="flex items-center justify-between rounded-lg bg-white border p-2 text-sm"
              >
                <span className="font-medium">{allocation.widowName}</span>
                <div className="flex items-center gap-4">
                  <span className="text-gray-600">
                    المخصص: <span className="font-semibold">{money(allocation.amount)}</span>
                  </span>
                  <span className={isOver ? "text-amber-700 font-semibold" : "text-gray-600"}>
                    رصيد الأسرة: {remaining === null ? "…" : money(remaining)}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {overspending.length > 0 && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
          <p>
            المبلغ المخصص لـ{" "}
            <span className="font-semibold">{overspending.map((o) => o.widowName).join("، ")}</span>{" "}
            يتجاوز ما توفره كفالة هذه الأسرة في هذا البند. سيتم تغطية الفارق من الرصيد المشترك الممول من كفلاء آخرين.
            يمكنك المتابعة إذا كان ذلك مقصوداً.
          </p>
        </div>
      )}
    </div>
  )
}
