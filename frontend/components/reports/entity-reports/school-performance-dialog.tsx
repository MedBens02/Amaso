"use client"

import { useEffect, useRef, useState } from "react"
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
import { Award, FileDown, GraduationCap, Loader2, Trophy } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { PDFCardTemplate, HiddenPDFWrapper, PDFTable, type PDFCardSection } from "@/components/reports"
import { generatePDFFromHTML, generatePDFFilename } from "@/lib/pdf-generator"
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
  const printRef = useRef<HTMLDivElement>(null)

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
    if (!printRef.current || isGenerating || !report) return

    setIsGenerating(true)
    try {
      toast({ title: "جاري إنشاء الـ PDF...", description: "يرجى الانتظار بينما يتم إعداد التقرير" })
      const result = await generatePDFFromHTML(
        printRef,
        generatePDFFilename("school-performance", report.academic_year?.label || "report"),
        { scale: 2, multiPage: true },
      )
      if (!result.success) throw new Error(result.error)
      toast({ title: "تم إنشاء الـ PDF بنجاح" })
    } catch (error) {
      toast({
        title: "خطأ في إنشاء الـ PDF",
        description: "حدث خطأ أثناء إنشاء الملف. يرجى المحاولة مرة أخرى",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const breakdownTable = (title: string, rows: any[]) => ({
    title,
    content: (
      <PDFTable
        headers={["البند", "العدد", "المعدل", "نسبة النجاح"]}
        rows={
          rows.length > 0
            ? rows.map((row) => [row.label, String(row.students), pct(row.average_percentage), pct(row.pass_rate)])
            : [["لا توجد نتائج", "—", "—", "—"]]
        }
      />
    ),
  })

  const pdfSections: PDFCardSection[] = report
    ? [
        {
          title: "ملخص",
          icon: GraduationCap,
          content: (
            <PDFTable
              headers={["المؤشر", "القيمة"]}
              rows={[
                ["السنة الدراسية", report.academic_year?.label || "—"],
                ["الفترة", SEMESTER_LABELS[report.semester] || report.semester],
                ["عدد التلاميذ", String(report.totals.students)],
                ["المنقطون بنقط مسجلة", String(report.totals.graded)],
                ["بدون نقط", String(report.totals.ungraded)],
                ["المعدل العام", pct(report.totals.average_percentage)],
                ["نسبة النجاح", pct(report.totals.pass_rate)],
              ]}
            />
          ),
        },
        {
          title: report.filters.top_n ? `الأوائل (${report.filters.top_n})` : "الترتيب",
          icon: Trophy,
          content: (
            <PDFTable
              headers={["الترتيب", "التلميذ", "المؤسسة", "المستوى", "الأسدس 1", "الأسدس 2", "المعدل", "النسبة"]}
              rows={
                report.students.length > 0
                  ? report.students.map((student: any) => [
                      String(student.rank),
                      student.full_name,
                      student.school || "—",
                      student.education_level || "—",
                      student.first_semester_grade === null ? "—" : Number(student.first_semester_grade).toFixed(2),
                      student.second_semester_grade === null ? "—" : Number(student.second_semester_grade).toFixed(2),
                      mark(student.grade, student.grade_scale),
                      pct(student.percentage),
                    ])
                  : [["—", "لا توجد نتائج مطابقة", "—", "—", "—", "—", "—", "—"]]
              }
            />
          ),
        },
        breakdownTable("حسب المؤسسة", report.by_school),
        breakdownTable("حسب المستوى", report.by_level),
        breakdownTable("حسب القطاع", report.by_sector),
        {
          ...breakdownTable(
            "حسب الجنس",
            report.by_gender.map((row: any) => ({
              ...row,
              label: row.label === "male" ? "ذكور" : row.label === "female" ? "إناث" : row.label,
            })),
          ),
          icon: Award,
        },
      ]
    : []

  return (
    <>
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
              <Label className="text-xs">عدد الأوائل</Label>
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
                      <p className="text-xs text-gray-500">{stat.label}</p>
                      <p className="text-lg font-bold">{stat.value}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {report.totals.ungraded > 0 && (
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md p-2">
                  {report.totals.ungraded} تلميذ(ة) بدون نقط مسجلة لهذه الفترة — غير مدرجين في الترتيب.
                </p>
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
                        <TableCell colSpan={8} className="text-center text-gray-500 py-6">
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
                          <TableCell className="text-gray-600">{student.family || "—"}</TableCell>
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

      {report && (
        <HiddenPDFWrapper>
          <div ref={printRef}>
            <PDFCardTemplate
              header={{
                title: "تقرير الأداء الدراسي",
                subtitle: SEMESTER_LABELS[report.semester] || report.semester,
                entityName: report.academic_year?.label || "السنة الدراسية الحالية",
                entityId: report.filters.top_n ? `الأوائل ${report.filters.top_n}` : undefined,
              }}
              sections={pdfSections}
              footer={{
                leftContent: `المعدل العام: ${pct(report.totals.average_percentage)}`,
                rightContent: `نسبة النجاح: ${pct(report.totals.pass_rate)} — ${report.totals.graded} من ${report.totals.students} تلميذ(ة)`,
              }}
            />
          </div>
        </HiddenPDFWrapper>
      )}
    </>
  )
}
