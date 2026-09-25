"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Bus, UserPlus, Wallet, Footprints } from "lucide-react"
import api from "@/lib/api"
import { TransportSupportDialog, type TransportSupport } from "./transport-support-dialog"
import { TransportMonthPanel } from "./transport-month-panel"

interface AcademicYear {
  id: number
  label: string
  is_current: boolean
}

const dirham = (v: number | string | null | undefined) =>
  v == null ? "—" : `${Number(v).toLocaleString("en-US")} د.م.`

export function TransportTab() {
  const [years, setYears] = useState<AcademicYear[]>([])
  const [yearId, setYearId] = useState<number | null>(null)
  const [support, setSupport] = useState<TransportSupport[]>([])
  const [loading, setLoading] = useState(true)

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
  }, [])

  const loadSupport = useCallback(async () => {
    if (!yearId) return
    try {
      setLoading(true)
      // Everything for the year: the counts above are worked out here, and
      // the filters that used to narrow this went with the table.
      const response = await api.getTransportSupport({
        academic_year_id: yearId,
        per_page: 200,
      })
      setSupport(response.data || [])
    } catch (error: any) {
      toast({ title: "خطأ", description: error.message || "فشل في تحميل المستفيدين", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [yearId])

  useEffect(() => { loadSupport() }, [loadSupport])

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

      {/* The المستفيدون من النقل table was here. The month sheet above
          already lists every rider with the trips they made, which is
          what this screen is for; a second list of the same children,
          filtered differently, was the same names twice. Registering a
          beneficiary is still the button at the top. */}

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
