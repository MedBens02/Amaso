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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Plus, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  UNSAVED_GRADES_CLOSE_MESSAGE,
  UNSAVED_GRADES_MESSAGE,
  useUnsavedChangesWarning,
} from "@/hooks/use-unsaved-changes"
import api from "@/lib/api"

/** The ceilings Moroccan institutions actually mark on. */
const SCALES = [10, 20, 40, 100]

interface GradeRow {
  label: string
  mark: string
  scale: string
}

interface ExamGradesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** The enrollment being marked, with its `grades` as the server has them. */
  enrollment: any | null
  onSaved: () => void
}

const emptyRow = (): GradeRow => ({ label: "", mark: "", scale: "20" })

/** Rows as one comparable string, for telling "edited" from "just opened". */
const signature = (rows: GradeRow[]) =>
  JSON.stringify(rows.map((row) => [row.label.trim(), row.mark.trim(), row.scale]))

/**
 * Every mark a student collected, not just the two the school averages.
 *
 * The enrollment row holds the two semester averages, which is what the
 * school issues and what the performance report ranks on. Those are edited
 * in the table itself. This is for everything in between - a regional exam,
 * a controlled assessment, a resit - where the number of marks is however
 * many the student sat, and a table column cannot be a list.
 *
 * Each mark carries its own ceiling: an exam marked out of 40 next to a
 * term marked out of 20 is ordinary, and a 32 means nothing without it.
 */
export function ExamGradesDialog({ open, onOpenChange, enrollment, onSaved }: ExamGradesDialogProps) {
  const [rows, setRows] = useState<GradeRow[]>([])
  const [saving, setSaving] = useState(false)
  // What was on screen when the dialog opened, so closing it can tell work
  // from a glance.
  const [opened, setOpened] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    if (!open) return

    const existing: GradeRow[] = (enrollment?.grades ?? []).map((grade: any) => ({
      label: grade.label ?? "",
      mark: String(Number(grade.mark)),
      scale: String(Number(grade.scale) || 20),
    }))

    const initial = existing.length > 0 ? existing : [emptyRow()]
    setRows(initial)
    setOpened(signature(initial))
  }, [open, enrollment])

  const dirty = open && signature(rows) !== opened

  useUnsavedChangesWarning(dirty, UNSAVED_GRADES_MESSAGE)

  /** Closing throws the rows away, so it asks first once they mean something. */
  const close = () => {
    if (dirty && !window.confirm(UNSAVED_GRADES_CLOSE_MESSAGE)) return

    onOpenChange(false)
  }

  const edit = (index: number, field: keyof GradeRow, value: string) =>
    setRows((current) => current.map((row, i) => (i === index ? { ...row, [field]: value } : row)))

  const remove = (index: number) => setRows((current) => current.filter((_, i) => i !== index))

  const save = async () => {
    // A blank line is how somebody leaves a row they decided not to fill;
    // sending it would fail validation on a field they never typed in.
    const filled = rows.filter((row) => row.label.trim() !== "" || row.mark.trim() !== "")

    const incomplete = filled.find((row) => row.label.trim() === "" || row.mark.trim() === "")
    if (incomplete) {
      toast({
        title: "بيانات ناقصة",
        description: "كل نقطة تحتاج اسماً وقيمة.",
        variant: "destructive",
      })

      return
    }

    setSaving(true)
    try {
      const response = await api.saveExamGrades(
        enrollment.id,
        filled.map((row) => ({
          label: row.label.trim(),
          mark: Number(row.mark),
          scale: Number(row.scale) || 20,
        })),
      )
      toast({ title: "تم", description: (response as any).message })
      onSaved()
      onOpenChange(false)
    } catch (error) {
      toast({
        title: "تعذر حفظ النقط",
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const student = enrollment?.orphan
    ? `${enrollment.orphan.first_name} ${enrollment.orphan.last_name}`
    : ""

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? onOpenChange(true) : close())}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>نقط الامتحانات{student ? ` — ${student}` : ""}</DialogTitle>
          <DialogDescription>
            أضف ما شئت من النقط. معدّلا الأسدسين يُسجَّلان في الجدول نفسه، وهما المعتمدان في تقرير الأداء الدراسي.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {rows.map((row, index) => {
            const mark = Number(row.mark)
            const scale = Number(row.scale) || 20
            const percentage = row.mark.trim() !== "" && scale > 0 ? (mark / scale) * 100 : null
            const overCeiling = percentage !== null && mark > scale

            return (
              <div key={index} className="flex items-end gap-2">
                <div className="flex-1 space-y-1">
                  {index === 0 && <Label className="text-xs text-muted-foreground">اسم النقطة</Label>}
                  <Input
                    value={row.label}
                    onChange={(event) => edit(index, "label", event.target.value)}
                    placeholder="مثال: الامتحان الجهوي"
                  />
                </div>

                <div className="w-24 space-y-1">
                  {index === 0 && <Label className="text-xs text-muted-foreground">النقطة</Label>}
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    dir="ltr"
                    className={overCeiling ? "border-red-500 text-left" : "text-left"}
                    value={row.mark}
                    onChange={(event) => edit(index, "mark", event.target.value)}
                    placeholder="—"
                  />
                </div>

                <div className="w-[92px] space-y-1">
                  {index === 0 && <Label className="text-xs text-muted-foreground">السلم</Label>}
                  <Select value={row.scale} onValueChange={(value) => edit(index, "scale", value)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {SCALES.map((value) => (
                        <SelectItem key={value} value={String(value)}>من {value}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="w-16 pb-2 text-center text-xs text-muted-foreground">
                  {overCeiling ? (
                    <span className="text-red-600">تتجاوز السلم</span>
                  ) : percentage !== null ? (
                    `${percentage.toFixed(0)}%`
                  ) : (
                    "—"
                  )}
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  className="mb-0.5 text-red-600 hover:text-red-700"
                  onClick={() => remove(index)}
                  aria-label="حذف هذه النقطة"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )
          })}

          <Button variant="outline" size="sm" onClick={() => setRows((current) => [...current, emptyRow()])}>
            <Plus className="h-4 w-4 ml-2" />
            إضافة نقطة
          </Button>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={close} disabled={saving}>
            إلغاء
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
            حفظ النقط
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
