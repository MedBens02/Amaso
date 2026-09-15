"use client"

import { useEffect, useState } from "react"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Route as RouteIcon, Loader2 } from "lucide-react"
import api from "@/lib/api"

export const DESTINATIONS: Record<string, string> = {
  school: "إلى المؤسسة التعليمية",
  tutoring: "إلى الدعم المدرسي",
  activity: "إلى نشاط",
  other: "أخرى",
}

export interface TransportRoute {
  id: number
  academic_year_id: number
  provider_id: number | null
  name: string
  destination_type: string
  destination_label?: string
  school_id: number | null
  capacity: number | null
  monthly_cost: string | number | null
  schedule?: string | null
  pickup_area?: string | null
  is_active: boolean
  notes?: string | null
  active_riders_count?: number
  seats_left?: number | null
  cost_per_rider?: number | null
  provider?: { id: number; name: string; type_label?: string } | null
  school?: { id: number; name: string } | null
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  academicYearId: number
  route?: TransportRoute | null
  providers: Array<{ id: number; name: string; is_active: boolean }>
  schools: Array<{ id: number; name: string }>
  onSaved: () => void
}

export function TransportRouteDialog({
  open, onOpenChange, academicYearId, route, providers, schools, onSaved,
}: Props) {
  const [name, setName] = useState("")
  const [providerId, setProviderId] = useState<string>("none")
  const [destination, setDestination] = useState("school")
  const [schoolId, setSchoolId] = useState<string>("none")
  const [capacity, setCapacity] = useState("")
  const [monthlyCost, setMonthlyCost] = useState("")
  const [schedule, setSchedule] = useState("")
  const [pickupArea, setPickupArea] = useState("")
  const [isActive, setIsActive] = useState(true)
  const [notes, setNotes] = useState("")
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (!open) return
    setName(route?.name || "")
    setProviderId(route?.provider_id ? String(route.provider_id) : "none")
    setDestination(route?.destination_type || "school")
    setSchoolId(route?.school_id ? String(route.school_id) : "none")
    setCapacity(route?.capacity != null ? String(route.capacity) : "")
    setMonthlyCost(route?.monthly_cost != null ? String(route.monthly_cost) : "")
    setSchedule(route?.schedule || "")
    setPickupArea(route?.pickup_area || "")
    setIsActive(route?.is_active ?? true)
    setNotes(route?.notes || "")
  }, [open, route])

  const save = async () => {
    if (!name.trim()) {
      toast({ title: "خطأ", description: "اسم المسار مطلوب", variant: "destructive" })
      return
    }

    setSaving(true)
    try {
      const payload = {
        academic_year_id: academicYearId,
        provider_id: providerId === "none" ? null : Number(providerId),
        name: name.trim(),
        destination_type: destination,
        // Only a run that goes to one institution names one. The server drops
        // it for the other destinations too; sending it would just be noise.
        school_id: destination === "school" && schoolId !== "none" ? Number(schoolId) : null,
        capacity: capacity.trim() === "" ? null : Number(capacity),
        monthly_cost: monthlyCost.trim() === "" ? null : Number(monthlyCost),
        schedule: schedule.trim() || null,
        pickup_area: pickupArea.trim() || null,
        is_active: isActive,
        notes: notes.trim() || null,
      }

      const response = route
        ? await api.updateTransportRoute(route.id, payload)
        : await api.createTransportRoute(payload)

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RouteIcon className="h-5 w-5" />
            {route ? "تعديل المسار" : "مسار نقل جديد"}
          </DialogTitle>
          <DialogDescription>
            الرحلة المشتركة التي تتعاقد عليها الجمعية: الكلفة هنا هي كلفة المسار كاملاً، لا كلفة المقعد
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>اسم المسار *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="مسار الحي المحمدي - صباح" />
            </div>
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
            <div className="space-y-2">
              <Label>الوجهة *</Label>
              <Select value={destination} onValueChange={setDestination}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(DESTINATIONS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {destination === "school" && (
              <div className="space-y-2">
                <Label>المؤسسة</Label>
                <Select value={schoolId} onValueChange={setSchoolId}>
                  <SelectTrigger><SelectValue placeholder="عدة مؤسسات" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">عدة مؤسسات</SelectItem>
                    {schools.map((s) => (
                      <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  اتركه فارغاً إذا كانت الحافلة تمر على أكثر من مؤسسة
                </p>
              </div>
            )}
            <div className="space-y-2">
              <Label>الطاقة الاستيعابية</Label>
              <Input
                type="number" min={1} inputMode="numeric"
                value={capacity} onChange={(e) => setCapacity(e.target.value)}
                placeholder="عدد المقاعد"
              />
            </div>
            <div className="space-y-2">
              <Label>الكلفة الشهرية للمسار (درهم)</Label>
              <Input
                type="number" min={0} step="0.01" inputMode="decimal"
                value={monthlyCost} onChange={(e) => setMonthlyCost(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>المنطقة / نقطة الانطلاق</Label>
              <Input value={pickupArea} onChange={(e) => setPickupArea(e.target.value)} placeholder="الحي المحمدي" />
            </div>
            <div className="space-y-2">
              <Label>التوقيت</Label>
              <Input
                value={schedule} onChange={(e) => setSchedule(e.target.value)}
                placeholder="الإثنين - الجمعة، 07:15 و 17:00"
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label>المسار نشط</Label>
              <p className="text-xs text-muted-foreground">
                المسار غير النشط لا يُحتسب في الكلفة الشهرية ولا تُضاف إليه أسماء جديدة
              </p>
            </div>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>

          <div className="space-y-2">
            <Label>ملاحظات</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>

          <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-900 p-3">
            <p className="text-xs text-amber-800 dark:text-amber-300">
              الكلفة المسجلة هنا للتخطيط والتقدير فقط. المصاريف الفعلية تُسجَّل في المصروفات تحت
              بند «نقل مدرسي» كما هو الحال دائماً.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>إلغاء</Button>
          <Button onClick={save} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
            {route ? "حفظ التعديلات" : "إنشاء المسار"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
