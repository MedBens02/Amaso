"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import {
  Calculator, Loader2, Save, RefreshCw, Receipt, Lock, Unlock, Plus, Trash2, Bus, Fuel, Footprints,
} from "lucide-react"
import api from "@/lib/api"

/**
 * The end-of-month sheet.
 *
 * Two halves that are settled separately, because they are two kinds of
 * spending: one vehicle whose cost is divided among whoever rode it, and a
 * set of allowances that are each one child's. Each half has its own button
 * carrying it into the expense form with the names and amounts already
 * filled in, and each freezes on its own once it has been paid - the fuel
 * bill can be written up while the attendance counts are still coming in.
 */

type Part = "bus" | "allowance"

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
  bus_settled: boolean
  allowance_settled: boolean
  bus_expense_id?: number | null
  allowance_expense_id?: number | null
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
    enrollment?: { orphan?: { id: number; first_name: string; last_name: string } }
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

export function TransportMonthPanel({ academicYearId }: { academicYearId: number }) {
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
        return list.find((m) => m.status !== "closed")?.id ?? list[0]?.id ?? null
      })
    } catch (error: any) {
      toast({ title: "خطأ", description: error.message || "فشل في تحميل الأشهر", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [academicYearId])

  const apply = (data: any) => {
    setMonth(data.month)
    setLines(data.lines || [])
    setTotals(data.totals)
    setFuel(String(data.month.fuel_cost ?? ""))
    setDriver(String(data.month.driver_cost ?? ""))
    setOther(String(data.month.other_cost ?? ""))
    setDirty(false)
  }

  const loadSheet = useCallback(async (id: number) => {
    try {
      setLoading(true)
      apply((await api.getTransportMonth(id) as any).data)
    } catch (error: any) {
      toast({ title: "خطأ", description: error.message || "فشل في تحميل الشهر", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadMonths() }, [loadMonths])
  useEffect(() => { if (selectedId) loadSheet(selectedId) }, [selectedId, loadSheet])

  const busLocked = Boolean(month?.bus_settled)
  const allowanceLocked = Boolean(month?.allowance_settled)

  /**
   * What the sheet would say if it were saved now.
   *
   * Computed here as well as on the server so that ticking a name moves the
   * numbers immediately. The server's answer is what gets stored - this only
   * has to agree with it, which it does because it is the same arithmetic.
   * A settled half is read from the stored amounts instead, since those are
   * frozen and no longer follow from what is on screen.
   */
  const preview = useMemo(() => {
    const pot = (Number(fuel) || 0) + (Number(driver) || 0) + (Number(other) || 0)
    const counted = lines.filter((l) => l.mode === "bus" && l.rode_consistently).length
    const busStored = lines
      .filter((l) => l.mode === "bus")
      .reduce((sum, l) => sum + (Number(l.amount) || 0), 0)
    const allowance = lines
      .filter((l) => l.mode === "allowance")
      .reduce((sum, l) => sum + (Number(l.rate) || 0) * (Number(l.attendances) || 0), 0)
    const allowanceStored = lines
      .filter((l) => l.mode === "allowance")
      .reduce((sum, l) => sum + (Number(l.amount) || 0), 0)

    const busTotal = busLocked ? Math.round(busStored * 100) / 100 : pot
    const allowanceTotal = allowanceLocked
      ? Math.round(allowanceStored * 100) / 100
      : Math.round(allowance * 100) / 100

    return {
      pot,
      counted,
      share: counted > 0 ? Math.round((pot / counted) * 100) / 100 : null,
      busTotal,
      allowanceTotal,
      grand: Math.round((busTotal + allowanceTotal) * 100) / 100,
    }
  }, [fuel, driver, other, lines, busLocked, allowanceLocked])

  const setLine = (id: number, patch: Partial<Line>) => {
    setLines((rows) => rows.map((row) => (row.id === id ? { ...row, ...patch } : row)))
    setDirty(true)
  }

  const save = async () => {
    if (!month) return
    setSaving(true)
    try {
      const payload: Record<string, any> = {
        lines: lines.map((l) => ({
          id: l.id,
          rode_consistently: l.rode_consistently,
          attendances: Number(l.attendances) || 0,
        })),
      }
      // The costs belong to the bus half; sending them once it is settled is
      // refused outright, and the allowances beside it must still save.
      if (!busLocked) {
        payload.fuel_cost = Number(fuel) || 0
        payload.driver_cost = Number(driver) || 0
        payload.other_cost = Number(other) || 0
      }

      const response = await api.updateTransportMonth(month.id, payload)
      apply((response as any).data)
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
      apply((response as any).data)
      toast({ title: "تم", description: (response as any).message })
    } catch (error: any) {
      toast({ title: "خطأ", description: error.message, variant: "destructive" })
    }
  }

  const toExpense = (part: Part) => {
    if (!month) return
    if (dirty) {
      toast({ title: "احفظ أولاً", description: "هناك تعديلات غير محفوظة في الشهر", variant: "destructive" })
      return
    }
    // The expenses screen fetches the draft itself from these two values, so
    // nothing has to be squeezed through the address bar or left in storage.
    router.push(`/dashboard/expenses?transport_month=${month.id}&part=${part}`)
  }

  const reopen = async (part: Part) => {
    if (!month) return
    try {
      const response = await api.reopenTransportMonth(month.id, part)
      apply((response as any).data)
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

  const settledBanner = (part: Part, expenseId?: number | null) => (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-muted/40 p-3">
      <span className="text-sm flex items-center gap-2">
        <Lock className="h-4 w-4" />
        مُرحَّلة إلى المصروف رقم {expenseId ?? "—"} — المبالغ مجمّدة
      </span>
      <Button variant="outline" size="sm" onClick={() => reopen(part)}>
        <Unlock className="h-4 w-4 ml-1" />
        إرجاع إلى مسودة
      </Button>
    </div>
  )

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
              <SelectTrigger className="w-56"><SelectValue placeholder="اختر الشهر" /></SelectTrigger>
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
              <Badge variant={month.status === "closed" ? "secondary" : "default"} className="gap-1">
                {month.status === "closed" ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
                {month.status_label}
              </Badge>
              <span className="text-sm text-muted-foreground">{month.period_label}</span>
            </div>

            <Tabs defaultValue="bus" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="bus" className="flex items-center gap-2">
                  <Bus className="h-4 w-4" />
                  كلفة الحافلة
                  {busLocked && <Lock className="h-3 w-3" />}
                </TabsTrigger>
                <TabsTrigger value="allowance" className="flex items-center gap-2">
                  <Footprints className="h-4 w-4" />
                  منح التنقل
                  {allowanceLocked && <Lock className="h-3 w-3" />}
                </TabsTrigger>
              </TabsList>

              {/* ================= the bus ================= */}
              <TabsContent value="bus" className="space-y-4">
                {busLocked && settledBanner("bus", month.bus_expense_id)}

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="space-y-2">
                    <Label className="flex h-5 items-center gap-1"><Fuel className="h-3.5 w-3.5" /> الوقود</Label>
                    <Input
                      type="number" min={0} step="0.01" inputMode="decimal" disabled={busLocked}
                      value={fuel} onChange={(e) => { setFuel(e.target.value); setDirty(true) }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex h-5 items-center">أجرة السائق</Label>
                    <Input
                      type="number" min={0} step="0.01" inputMode="decimal" disabled={busLocked}
                      value={driver} onChange={(e) => { setDriver(e.target.value); setDirty(true) }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex h-5 items-center">مصاريف أخرى</Label>
                    <Input
                      type="number" min={0} step="0.01" inputMode="decimal" disabled={busLocked}
                      value={other} onChange={(e) => { setOther(e.target.value); setDirty(true) }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex h-5 items-center">مجموع كلفة الحافلة</Label>
                    <div className="flex h-10 items-center rounded-md border bg-muted/40 px-3 font-bold">
                      {dirham(preview.busTotal)}
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

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-sm">
                      ركاب الحافلة ({preview.counted} من {busLines.length})
                    </h3>
                    {!busLocked && (
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
                          <TableHead className="text-end">النصيب</TableHead>
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
                                disabled={busLocked}
                                onCheckedChange={(v) => setLine(line.id, { rode_consistently: Boolean(v) })}
                              />
                            </TableCell>
                            <TableCell className="font-medium">{nameOf(line)}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {line.support?.pickup_point || "—"}
                            </TableCell>
                            <TableCell className="text-end font-medium">
                              {line.rode_consistently
                                ? dirham(busLocked || !dirty ? line.amount : preview.share)
                                : <span className="text-muted-foreground">—</span>}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {!busLocked && (
                  <div className="flex flex-wrap gap-2 justify-end">
                    <Button variant="outline" onClick={save} disabled={saving || !dirty}>
                      {saving ? <Loader2 className="h-4 w-4 animate-spin ml-1" /> : <Save className="h-4 w-4 ml-1" />}
                      حفظ الشهر
                    </Button>
                    <Button onClick={() => toExpense("bus")} disabled={preview.pot <= 0 || preview.counted === 0}>
                      <Receipt className="h-4 w-4 ml-1" />
                      إنشاء مصروف كلفة الحافلة ({dirham(preview.pot)})
                    </Button>
                  </div>
                )}
              </TabsContent>

              {/* ================= the allowances ================= */}
              <TabsContent value="allowance" className="space-y-4">
                {allowanceLocked && settledBanner("allowance", month.allowance_expense_id)}

                <p className="text-sm text-muted-foreground">
                  مستفيدون يسكنون خارج مسار الحافلة، يتقاضون منحة عن كل حضور. تُرحَّل في مصروف مستقل عن كلفة الحافلة.
                </p>

                <div className="overflow-x-auto rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-28">عدد الحضور</TableHead>
                        <TableHead>المستفيد</TableHead>
                        <TableHead>قيمة الحضور</TableHead>
                        <TableHead className="text-end">المجموع</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allowanceLines.length === 0 ? (
                        <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-6">
                          لا يوجد مستفيدون من منح التنقل في هذا الشهر
                        </TableCell></TableRow>
                      ) : allowanceLines.map((line) => (
                        <TableRow key={line.id}>
                          <TableCell>
                            <Input
                              type="number" min={0} max={60} className="h-8 w-20"
                              disabled={allowanceLocked}
                              value={line.attendances}
                              onChange={(e) => setLine(line.id, { attendances: Number(e.target.value) || 0 })}
                            />
                          </TableCell>
                          <TableCell className="font-medium">{nameOf(line)}</TableCell>
                          <TableCell className="text-sm">{dirham(line.rate)}</TableCell>
                          <TableCell className="text-end font-medium">
                            {dirham(allowanceLocked
                              ? line.amount
                              : (Number(line.rate) || 0) * (Number(line.attendances) || 0))}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="flex justify-between rounded-lg border p-3 font-bold">
                  <span>مجموع منح التنقل</span>
                  <span>{dirham(preview.allowanceTotal)}</span>
                </div>

                {!allowanceLocked && (
                  <div className="flex flex-wrap gap-2 justify-end">
                    <Button variant="outline" onClick={save} disabled={saving || !dirty}>
                      {saving ? <Loader2 className="h-4 w-4 animate-spin ml-1" /> : <Save className="h-4 w-4 ml-1" />}
                      حفظ الشهر
                    </Button>
                    <Button onClick={() => toExpense("allowance")} disabled={preview.allowanceTotal <= 0}>
                      <Receipt className="h-4 w-4 ml-1" />
                      إنشاء مصروف منح التنقل ({dirham(preview.allowanceTotal)})
                    </Button>
                  </div>
                )}
              </TabsContent>
            </Tabs>

            {/* ---- the bottom line ---- */}
            <div className="rounded-lg border p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  كلفة الحافلة {busLocked && <span className="text-xs">(مُرحَّلة)</span>}
                </span>
                <span>{dirham(preview.busTotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  منح التنقل {allowanceLocked && <span className="text-xs">(مُرحَّلة)</span>}
                </span>
                <span>{dirham(preview.allowanceTotal)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t font-bold">
                <span>المجموع العام للشهر</span>
                <span>{dirham(preview.grand)}</span>
              </div>
            </div>

            {month.status === "draft" && (
              <div className="flex justify-end">
                <Button variant="ghost" onClick={removeMonth}>
                  <Trash2 className="h-4 w-4 ml-1" />
                  حذف الشهر
                </Button>
              </div>
            )}

            {dirty && (
              <p className="text-xs text-amber-600 dark:text-amber-400 text-end">
                هناك تعديلات غير محفوظة — المبالغ المعروضة تقديرية حتى تحفظ الشهر
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
