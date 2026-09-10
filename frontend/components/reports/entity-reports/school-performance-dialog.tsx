"use client"

import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { FileDown, GraduationCap, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import api from "@/lib/api"

interface SchoolPerformanceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const ANY = "all"

const SEMESTER_LABELS: Record<string, string> = {
  first: "الأسدس الأول",
  second: "الأسدس الثاني",
  average: "معدل السنة",
}

const pct = (value: number | null) => (value === null || value === undefined ? "—" : `${value.toFixed(1)}%`)
const mark = (value: number | null, scale: number) =>
  value === null || value === undefined ? "—" : `${Number(value).toFixed(2)} / ${scale}`

/**
 * Ranks the sponsored students for a given academic year, with the cuts the
 * association actually asks for before handing out excellence awards. Marks
 * are compared as percentages, because a faculty marking out of 100 and a
 * primary school marking out of 20 otherwise never belong in the same list.
 */
export function SchoolPerformanceDialog({ open, onOpenChange }: SchoolPerformanceDialogProps) {
  const { toast } = useToast()

  const [years, setYears] = useState<any[]>([])
  const [schools, setSchools] = useState<any[]>([])
  const [levels, setLevels] = useState<any[]>([])

  const [academicYearId, setAcademicYearId] = useState<string>(ANY)
  const [semester, setSemester] = useState<string>("average")
  const [gender, setGender] = useState<string>(ANY)
  const [levelId, setLevelId] = useState<string>(ANY)
  const [schoolId, setSchoolId] = useState<string>(ANY)
  const [schoolType, setSchoolType] = useState<string>(ANY)
  const [sector, setSector] = useState<string>(ANY)
  const [amasoLinked, setAmasoLinked] = useState<string>(ANY)
  const [topN, setTopN] = useState<string>("10")
  const [groupBy, setGroupBy] = useState<string>("none")

  const [report, setReport] = useState<any | null>(null)
  const [loading, setLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)

  useEffect(() => {
    if (!open) return

    Promise.all([api.getAcademicYears(), api.getSchools(), api.getOrphansEducationLevels()])
      .then(([yearsRes, schoolsRes, levelsRes]) => {
        setYears(yearsRes.data || [])
        setSchools(schoolsRes.data || [])
        setLevels(levelsRes.data || [])
        const current = (yearsRes.data || []).find((year: any) => year.is_current)
        if (current) setAcademicYearId(current.id.toString())
      })
      .catch(() => toast({ title: "خطأ", description: "تعذر تحميل بيانات التصفية", variant: "destructive" }))
  }, [open])

  const loadReport = async () => {
    setLoading(true)
    try {
      const res = await api.getSchoolPerformance({
        academic_year_id: academicYearId !== ANY ? parseInt(academicYearId) : undefined,
        semester,
        gender: gender !== ANY ? gender : undefined,
        education_level_id: levelId !== ANY ? parseInt(levelId) : undefined,
        school_id: schoolId !== ANY ? parseInt(schoolId) : undefined,
        school_type: schoolType !== ANY ? schoolType : undefined,
        is_private: sector === ANY ? undefined : sector === "private",
        is_amaso_linked: amasoLinked === ANY ? undefined : amasoLinked === "yes",
        group_by: groupBy,
        top_n: topN ? parseInt(topN) : undefined,
      })
      setReport(res.data)
    } catch (error: any) {
      toast({
        title: "خطأ في إنشاء التقرير",
        description: error?.message || "حدث خطأ أثناء تحميل النتائج",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const generatePDF = async () => {
    if (isGenerating) return

    setIsGenerating(true)
    try {
      await api.downloadPdf('/reports/school-performance.pdf', {
        academic_year_id: academicYearId !== ANY ? parseInt(academicYearId) : undefined,
        semester,
        gender: gender !== ANY ? gender : undefined,
        education_level_id: levelId !== ANY ? parseInt(levelId) : undefined,
        school_id: schoolId !== ANY ? parseInt(schoolId) : undefined,
        school_type: schoolType !== ANY ? schoolType : undefined,
        is_private: sector === ANY ? undefined : sector === "private",
        is_amaso_linked: amasoLinked === ANY ? undefined : amasoLinked === "yes",
        group_by: groupBy,
        top_n: topN ? parseInt(topN) : undefined,
      })
      toast({ title: "تم تحميل التقرير" })
    } catch (error: any) {
      toast({
        title: "خطأ في إنشاء الـ PDF",
        description: error?.message || "حدث خطأ أثناء إنشاء الملف. يرجى المحاولة مرة أخرى",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              تقرير الأداء الدراسي
            </DialogTitle>
            <DialogDescription>
              ترتيب التلاميذ المكفولين حسب نقط الأسدسين، مع إمكانية التصفية لاختيار الأوائل
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">السنة الدراسية</Label>
              <Select value={academicYearId} onValueChange={setAcademicYearId}>
                <SelectTrigger><SelectValue placeholder="السنة" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={ANY}>السنة الحالية</SelectItem>
                  {years.map((year) => (
                    <SelectItem key={year.id} value={year.id.toString()}>
                      {year.label}{year.is_current ? " (الحالية)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">الفترة</Label>
              <Select value={semester} onValueChange={setSemester}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="average">معدل السنة</SelectItem>
                  <SelectItem value="first">الأسدس الأول</SelectItem>
                  <SelectItem value="second">الأسدس الثاني</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">الجنس</Label>
              <Select value={gender} onValueChange={setGender}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={ANY}>الكل</SelectItem>
                  <SelectItem value="male">ذكور</SelectItem>
                  <SelectItem value="female">إناث</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">المستوى الدراسي</Label>
              <Select value={levelId} onValueChange={setLevelId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={ANY}>كل المستويات</SelectItem>
                  {levels.map((level) => (
                    <SelectItem key={level.id} value={level.id.toString()}>{level.name_ar}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">نوع التعليم</Label>
              <Select value={schoolType} onValueChange={setSchoolType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={ANY}>الكل</SelectItem>
                  <SelectItem value="school">التعليم المدرسي</SelectItem>
                  <SelectItem value="university">التعليم العالي</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">القطاع</Label>
              <Select value={sector} onValueChange={setSector}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={ANY}>الكل</SelectItem>
                  <SelectItem value="public">عمومي</SelectItem>
                  <SelectItem value="private">خاص</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">المؤسسة</Label>
              <Select value={schoolId} onValueChange={setSchoolId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={ANY}>كل المؤسسات</SelectItem>
                  {schools.map((school) => (
                    <SelectItem key={school.id} value={school.id.toString()}>{school.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">ترتيب داخل</Label>
              <Select value={groupBy} onValueChange={setGroupBy}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">ترتيب عام</SelectItem>
                  <SelectItem value="level">كل مستوى دراسي</SelectItem>
                  <SelectItem value="school">كل مؤسسة</SelectItem>
                  <SelectItem value="gender">كل جنس</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">عدد الأوائل{groupBy !== "none" ? " (لكل فئة)" : ""}</Label>
              <Input
                type="number"
                min="1"
                max="500"
                value={topN}
                onChange={(e) => setTopN(e.target.value)}
                placeholder="الكل"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">شراكة مع الجمعية</Label>
              <Select value={amasoLinked} onValueChange={setAmasoLinked}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={ANY}>الكل</SelectItem>
                  <SelectItem value="yes">مؤسسات شريكة فقط</SelectItem>
                  <SelectItem value="no">غير شريكة</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={loadReport} disabled={loading} className="w-full">
            {loading ? <Loader2 className="h-4 w-4 ml-2 animate-spin" /> : <GraduationCap className="h-4 w-4 ml-2" />}
            عرض النتائج
          </Button>

          {report && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {[
                  { label: "التلاميذ", value: report.totals.students },
                  { label: "بنقط مسجلة", value: report.totals.graded },
                  { label: "بدون نقط", value: report.totals.ungraded },
                  { label: "المعدل العام", value: pct(report.totals.average_percentage) },
                  { label: "نسبة النجاح", value: pct(report.totals.pass_rate) },
                ].map((stat) => (
                  <Card key={stat.label}>
                    <CardContent className="p-3 text-center">
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                      <p className="text-lg font-bold">{stat.value}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {report.totals.ungraded > 0 && (
                <p className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-md p-2">
                  {report.totals.ungraded} تلميذ(ة) بدون نقط مسجلة لهذه الفترة — غير مدرجين في الترتيب.
                </p>
              )}

              {report.group_by !== "none" && report.groups?.length > 0 && (
                <div className="space-y-3">
                  {report.groups.map((group: any) => (
                    <div key={group.label} className="border rounded-lg overflow-hidden">
                      <div className="bg-teal-800 text-white px-3 py-1.5 text-sm font-semibold flex justify-between">
                        <span>{group.label}</span>
                        <span className="font-normal">
                          {group.students_listed} من {group.students_total} — المعدل {pct(group.average_percentage)}
                        </span>
                      </div>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-center w-[60px]">#</TableHead>
                            <TableHead className="text-right">التلميذ</TableHead>
                            <TableHead className="text-right">المؤسسة</TableHead>
                            <TableHead className="text-center">الأسدس 1</TableHead>
                            <TableHead className="text-center">الأسدس 2</TableHead>
                            <TableHead className="text-center">النسبة</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {group.students.map((student: any) => (
                            <TableRow key={student.enrollment_id}>
                              <TableCell className="text-center font-bold">
                                {student.rank <= 3 ? (
                                  <Badge className="bg-amber-500 hover:bg-amber-500">{student.rank}</Badge>
                                ) : student.rank}
                              </TableCell>
                              <TableCell className="font-medium">{student.full_name}</TableCell>
                              <TableCell>{student.school || "—"}</TableCell>
                              <TableCell className="text-center">
                                {student.first_semester_grade === null ? "—" : Number(student.first_semester_grade).toFixed(2)}
                              </TableCell>
                              <TableCell className="text-center">
                                {student.second_semester_grade === null ? "—" : Number(student.second_semester_grade).toFixed(2)}
                              </TableCell>
                              <TableCell className="text-center font-semibold">{pct(student.percentage)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ))}
                </div>
              )}

              <div className="border rounded-lg overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-center w-[60px]">#</TableHead>
                      <TableHead className="text-right">التلميذ</TableHead>
                      <TableHead className="text-right">الأسرة</TableHead>
                      <TableHead className="text-right">المؤسسة</TableHead>
                      <TableHead className="text-right">المستوى</TableHead>
                      <TableHead className="text-center">الأسدس 1</TableHead>
                      <TableHead className="text-center">الأسدس 2</TableHead>
                      <TableHead className="text-center">النسبة</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.students.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-muted-foreground py-6">
                          لا توجد نتائج مطابقة لهذه التصفية.
                        </TableCell>
                      </TableRow>
                    ) : (
                      report.students.map((student: any) => (
                        <TableRow key={student.enrollment_id}>
                          <TableCell className="text-center font-bold">
                            {student.rank <= 3 ? (
                              <Badge className="bg-amber-500 hover:bg-amber-500">{student.rank}</Badge>
                            ) : (
                              student.rank
                            )}
                          </TableCell>
                          <TableCell className="font-medium">{student.full_name}</TableCell>
                          <TableCell className="text-muted-foreground">{student.family || "—"}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {student.school || "—"}
                              {student.is_private && <Badge variant="outline" className="text-[10px]">خاص</Badge>}
                              {student.school_type === "university" && (
                                <Badge variant="outline" className="text-[10px]">عالي</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{student.education_level || student.specialty || "—"}</TableCell>
                          <TableCell className="text-center">
                            {student.first_semester_grade === null ? "—" : Number(student.first_semester_grade).toFixed(2)}
                          </TableCell>
                          <TableCell className="text-center">
                            {student.second_semester_grade === null ? "—" : Number(student.second_semester_grade).toFixed(2)}
                          </TableCell>
                          <TableCell className="text-center font-semibold">{pct(student.percentage)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>إغلاق</Button>
            <Button onClick={generatePDF} disabled={!report || isGenerating}>
              {isGenerating ? <Loader2 className="h-4 w-4 ml-2 animate-spin" /> : <FileDown className="h-4 w-4 ml-2" />}
              تصدير PDF
            </Button>
          </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
