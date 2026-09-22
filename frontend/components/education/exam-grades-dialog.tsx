"use client"

import { useEffect, useMemo, useState } from "react"
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
import { Loader2, Plus, RotateCcw, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  UNSAVED_GRADES_CLOSE_MESSAGE,
  UNSAVED_GRADES_MESSAGE,
  useUnsavedChangesWarning,
} from "@/hooks/use-unsaved-changes"
import api from "@/lib/api"

/** The ceilings Moroccan institutions actually mark on. */
const SCALES = [10, 20, 40, 100]

export interface GradeComponent {
  label: string
  weight: number | string
}

interface GradeRow {
  label: string
  mark: string
  scale: string
  weight: string
  /** True while this row is one of the level's components rather than an extra. */
  fromScheme: boolean
}

interface ExamGradesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** The enrollment being marked, with its `grades` as the server has them. */
  enrollment: any | null
  /** The level's marking scheme, which lays the form out. */
  components: GradeComponent[]
  onSaved: () => void
}

const blankRow = (): GradeRow => ({ label: "", mark: "", scale: "20", weight: "0", fromScheme: false })

/** Rows as one comparable string, for telling "edited" from "just opened". */
const signature = (rows: GradeRow[]) =>
  JSON.stringify(rows.map((row) => [row.label.trim(), row.mark.trim(), row.scale, row.weight]))

const num = (value: string) => {
  const parsed = Number(value)

  return Number.isFinite(parsed) ? parsed : 0
}

/**
 * A year's marks, and the mark they add up to.
 *
 * The form is the level's own scheme: a box per component, already named and
 * already weighted, because the weights are the ministry's and the same for
 * every child at that level. Somebody marking a class types marks, never
 * weights - that is the whole reason the scheme lives on the level.
 *
 * A weight is still editable here, for the year that does not go to plan: a
 * student exempted from a component, or a mark that should be on the record
 * without counting. Zero means exactly that, and the row stays.
 *
 * Each mark carries its own ceiling, so the year's mark is worked out in
 * percentages and converted back - an exam out of 40 beside a term out of 20
 * is ordinary, and averaging 32 with 15 as though they were the same number
 * is not an average of anything.
 */
export function ExamGradesDialog({
  open,
  onOpenChange,
  enrollment,
  components,
  onSaved,
}: ExamGradesDialogProps) {
  const [rows, setRows] = useState<GradeRow[]>([])
  const [saving, setSaving] = useState(false)
  // What was on screen when the dialog opened, so closing it can tell work
  // from a glance.
  const [opened, setOpened] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    if (!open) return

    const saved: any[] = enrollment?.grades ?? []
    const defaultScale = String(Number(enrollment?.grade_scale) || 20)
    const used = new Set<string>()

    // The scheme lays the form out, in its order, whether or not a mark has
    // been given yet - an empty box invites the mark, where a missing row
    // just looks like the component does not exist.
    const scheme: GradeRow[] = components.map((component) => {
      const match = saved.find((grade) => grade.label === component.label)
      if (match) used.add(match.label)

      return {
        label: component.label,
        mark: match ? String(Number(match.mark)) : "",
        scale: match ? String(Number(match.scale) || 20) : defaultScale,
        // A mark already given keeps the weight it was given under; a new one
        // takes the level's. Correcting a level's scheme must not silently
        // re-price a year that has been marked and reported on.
        weight: String(Number(match ? match.weight : component.weight) || 0),
        fromScheme: true,
      }
    })

    // Anything recorded that the scheme has no place for - a mock exam, or a
    // component removed from the scheme after the mark was given.
    const extras: GradeRow[] = saved
      .filter((grade) => !used.has(grade.label))
      .map((grade) => ({
        label: grade.label ?? "",
        mark: String(Number(grade.mark)),
        scale: String(Number(grade.scale) || 20),
        weight: String(Number(grade.weight) || 0),
        fromScheme: false,
      }))

    const initial = [...scheme, ...extras]
    setRows(initial.length > 0 ? initial : [blankRow()])
    setOpened(signature(initial.length > 0 ? initial : [blankRow()]))
  }, [open, enrollment, components])

  const edit = (index: number, field: keyof GradeRow, value: string) =>
    setRows((current) => current.map((row, i) => (i === index ? { ...row, [field]: value } : row)))

  const remove = (index: number) => setRows((current) => current.filter((_, i) => i !== index))

  /** Put every scheme row back on the weight the level currently says. */
  const applySchemeWeights = () =>
    setRows((current) =>
      current.map((row) => {
        const component = components.find((c) => c.label === row.label)

        return component ? { ...row, weight: String(Number(component.weight) || 0) } : row
      }),
    )

  /**
   * The year's mark as the server will compute it: every mark weighted by
   * what it counts for, in percentage space, divided by the weight actually
   * present so a half-marked year still shows where the student stands.
   */
  const year = useMemo(() => {
    const scale = Number(enrollment?.grade_scale) || 20
    let weighted = 0
    let weights = 0
    let counted = 0

    for (const row of rows) {
      if (row.mark.trim() === "") continue

      const rowScale = num(row.scale) || 20
      const weight = num(row.weight)
      if (rowScale <= 0 || weight <= 0) continue

      weighted += (num(row.mark) / rowScale) * 100 * weight
      weights += weight
      counted++
    }

    const percentage = weights > 0 ? weighted / weights : null

    return {
      percentage,
      mark: percentage === null ? null : (percentage / 100) * scale,
      scale,
      counted,
      // What the marks on screen account for. Short of 100 is normal while a
      // year is still being taught; over it means a weight was mistyped.
      weightTotal: Math.round(rows.reduce((sum, row) => sum + num(row.weight), 0) * 100) / 100,
    }
  }, [rows, enrollment])

  const dirty = open && signature(rows) !== opened

  useUnsavedChangesWarning(dirty, UNSAVED_GRADES_MESSAGE)

  /** Closing throws the rows away, so it asks first once they mean something. */
  const close = () => {
    if (dirty && !window.confirm(UNSAVED_GRADES_CLOSE_MESSAGE)) return

    onOpenChange(false)
  }

  const save = async () => {
    // A row with no mark is a component not yet sat, not a blank to complain
    // about - it simply is not sent.
    const filled = rows.filter((row) => row.mark.trim() !== "")

    const unnamed = filled.find((row) => row.label.trim() === "")
    if (unnamed) {
      toast({
        title: "بيانات ناقصة",
        description: "كل نقطة تحتاج اسماً.",
        variant: "destructive",
      })

      return
    }

    const labels = filled.map((row) => row.label.trim())
    if (new Set(labels).size !== labels.length) {
      toast({
        title: "اسم مكرر",
        description: "لا يمكن تكرار اسم النقطة في السنة نفسها.",
        variant: "destructive",
      })

      return
    }

    setSaving(true)
    try {
      const response: any = await api.saveExamGrades(
        enrollment.id,
        filled.map((row) => ({
          label: row.label.trim(),
          mark: num(row.mark),
          scale: num(row.scale) || 20,
          weight: num(row.weight),
        })),
      )
      toast({ title: "تم", description: response.message })
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
  const levelName = enrollment?.education_level?.name_ar ?? ""

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? onOpenChange(true) : close())}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>نقط السنة{student ? ` — ${student}` : ""}</DialogTitle>
          <DialogDescription>
            {levelName
              ? `مكوّنات ${levelName} ومعاملاتها كما هي في نظام الاحتساب. المعدل السنوي يُحتسب منها.`
              : "معاملات المكوّنات مأخوذة من نظام احتساب المستوى، والمعدل السنوي يُحتسب منها."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {rows.map((row, index) => {
            const rowScale = num(row.scale) || 20
            const mark = num(row.mark)
            const given = row.mark.trim() !== ""
            const overCeiling = given && mark > rowScale
            const percentage = given && rowScale > 0 ? (mark / rowScale) * 100 : null

            return (
              <div key={index} className="flex items-end gap-2">
                <div className="flex-1 space-y-1">
                  {index === 0 && <Label className="text-xs text-muted-foreground">المكوّن</Label>}
                  <Input
                    value={row.label}
                    onChange={(event) => edit(index, "label", event.target.value)}
                    placeholder="مثال: الامتحان الجهوي"
                    // A scheme row is named by the level. Renaming it here
                    // would quietly detach the mark from the component it
                    // belongs to and drop it out of the average.
                    readOnly={row.fromScheme}
                    className={row.fromScheme ? "bg-muted/50" : undefined}
                  />
                </div>

                <div className="w-20 space-y-1">
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

                <div className="w-24 space-y-1">
                  {index === 0 && <Label className="text-xs text-muted-foreground">المعامل %</Label>}
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    dir="ltr"
                    className="text-left"
                    value={row.weight}
                    onChange={(event) => edit(index, "weight", event.target.value)}
                  />
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
                  aria-label={`حذف ${row.label || "هذه النقطة"}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )
          })}

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setRows((current) => [...current, blankRow()])}>
              <Plus className="h-4 w-4 ml-2" />
              إضافة نقطة
            </Button>
            {components.length > 0 && (
              <Button variant="ghost" size="sm" onClick={applySchemeWeights}>
                <RotateCcw className="h-4 w-4 ml-2" />
                تطبيق معاملات المستوى
              </Button>
            )}
          </div>
        </div>

        {/* The answer the whole dialog exists to produce. */}
        <div className="rounded-lg border bg-muted/40 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm text-muted-foreground">
              المعدل السنوي
              {year.counted > 0 && ` — من ${year.counted} نقطة بمجموع معاملات ${year.weightTotal}%`}
            </span>
            <span className="text-lg font-bold">
              {year.mark === null
                ? "—"
                : `${year.mark.toFixed(2)} من ${year.scale}`}
            </span>
          </div>
          {year.weightTotal > 100.001 && (
            <p className="mt-1 text-xs text-red-600">
              مجموع المعاملات يتجاوز 100% — راجع نظام احتساب المستوى.
            </p>
          )}
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
