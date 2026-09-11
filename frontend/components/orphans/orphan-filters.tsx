"use client"

import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import api from "@/lib/api"

interface OrphanFiltersProps {
  onFiltersChange: (filters: any) => void
  initialFilters?: any
}

/** Shortcuts, not the whole vocabulary - the boxes below still take any age. */
const AGE_PRESETS = [
  { label: "ما قبل التمدرس", min: "0", max: "5" },
  { label: "ابتدائي", min: "6", max: "11" },
  { label: "إعدادي وثانوي", min: "12", max: "17" },
  { label: "18 فما فوق", min: "18", max: "" },
]

/**
 * The age filter used to be three fixed choices - all, 6-12, 13-18 - which
 * could not answer "who turns 18 this year" or "the under-fives", the two
 * questions the association actually asks. It is a pair of open boxes now,
 * with the common spans kept as one-click shortcuts rather than as the only
 * options. The backend has always accepted min_age/max_age.
 */
export function OrphanFilters({ onFiltersChange, initialFilters = {} }: OrphanFiltersProps) {
  const [filters, setFilters] = useState({
    gender: initialFilters.gender || "all",
    education_level: initialFilters.education_level || "all",
    min_age: initialFilters.min_age?.toString() || "",
    max_age: initialFilters.max_age?.toString() || "",
  })
  const [educationLevels, setEducationLevels] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Typing an age should not fire a request per keystroke.
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => () => { if (debounce.current) clearTimeout(debounce.current) }, [])

  useEffect(() => {
    api
      .getOrphansEducationLevels()
      .then((response) => setEducationLevels(response.data || []))
      .catch((error) => console.error("Failed to fetch education levels:", error))
      .finally(() => setLoading(false))
  }, [])

  /** Drops the empty and "all" entries, and sends ages as numbers. */
  const publish = (next: typeof filters) => {
    const payload: Record<string, any> = {}

    if (next.gender && next.gender !== "all") payload.gender = next.gender
    if (next.education_level && next.education_level !== "all") payload.education_level = next.education_level

    const min = Number.parseInt(next.min_age, 10)
    const max = Number.parseInt(next.max_age, 10)
    if (Number.isFinite(min)) payload.min_age = min
    if (Number.isFinite(max)) payload.max_age = max

    onFiltersChange(payload)
  }

  const setSelect = (key: "gender" | "education_level", value: string) => {
    const next = { ...filters, [key]: value }
    setFilters(next)
    publish(next)
  }

  const setAge = (key: "min_age" | "max_age", value: string) => {
    // Digits only: a stray minus or letter would silently drop the filter.
    const cleaned = value.replace(/[^\d]/g, "").slice(0, 3)
    const next = { ...filters, [key]: cleaned }
    setFilters(next)

    if (debounce.current) clearTimeout(debounce.current)
    debounce.current = setTimeout(() => publish(next), 400)
  }

  const applyPreset = (preset: (typeof AGE_PRESETS)[number]) => {
    const next = { ...filters, min_age: preset.min, max_age: preset.max }
    setFilters(next)
    if (debounce.current) clearTimeout(debounce.current)
    publish(next)
  }

  const clearAll = () => {
    const cleared = { gender: "all", education_level: "all", min_age: "", max_age: "" }
    setFilters(cleared)
    if (debounce.current) clearTimeout(debounce.current)
    onFiltersChange({})
  }

  const activePreset = AGE_PRESETS.find((p) => p.min === filters.min_age && p.max === filters.max_age)
  const hasAny =
    filters.gender !== "all" || filters.education_level !== "all" || filters.min_age !== "" || filters.max_age !== ""

  // A range typed the wrong way round returns nothing, with no clue why.
  const min = Number.parseInt(filters.min_age, 10)
  const max = Number.parseInt(filters.max_age, 10)
  const rangeInverted = Number.isFinite(min) && Number.isFinite(max) && min > max

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">فلاتر البحث</h3>
        <Button variant="outline" size="sm" onClick={clearAll} disabled={!hasAny}>
          مسح جميع الفلاتر
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-2">
          <Label>الجنس</Label>
          <Select value={filters.gender} onValueChange={(value) => setSelect("gender", value)}>
            <SelectTrigger>
              <SelectValue placeholder="اختر الجنس" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">الكل</SelectItem>
              <SelectItem value="male">ذكر</SelectItem>
              <SelectItem value="female">أنثى</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>المستوى التعليمي</Label>
          <Select
            value={filters.education_level}
            onValueChange={(value) => setSelect("education_level", value)}
            disabled={loading}
          >
            <SelectTrigger>
              <SelectValue placeholder={loading ? "جاري التحميل..." : "اختر المستوى التعليمي"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع المستويات</SelectItem>
              {educationLevels.map((level) => (
                <SelectItem key={level.id} value={level.name_ar}>
                  {level.name_ar}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>العمر (بالسنوات)</Label>
          <div className="flex items-center gap-2">
            <Input
              inputMode="numeric"
              value={filters.min_age}
              onChange={(e) => setAge("min_age", e.target.value)}
              placeholder="من"
              className="tabular-nums"
              aria-label="أصغر عمر"
            />
            <span className="text-muted-foreground">—</span>
            <Input
              inputMode="numeric"
              value={filters.max_age}
              onChange={(e) => setAge("max_age", e.target.value)}
              placeholder="إلى"
              className="tabular-nums"
              aria-label="أكبر عمر"
            />
          </div>
          {rangeInverted && (
            <p className="text-xs text-destructive">الحد الأدنى أكبر من الحد الأقصى — لن تظهر أي نتائج.</p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground">فئات سريعة:</span>
        {AGE_PRESETS.map((preset) => (
          <Button
            key={preset.label}
            type="button"
            size="sm"
            variant={activePreset?.label === preset.label ? "secondary" : "outline"}
            onClick={() => applyPreset(preset)}
          >
            {preset.label}
          </Button>
        ))}
        {(filters.min_age || filters.max_age) && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => applyPreset({ label: "", min: "", max: "" })}
          >
            كل الأعمار
          </Button>
        )}
      </div>
    </div>
  )
}
