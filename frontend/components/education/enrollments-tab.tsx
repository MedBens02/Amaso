"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { GraduationCap, Plus, Loader2, Search, Trash2, Save, Pencil, BookOpen } from "lucide-react"
import { RowActions } from "@/components/ui/row-actions"
import api from "@/lib/api"
import { cn } from "@/lib/utils"
import { EnrollmentDialog, type Phase } from "./enrollment-dialog"

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  enrolled: { label: "مسجل", className: "bg-blue-100 dark:bg-blue-950/50 text-blue-800 dark:text-blue-400" },
  passed: { label: "ناجح", className: "bg-green-100 dark:bg-green-950/50 text-green-800 dark:text-green-400" },
  failed: { label: "راسب", className: "bg-red-100 dark:bg-red-950/50 text-red-800 dark:text-red-400" },
  left: { label: "غادر", className: "bg-gray-200 text-foreground" },
}

/** The ceilings Moroccan institutions mark on. */
const GRADE_SCALES = [10, 20, 100]

type GradeDraft = { s1: string; s2: string; scale: string }

const draftOf = (row: any): GradeDraft => ({
  s1: row.first_semester_grade == null ? "" : String(Number(row.first_semester_grade)),
  s2: row.second_semester_grade == null ? "" : String(Number(row.second_semester_grade)),
  scale: String(Number(row.grade_scale) || 20),
})

export function EnrollmentsTab({ refreshKey }: { refreshKey?: number }) {
  const [enrollments, setEnrollments] = useState<any[]>([])
  const [years, setYears] = useState<any[]>([])
  const [schools, setSchools] = useState<any[]>([])
  const [levels, setLevels] = useState<any[]>([])
  const [phases, setPhases] = useState<Phase[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [yearFilter, setYearFilter] = useState<string>("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [tutoringFilter, setTutoringFilter] = useState<string>("all")
  const [dialogOpen, setDialogOpen] = useState(false)
  // null in the dialog means "register a student" rather than "edit this one".
  const [editing, setEditing] = useState<any | null>(null)
  const { toast } = useToast()

  // Grades are entered a class at a time from a report-card list, so the
  // marks are edited inline and saved in one request rather than one dialog
  // per student. The scale rides along: a registrar keying in a faculty's
  // marks out of 20 needs to say so on the same row, not in a second screen.
  const [gradeDrafts, setGradeDrafts] = useState<Record<number, GradeDraft>>({})
  const [savingGrades, setSavingGrades] = useState(false)
  // What the server last sent for each row. Without it there is no way to
  // tell a mark the user typed from one that simply arrived, so every reload
  // overwrote unsaved work - marking one student as passed threw away the
  // whole column somebody had been keying in.
  const serverGrades = useRef<Record<number, GradeDraft>>({})

  const fetchLookups = async () => {
    try {
      const [yearsRes, schoolsRes, levelsRes] = await Promise.all([
        api.getAcademicYears(),
        api.getSchools(),
        api.getOrphansEducationLevels(),
      ])
      setYears(yearsRes.data || [])
      setSchools(schoolsRes.data || [])
      setLevels(levelsRes.data || [])
      // The student picker searches the orphans endpoint itself now rather
      // than filtering a list fetched once here - a fixed page of 100 was
      // silently unreachable past the 100th orphan, in a real roster of
      // several hundred.

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
        has_tutoring: tutoringFilter === "all" ? undefined : tutoringFilter === "yes" ? 1 : 0,
        search: search || undefined,
        per_page: 50,
      })
      const rows = response.data || []
      setEnrollments(rows)
      // The course list travels with the page the screen already asks for,
      // so it never falls out of step with the server's own vocabulary.
      const meta = response.meta as any
      if (meta?.higher_education_phases) setPhases(meta.higher_education_phases)
      // Reloading keeps whatever is still unsaved. A row the user has not
      // touched takes the server's value; a row they have takes theirs.
      const fresh: Record<number, GradeDraft> = Object.fromEntries(
        rows.map((row: any) => [row.id, draftOf(row)]),
      )
      setGradeDrafts((previous) => {
        const merged: Record<number, GradeDraft> = {}
        for (const row of rows) {
          const before = serverGrades.current[row.id]
          const current = previous[row.id]
          const edited =
            before && current &&
            (current.s1 !== before.s1 || current.s2 !== before.s2 || current.scale !== before.scale)
          merged[row.id] = edited ? current : fresh[row.id]
        }
        return merged
      })
      serverGrades.current = fresh
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
  }, [search, yearFilter, statusFilter, tutoringFilter, refreshKey])

  const setStatus = async (enrollment: any, status: string) => {
    try {
      const response = await api.updateEnrollment(enrollment.id, { status })
      const updated = (response.data as any) ?? { ...enrollment, status }

      // Patch the one row. Reloading the table for a single dropdown was what
      // discarded unsaved marks, and it is a whole round trip for a change
      // the server has already confirmed.
      setEnrollments((rows) =>
        rows
          .map((row) => (row.id === enrollment.id ? { ...row, ...updated } : row))
          // Under a status filter the row may no longer belong on screen.
          .filter((row) => statusFilter === "all" || row.status === statusFilter),
      )
      serverGrades.current[enrollment.id] = draftOf(updated)
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

  const editDraft = (enrollmentId: number, field: keyof GradeDraft, value: string) => {
    setGradeDrafts((drafts) => ({
      ...drafts,
      [enrollmentId]: { ...(drafts[enrollmentId] || { s1: "", s2: "", scale: "20" }), [field]: value },
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
        const original = draftOf(enrollment)
        return draft.s1 !== original.s1 || draft.s2 !== original.s2 || draft.scale !== original.scale
      })
      .map((enrollment) => ({
        enrollment_id: enrollment.id,
        first_semester_grade: gradeDrafts[enrollment.id].s1 === "" ? null : Number(gradeDrafts[enrollment.id].s1),
        second_semester_grade: gradeDrafts[enrollment.id].s2 === "" ? null : Number(gradeDrafts[enrollment.id].s2),
        grade_scale: Number(gradeDrafts[enrollment.id].scale) || 20,
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

  const openAdd = () => {
    setEditing(null)
    setDialogOpen(true)
  }

  const openEdit = (enrollment: any) => {
    setEditing(enrollment)
    setDialogOpen(true)
  }

  const tutoringCount = enrollments.filter((e) => e.has_tutoring).length
  const pendingGrades = changedGrades().length

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            تسجيلات التلاميذ
            {!loading && enrollments.length > 0 && (
              <span className="text-sm font-normal text-muted-foreground">
                ({enrollments.length}{tutoringCount > 0 ? ` — ${tutoringCount} بدعم دراسي` : ""})
              </span>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            {/* The count is the reminder: marks live in the row until saved,
                and there was nothing on screen saying so. */}
            <Button
              size="sm"
              variant={pendingGrades > 0 ? "default" : "outline"}
              onClick={handleSaveGrades}
              disabled={savingGrades || pendingGrades === 0}
            >
              {savingGrades ? <Loader2 className="h-4 w-4 ml-2 animate-spin" /> : <Save className="h-4 w-4 ml-2" />}
              {pendingGrades > 0 ? `حفظ النقط (${pendingGrades})` : "حفظ النقط"}
            </Button>
            <Button size="sm" onClick={openAdd}>
              <Plus className="h-4 w-4 ml-2" />
              تسجيل تلميذ
            </Button>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 mt-2">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
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
          <Select value={tutoringFilter} onValueChange={setTutoringFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="الدعم الدراسي" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">الجميع</SelectItem>
              <SelectItem value="yes">بدعم دراسي</SelectItem>
              <SelectItem value="no">بدون دعم</SelectItem>
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
                <TableHead className="text-right">المؤسسة والتخصص</TableHead>
                <TableHead className="w-[76px] text-center">الأسدس 1</TableHead>
                <TableHead className="w-[76px] text-center">الأسدس 2</TableHead>
                <TableHead className="w-[96px] text-center">المعدل</TableHead>
                <TableHead className="text-right">النتيجة</TableHead>
                <TableHead className="w-[60px] text-center">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {enrollments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                    لا توجد تسجيلات لهذه السنة الدراسية.
                  </TableCell>
                </TableRow>
              ) : (
                enrollments.map((enrollment) => {
                  const status = STATUS_LABELS[enrollment.status] || STATUS_LABELS.enrolled
                  const draft = gradeDrafts[enrollment.id]
                  const average = draftAverage(enrollment)
                  const scale = Number(draft?.scale) || 20
                  return (
                    <TableRow key={enrollment.id}>
                      <TableCell className="font-medium">
                        <span className="flex items-center gap-1.5">
                          {enrollment.orphan ? `${enrollment.orphan.first_name} ${enrollment.orphan.last_name}` : "—"}
                          {/* A whole column for tutoring cost more width than
                              the subjects it could actually fit - truncated to
                              three letters it said nothing. The mark travels
                              with the student's name instead, and the detail
                              is on hover; the toolbar filter is unchanged. */}
                          {enrollment.has_tutoring && (
                            <span
                              className="shrink-0 text-teal-600 dark:text-teal-400"
                              title={["دعم دراسي", enrollment.tutoring_subjects, enrollment.tutoring_provider]
                                .filter(Boolean)
                                .join(" — ")}
                            >
                              <BookOpen className="h-3.5 w-3.5" aria-label="يتلقى دعماً دراسياً" />
                            </span>
                          )}
                        </span>
                      </TableCell>
                      <TableCell>{enrollment.orphan?.masar_code || "—"}</TableCell>
                      <TableCell>
                        <div>{enrollment.education_level?.name_ar || "—"}</div>
                        {/* Which year of which course, for the students the
                            ladder's single "جامعي" rung cannot describe. */}
                        {enrollment.higher_education_label && (
                          <div className="text-xs text-muted-foreground">{enrollment.higher_education_label}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {enrollment.school?.name || "—"}
                          {enrollment.school?.is_amaso_linked && (
                            <Badge className="bg-green-600 hover:bg-green-600 text-[10px]">AMASO</Badge>
                          )}
                        </div>
                        {enrollment.specialty && (
                          <div className="text-xs text-muted-foreground">{enrollment.specialty}</div>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          max={scale}
                          value={draft?.s1 ?? ""}
                          onChange={(e) => editDraft(enrollment.id, "s1", e.target.value)}
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
                          onChange={(e) => editDraft(enrollment.id, "s2", e.target.value)}
                          className="h-8 text-center px-1"
                          placeholder="—"
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center gap-1">
                          {average === null ? (
                            <span className="text-muted-foreground">—</span>
                          ) : (
                            <span className={`font-semibold ${average >= scale / 2 ? "text-green-700 dark:text-green-400" : "text-red-600"}`}>
                              {average.toFixed(2)}
                            </span>
                          )}
                          {/* The ceiling is a property of the institution's
                              marking, not of the app - a faculty marking out
                              of 20 is as common as one marking out of 100. */}
                          <Select value={draft?.scale ?? "20"} onValueChange={(value) => editDraft(enrollment.id, "scale", value)}>
                            <SelectTrigger className="h-6 w-[70px] px-2 text-[11px] text-muted-foreground">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {GRADE_SCALES.map((value) => (
                                <SelectItem key={value} value={String(value)} className="text-xs">
                                  من {value}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </TableCell>
                      <TableCell>
                        {/* Marking a result was three unlabelled icons in the
                            actions strip, a third of the table's width away
                            from the badge showing what the result currently
                            was. It is one control now, where the answer is. */}
                        <Select value={enrollment.status} onValueChange={(value) => setStatus(enrollment, value)}>
                          <SelectTrigger className={cn("h-7 w-[92px] border-0 px-2 text-xs font-medium", status.className)}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(STATUS_LABELS).map(([value, item]) => (
                              <SelectItem key={value} value={value} className="text-xs">
                                {item.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="w-[60px] text-center">
                        <RowActions
                          actions={[
                            { label: "تعديل التسجيل", icon: Pencil, onSelect: () => openEdit(enrollment) },
                            {
                              label: "حذف التسجيل",
                              icon: Trash2,
                              onSelect: () => handleDelete(enrollment),
                              destructive: true,
                            },
                          ]}
                        />
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <EnrollmentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        enrollment={editing}
        years={years}
        levels={levels}
        schools={schools}
        phases={phases}
        defaultYearId={yearFilter}
        onSaved={fetchEnrollments}
      />
    </Card>
  )
}
