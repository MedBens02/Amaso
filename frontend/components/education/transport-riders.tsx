"use client"

import { useCallback, useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RowActions } from "@/components/ui/row-actions"
import { toDisplay } from "@/components/ui/date-field"
import { useToast } from "@/hooks/use-toast"
import { Edit, Loader2, Search, Trash2, UserPlus, Users } from "lucide-react"
import api from "@/lib/api"
import {
  TransportSupportDialog, type TransportSupport, MODES, SUPPORT_STATUSES,
} from "./transport-support-dialog"

interface AcademicYear {
  id: number
  label: string
  is_current: boolean
}

const dirham = (v: number | string | null | undefined) =>
  v == null ? "—" : `${Number(v).toLocaleString("en-US")} د.م.`

/**
 * Who the association carries, and on what terms.
 *
 * Its own screen rather than a panel on the monthly sheet, because the two
 * answer different questions over different spans. The sheet is one month:
 * its rows are a frozen copy of who was riding when that month was opened,
 * they are locked once the month is settled, and a part that is already
 * settled is skipped when the rows are rebuilt. So a rider registered after
 * a month was settled never appears in it, and one whose support was
 * suspended or ended drops out of every later sheet - editing from there
 * would have left those records with nowhere to be reached from, and the
 * edit button would have been dead exactly when the month was settled.
 *
 * A support record is none of those things. It runs across the year, it is
 * still worth reading after it has ended, and changing a pickup point has
 * nothing to do with whether December has been paid.
 */
export function TransportRiders() {
  const [years, setYears] = useState<AcademicYear[]>([])
  const [yearId, setYearId] = useState<number | null>(null)
  const [support, setSupport] = useState<TransportSupport[]>([])
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState("")
  const [modeFilter, setModeFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")

  const [dialog, setDialog] = useState<{ open: boolean; support: TransportSupport | null }>(
    { open: false, support: null },
  )
  const [confirmDelete, setConfirmDelete] = useState<TransportSupport | null>(null)

  const { toast } = useToast()

  useEffect(() => {
    ;(async () => {
      try {
        const response = await api.getAcademicYears()
        const list: AcademicYear[] = response.data || []
        setYears(list)
        setYearId((current) => current ?? (list.find((y) => y.is_current)?.id ?? list[0]?.id ?? null))
      } catch (error: any) {
        toast({ title: "خطأ", description: error.message || "فشل في تحميل السنوات", variant: "destructive" })
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const load = useCallback(async () => {
    if (!yearId) return
    try {
      setLoading(true)
      const response = await api.getTransportSupport({
        academic_year_id: yearId,
        mode: modeFilter === "all" ? undefined : modeFilter,
        status: statusFilter === "all" ? undefined : statusFilter,
        search: search.trim() || undefined,
        per_page: 200,
      })
      setSupport(response.data || [])
    } catch (error: any) {
      toast({ title: "خطأ", description: error.message || "فشل في تحميل المستفيدين", variant: "destructive" })
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [yearId, modeFilter, statusFilter, search])

  // Typing waits; a filter changing does not.
  useEffect(() => {
    const timer = setTimeout(load, search ? 300 : 0)
    return () => clearTimeout(timer)
  }, [load, search])

  const remove = async (row: TransportSupport) => {
    try {
      const response = await api.deleteTransportSupport(row.id)
      toast({ title: "تم", description: (response as any).message })
      setConfirmDelete(null)
      load()
    } catch (error: any) {
      toast({ title: "تعذر الحذف", description: error.message, variant: "destructive" })
    }
  }

  const statusBadge = (status: string) => {
    const label = SUPPORT_STATUSES[status] || status
    if (status === "active") return <Badge className="bg-green-600 hover:bg-green-600">{label}</Badge>
    if (status === "suspended") return <Badge variant="secondary">{label}</Badge>
    return <Badge variant="outline">{label}</Badge>
  }

  const nameOf = (row: TransportSupport) => {
    const o = row.enrollment?.orphan
    return o ? `${o.first_name} ${o.last_name}` : "—"
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-2">
          <Label>السنة الدراسية</Label>
          <Select value={yearId ? String(yearId) : ""} onValueChange={(v) => setYearId(Number(v))}>
            <SelectTrigger className="w-56"><SelectValue placeholder="اختر السنة" /></SelectTrigger>
            <SelectContent searchable>
              {years.map((year) => (
                <SelectItem key={year.id} value={String(year.id)}>
                  {year.label}{year.is_current ? " (الحالية)" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button onClick={() => setDialog({ open: true, support: null })} disabled={!yearId}>
          <UserPlus className="h-4 w-4 ml-2" />
          تسجيل مستفيد
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            المستفيدون من النقل
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="relative md:col-span-2">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pr-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ابحث باسم المستفيد..."
              />
            </div>
            <Select value={modeFilter} onValueChange={setModeFilter}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل أنواع الدعم</SelectItem>
                {Object.entries(MODES).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الحالات</SelectItem>
                {Object.entries(SUPPORT_STATUSES).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : support.length === 0 ? (
            <p className="text-center text-muted-foreground py-10">لا يوجد مستفيدون مطابقون</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>المستفيد</TableHead>
                    <TableHead>نوع الدعم</TableHead>
                    <TableHead>نقطة الالتقاء / القيمة</TableHead>
                    <TableHead>من</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {support.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium">
                        {nameOf(row)}
                        {row.enrollment?.educationLevel?.name_ar && (
                          <p className="text-xs text-muted-foreground font-normal">
                            {row.enrollment.educationLevel.name_ar}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={row.mode === "bus" ? "default" : "secondary"}>
                          {row.mode_label || MODES[row.mode]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {row.mode === "bus"
                          ? (row.pickup_point || "—")
                          : `${dirham(row.allowance_rate)} / حضور`}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {/* dd/mm/yyyy, like every other date on screen. */}
                        {row.start_date ? toDisplay(String(row.start_date).slice(0, 10)) : "—"}
                      </TableCell>
                      <TableCell>{statusBadge(row.status)}</TableCell>
                      <TableCell>
                        <RowActions
                          actions={[
                            { label: "تعديل", icon: Edit, onSelect: () => setDialog({ open: true, support: row }) },
                            { label: "حذف", icon: Trash2, onSelect: () => setConfirmDelete(row), destructive: true },
                          ]}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {yearId && (
        <TransportSupportDialog
          open={dialog.open}
          onOpenChange={(open) => setDialog((s) => ({ ...s, open }))}
          academicYearId={yearId}
          support={dialog.support}
          onSaved={load}
        />
      )}

      {/* Asked before, not after: a deleted record takes the months already
          settled against it with it, and the old menu deleted on one click. */}
      <ConfirmDelete
        row={confirmDelete}
        name={confirmDelete ? nameOf(confirmDelete) : ""}
        onCancel={() => setConfirmDelete(null)}
        onConfirm={() => confirmDelete && remove(confirmDelete)}
      />
    </div>
  )
}

function ConfirmDelete({
  row, name, onCancel, onConfirm,
}: {
  row: TransportSupport | null
  name: string
  onCancel: () => void
  onConfirm: () => void
}) {
  if (!row) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="w-full max-w-md rounded-xl border bg-background p-6 shadow-xl">
        <h3 className="text-lg font-bold">حذف تسجيل النقل؟</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          سيُحذف تسجيل "{name}" في النقل. الأشهر المُرحَّلة سابقاً تبقى كما هي في
          المحاسبة. إن كان المستفيد توقف عن الاستفادة فقط، الأفضل تغيير حالته إلى
          "منتهٍ" بدل حذفه، حتى يبقى سجله محفوظاً.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>إلغاء</Button>
          <Button
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            حذف
          </Button>
        </div>
      </div>
    </div>
  )
}
