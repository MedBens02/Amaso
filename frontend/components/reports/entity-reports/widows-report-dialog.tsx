"use client"

import { useState, useEffect } from "react"
import { ReportDialog, ExportFormat, StatisticItem } from "../report-dialog"
import { ReportFilters, FilterOption, useReportFilters } from "../report-filters"
import { useToast } from "@/hooks/use-toast"
import api from "@/lib/api"

interface WidowsReportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Loads the values that actually occur in the families' records.
 *
 * Both columns are free text. The old config offered a hardcoded list of
 * education levels that did not match what was stored, and an empty array of
 * neighbourhoods with a comment promising they would be filled in later -
 * so one filter matched nothing and the other had nothing to pick.
 */
async function loadReferenceOptions(key: "neighborhoods" | "education_levels") {
  const response = await api.getWidowsReferenceData()
  const values: string[] = (response.data as any)?.[key] ?? []
  return values.map((value) => ({ label: value, value }))
}

/**
 * Every filter here is one the server applies. The previous set could not
 * work: two of them used type names the filter component does not render
 * ("dateRange", "numberRange") so they never appeared at all; the marital
 * status options were lowercase English words the column has never held; and
 * of the rest only the education level was read by the API. Dropping the ones
 * that cannot earn their place leaves a shorter list that does what it says.
 */
const FILTER_CONFIG: FilterOption[] = [
  {
    type: "select",
    field: "neighborhood",
    label: "الحي",
    placeholder: "كل الأحياء",
    optionsLoader: () => loadReferenceOptions("neighborhoods"),
  },
  {
    type: "select",
    field: "education_level",
    label: "المستوى التعليمي",
    placeholder: "كل المستويات",
    optionsLoader: () => loadReferenceOptions("education_levels"),
  },
  {
    type: "select",
    field: "has_kafil",
    label: "الكفالة",
    placeholder: "الكل",
    options: [
      { label: "مكفولة", value: "1" },
      { label: "غير مكفولة", value: "0" },
    ],
  },
  {
    type: "number-range",
    field: "age",
    label: "عمر الأرملة",
    minField: "min_age",
    maxField: "max_age",
  },
  {
    type: "date-range",
    field: "admission_date",
    label: "تاريخ الانتساب",
    fromField: "admission_from",
    toField: "admission_to",
  },
]

export function WidowsReportDialog({ open, onOpenChange }: WidowsReportDialogProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [statistics, setStatistics] = useState<StatisticItem[]>([])

  const { filters, appliedFilters, handleApply, handleClear, handleFiltersChange } = useReportFilters()

  useEffect(() => {
    if (!open) return

    let cancelled = false
    setLoading(true)

    api
      .getWidowsReport(appliedFilters)
      .then((response) => {
        if (cancelled) return
        const totals = response.data?.totals ?? {}
        setStatistics([
          { label: "إجمالي الأرامل", value: totals.widows ?? 0, format: "number" },
          { label: "إجمالي الأيتام", value: totals.orphans ?? 0, format: "number" },
          { label: "العائلات", value: totals.families_with_orphans ?? 0, format: "number" },
          { label: "متوسط الأيتام", value: totals.average_orphans ?? 0, format: "number" },
          { label: "الأسر المكفولة", value: totals.sponsored_widows ?? 0, format: "number" },
          { label: "نسبة التغطية", value: totals.sponsorship_coverage ?? 0, format: "percentage" },
        ])
      })
      .catch((error: any) => {
        if (cancelled) return
        toast({
          title: "خطأ",
          description: error?.message || "حدث خطأ أثناء جلب البيانات",
          variant: "destructive",
        })
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [open, appliedFilters])

  const handleGenerate = async (format: ExportFormat) => {
    const isPdf = format === "pdf"
    try {
      // The same filters the figures above were counted with, so the file and
      // the screen cannot disagree.
      isPdf
        ? await api.downloadPdf("/reports/widows.pdf", appliedFilters)
        : await api.downloadExcel("/reports/widows.xlsx", appliedFilters)
      toast({ title: isPdf ? "تم تحميل التقرير" : "تم تحميل ملف Excel" })
    } catch (error: any) {
      toast({
        title: "تعذر إنشاء الملف",
        description: error?.message || "حدث خطأ أثناء التصدير",
        variant: "destructive",
      })
    }
  }

  return (
    <ReportDialog
      open={open}
      onOpenChange={onOpenChange}
      title="تقرير الأرامل والأيتام"
      description="إحصائيات شاملة عن الأرامل والأيتام المسجلين"
      statistics={statistics}
      onGenerate={handleGenerate}
      loading={loading}
    >
      <ReportFilters
        filterOptions={FILTER_CONFIG}
        values={filters}
        onValuesChange={handleFiltersChange}
        onApply={handleApply}
        onClear={handleClear}
      />
    </ReportDialog>
  )
}
