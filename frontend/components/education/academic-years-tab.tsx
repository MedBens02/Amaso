"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { CalendarDays, Plus, Loader2, ArrowLeftRight, AlertTriangle, School as SchoolIcon, X } from "lucide-react"
import api from "@/lib/api"

interface AcademicYear {
  id: number
  start_year: number
  label: string
  is_current: boolean
  enrollments_count?: number
}

export function AcademicYearsTab({ onChanged }: { onChanged?: () => void }) {
  const [years, setYears] = useState<AcademicYear[]>([])
  const [loading, setLoading] = useState(true)
  const [addOpen, setAddOpen] = useState(false)
  const [rolloverOpen, setRolloverOpen] = useState(false)
  const [startYear, setStartYear] = useState(new Date().getFullYear().toString())
  const [isSubmitting, setIsSubmitting] = useState(false)
  // The rollover deliberately leaves two decisions to a person; a toast
  // cannot hold the list of who they are, so it is kept on the page until
  // dismissed.
  const [rolloverResult, setRolloverResult] = useState<any | null>(null)
  const { toast } = useToast()

  const fetchYears = async () => {
    try {
      setLoading(true)
      const response = await api.getAcademicYears()
      setYears(response.data || [])
    } catch (error: any) {
      toast({ title: "خطأ", description: error.message || "فشل في تحميل السنوات الدراسية", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchYears()
  }, [])

  const currentYear = years.find((y) => y.is_current)

  const handleAdd = async () => {
    const year = parseInt(startYear)
    if (!year || year < 2000 || year > 2100) {
      toast({ title: "خطأ", description: "أدخل سنة صحيحة (مثال: 2025)", variant: "destructive" })
      return
    }

    setIsSubmitting(true)
    try {
      const response = await api.createAcademicYear(year)
      toast({ title: "تم الإنشاء", description: response.message })
      setAddOpen(false)
      fetchYears()
      onChanged?.()
    } catch (error: any) {
      toast({ title: "خطأ", description: error.message || "فشل في إنشاء السنة الدراسية", variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRollover = async () => {
    setIsSubmitting(true)
    try {
      const response = await api.rolloverAcademicYear()
      toast({ title: "تم الانتقال للسنة الجديدة", description: response.message })
      setRolloverResult(response.data ?? null)
      setRolloverOpen(false)
      fetchYears()
      onChanged?.()
    } catch (error: any) {
      toast({ title: "لا يمكن إغلاق السنة", description: error.message || "فشل في الانتقال للسنة الجديدة", variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            السنوات الدراسية
          </CardTitle>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setAddOpen(true)}>
              <Plus className="h-4 w-4 ml-2" />
              سنة جديدة
            </Button>
            {currentYear && (
              <Button size="sm" onClick={() => setRolloverOpen(true)}>
                <ArrowLeftRight className="h-4 w-4 ml-2" />
                إغلاق {currentYear.label} والانتقال للسنة الموالية
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {rolloverResult && (rolloverResult.needs_placement?.length > 0 || rolloverResult.needs_school?.length > 0) && (
          <div className="mb-4 space-y-3 rounded-lg border border-amber-300 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/40">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 font-medium text-amber-900 dark:text-amber-300">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                تلاميذ يحتاجون إلى قرار بعد الانتقال إلى {rolloverResult.opened}
              </div>
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setRolloverResult(null)} title="إخفاء">
                <X className="h-4 w-4" />
              </Button>
            </div>

            {rolloverResult.needs_placement?.length > 0 && (
              <div className="space-y-1 text-sm">
                <div className="font-medium">أنهوا مرحلتهم ولم يُسجَّلوا في السنة الجديدة — يحتاجون إلى توجيه:</div>
                <ul className="space-y-0.5 text-muted-foreground">
                  {rolloverResult.needs_placement.map((row: any) => (
                    <li key={`p-${row.orphan_id}`}>
                      <span className="font-medium text-foreground">{row.name}</span> — {row.reason}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {rolloverResult.needs_school?.length > 0 && (
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-1.5 font-medium">
                  <SchoolIcon className="h-3.5 w-3.5" />
                  انتقلوا إلى سلك جديد — تحتاج مؤسستهم إلى تحديد:
                </div>
                <ul className="space-y-0.5 text-muted-foreground">
                  {rolloverResult.needs_school.map((row: any) => (
                    <li key={`s-${row.orphan_id}`}>
                      <span className="font-medium text-foreground">{row.name}</span>
                      {row.level ? ` — ${row.level}` : ""}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              يمكن إتمام ذلك من تبويب «التسجيلات»: زر التعديل أمام كل تلميذ.
            </p>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin ml-2" />
            <span>جاري التحميل...</span>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">السنة الدراسية</TableHead>
                <TableHead className="text-right">الحالة</TableHead>
                <TableHead className="text-right">عدد التسجيلات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {years.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                    لا توجد سنوات دراسية بعد.
                  </TableCell>
                </TableRow>
              ) : (
                years.map((year) => (
                  <TableRow key={year.id}>
                    <TableCell className="font-medium">{year.label}</TableCell>
                    <TableCell>
                      {year.is_current ? (
                        <Badge className="bg-green-600 hover:bg-green-600">السنة الحالية</Badge>
                      ) : (
                        <Badge variant="secondary">مغلقة</Badge>
                      )}
                    </TableCell>
                    <TableCell>{year.enrollments_count ?? 0}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>

      {/* Add year dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>سنة دراسية جديدة</DialogTitle>
            <DialogDescription>أدخل سنة البداية — مثال: 2025 تعني السنة الدراسية 2025/2026</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>سنة البداية</Label>
            <Input type="number" value={startYear} onChange={(e) => setStartYear(e.target.value)} placeholder="2025" />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>إلغاء</Button>
            <Button type="button" onClick={handleAdd} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
              إنشاء
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rollover confirmation */}
      <Dialog open={rolloverOpen} onOpenChange={setRolloverOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>إغلاق السنة الدراسية {currentYear?.label}</DialogTitle>
            <DialogDescription className="space-y-2">
              <span className="block">
                سيتم فتح السنة الدراسية الموالية تلقائياً: التلاميذ الناجحون يُرقّون إلى المستوى الموالي
                (أو إلى السنة الموالية داخل سلكهم الجامعي)، والراسبون يُعاد تسجيلهم في نفس المستوى.
                يُنقل معهم الدعم الدراسي وسلم التنقيط.
              </span>
              <span className="block">
                من أنهى الثانوية أو أنهى سلكه الجامعي لا يُسجَّل تلقائياً — ستظهر لائحته بعد الانتقال
                لاختيار المؤسسة أو السلك المناسب. ومن انتقل إلى سلك جديد يُسجَّل بدون مؤسسة.
              </span>
              <span className="block">يجب أولاً تحديد نتيجة (ناجح/راسب/غادر) لكل تسجيل.</span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setRolloverOpen(false)}>إلغاء</Button>
            <Button type="button" onClick={handleRollover} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
              تأكيد الانتقال
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
