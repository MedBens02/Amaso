"use client"

import { useEffect, useState } from "react"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DateField } from "@/components/ui/date-field"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Bus, Loader2, Search } from "lucide-react"
import api from "@/lib/api"

export const MODES: Record<string, string> = {
  bus: "حافلة المنصور",
  allowance: "منحة تنقل",
}

export const SUPPORT_STATUSES: Record<string, string> = {
  active: "جاري",
  suspended: "موقوف مؤقتاً",
  ended: "منتهٍ",
}

export interface TransportSupport {
  id: number
  enrollment_id: number
  mode: string
  mode_label?: string
  pickup_point?: string | null
  allowance_rate: string | number | null
  start_date?: string | null
  end_date?: string | null
  status: string
  status_label?: string
  notes?: string | null
  enrollment?: {
    id: number
    orphan?: { id: number; first_name: string; last_name: string; widow?: { id: number; first_name: string; last_name: string } | null }
    educationLevel?: { id: number; name_ar: string } | null
  }
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  academicYearId: number
  support?: TransportSupport | null
  onSaved: () => void
}

export function TransportSupportDialog({ open, onOpenChange, academicYearId, support, onSaved }: Props) {
  const [search, setSearch] = useState("")
  const [candidates, setCandidates] = useState<any[]>([])
  const [searching, setSearching] = useState(false)
  const [enrollmentId, setEnrollmentId] = useState<number | null>(null)
  const [chosenLabel, setChosenLabel] = useState("")

  const [mode, setMode] = useState("bus")
  const [pickupPoint, setPickupPoint] = useState("")
  const [allowanceRate, setAllowanceRate] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [status, setStatus] = useState("active")
  const [notes, setNotes] = useState("")
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (!open) return
    const orphan = support?.enrollment?.orphan
    setEnrollmentId(support?.enrollment_id ?? null)
    setChosenLabel(orphan ? `${orphan.first_name} ${orphan.last_name}` : "")
    setSearch("")
    setCandidates([])
    setMode(support?.mode || "bus")
    setPickupPoint(support?.pickup_point || "")
    setAllowanceRate(support?.allowance_rate != null ? String(support.allowance_rate) : "")
    setStartDate(support?.start_date ? String(support.start_date).slice(0, 10) : "")
    setEndDate(support?.end_date ? String(support.end_date).slice(0, 10) : "")
    setStatus(support?.status || "active")
    setNotes(support?.notes || "")
  }, [open, support])

  // Searching runs against the chosen year's enrollments, so only children
  // who actually have a school record for it can be offered - which is what
  // a transport record hangs off.
  useEffect(() => {
    if (!open || support) return

    const term = search.trim()
    if (term.length < 2) {
      setCandidates([])
      return
    }

    const timer = setTimeout(async () => {
      try {
        setSearching(true)
        const response = await api.getEnrollments({
          academic_year_id: academicYearId,
          search: term,
          per_page: 20,
        })
        setCandidates(response.data || [])
      } catch {
        setCandidates([])
      } finally {
        setSearching(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [search, open, academicYearId, support])

  const save = async () => {
    if (!enrollmentId) {
      toast({ title: "خطأ", description: "اختر المستفيد أولاً", variant: "destructive" })
      return
    }
    if (mode === "allowance" && allowanceRate.trim() === "") {
      toast({ title: "خطأ", description: "حدد قيمة المنحة عن كل حضور", variant: "destructive" })
      return
    }

    setSaving(true)
    try {
      const payload = {
        enrollment_id: enrollmentId,
        mode,
        pickup_point: mode === "bus" ? (pickupPoint.trim() || null) : null,
        allowance_rate: mode === "allowance" ? Number(allowanceRate) : null,
        start_date: startDate || null,
        end_date: endDate || null,
        status,
        notes: notes.trim() || null,
      }

      const response = support
        ? await api.updateTransportSupport(support.id, payload)
        : await api.createTransportSupport(payload)

      toast({ title: "تم", description: (response as any).message })
      onOpenChange(false)
      onSaved()
    } catch (error: any) {
      toast({ title: "خطأ", description: error.message || "فشل في الحفظ", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bus className="h-5 w-5" />
            {support ? "تعديل دعم النقل" : "تسجيل مستفيد في النقل"}
          </DialogTitle>
          <DialogDescription>
            إما أن تقلّه حافلة المنصور إلى المركز، أو يتقاضى منحة تنقل عن كل حضور إن كان يسكن خارج مسارها
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {support ? (
            <div className="rounded-lg border bg-muted/40 p-3">
              <p className="text-sm text-muted-foreground">المستفيد</p>
              <p className="font-medium">{chosenLabel || "—"}</p>
            </div>
          ) : (
            <div className="space-y-2">
              <Label>المستفيد *</Label>
              {enrollmentId ? (
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <span className="font-medium">{chosenLabel}</span>
                  <Button
                    variant="ghost" size="sm"
                    onClick={() => { setEnrollmentId(null); setChosenLabel(""); setSearch("") }}
                  >
                    تغيير
                  </Button>
                </div>
              ) : (
                <>
                  <div className="relative">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      className="pr-9"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="ابحث بالاسم أو رمز مسار..."
                    />
                  </div>
                  {searching && (
                    <p className="text-xs text-muted-foreground flex items-center gap-2">
                      <Loader2 className="h-3 w-3 animate-spin" /> جارٍ البحث...
                    </p>
                  )}
                  {!searching && search.trim().length >= 2 && candidates.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      لا يوجد تسجيل دراسي بهذا الاسم في السنة المختارة
                    </p>
                  )}
                  {candidates.length > 0 && (
                    <div className="max-h-52 overflow-y-auto rounded-lg border divide-y">
                      {candidates.map((enrollment: any) => {
                        const orphan = enrollment.orphan
                        const full = `${orphan?.first_name || ""} ${orphan?.last_name || ""}`.trim()
                        return (
                          <button
                            key={enrollment.id}
                            type="button"
                            className="w-full text-right p-3 hover:bg-accent transition-colors"
                            onClick={() => {
                              setEnrollmentId(enrollment.id)
                              setChosenLabel(full)
                              setCandidates([])
                            }}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-medium">{full}</span>
                              {enrollment.educationLevel?.name_ar && (
                                <Badge variant="outline">{enrollment.educationLevel.name_ar}</Badge>
                              )}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>نوع الدعم *</Label>
              <Select value={mode} onValueChange={setMode}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(MODES).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>الحالة *</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(SUPPORT_STATUSES).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {mode === "bus" ? (
              <div className="space-y-2 md:col-span-2">
                <Label>نقطة الالتقاء</Label>
                <Input
                  value={pickupPoint} onChange={(e) => setPickupPoint(e.target.value)}
                  placeholder="أمام المسجد"
                />
                <p className="text-xs text-muted-foreground">
                  لا تُسجَّل كلفة هنا: نصيب المستفيد يُحتسب آخر الشهر من مجموع الوقود وأجرة السائق
                </p>
              </div>
            ) : (
              <div className="space-y-2 md:col-span-2">
                <Label>قيمة المنحة عن كل حضور (درهم) *</Label>
                <Input
                  type="number" min={0} step="0.01" inputMode="decimal"
                  value={allowanceRate} onChange={(e) => setAllowanceRate(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  يُضرب هذا المبلغ في عدد مرات حضوره خلال الشهر
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label>تاريخ البداية</Label>
              <DateField value={startDate} onChange={setStartDate} />
            </div>

            <div className="space-y-2">
              <Label>تاريخ الانتهاء</Label>
              <DateField value={endDate} onChange={setEndDate} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>ملاحظات</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>إلغاء</Button>
          <Button onClick={save} disabled={saving || !enrollmentId}>
            {saving && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
            {support ? "حفظ التعديلات" : "تسجيل"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
