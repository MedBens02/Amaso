"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RowActions } from "@/components/ui/row-actions"
import { useToast } from "@/hooks/use-toast"
import { Bus, Search, Loader2, Edit, Trash2, Users, UserPlus, Wallet, Footprints } from "lucide-react"
import api from "@/lib/api"
import {
  TransportSupportDialog, type TransportSupport, MODES, SUPPORT_STATUSES,
} from "./transport-support-dialog"
import { TransportMonthPanel } from "./transport-month-panel"

interface AcademicYear {
  id: number
  label: string
  is_current: boolean
}

const dirham = (v: number | string | null | undefined) =>
  v == null ? "—" : `${Number(v).toLocaleString("en-US")} د.م.`

export function TransportTab({ refreshKey }: { refreshKey?: number }) {
  const [years, setYears] = useState<AcademicYear[]>([])
  const [yearId, setYearId] = useState<number | null>(null)
  const [support, setSupport] = useState<TransportSupport[]>([])
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState("")
  const [modeFilter, setModeFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("active")

  const [dialog, setDialog] = useState<{ open: boolean; support: TransportSupport | null }>(
    { open: false, support: null },
  )

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
  }, [refreshKey])

  const loadSupport = useCallback(async () => {
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
  }, [yearId, modeFilter, statusFilter, search])

  useEffect(() => {
    const timer = setTimeout(loadSupport, search ? 300 : 0)
    return () => clearTimeout(timer)
  }, [loadSupport])

  const counts = useMemo(() => {
    const live = support.filter((s) => s.status === "active")
    return {
      bus: live.filter((s) => s.mode === "bus").length,
      allowance: live.filter((s) => s.mode === "allowance").length,
      allowanceRates: live
        .filter((s) => s.mode === "allowance")
        .map((s) => Number(s.allowance_rate) || 0),
    }
  }, [support])

  const remove = async (row: TransportSupport) => {
    try {
      const response = await api.deleteTransportSupport(row.id)
      toast({ title: "تم", description: (response as any).message })
      loadSupport()
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
          <UserPlus className="h-4 w-4 ml-1" />
          تسجيل مستفيد
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm text-muted-foreground">ركاب حافلة المنصور</p>
                <p className="text-2xl font-bold mt-1">{counts.bus}</p>
                <p className="text-xs text-muted-foreground mt-1">من المنزل إلى المركز وبالعكس</p>
              </div>
              <Bus className="h-5 w-5 text-muted-foreground shrink-0" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm text-muted-foreground">مستفيدون من منحة التنقل</p>
                <p className="text-2xl font-bold mt-1">{counts.allowance}</p>
                <p className="text-xs text-muted-foreground mt-1">يسكنون خارج مسار الحافلة</p>
              </div>
              <Footprints className="h-5 w-5 text-muted-foreground shrink-0" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm text-muted-foreground">قيمة المنحة عن كل حضور</p>
                <p className="text-2xl font-bold mt-1">
                  {counts.allowanceRates.length === 0
                    ? "—"
                    : counts.allowanceRates.every((r) => r === counts.allowanceRates[0])
                      ? dirham(counts.allowanceRates[0])
                      : `${dirham(Math.min(...counts.allowanceRates))} - ${dirham(Math.max(...counts.allowanceRates))}`}
                </p>
                <p className="text-xs text-muted-foreground mt-1">تُضرب في عدد مرات الحضور</p>
              </div>
              <Wallet className="h-5 w-5 text-muted-foreground shrink-0" />
            </div>
          </CardContent>
        </Card>
      </div>

      {yearId && <TransportMonthPanel academicYearId={yearId} />}

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
                        {row.start_date ? String(row.start_date).slice(0, 10) : "—"}
                      </TableCell>
                      <TableCell>{statusBadge(row.status)}</TableCell>
                      <TableCell>
                        <RowActions
                          actions={[
                            { label: "تعديل", icon: Edit, onSelect: () => setDialog({ open: true, support: row }) },
                            { label: "حذف", icon: Trash2, onSelect: () => remove(row), destructive: true },
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
          onSaved={loadSupport}
        />
      )}
    </div>
  )
}
