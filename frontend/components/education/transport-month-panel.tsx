"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import {
  Calculator, Loader2, Save, RefreshCw, Receipt, Lock, Unlock, Plus, Trash2, Users, Fuel,
} from "lucide-react"
import api from "@/lib/api"

/**
 * The end-of-month sheet.
 *
 * Everything the association does at the end of a month happens on this one
 * screen: put in what the fuel and the driver cost, tick off who used the
 * bus consistently, say how many times each of the far-away children came,
 * and read off what every family owes. The button at the bottom carries the
 * whole thing into the expense form rather than making anybody retype
 * twenty names and twenty amounts.
 */

interface MonthSummary {
  id: number
  period_month: string
  period_label: string
  status: string
  status_label: string
  fuel_cost: string | number
  driver_cost: string | number
  other_cost: string | number
  bus_pot: number
  riders_count?: number
  allowance_count?: number
  total_amount?: string | number | null
  expense_id?: number | null
}

interface Line {
  id: number
  mode: string
  rode_consistently: boolean
  attendances: number
  rate: string | number | null
  amount: string | number
  support?: {
    id: number
    pickup_point?: string | null
    enrollment?: {
      orphan?: { id: number; first_name: string; last_name: string }
      educationLevel?: { name_ar: string } | null
    }
  }
}

interface Totals {
  bus_pot: number
  riders_counted: number
  riders_total: number
  share_per_rider: number | null
  bus_total: number
  allowance_total: number
  allowance_children: number
  grand_total: number
}

const dirham = (v: number | string | null | undefined) =>
  v == null ? "—" : `${Number(v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} د.م.`

export function TransportMonthPanel({
  academicYearId,
  onSettled,
}: {
  academicYearId: number
  onSettled?: () => void
}) {
  const [months, setMonths] = useState<MonthSummary[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [lines, setLines] = useState<Line[]>([])
  const [totals, setTotals] = useState<Totals | null>(null)
  const [month, setMonth] = useState<MonthSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Edited locally and sent in one save, so the sheet is not re-divided on
  // every keystroke - which would make the share flicker while somebody is
  // still typing the fuel bill.
  const [fuel, setFuel] = useState("")
  const [driver, setDriver] = useState("")
  const [other, setOther] = useState("")
  const [dirty, setDirty] = useState(false)

  const { toast } = useToast()
  const router = useRouter()

  const loadMonths = useCallback(async () => {
    try {
      setLoading(true)
      const response = await api.getTransportMonths(academicYearId)
      const list: MonthSummary[] = response.data || []
      setMonths(list)
      setSelectedId((current) => {
        if (current && list.some((m) => m.id === current)) return current
        return list.find((m) => m.status === "draft")?.id ?? list[0]?.id ?? null
      })
    } catch (error: any) {
      toast({ title: "خطأ", description: error.message || "فشل في تحميل الأشهر", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [academicYearId])

  const loadSheet = useCallback(async (id: number) => {
    try {
      setLoading(true)
      const response = await api.getTransportMonth(id)
      const data = (response as any).data
      setMonth(data.month)
      setLines(data.lines || [])
      setTotals(data.totals)
      setFuel(String(data.month.fuel_cost ?? ""))
      setDriver(String(data.month.driver_cost ?? ""))
      setOther(String(data.month.other_cost ?? ""))
      setDirty(false)
    } catch (error: any) {
      toast({ title: "خطأ", description: error.message || "فشل في تحميل الشهر", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadMonths() }, [loadMonths])
  useEffect(() => { if (selectedId) loadSheet(selectedId) }, [selectedId, loadSheet])

  const isClosed = month?.status === "closed"

  /**
   * What the sheet would say if it were saved now.
   *
   * Computed here as well as on the server so that ticking a name moves the
   * numbers immediately. The server's answer is what gets stored - this only
   * has to agree with it, which it does because it is the same arithmetic:
   * the pot over the ticked riders, and rate times attendances.
   */
  const preview = useMemo(() => {
    const pot = (Number(fuel) || 0) + (Number(driver) || 0) + (Number(other) || 0)
    const counted = lines.filter((l) => l.mode === "bus" && l.rode_consistently).length
    const allowance = lines
      .filter((l) => l.mode === "allowance")
      .reduce((sum, l) => sum + (Number(l.rate) || 0) * (Number(l.attendances) || 0), 0)

    return {
      pot,
      counted,
      share: counted > 0 ? Math.round((pot / counted) * 100) / 100 : null,
      allowance: Math.round(allowance * 100) / 100,
      grand: Math.round((pot + allowance) * 100) / 100,
    }
  }, [fuel, driver, other, lines])

  const setLine = (id: number, patch: Partial<Line>) => {
    setLines((rows) => rows.map((row) => (row.id === id ? { ...row, ...patch } : row)))
    setDirty(true)
  }

  const save = async () => {
    if (!month) return
    setSaving(true)
    try {
      const response = await api.updateTransportMonth(month.id, {
        fuel_cost: Number(fuel) || 0,
        driver_cost: Number(driver) || 0,
        other_cost: Number(other) || 0,
        lines: lines.map((l) => ({
          id: l.id,
          rode_consistently: l.rode_consistently,
          attendances: Number(l.attendances) || 0,
        })),
      })
      const data = (response as any).data
      setMonth(data.month); setLines(data.lines || []); setTotals(data.totals)
      setDirty(false)
      toast({ title: "تم", description: (response as any).message })
      loadMonths()
    } catch (error: any) {
      toast({ title: "خطأ", description: error.message || "فشل في الحفظ", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const openMonth = async () => {
    // The month after the latest one on file, or this month when there are none.
    const latest = months[0]
    const next = latest
      ? (() => { const d = new Date(latest.period_month); d.setMonth(d.getMonth() + 1); return d })()
      : new Date()

    try {
      const response = await api.createTransportMonth({
        academic_year_id: academicYearId,
        period_month: `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}-01`,
      })
      toast({ title: "تم", description: (response as any).message })
      await loadMonths()
      setSelectedId((response as any).data.month.id)
    } catch (error: any) {
      toast({ title: "خطأ", description: error.message || "فشل في فتح الشهر", variant: "destructive" })
    }
  }

  const refresh = async () => {
    if (!month) return
    try {
      const response = await api.refreshTransportMonth(month.id)
      const data = (response as any).data
      setMonth(data.month); setLines(data.lines || []); setTotals(data.totals)
      toast({ title: "تم", description: (response as any).message })
    } catch (error: any) {
      toast({ title: "خطأ", description: error.message, variant: "destructive" })
    }
  }

  const toExpense = async () => {
    if (!month) return
    if (dirty) {
      toast({ title: "احفظ أولاً", description: "هناك تعديلات غير محفوظة في الشهر", variant: "destructive" })
      return
    }
    // The expenses screen fetches the draft itself from this id, so nothing
    // has to be squeezed through the address bar or left in browser storage.
    router.push(`/dashboard/expenses?transport_month=${month.id}`)
  }

  const reopen = async () => {
    if (!month) return
    try {
      const response = await api.reopenTransportMonth(month.id)
      const data = (response as any).data
      setMonth(data.month); setLines(data.lines || []); setTotals(data.totals)
      toast({ title: "تم", description: (response as any).message })
      loadMonths()
    } catch (error: any) {
      toast({ title: "خطأ", description: error.message, variant: "destructive" })
    }
  }

  const removeMonth = async () => {
    if (!month) return
    try {
      const response = await api.deleteTransportMonth(month.id)
      toast({ title: "تم", description: (response as any).message })
      setSelectedId(null)
      await loadMonths()
    } catch (error: any) {
      toast({ title: "تعذر الحذف", description: error.message, variant: "destructive" })
    }
  }

  const busLines = lines.filter((l) => l.mode === "bus")
  const allowanceLines = lines.filter((l) => l.mode === "allowance")
  const nameOf = (line: Line) => {
    const o = line.support?.enrollment?.orphan
    return o ? `${o.first_name} ${o.last_name}` : "—"
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            حساب الشهر
          </CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={selectedId ? String(selectedId) : ""}
              onValueChange={(v) => setSelectedId(Number(v))}
            >
              <SelectTrigger className="w-52"><SelectValue placeholder="اختر الشهر" /></SelectTrigger>
              <SelectContent>
                {months.map((m) => (
                  <SelectItem key={m.id} value={String(m.id)}>
                    {m.period_label} — {m.status_label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={openMonth}>
              <Plus className="h-4 w-4 ml-1" />
              فتح شهر جديد
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : !month ? (
          <div className="text-center py-10 space-y-3">
            <p className="text-muted-foreground">لم يُفتح أي شهر في هذه السنة الدراسية بعد</p>
            <Button variant="outline" onClick={openMonth}>
              <Plus className="h-4 w-4 ml-1" />
              فتح أول شهر
            </Button>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={isClosed ? "secondary" : "default"} className="gap-1">
                {isClosed ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
                {month.status_label}
              </Badge>
              <span className="text-sm text-muted-foreground">{month.period_label}</span>
              {isClosed && month.expense_id && (
                <Badge variant="outline">مصروف رقم {month.expense_id}</Badge>
              )}
            </div>

            {/* ---- what the bus cost ---- */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="space-y-2">
                <Label className="flex items-center gap-1"><Fuel className="h-3.5 w-3.5" /> الوقود</Label>
                <Input
                  type="number" min={0} step="0.01" inputMode="decimal" disabled={isClosed}
                  value={fuel} onChange={(e) => { setFuel(e.target.value); setDirty(true) }}
                />
              </div>
              <div className="space-y-2">
                <Label>أجرة السائق</Label>
                <Input
                  type="number" min={0} step="0.01" inputMode="decimal" disabled={isClosed}
                  value={driver} onChange={(e) => { setDriver(e.target.value); setDirty(true) }}
                />
              </div>
              <div className="space-y-2">
                <Label>مصاريف أخرى</Label>
                <Input
                  type="number" min={0} step="0.01" inputMode="decimal" disabled={isClosed}
                  value={other} onChange={(e) => { setOther(e.target.value); setDirty(true) }}
                />
              </div>
              <div className="space-y-2">
                <Label>مجموع كلفة الحافلة</Label>
                <div className="h-10 flex items-center rounded-md border bg-muted/40 px-3 font-bold">
                  {dirham(preview.pot)}
                </div>
              </div>
            </div>

            <div className="rounded-lg border bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="text-blue-800 dark:text-blue-300">
                  {dirham(preview.pot)} ÷ {preview.counted} مستفيداً استفادوا بانتظام
                </span>
                <span className="font-bold text-blue-900 dark:text-blue-200">
                  نصيب المستفيد الواحد ≈ {preview.share == null ? "—" : dirham(preview.share)}
                </span>
              </div>
              <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
                تُوزَّع السنتيمات المتبقية على الأنصبة الأولى حتى يكون مجموع الأنصبة مطابقاً للمبلغ المصروف تماماً
              </p>
            </div>

            {/* ---- who rode ---- */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  ركاب الحافلة ({preview.counted} من {busLines.length})
                </h3>
                {!isClosed && (
                  <Button variant="ghost" size="sm" onClick={refresh}>
                    <RefreshCw className="h-4 w-4 ml-1" />
                    إضافة المسجلين الجدد
                  </Button>
                )}
              </div>
              <div className="overflow-x-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-28">استفاد بانتظام</TableHead>
                      <TableHead>المستفيد</TableHead>
                      <TableHead>نقطة الالتقاء</TableHead>
                      <TableHead className="text-left">النصيب</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {busLines.length === 0 ? (
                      <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-6">
                        لا يوجد ركاب في هذا الشهر
                      </TableCell></TableRow>
                    ) : busLines.map((line) => (
                      <TableRow key={line.id} className={line.rode_consistently ? "" : "opacity-55"}>
                        <TableCell>
                          <Checkbox
                            checked={line.rode_consistently}
                            disabled={isClosed}
                            onCheckedChange={(v) => setLine(line.id, { rode_consistently: Boolean(v) })}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{nameOf(line)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {line.support?.pickup_point || "—"}
                        </TableCell>
                        <TableCell className="text-left font-medium">
                          {line.rode_consistently
                            ? dirham(isClosed || !dirty ? line.amount : preview.share)
                            : <span className="text-muted-foreground">—</span>}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* ---- who made their own way ---- */}
            {allowanceLines.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">
                  منح التنقل ({totals?.allowance_children ?? 0} من {allowanceLines.length})
                </h3>
                <div className="overflow-x-auto rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-28">عدد الحضور</TableHead>
                        <TableHead>المستفيد</TableHead>
                        <TableHead>قيمة الحضور</TableHead>
                        <TableHead className="text-left">المجموع</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allowanceLines.map((line) => (
                        <TableRow key={line.id}>
                          <TableCell>
                            <Input
                              type="number" min={0} max={60} className="h-8 w-20"
                              disabled={isClosed}
                              value={line.attendances}
                              onChange={(e) => setLine(line.id, { attendances: Number(e.target.value) || 0 })}
                            />
                          </TableCell>
                          <TableCell className="font-medium">{nameOf(line)}</TableCell>
                          <TableCell className="text-sm">{dirham(line.rate)}</TableCell>
                          <TableCell className="text-left font-medium">
                            {dirham((Number(line.rate) || 0) * (Number(line.attendances) || 0))}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* ---- the bottom line ---- */}
            <div className="rounded-lg border p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">كلفة الحافلة الموزَّعة</span>
                <span>{dirham(preview.pot)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">منح التنقل</span>
                <span>{dirham(preview.allowance)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t font-bold">
                <span>المجموع العام للشهر</span>
                <span>{dirham(preview.grand)}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 justify-end">
              {!isClosed && (
                <>
                  <Button variant="ghost" onClick={removeMonth}>
                    <Trash2 className="h-4 w-4 ml-1" />
                    حذف الشهر
                  </Button>
                  <Button variant="outline" onClick={save} disabled={saving || !dirty}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin ml-1" /> : <Save className="h-4 w-4 ml-1" />}
                    حفظ الشهر
                  </Button>
                  <Button onClick={toExpense} disabled={preview.grand <= 0}>
                    <Receipt className="h-4 w-4 ml-1" />
                    إنشاء مصروف بهذه المبالغ
                  </Button>
                </>
              )}
              {isClosed && (
                <Button variant="outline" onClick={reopen}>
                  <Unlock className="h-4 w-4 ml-1" />
                  إرجاع إلى مسودة
                </Button>
              )}
            </div>

            {dirty && !isClosed && (
              <p className="text-xs text-amber-600 dark:text-amber-400 text-left">
                هناك تعديلات غير محفوظة — المبالغ المعروضة تقديرية حتى تحفظ الشهر
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
