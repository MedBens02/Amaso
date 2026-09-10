"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { HandCoins } from "lucide-react"
import api from "@/lib/api"

const money = (value: number) =>
  `${Number(value || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} د.م`

/**
 * What this family's kafala contributions have brought into the shared pools
 * and how much of it has already been spent on them. Advisory: the money is
 * pooled, so this is what the family brought in, not a wallet they own.
 */
export function KafalaFamilyBalance({ widowId }: { widowId: number }) {
  const [balance, setBalance] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    setLoading(true)

    api
      .getKafalaChamilaFamilyBalances([widowId])
      .then((res) => {
        if (active) setBalance((res.data || [])[0] || null)
      })
      .catch(() => {
        if (active) setBalance(null)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [widowId])

  if (loading || !balance) {
    return null
  }

  const activeParts = balance.parts.filter((p: any) => p.credited || p.spent)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HandCoins className="h-5 w-5 text-teal-600" />
          رصيد الكفالة الشاملة لهذه الأسرة
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-green-50 dark:bg-green-950/40 border border-green-100 dark:border-green-900 rounded-lg p-3">
            <p className="text-xl font-bold text-green-700 dark:text-green-400">{money(balance.total_credited)}</p>
            <p className="text-xs text-muted-foreground">ما قدّمه كفلاء الأسرة</p>
          </div>
          <div className="bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900 rounded-lg p-3">
            <p className="text-xl font-bold text-red-700 dark:text-red-400">{money(balance.total_spent)}</p>
            <p className="text-xs text-muted-foreground">ما صُرف على الأسرة</p>
          </div>
          <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900 rounded-lg p-3">
            <p className={`text-xl font-bold ${balance.total_remaining < 0 ? "text-red-700 dark:text-red-400" : "text-blue-700 dark:text-blue-400"}`}>
              {money(balance.total_remaining)}
            </p>
            <p className="text-xs text-muted-foreground">المتبقي</p>
          </div>
        </div>

        {activeParts.length > 0 && (
          <div className="space-y-1">
            {activeParts.map((part: any) => (
              <div key={part.split_id} className="flex justify-between text-sm border rounded p-2">
                <span>{part.label}</span>
                <span className="text-muted-foreground">
                  قُدّم {money(part.credited)} — صُرف {money(part.spent)} —{" "}
                  <span className={part.remaining < 0 ? "text-red-600 font-semibold" : "font-semibold"}>
                    متبقٍ {money(part.remaining)}
                  </span>
                </span>
              </div>
            ))}
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          المبالغ تُجمع في الميزانيات المشتركة. هذا الرصيد يوضح ما قدّمته كفالات هذه الأسرة تحديداً وما صُرف
          عليها منه، ولا يمنع الصرف من الرصيد المشترك عند الحاجة.
        </p>
      </CardContent>
    </Card>
  )
}
