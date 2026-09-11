"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { AlertTriangle, CheckCircle2, Loader2, TrendingDown, TrendingUp, Wallet } from "lucide-react"
import api from "@/lib/api"
import { cn, toNumber } from "@/lib/utils"

type ClosingSummary = {
  unapprovedIncomes: number
  unapprovedExpenses: number
  unapprovedTransfers: number
  untransferredCash?: number
  currentCash: number
  canClose: boolean
  validationMessages: string[]
}

/** Left-to-right inside Arabic text, or the bidi algorithm reorders it. */
function Money({ value, className }: { value: unknown; className?: string }) {
  return (
    <span dir="ltr" className={cn("inline-block tabular-nums", className)}>
      DH {toNumber(value).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
    </span>
  )
}

function Stat({ label, children, tone }: { label: string; children: React.ReactNode; tone?: string }) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={cn("mt-1 text-lg font-semibold", tone)}>{children}</div>
    </div>
  )
}

/**
 * What a fiscal year actually contains, as an accounting period.
 *
 * The button that opens this had no onClick at all - it was a labelled
 * control that did nothing. The year cards already show the carryover and the
 * pending counts, so this answers the question they raise and cannot: what
 * happened *inside* the year, and what is still standing between it and being
 * closed.
 *
 * The activity totals come from the same aggregate the financial report is
 * built from, windowed to the year, so the two cannot disagree.
 */
export function FiscalYearDetailsDialog({
  open,
  onOpenChange,
  year,
  summary,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  year: {
    id: number
    year: string
    status: string
    isActive: boolean
    carryOver: number
    carryoverNextYear: number
  } | null
  summary?: ClosingSummary
}) {
  const [financial, setFinancial] = useState<any | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !year) return

    let cancelled = false
    setLoading(true)
    setError(null)

    api
      .getFinancialReport({ from: `${year.year}-01-01`, to: `${year.year}-12-31` })
      .then((response) => {
        if (!cancelled) setFinancial(response.data)
      })
      .catch((err: any) => {
        if (!cancelled) setError(err?.message || "تعذر تحميل حركة السنة المالية")
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [open, year?.id])

  if (!year) return null

  const totals = financial?.totals
  const pending =
    (summary?.unapprovedIncomes ?? 0) +
    (summary?.unapprovedExpenses ?? 0) +
    (summary?.unapprovedTransfers ?? 0)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5 shrink-0" />
            السنة المالية {year.year}
            <Badge variant={year.isActive ? "default" : "secondary"}>{year.status}</Badge>
          </DialogTitle>
          <DialogDescription>
            رصيد الافتتاح، وحركة السنة، وما تبقّى قبل الإغلاق
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Stat label="المرحّل من السنة السابقة">
              <Money value={year.carryOver} />
            </Stat>
            <Stat label={year.isActive ? "الرصيد الحالي في الحسابات" : "المرحّل للسنة الموالية"}>
              <Money value={year.isActive ? (summary?.currentCash ?? 0) : year.carryoverNextYear} />
            </Stat>
          </div>

          <Separator />

          <div>
            <h4 className="mb-2 text-sm font-medium text-muted-foreground">حركة السنة (العمليات المعتمدة)</h4>

            {loading ? (
              <div className="flex items-center justify-center gap-2 p-6 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                جاري التحميل...
              </div>
            ) : error ? (
              <p className="p-4 text-center text-destructive">{error}</p>
            ) : (
              <>
                <div className="grid gap-3 sm:grid-cols-3">
                  <Stat label="الإيرادات" tone="text-green-700 dark:text-green-400">
                    <span className="flex items-center gap-1.5">
                      <TrendingUp className="h-4 w-4 shrink-0" />
                      <Money value={totals?.income} />
                    </span>
                  </Stat>
                  <Stat label="المصروفات" tone="text-red-600">
                    <span className="flex items-center gap-1.5">
                      <TrendingDown className="h-4 w-4 shrink-0" />
                      <Money value={totals?.expense} />
                    </span>
                  </Stat>
                  <Stat
                    label="الفارق"
                    tone={toNumber(totals?.balance) >= 0 ? "text-green-700 dark:text-green-400" : "text-red-600"}
                  >
                    <Money value={totals?.balance} />
                  </Stat>
                </div>

                <p className="mt-2 text-xs text-muted-foreground">
                  {toNumber(totals?.income_count)} عملية إيراد و{toNumber(totals?.expense_count)} عملية مصروف خلال السنة.
                </p>
              </>
            )}
          </div>

          {summary && (
            <>
              <Separator />
              <div
                className={cn(
                  "rounded-lg border p-4",
                  summary.canClose
                    ? "border-green-300 bg-green-50 dark:border-green-900 dark:bg-green-950/40"
                    : "border-amber-300 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40",
                )}
              >
                <div className="flex items-center gap-2 font-medium">
                  {summary.canClose ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600 dark:text-green-400" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
                  )}
                  {summary.canClose ? "جاهزة للإغلاق" : "لا يمكن الإغلاق بعد"}
                </div>

                <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                  {summary.validationMessages.map((message) => (
                    <li key={message}>• {message}</li>
                  ))}
                </ul>

                {pending > 0 && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    {pending} عملية بانتظار الاعتماد. لا تدخل في الأرقام أعلاه حتى تُعتمد.
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
