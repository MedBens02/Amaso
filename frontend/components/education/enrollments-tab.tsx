"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { GraduationCap, Plus, Loader2, Search, Check, X, DoorOpen, Trash2, Save } from "lucide-react"
import api from "@/lib/api"

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  enrolled: { label: "مسجل", className: "bg-blue-100 text-blue-800" },
  passed: { label: "ناجح", className: "bg-green-100 text-green-800" },
  failed: { label: "راسب", className: "bg-red-100 text-red-800" },
  left: { label: "غادر", className: "bg-gray-200 text-gray-700" },
}

export function EnrollmentsTab({ refreshKey }: { refreshKey?: number }) {
  const [enrollments, setEnrollments] = useState<any[]>([])
  const [years, setYears] = useState<any[]>([])
  const [schools, setSchools] = useState<any[]>([])
  const [levels, setLevels] = useState<any[]>([])
  const [orphans, setOrphans] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [yearFilter, setYearFilter] = useState<string>("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [addOpen, setAddOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  // Grades are entered a class at a time from a report-card list, so the
  // marks are edited inline and saved in one request rather than one dialog
  // per student.
  const [gradeDrafts, setGradeDrafts] = useState<Record<number, { s1: string; s2: string }>>({})
  const [savingGrades, setSavingGrades] = useState(false)

  // add-enrollment form state
  const [orphanId, setOrphanId] = useState<string>("")
  const [levelId, setLevelId] = useState<string>("0")
  const [schoolId, setSchoolId] = useState<string>("0")
  const [specialty, setSpecialty] = useState("")

  const selectedLevel = levels.find((l) => l.id.toString() === levelId)
  const isUniversityLevel = selectedLevel?.name_ar?.includes("جامع") || false

  const fetchLookups = async () => {
    try {
      const [yearsRes, schoolsRes, levelsRes, orphansRes] = await Promise.all([
        api.getAcademicYears(),
        api.getSchools(),
        api.getOrphansEducationLevels(),
        api.getOrphans({ per_page: 100 }),
      ])
      setYears(yearsRes.data || [])
      setSchools(schoolsRes.data || [])
      setLevels(levelsRes.data || [])
      // orphans endpoint groups by widow - flatten for the picker
      const flat: any[] = []
      for (const group of orphansRes.data || []) {
        for (const orphan of group.orphans || []) {
          flat.push({ ...orphan, widow_name: group.widow?.full_name })
        }
      }
      setOrphans(flat)

      const current = (yearsRes.data || []).find((y: any) => y.is_current)
      if (current && !yearFilter) setYearFilter(current.id.toString())
    } catch (error) {
      console.error("Failed to load education lookups:", error)
    }
  }

  const fetchEnrollments = async () => {
    try {
      setLoading(true)
      const response = await api.getEnrollments({
        academic_year_id: yearFilter ? parseInt(yearFilter) : undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
        search: search || undefined,
        per_page: 50,
      })
      const rows = response.data || []
      setEnrollments(rows)
      setGradeDrafts(
        Object.fromEntries(
          rows.map((row: any) => [
            row.id,
            {
              s1: row.first_semester_grade == null ? "" : String(Number(row.first_semester_grade)),
              s2: row.second_semester_grade == null ? "" : String(Number(row.second_semester_grade)),
            },
          ]),
        ),
      )
    } catch (error: any) {
      toast({ title: "خطأ", description: error.message || "فشل في تحميل التسجيلات", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLookups()
  }, [refreshKey])

  useEffect(() => {
    fetchEnrollments()
  }, [search, yearFilter, statusFilter, refreshKey])

  const setStatus = async (enrollment: any, status: string) => {
    try {
      await api.updateEnrollment(enrollment.id, { status })
      fetchEnrollments()
    } catch (error: any) {
      toast({ title: "خطأ", description: error.message || "فشل في تحديث النتيجة", variant: "destructive" })
    }
  }

  const handleDelete = async (enrollment: any) => {
    if (!confirm("حذف هذا التسجيل؟")) return
    try {
      await api.deleteEnrollment(enrollment.id)
      fetchEnrollments()
    } catch (error: any) {
      toast({ title: "خطأ", description: error.message || "فشل في حذف التسجيل", variant: "destructive" })
    }
  }

  const editGrade = (enrollmentId: number, semester: "s1" | "s2", value: string) => {
    setGradeDrafts((drafts) => ({
      ...drafts,
      [enrollmentId]: { ...(drafts[enrollmentId] || { s1: "", s2: "" }), [semester]: value },
    }))
  }

  const draftAverage = (enrollment: any) => {
    const draft = gradeDrafts[enrollment.id]
    if (!draft) return null
    const marks = [draft.s1, draft.s2]
      .filter((value) => value !== "")
      .map(Number)
      .filter((value) => !Number.isNaN(value))

    return marks.length === 0 ? null : marks.reduce((sum, value) => sum + value, 0) / marks.length
  }

  // Only the rows the user actually touched are sent, so saving a class of 40
  // after correcting two marks does not rewrite 38 untouched records.
  const changedGrades = () =>
    enrollments
      .filter((enrollment) => {
        const draft = gradeDrafts[enrollment.id]
        if (!draft) return false
        const original = {
          s1: enrollment.first_semester_grade == null ? "" : String(Number(enrollment.first_semester_grade)),
          s2: enrollment.second_semester_grade == null ? "" : String(Number(enrollment.second_semester_grade)),
        }
        return draft.s1 !== original.s1 || draft.s2 !== original.s2
      })
      .map((enrollment) => ({
        enrollment_id: enrollment.id,
        first_semester_grade: gradeDrafts[enrollment.id].s1 === "" ? null : Number(gradeDrafts[enrollment.id].s1),
        second_semester_grade: gradeDrafts[enrollment.id].s2 === "" ? null : Number(gradeDrafts[enrollment.id].s2),
      }))

  const handleSaveGrades = async () => {
    const grades = changedGrades()
    if (grades.length === 0) {
      toast({ title: "لا جديد", description: "لم يتم تعديل أي نقطة" })
      return
    }

    setSavingGrades(true)
    try {
      const response = await api.saveEnrollmentGrades(grades)
      toast({ title: "تم الحفظ", description: response.message })
      fetchEnrollments()
    } catch (error: any) {
      // A partial save still commits the good rows, and the payload names the
      // ones it refused - worth showing rather than a bare failure.
      const rejected = error?.data?.rejected
      toast({
        title: "تعذر حفظ بعض النقط",
        description: rejected?.length
          ? `${error.message} — رفض: ${rejected.map((r: any) => r.message).join("، ")}`
          : error.message || "فشل في حفظ النقط",
        variant: "destructive",
      })
      fetchEnrollments()
    } finally {
      setSavingGrades(false)
    }
  }

  const handleAdd = async () => {
    if (!orphanId || !yearFilter) {
      toast({ title: "خطأ", description: "اختر اليتيم والسنة الدراسية", variant: "destructive" })
      return
    }

    setIsSubmitting(true)
    try {
      const response = await api.createEnrollment({
        orphan_id: parseInt(orphanId),
        academic_year_id: parseInt(yearFilter),
        education_level_id: levelId !== "0" ? parseInt(levelId) : null,
        school_id: schoolId !== "0" ? parseInt(schoolId) : null,
        specialty: isUniversityLevel && specialty ? specialty : null,
      })
      toast({ title: "تم التسجيل", description: response.message })
      setAddOpen(false)
      setOrphanId("")
      setLevelId("0")
      setSchoolId("0")
      setSpecialty("")
      fetchEnrollments()
    } catch (error: any) {
      toast({ title: "خطأ", description: error.message || "فشل في إضافة التسجيل", variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            تسجيلات التلاميذ
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={handleSaveGrades} disabled={savingGrades}>
              {savingGrades ? <Loader2 className="h-4 w-4 ml-2 animate-spin" /> : <Save className="h-4 w-4 ml-2" />}
              حفظ النقط
            </Button>
            <Button size="sm" onClick={() => setAddOpen(true)}>
              <Plus className="h-4 w-4 ml-2" />
              تسجيل تلميذ
            </Button>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 mt-2">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input placeholder="البحث بالاسم أو رمز مسار..." value={search} onChange={(e) => setSearch(e.target.value)} className="pr-10" />
          </div>
          <Select value={yearFilter} onValueChange={setYearFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="السنة الدراسية" />
            </SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y.id} value={y.id.toString()}>
                  {y.label} {y.is_current ? "(الحالية)" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="الحالة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل الحالات</SelectItem>
              <SelectItem value="enrolled">مسجل</SelectItem>
              <SelectItem value="passed">ناجح</SelectItem>
              <SelectItem value="failed">راسب</SelectItem>
              <SelectItem value="left">غادر</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin ml-2" />
            <span>جاري التحميل...</span>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">التلميذ</TableHead>
                <TableHead className="text-right">رمز مسار</TableHead>
                <TableHead className="text-right">المستوى</TableHead>
                <TableHead className="text-right">المؤسسة</TableHead>
                <TableHead className="text-right">التخصص</TableHead>
                <TableHead className="text-center w-[90px]">الأسدس 1</TableHead>
                <TableHead className="text-center w-[90px]">الأسدس 2</TableHead>
                <TableHead className="text-center w-[80px]">المعدل</TableHead>
                <TableHead className="text-right">النتيجة</TableHead>
                <TableHead className="text-center">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {enrollments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center text-gray-500 py-8">
                    لا توجد تسجيلات لهذه السنة الدراسية.
                  </TableCell>
                </TableRow>
              ) : (
                enrollments.map((enrollment) => {
                  const status = STATUS_LABELS[enrollment.status] || STATUS_LABELS.enrolled
                  const draft = gradeDrafts[enrollment.id]
                  const average = draftAverage(enrollment)
                  const scale = Number(enrollment.grade_scale) || 20
                  return (
                    <TableRow key={enrollment.id}>
                      <TableCell className="font-medium">
                        {enrollment.orphan ? `${enrollment.orphan.first_name} ${enrollment.orphan.last_name}` : "—"}
                      </TableCell>
                      <TableCell>{enrollment.orphan?.masar_code || "—"}</TableCell>
                      <TableCell>{enrollment.education_level?.name_ar || "—"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {enrollment.school?.name || "—"}
                          {enrollment.school?.is_amaso_linked && (
                            <Badge className="bg-green-600 hover:bg-green-600 text-[10px]">AMASO</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{enrollment.specialty || "—"}</TableCell>
                      <TableCell className="text-center">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          max={scale}
                          value={draft?.s1 ?? ""}
                          onChange={(e) => editGrade(enrollment.id, "s1", e.target.value)}
                          className="h-8 text-center px-1"
                          placeholder="—"
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          max={scale}
                          value={draft?.s2 ?? ""}
                          onChange={(e) => editGrade(enrollment.id, "s2", e.target.value)}
                          className="h-8 text-center px-1"
                          placeholder="—"
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        {average === null ? (
                          <span className="text-gray-400">—</span>
                        ) : (
                          <span className={`font-semibold ${average >= scale / 2 ? "text-green-700" : "text-red-600"}`}>
                            {average.toFixed(2)}
                          </span>
                        )}
                        <span className="text-[10px] text-gray-400 block">/{scale}</span>
                      </TableCell>
                      <TableCell>
                        <Badge className={status.className + " hover:" + status.className}>{status.label}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button size="sm" variant="outline" className="h-7 w-7 p-0 hover:bg-green-50 hover:text-green-600" onClick={() => setStatus(enrollment, "passed")} title="ناجح">
                            <Check className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="sm" variant="outline" className="h-7 w-7 p-0 hover:bg-red-50 hover:text-red-600" onClick={() => setStatus(enrollment, "failed")} title="راسب">
                            <X className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="sm" variant="outline" className="h-7 w-7 p-0" onClick={() => setStatus(enrollment, "left")} title="غادر">
                            <DoorOpen className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="sm" variant="outline" className="h-7 w-7 p-0 hover:bg-destructive hover:text-destructive-foreground" onClick={() => handleDelete(enrollment)} title="حذف التسجيل">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>

      {/* Add enrollment dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>تسجيل تلميذ في السنة الدراسية</DialogTitle>
            <DialogDescription>
              يسجَّل التلميذ في السنة الدراسية المحددة في الفلتر أعلاه
              ({years.find((y) => y.id.toString() === yearFilter)?.label || "—"})
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>التلميذ *</Label>
              <Select value={orphanId} onValueChange={setOrphanId}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر اليتيم" />
                </SelectTrigger>
                <SelectContent>
                  {orphans.map((orphan) => (
                    <SelectItem key={orphan.id} value={orphan.id.toString()}>
                      {orphan.full_name} {orphan.widow_name ? `(${orphan.widow_name})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>المستوى الدراسي</Label>
              <Select value={levelId} onValueChange={setLevelId}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر المستوى" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">غير محدد</SelectItem>
                  {levels.map((level) => (
                    <SelectItem key={level.id} value={level.id.toString()}>
                      {level.name_ar}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>المؤسسة</Label>
              <Select value={schoolId} onValueChange={setSchoolId}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر المؤسسة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">غير محددة</SelectItem>
                  {schools
                    .filter((s) => (isUniversityLevel ? s.type === "university" : true))
                    .map((school) => (
                      <SelectItem key={school.id} value={school.id.toString()}>
                        {school.name} {school.type === "university" ? "(جامعة)" : ""}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {isUniversityLevel && (
              <div className="space-y-2">
                <Label>التخصص الجامعي</Label>
                <Input value={specialty} onChange={(e) => setSpecialty(e.target.value)} placeholder="مثال: الحقوق، الطب، الإعلاميات..." />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>إلغاء</Button>
            <Button type="button" onClick={handleAdd} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
              تسجيل
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
