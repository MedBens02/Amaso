"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowUpDown, Edit2, ListOrdered, Plus, Scale, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { ReferenceItemDialog } from "@/components/references/reference-item-dialog"
import { EducationLevelReorder } from "@/components/references/education-level-reorder"
import type { EducationLevel } from "@/components/references/education-level-reorder"
import { GradeSchemeDialog } from "@/components/education/grade-scheme-dialog"
import { API_BASE_URL } from "@/lib/api"

/** A level as this screen needs it: the ladder rung plus how its year is marked. */
type LevelWithScheme = EducationLevel & {
  grade_components?: Array<{ id: number; label: string; weight: number | string }>
}

/**
 * The school levels, and the order they run in.
 *
 * These lived in the references screen with the illnesses and the housing
 * types, which is where a lookup table goes - but the order of them is not
 * a lookup, it is the ladder the promotion at the end of a year walks up,
 * and the person who knows it is the one marking the registrations. So it
 * sits in the education section, next to the registrations that use it.
 */
export function EducationLevelsTab() {
  const [levels, setLevels] = useState<LevelWithScheme[]>([])
  const [loading, setLoading] = useState(true)
  const [dialog, setDialog] = useState<{ open: boolean; item?: EducationLevel }>({ open: false })
  const [reorderOpen, setReorderOpen] = useState(false)
  const [schemeLevel, setSchemeLevel] = useState<LevelWithScheme | null>(null)
  const { toast } = useToast()

  const load = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_BASE_URL}/references/education-levels`)
      const body = response.ok ? await response.json() : { data: [] }
      setLevels(body.data || [])
    } catch (error) {
      toast({
        title: "خطأ",
        description: "تعذر تحميل المستويات التعليمية",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  /** "50% + 50%" - short enough to sit under the name and be read at a glance. */
  const schemeSummary = (level: LevelWithScheme) => {
    const components = level.grade_components ?? []

    if (components.length === 0) return "لا يوجد نظام احتساب"

    return components.map((c) => `${c.label} ${Number(c.weight)}%`).join(" + ")
  }

  const remove = async (level: EducationLevel) => {
    if (!window.confirm(`هل أنت متأكد من حذف "${level.name_ar}"؟`)) return

    try {
      const response = await fetch(`${API_BASE_URL}/references/education-levels/${level.id}`, {
        method: "DELETE",
        headers: { Accept: "application/json" },
      })
      const body = await response.json()
      if (!response.ok) throw new Error(body.message || `HTTP ${response.status}`)

      toast({ title: "تم الحذف", description: body.message })
      load()
    } catch (error) {
      toast({
        title: "تعذر الحذف",
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ListOrdered className="h-5 w-5" />
            المستويات التعليمية
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => setReorderOpen(true)}>
              <ArrowUpDown className="h-4 w-4 ml-2" />
              إعادة ترتيب
            </Button>
            <Button size="sm" onClick={() => setDialog({ open: true })}>
              <Plus className="h-4 w-4 ml-2" />
              إضافة مستوى
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          الترتيب هنا هو السلّم الذي يصعده الانتقال في نهاية السنة الدراسية، ونظام الاحتساب هو
          الذي يُستخرج منه المعدل السنوي لكل تلميذ في المستوى.
        </p>

        {loading ? (
          <div className="text-center py-4">جاري التحميل...</div>
        ) : levels.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">لا توجد مستويات مضافة بعد</div>
        ) : (
          <div className="space-y-2">
            {levels.map((level, index) => (
              <div key={level.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="w-6 text-center text-xs text-muted-foreground tabular-nums">{index + 1}</span>
                  <div>
                    <span className="font-medium">{level.name_ar}</span>
                    {level.name_en && (
                      <span className="text-xs text-muted-foreground block">{level.name_en}</span>
                    )}
                    {/* How a year at this level is marked, so the exception
                        stands out from the levels that use the ordinary two
                        semesters. */}
                    <span className="text-xs text-muted-foreground block">{schemeSummary(level)}</span>
                  </div>
                  {level.is_active === false && <Badge variant="secondary">غير نشط</Badge>}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSchemeLevel(level)}
                    aria-label={`نظام احتساب ${level.name_ar}`}
                    title="نظام احتساب المعدل السنوي"
                  >
                    <Scale className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDialog({ open: true, item: level })}
                    aria-label={`تعديل ${level.name_ar}`}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                    onClick={() => remove(level)}
                    aria-label={`حذف ${level.name_ar}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <ReferenceItemDialog
        open={dialog.open}
        onOpenChange={(open) => setDialog((current) => ({ ...current, open }))}
        type="education-level"
        item={dialog.item}
        onSuccess={load}
      />

      <EducationLevelReorder
        open={reorderOpen}
        onOpenChange={setReorderOpen}
        educationLevels={levels}
        onReorderSuccess={load}
      />

      <GradeSchemeDialog
        open={schemeLevel !== null}
        onOpenChange={(open) => !open && setSchemeLevel(null)}
        level={schemeLevel}
        onSaved={load}
      />
    </Card>
  )
}
