"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { AlertTriangle, CheckCircle2, Loader2, Receipt } from "lucide-react"
import api from "@/lib/api"
import { cn } from "@/lib/utils"

const SOURCE_FILTERS = [
  { value: "all", label: "كل الحركات" },
  { value: "income", label: "إيراد بحوالة بنكية" },
  { value: "income_deposit", label: "إيداع إيراد نقدي/شيك" },
  { value: "expense", label: "مصروف" },
  { value: "transfer_in", label: "تحويل وارد" },
  { value: "transfer_out", label: "تحويل صادر" },
]

/** Left-to-right inside Arabic text, or the bidi algorithm reorders it. */
function Money({ value, className }: { value: number; className?: string }) {
  return (
    <span dir="ltr" className={cn("inline-block tabular-nums", className)}>
      {value < 0 ? "−" : ""}DH{" "}
      {Math.abs(value).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
    </span>
  )
}

function DateText({ value }: { value?: string | null }) {
  if (!value) return <span className="text-muted-foreground">—</span>
  const [year, month, day] = value.split("-")
  return (
    <span dir="ltr" className="inline-block tabular-nums">
      {`${day}/${month}/${year}`}
    </span>
  )
}

/**
 * Every movement on one account, and whether they add up to its balance.
 *
 * The ledger has recorded each change since the app was first used and
 * nothing ever read it back, so a balance was a number with no story behind
 * it - impossible to reconcile against what the bank says. The check at the
 * top is the one that matters: opening balance plus every recorded movement
 * has to equal the stored balance, and if it ever does not, the screen says
 * so instead of showing a total nobody can trace.
 */
export function BankAccountStatement({
  accountId,
  open,
  onOpenChange,
}: {
  accountId: number | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [data, setData] = useState<any | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sourceType, setSourceType] = useState("all")
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")

  useEffect(() => {
    if (!open) return
    setSourceType("all")
    setFrom("")
    setTo("")
  }, [open, accountId])

  useEffect(() => {
    if (!open || !accountId) return

    let cancelled = false
    setLoading(true)
    setError(null)

    api
      .getBankAccountStatement(accountId, {
        source_type: sourceType === "all" ? undefined : sourceType,
        from: from || undefined,
        to: to || undefined,
        per_page: 100,
      })
      .then((response) => {
        if (!cancelled) setData(response.data)
      })
      .catch((err: any) => {
        if (!cancelled) setError(err?.message || "تعذر تحميل كشف الحساب")
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [open, accountId, sourceType, from, to])

  const account = data?.account
  const reconciliation = data?.reconciliation
  const rows = data?.transactions ?? []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-4xl overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5 shrink-0" />
            كشف حساب — {account?.label ?? "..."}
          </DialogTitle>
          <DialogDescription>
            {account ? `${account.bank_name} · ${account.account_number}` : "جاري التحميل..."}
          </DialogDescription>
        </DialogHeader>

        {reconciliation && (
          <div
            className={cn(
              "rounded-lg border p-4",
              reconciliation.balanced
                ? "border-green-300 bg-green-50 dark:border-green-900 dark:bg-green-950/40"
                : "border-red-300 bg-red-50 dark:border-red-900 dark:bg-red-950/40",
            )}
          >
            <div className="flex items-center gap-2 font-medium">
              {reconciliation.balanced ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600 dark:text-green-400" />
              ) : (
                <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" />
              )}
              {reconciliation.balanced
                ? "الرصيد مطابق لسجل الحركات"
                : "الرصيد لا يطابق سجل الحركات — راجع الحساب"}
            </div>
            <div className="mt-2 grid gap-x-4 gap-y-2 text-sm sm:grid-cols-4">
              <div>
                <div className="text-muted-foreground">الرصيد الافتتاحي</div>
                <Money value={reconciliation.opening_balance} />
              </div>
              <div>
                <div className="text-muted-foreground">مجموع الحركات</div>
                <Money value={reconciliation.recorded_movements} />
              </div>
              <div>
                <div className="text-muted-foreground">الرصيد المتوقع</div>
                <Money value={reconciliation.expected_balance} />
              </div>
              <div>
                <div className="text-muted-foreground">الرصيد المسجل</div>
                <Money value={reconciliation.stored_balance} className="font-semibold" />
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">نوع الحركة</Label>
            <Select value={sourceType} onValueChange={setSourceType}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SOURCE_FILTERS.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">من تاريخ</Label>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-[160px]" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">إلى تاريخ</Label>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-[160px]" />
          </div>
          {(sourceType !== "all" || from || to) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSourceType("all")
                setFrom("")
                setTo("")
              }}
            >
              إلغاء التصفية
            </Button>
          )}
        </div>

        <Separator />

        <div className="max-h-[45vh] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center gap-2 p-8 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              جاري التحميل...
            </div>
          ) : error ? (
            <p className="p-8 text-center text-destructive">{error}</p>
          ) : rows.length === 0 ? (
            <p className="p-8 text-center text-muted-foreground">لا توجد حركات مطابقة.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">التاريخ</TableHead>
                  <TableHead className="text-right">نوع الحركة</TableHead>
                  <TableHead className="text-right">البيان</TableHead>
                  <TableHead className="text-right">المبلغ</TableHead>
                  <TableHead className="text-right">الرصيد بعدها</TableHead>
                  <TableHead className="text-right">بواسطة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row: any) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <DateText value={row.date} />
                    </TableCell>
                    <TableCell>
                      <Badge variant={row.amount >= 0 ? "secondary" : "outline"}>{row.source_label}</Badge>
                    </TableCell>
                    <TableCell className="max-w-[240px] truncate" title={row.description || undefined}>
                      {row.description || "—"}
                    </TableCell>
                    <TableCell>
                      <Money
                        value={row.amount}
                        className={cn(
                          "font-medium",
                          row.amount >= 0 ? "text-green-700 dark:text-green-400" : "text-red-600",
                        )}
                      />
                    </TableCell>
                    <TableCell>
                      <Money value={row.balance_after} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">{row.created_by || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {data?.totals && (
          <div className="flex flex-wrap items-center gap-x-6 gap-y-1 border-t pt-3 text-sm">
            <span className="text-muted-foreground">مجموع الوارد:</span>
            <Money value={data.totals.credits} className="font-medium text-green-700 dark:text-green-400" />
            <span className="text-muted-foreground">مجموع الصادر:</span>
            <Money value={data.totals.debits} className="font-medium text-red-600" />
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
