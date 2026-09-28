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
import { Loader2, Plus, Scale, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import api from "@/lib/api"

interface Component {
  label: string
  weight: string
}

interface GradeSchemeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** The level whose scheme this is, with its `grade_components`. */
  level: any | null
  onSaved: () => void
}

/** What most of the school does, and what a level starts on. */
const DEFAULT_SCHEME: Component[] = [
  { label: "الأسدس الأول", weight: "50" },
  { label: "الأسدس الثاني", weight: "50" },
]

const num = (value: string) => {
  const parsed = Number(value)

  return Number.isFinite(parsed) ? parsed : 0
}

const round2 = (value: number) => Math.round(value * 100) / 100

/**
 * How a year's mark is worked out at one level.
 *
 * Set here, once, by somebody who knows the ministry's rules - and never by
 * the person marking a class, who only ever types marks into boxes this
 * screen has already named and weighted.
 *
 * Flat percentages that add to 100, not a tree. "The exam is 75% and the two
 * semesters share the other 25%" is 75 / 12.5 / 12.5: the same arithmetic,
 * and a list anybody can check by adding it up. The button below does that
 * division so nobody has to.
 */
export function GradeSchemeDialog({ open, onOpenChange, level, onSaved }: GradeSchemeDialogProps) {
  const [components, setComponents] = useState<Component[]>([])
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (!open) return

    const existing: Component[] = (level?.grade_components ?? []).map((component: any) => ({
      label: component.label ?? "",
      weight: String(Number(component.weight) || 0),
    }))

    setComponents(existing.length > 0 ? existing : DEFAULT_SCHEME.map((c) => ({ ...c })))
  }, [open, level])

  const edit = (index: number, field: keyof Component, value: string) =>
    setComponents((current) => current.map((row, i) => (i === index ? { ...row, [field]: value } : row)))

  const remove = (index: number) => setComponents((current) => current.filter((_, i) => i !== index))

  const total = useMemo(
    () => round2(components.reduce((sum, component) => sum + num(component.weight), 0)),
    [components],
  )

  /**
   * Hand whatever is left over to the components that have no weight yet, or
   * to all of them when every one is already set.
   *
   * This is the friendly half of the design: type 75 against the exam, press
   * the button, and the two semesters come out at 12.5 each without anybody
   * doing that division in their head.
   */
  const spreadRemainder = () => {
    const blanks = components.filter((component) => num(component.weight) === 0)
    const targets = blanks.length > 0 ? blanks : components
    const fixed = blanks.length > 0
      ? components.reduce((sum, component) => sum + num(component.weight), 0)
      : 0
    const remaining = round2(100 - fixed)

    if (targets.length === 0 || remaining < 0) return

    // Split to the centime of a percent and give the odd hundredths to the
    // first few, so the total lands on exactly 100 rather than 99.99.
    const hundredths = Math.round(remaining * 100)
    const base = Math.floor(hundredths / targets.length)
    const leftover = hundredths - base * targets.length
    let position = 0

    setComponents((current) =>
      current.map((component) => {
        if (blanks.length > 0 && num(component.weight) !== 0) return component

        const share = (base + (position < leftover ? 1 : 0)) / 100
        position++

        return { ...component, weight: String(share) }
      }),
    )
  }

  const save = async () => {
    const filled = components.filter((component) => component.label.trim() !== "")

    if (filled.length === 0) {
      toast({
        title: "نظام فارغ",
        description: "نظام الاحتساب يحتاج مكوّناً واحداً على الأقل.",
        variant: "destructive",
      })

      return
    }

    const labels = filled.map((component) => component.label.trim())
    if (new Set(labels).size !== labels.length) {
      toast({
        title: "اسم مكرر",
        description: "لا يمكن تكرار اسم المكوّن في المستوى نفسه.",
        variant: "destructive",
      })

      return
    }

    setSaving(true)
    try {
      const response: any = await api.saveLevelGradeComponents(
        level.id,
        filled.map((component) => ({ label: component.label.trim(), weight: num(component.weight) })),
      )
      toast({ title: "تم", description: response.message })
      onSaved()
      onOpenChange(false)
    } catch (error) {
      toast({
        title: "تعذر حفظ نظام الاحتساب",
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const balanced = Math.abs(total - 100) < 0.001

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5" />
            نظام الاحتساب{level ? ` — ${level.name_ar}` : ""}
          </DialogTitle>
          <DialogDescription>
            مكوّنات المعدل السنوي ومعامل كل واحد منها. تُطبَّق على كل تلميذ في هذا المستوى، فلا
            يحتاج من يسجّل النقط إلى إدخال أي معامل.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {components.map((component, index) => (
            <div key={index} className="flex items-end gap-2">
              <div className="flex-1 space-y-1">
                {index === 0 && <Label className="text-xs text-muted-foreground">اسم المكوّن</Label>}
                <Input
                  value={component.label}
                  onChange={(event) => edit(index, "label", event.target.value)}
                  placeholder="مثال: الامتحان الوطني"
                />
              </div>

              <div className="w-28 space-y-1">
                {index === 0 && <Label className="text-xs text-muted-foreground">المعامل %</Label>}
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  dir="ltr"
                  className="text-left"
                  value={component.weight}
                  onChange={(event) => edit(index, "weight", event.target.value)}
                />
              </div>

              <Button
                variant="ghost"
                size="sm"
                className="mb-0.5 text-red-600 hover:text-red-700"
                onClick={() => remove(index)}
                aria-label={`حذف ${component.label || "هذا المكوّن"}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setComponents((current) => [...current, { label: "", weight: "0" }])}
            >
              <Plus className="h-4 w-4 ml-2" />
              إضافة مكوّن
            </Button>
            <Button variant="ghost" size="sm" onClick={spreadRemainder} disabled={balanced}>
              وزّع الباقي بالتساوي
            </Button>
          </div>
        </div>

        <div
          className={`rounded-lg border p-3 text-sm ${
            balanced
              ? "border-green-200 bg-green-50 text-green-800 dark:border-green-900 dark:bg-green-950/30 dark:text-green-300"
              : "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span>مجموع المعاملات</span>
            <span className="font-bold">{total}%</span>
          </div>
          {!balanced && (
            <p className="mt-1 text-xs">
              يجب أن يساوي المجموع 100% قبل الحفظ
              {total < 100 ? ` — ينقص ${round2(100 - total)}%` : ` — يزيد ${round2(total - 100)}%`}
            </p>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            إلغاء
          </Button>
          <Button onClick={save} disabled={saving || !balanced}>
            {saving && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
            حفظ النظام
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
