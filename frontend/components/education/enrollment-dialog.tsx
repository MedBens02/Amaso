"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { Loader2, GraduationCap } from "lucide-react"
import api from "@/lib/api"
import { AsyncSelectRS, type AsyncOption } from "@/components/common/AsyncSelectRS"
import { SingleSelectRS } from "@/components/common/SingleSelectRS"

export type Phase = { value: string; label: string; years: number }

/** The marking ceilings actually used in Morocco; anything else is a typo. */
const GRADE_SCALES = [10, 20, 100]

const NONE = "0"

/**
 * Mirrors the server's own test (EnrollmentController::withCourseConsistency).
 *
 * Any one of the three is enough: a record can be placed at a faculty before
 * its level is set, or given a course before its institution is chosen, and
 * the form has to show the higher-education fields in all of those cases.
 */
function isHigherEducation(level?: any, school?: any, phase?: string | null): boolean {
  return Boolean(phase) || school?.type === "university" || Boolean(level?.name_ar?.includes("جامع"))
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** null opens the dialog in "register a student" mode. */
  enrollment: any | null
  years: any[]
  levels: any[]
  schools: any[]
  phases: Phase[]
  defaultYearId: string
  onSaved: () => void
}

/**
 * One form for registering a student and for correcting the record afterwards.
 *
 * They were never two different sets of facts - the only thing registering
 * adds is which student - so keeping them as one form is what stops the two
 * drifting apart, which is how the app ended up able to record a placement it
 * could not then edit.
 */
export function EnrollmentDialog({
  open, onOpenChange, enrollment, years, levels, schools, phases, defaultYearId, onSaved,
}: Props) {
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)

  const [orphanId, setOrphanId] = useState("")
  const [yearId, setYearId] = useState(defaultYearId)
  const [levelId, setLevelId] = useState(NONE)
  const [schoolId, setSchoolId] = useState(NONE)
  const [specialty, setSpecialty] = useState("")
  const [phase, setPhase] = useState(NONE)
  const [higherYear, setHigherYear] = useState(NONE)
  const [scale, setScale] = useState("20")
  const [status, setStatus] = useState("enrolled")
  const [hasTutoring, setHasTutoring] = useState(false)
  const [tutoringSubjects, setTutoringSubjects] = useState("")
  const [tutoringProvider, setTutoringProvider] = useState("")
  const [notes, setNotes] = useState("")

  const editing = enrollment !== null

  // Reset from the record every time the dialog opens, so a cancelled edit
  // leaves nothing behind for the next one to inherit.
  useEffect(() => {
    if (!open) return

    setOrphanId(enrollment?.orphan_id ? String(enrollment.orphan_id) : "")
    setYearId(String(enrollment?.academic_year_id ?? defaultYearId ?? ""))
    setLevelId(enrollment?.education_level_id ? String(enrollment.education_level_id) : NONE)
    setSchoolId(enrollment?.school_id ? String(enrollment.school_id) : NONE)
    setSpecialty(enrollment?.specialty ?? "")
    setPhase(enrollment?.higher_education_phase ?? NONE)
    setHigherYear(enrollment?.higher_education_year ? String(enrollment.higher_education_year) : NONE)
    setScale(String(Number(enrollment?.grade_scale) || 20))
    setStatus(enrollment?.status ?? "enrolled")
    setHasTutoring(Boolean(enrollment?.has_tutoring))
    setTutoringSubjects(enrollment?.tutoring_subjects ?? "")
    setTutoringProvider(enrollment?.tutoring_provider ?? "")
    setNotes(enrollment?.notes ?? "")
  }, [open, enrollment, defaultYearId])

  const level = levels.find((l) => String(l.id) === levelId)
  const school = schools.find((s) => String(s.id) === schoolId)
  const higher = isHigherEducation(level, school, phase === NONE ? null : phase)

  // Once a student is in higher education the school list is the wrong list:
  // offering them last year's secondary school is how records end up wrong.
  const institutions = schools.filter((s) => (higher ? s.type === "university" : s.type !== "university"))
  const institutionOptions = institutions.map((item) => ({
    value: String(item.id),
    label: `${item.name}${item.is_amaso_linked ? " — شريكة" : ""}`,
  }))
  const levelOptions = levels.map((item) => ({ value: String(item.id), label: item.name_ar }))

  /**
   * A roster of hundreds cannot be handed to the browser in one page and
   * filtered client-side - the plain Select this replaced fetched at most
   * 100 and had no way to search the rest anyway, so a family past the
   * hundredth orphan was simply not reachable here. This searches the same
   * endpoint the orphans page does.
   */
  const loadOrphanOptions = async (query: string): Promise<AsyncOption[]> => {
    const response = await api.getOrphans({ search: query || undefined, per_page: 50 })
    const options: AsyncOption[] = []
    for (const group of response.data || []) {
      for (const orphan of group.orphans || []) {
        options.push({
          value: String(orphan.id),
          label: `${orphan.full_name}${group.widow?.full_name ? ` (${group.widow.full_name})` : ""}`,
        })
      }
    }
    return options
  }

  const handleSave = async () => {
    if (!editing && !orphanId) {
      toast({ title: "خطأ", description: "اختر التلميذ", variant: "destructive" })
      return
    }
    if (!yearId) {
      toast({ title: "خطأ", description: "اختر السنة الدراسية", variant: "destructive" })
      return
    }

    const placement = {
      education_level_id: levelId === NONE ? null : Number(levelId),
      school_id: schoolId === NONE ? null : Number(schoolId),
      specialty: specialty.trim() || null,
      higher_education_phase: higher && phase !== NONE ? (phase as any) : null,
      higher_education_year: higher && higherYear !== NONE ? Number(higherYear) : null,
      grade_scale: Number(scale) || 20,
      has_tutoring: hasTutoring,
      // Clearing the switch clears what it was describing; leaving the
      // subjects behind would keep them showing up in "who gets support".
      tutoring_subjects: hasTutoring ? tutoringSubjects.trim() || null : null,
      tutoring_provider: hasTutoring ? tutoringProvider.trim() || null : null,
      notes: notes.trim() || null,
    }

    setSaving(true)
    try {
      const response = editing
        ? await api.updateEnrollment(enrollment.id, {
            ...placement,
            academic_year_id: Number(yearId),
            status,
          })
        : await api.createEnrollment({
            ...placement,
            orphan_id: Number(orphanId),
            academic_year_id: Number(yearId),
          })

      toast({ title: editing ? "تم التحديث" : "تم التسجيل", description: response.message })
      onOpenChange(false)
      onSaved()
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message || "فشل في حفظ التسجيل",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            {editing ? "تعديل التسجيل" : "تسجيل تلميذ في السنة الدراسية"}
          </DialogTitle>
          <DialogDescription>
            {editing
              ? `${enrollment?.orphan?.first_name ?? ""} ${enrollment?.orphan?.last_name ?? ""}`.trim() || "تعديل بيانات التسجيل"
              : "اختر التلميذ والسنة الدراسية ثم حدد المؤسسة والمستوى"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {!editing && (
              <div className="space-y-2">
                <Label>التلميذ *</Label>
                <AsyncSelectRS
                  loadOptions={loadOrphanOptions}
                  value={orphanId || undefined}
                  onChange={(value) => setOrphanId(value ?? "")}
                  placeholder="اكتب اسم اليتيم للبحث..."
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>السنة الدراسية *</Label>
              <Select value={yearId} onValueChange={setYearId}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر السنة" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year.id} value={String(year.id)}>
                      {year.label} {year.is_current ? "(الحالية)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>المستوى الدراسي</Label>
              <SingleSelectRS
                options={levelOptions}
                value={levelId === NONE ? undefined : levelId}
                onChange={(value) => setLevelId(value ?? NONE)}
                placeholder="اختر المستوى"
              />
            </div>

            <div className="space-y-2">
              <Label>{higher ? "مؤسسة التعليم العالي" : "المؤسسة"}</Label>
              <SingleSelectRS
                options={institutionOptions}
                value={schoolId === NONE ? undefined : schoolId}
                onChange={(value) => setSchoolId(value ?? NONE)}
                placeholder="اختر المؤسسة"
              />
            </div>

            <div className="space-y-2">
              <Label>التخصص</Label>
              <Input
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                placeholder={higher ? "مثال: الحقوق، الطب، الإعلاميات" : "مثال: علوم رياضية"}
              />
            </div>
          </div>

          {higher && (
            <>
              <Separator />
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>سلك التعليم العالي</Label>
                  <Select value={phase} onValueChange={setPhase}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر السلك" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>غير محدد</SelectItem>
                      {phases.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label} ({item.years} سنوات)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>السنة داخل السلك</Label>
                  <Select value={higherYear} onValueChange={setHigherYear}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر السنة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>غير محددة</SelectItem>
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((year) => (
                        <SelectItem key={year} value={String(year)}>
                          السنة {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          )}

          <Separator />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>سلم التنقيط</Label>
              <Select value={scale} onValueChange={setScale}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GRADE_SCALES.map((value) => (
                    <SelectItem key={value} value={String(value)}>
                      من {value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {editing && (
              <div className="space-y-2">
                <Label>النتيجة</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="enrolled">مسجل</SelectItem>
                    <SelectItem value="passed">ناجح</SelectItem>
                    <SelectItem value="failed">راسب</SelectItem>
                    <SelectItem value="left">غادر</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base">الدعم الدراسي</Label>
                <p className="text-sm text-muted-foreground">دروس دعم أو مساعدة على الدراسة خلال هذه السنة</p>
              </div>
              <Switch checked={hasTutoring} onCheckedChange={setHasTutoring} />
            </div>

            {hasTutoring && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>المواد</Label>
                  <Input
                    value={tutoringSubjects}
                    onChange={(e) => setTutoringSubjects(e.target.value)}
                    placeholder="مثال: الرياضيات، الفيزياء"
                  />
                </div>
                <div className="space-y-2">
                  <Label>الجهة الداعمة</Label>
                  <Input
                    value={tutoringProvider}
                    onChange={(e) => setTutoringProvider(e.target.value)}
                    placeholder="مثال: الجمعية، أستاذ متطوع"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>ملاحظات</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="ملاحظات حول هذه السنة الدراسية" />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            إلغاء
          </Button>
          <Button type="button" onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
            {editing ? "حفظ التعديلات" : "تسجيل"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
