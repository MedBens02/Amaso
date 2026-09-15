"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { UserPlus, Loader2, Search } from "lucide-react"
import api from "@/lib/api"
import type { TransportRoute } from "./transport-route-dialog"

export const PURPOSES: Record<string, string> = {
  school: "إلى المؤسسة التعليمية",
  tutoring: "إلى الدعم المدرسي",
  activity: "إلى نشاط",
  other: "أخرى",
}

export const STATUSES: Record<string, string> = {
  active: "جاري",
  suspended: "موقوف مؤقتاً",
  ended: "منتهٍ",
}

export const PAYERS: Record<string, string> = {
  association: "الجمعية",
  family: "الأسرة",
  shared: "مناصفة",
  provider: "الناقل (مجاناً)",
}

export interface TransportSubscription {
  id: number
  enrollment_id: number
  route_id: number | null
  provider_id: number | null
  purpose: string
  purpose_label?: string
  pickup_point?: string | null
  monthly_cost: number | null
  paid_by: string
  paid_by_label?: string
  start_date?: string | null
  end_date?: string | null
  status: string
  status_label?: string
  notes?: string | null
  route?: TransportRoute | null
  provider?: { id: number; name: string } | null
  enrollment?: {
    id: number
    orphan?: { id: number; first_name: string; last_name: string }
    school?: { id: number; name: string } | null
    educationLevel?: { id: number; name_ar: string } | null
  }
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  academicYearId: number
  subscription?: TransportSubscription | null
  /** Pre-selects the run when the dialog is opened from a roster. */
  defaultRouteId?: number | null
  routes: TransportRoute[]
  providers: Array<{ id: number; name: string; is_active: boolean }>
  onSaved: () => void
}

export function TransportRiderDialog({
  open, onOpenChange, academicYearId, subscription, defaultRouteId, routes, providers, onSaved,
}: Props) {
  const [search, setSearch] = useState("")
  const [candidates, setCandidates] = useState<any[]>([])
  const [searching, setSearching] = useState(false)
  const [enrollmentId, setEnrollmentId] = useState<number | null>(null)
  const [chosenLabel, setChosenLabel] = useState("")

  // "route" means a seat on a shared run; "own" means an arrangement for this
  // child alone. They are exclusive on purpose - a rider on a run is carried
  // by that run's transporter, and a second copy here would drift from it.
  const [mode, setMode] = useState<"route" | "own">("route")
  const [routeId, setRouteId] = useState<string>("none")
  const [providerId, setProviderId] = useState<string>("none")
  const [purpose, setPurpose] = useState("school")
  const [pickupPoint, setPickupPoint] = useState("")
  const [monthlyCost, setMonthlyCost] = useState("")
  const [paidBy, setPaidBy] = useState("association")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [status, setStatus] = useState("active")
  const [notes, setNotes] = useState("")
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (!open) return

    const orphan = subscription?.enrollment?.orphan
    setEnrollmentId(subscription?.enrollment_id ?? null)
    setChosenLabel(orphan ? `${orphan.first_name} ${orphan.last_name}` : "")
    setSearch("")
    setCandidates([])

    const onRoute = subscription ? subscription.route_id != null : defaultRouteId != null
    setMode(subscription ? (onRoute ? "route" : "own") : "route")
    setRouteId(
      subscription?.route_id ? String(subscription.route_id)
        : defaultRouteId ? String(defaultRouteId) : "none",
    )
    setProviderId(subscription?.provider_id ? String(subscription.provider_id) : "none")
    setPurpose(subscription?.purpose || "school")
    setPickupPoint(subscription?.pickup_point || "")
    setMonthlyCost(subscription?.monthly_cost != null ? String(subscription.monthly_cost) : "")
    setPaidBy(subscription?.paid_by || "association")
    setStartDate(subscription?.start_date ? String(subscription.start_date).slice(0, 10) : "")
    setEndDate(subscription?.end_date ? String(subscription.end_date).slice(0, 10) : "")
    setStatus(subscription?.status || "active")
    setNotes(subscription?.notes || "")
  }, [open, subscription, defaultRouteId])

  // Searching runs against the enrollments of the chosen year, so the list can
  // only ever offer children who actually have a school record for it - which
  // is what a transport row hangs off.
  useEffect(() => {
    if (!open || subscription) return

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
  }, [search, open, academicYearId, subscription])

  const selectedRoute = useMemo(
    () => routes.find((r) => String(r.id) === routeId) || null,
    [routes, routeId],
  )

  // A full run cannot take another child, and saying so here saves a round
  // trip to be told the same thing by the server.
  const routeIsFull = Boolean(
    selectedRoute
    && selectedRoute.seats_left !== null
    && selectedRoute.seats_left !== undefined
    && selectedRoute.seats_left <= 0
    && subscription?.route_id !== selectedRoute.id,
  )

  const save = async () => {
    if (!enrollmentId) {
      toast({ title: "خطأ", description: "اختر المستفيد أولاً", variant: "destructive" })
      return
    }
    if (mode === "route" && routeId === "none") {
      toast({ title: "خطأ", description: "اختر المسار أو حوّل إلى ترتيب خاص", variant: "destructive" })
      return
    }

    setSaving(true)
    try {
      const payload = {
        enrollment_id: enrollmentId,
        route_id: mode === "route" && routeId !== "none" ? Number(routeId) : null,
        provider_id: mode === "own" && providerId !== "none" ? Number(providerId) : null,
        purpose,
        pickup_point: pickupPoint.trim() || null,
        monthly_cost: monthlyCost.trim() === "" ? null : Number(monthlyCost),
        paid_by: paidBy,
        start_date: startDate || null,
        end_date: endDate || null,
        status,
        notes: notes.trim() || null,
      }

      const response = subscription
        ? await api.updateTransportSubscription(subscription.id, payload)
        : await api.createTransportSubscription(payload)

      toast({ title: "تم", description: (response as any).message })
      onOpenChange(false)
      onSaved()
    } catch (error: any) {
      toast({ title: "خطأ", description: error.message || "فشل في الحفظ", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const activeProviders = providers.filter((p) => p.is_active || String(p.id) === providerId)
  const selectableRoutes = routes.filter((r) => r.is_active || String(r.id) === routeId)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            {subscription ? "تعديل سجل النقل" : "تسجيل مستفيد في النقل"}
          </DialogTitle>
          <DialogDescription>
            المستفيد يُنقل إما ضمن مسار مشترك، أو بترتيب خاص به وحده
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {subscription ? (
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
                              <div className="flex items-center gap-2">
                                {enrollment.educationLevel?.name_ar && (
                                  <Badge variant="outline">{enrollment.educationLevel.name_ar}</Badge>
                                )}
                                {enrollment.school?.name && (
                                  <span className="text-xs text-muted-foreground">{enrollment.school.name}</span>
                                )}
                              </div>
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
              <Label>نوع الترتيب *</Label>
              <Select value={mode} onValueChange={(v) => setMode(v as "route" | "own")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="route">ضمن مسار مشترك</SelectItem>
                  <SelectItem value="own">ترتيب خاص بهذا المستفيد</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {mode === "route" ? (
              <div className="space-y-2">
                <Label>المسار *</Label>
                <Select value={routeId} onValueChange={setRouteId}>
                  <SelectTrigger><SelectValue placeholder="اختر المسار" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">غير محدد</SelectItem>
                    {selectableRoutes.map((r) => (
                      <SelectItem key={r.id} value={String(r.id)}>
                        {r.name}
                        {r.seats_left != null && ` (${r.seats_left} مقعد متبقٍ)`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {routeIsFull && (
                  <p className="text-xs text-red-600 dark:text-red-400">
                    هذا المسار مكتمل. ارفع الطاقة الاستيعابية أو اختر مساراً آخر.
                  </p>
                )}
                {selectedRoute?.provider?.name && (
                  <p className="text-xs text-muted-foreground">الناقل: {selectedRoute.provider.name}</p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <Label>الناقل</Label>
                <Select value={providerId} onValueChange={setProviderId}>
                  <SelectTrigger><SelectValue placeholder="اختر الناقل" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">غير محدد</SelectItem>
                    {activeProviders.map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>الوجهة *</Label>
              <Select value={purpose} onValueChange={setPurpose}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(PURPOSES).map(([value, label]) => (
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
                  {Object.entries(STATUSES).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>نقطة الالتقاء</Label>
              <Input
                value={pickupPoint} onChange={(e) => setPickupPoint(e.target.value)}
                placeholder="أمام المسجد"
              />
            </div>

            <div className="space-y-2">
              <Label>من يتحمل الكلفة *</Label>
              <Select value={paidBy} onValueChange={setPaidBy}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(PAYERS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>تاريخ البداية</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>تاريخ الانتهاء</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>

          {mode === "own" && (
            <div className="space-y-2">
              <Label>الكلفة الشهرية (درهم)</Label>
              <Input
                type="number" min={0} step="0.01" inputMode="decimal"
                value={monthlyCost} onChange={(e) => setMonthlyCost(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                للترتيبات الخاصة فقط. المستفيد ضمن مسار مشترك تغطيه كلفة المسار نفسه.
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label>ملاحظات</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>إلغاء</Button>
          <Button onClick={save} disabled={saving || !enrollmentId || routeIsFull}>
            {saving && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
            {subscription ? "حفظ التعديلات" : "تسجيل"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
