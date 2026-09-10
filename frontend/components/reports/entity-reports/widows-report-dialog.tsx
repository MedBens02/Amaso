"use client"

import { useState, useEffect } from "react"
import { ReportDialog, ExportFormat, StatisticItem, useReportDialog } from "../report-dialog"
import { ReportFilters, FilterOption, useReportFilters } from "../report-filters"
import { useToast } from "@/hooks/use-toast"
import api from "@/lib/api"
import { exportDataToCSV, formatDateForExport, formatCurrency, maritalStatusArabic, printHeader, PRINT_HEADER_STYLES } from "@/lib/export-utils"

interface Widow {
  id: number
  full_name: string
  phone: string
  address?: string
  neighborhood?: string
  age: number
  marital_status: string
  education_level?: string
  disability_flag: boolean
  disability_type?: string
  orphans_count?: number
  sponsorships_count?: number
  total_sponsorship_amount?: number
  created_at: string
  admission_date: string
}

interface Orphan {
  id: number
  full_name: string
  age: number
  gender: string
  birth_date: string
  education_level?: string
  health_status?: string
  widow_id: number
  widow?: {
    full_name: string
    phone: string
  }
}

interface WidowsReportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function WidowsReportDialog({ open, onOpenChange }: WidowsReportDialogProps) {
  const { toast } = useToast()
  const [widows, setWidows] = useState<Widow[]>([])
  const [orphans, setOrphans] = useState<Orphan[]>([])
  const [loading, setLoading] = useState(false)
  const [statistics, setStatistics] = useState<StatisticItem[]>([])

  const { filters, appliedFilters, handleApply, handleClear, handleFiltersChange } = useReportFilters()

  // Define filter configuration
  const filterConfig: FilterOption[] = [
    {
      type: 'dateRange',
      field: 'admission_date',
      label: 'تاريخ القبول',
      placeholder: { from: 'من تاريخ', to: 'إلى تاريخ' }
    },
    {
      type: 'select',
      field: 'neighborhood',
      label: 'الحي',
      placeholder: 'اختر الحي',
      options: [] // Will be populated dynamically
    },
    {
      type: 'select',
      field: 'marital_status',
      label: 'الحالة الاجتماعية',
      placeholder: 'اختر الحالة',
      options: [
        { label: 'أرملة', value: 'widow' },
        { label: 'مطلقة', value: 'divorced' },
        { label: 'متزوجة', value: 'married' },
        { label: 'عزباء', value: 'single' }
      ]
    },
    {
      type: 'toggle',
      field: 'disability_flag',
      label: 'فقط ذوات الإعاقة'
    },
    {
      type: 'select',
      field: 'education_level',
      label: 'المستوى التعليمي',
      placeholder: 'اختر المستوى',
      options: [
        { label: 'أمي', value: 'أمي' },
        { label: 'ابتدائي', value: 'ابتدائي' },
        { label: 'إعدادي', value: 'إعدادي' },
        { label: 'ثانوي', value: 'ثانوي' },
        { label: 'جامعي', value: 'جامعي' }
      ]
    },
    {
      type: 'numberRange',
      field: 'age',
      label: 'العمر',
      placeholder: { from: 'من', to: 'إلى' }
    },
    {
      type: 'toggle',
      field: 'has_sponsorship',
      label: 'فقط المكفولات'
    }
  ]

  // Fetch data when dialog opens or applied filters change
  useEffect(() => {
    if (open) {
      fetchData()
    }
  }, [open, appliedFilters])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Fetch widows
      const widowsResponse = await api.getWidows({
        per_page: 1000,
        ...appliedFilters
      })
      const widowsData = widowsResponse.data || []
      setWidows(widowsData)

      // Fetch orphans
      const orphansResponse = await api.getOrphans({
        per_page: 1000
      })

      // Flatten orphan groups
      const allOrphans = orphansResponse.data?.flatMap((group: any) =>
        group.orphans?.map((orphan: any) => ({
          ...orphan,
          widow: {
            full_name: group.widow.full_name,
            phone: group.widow.phone
          }
        })) || []
      ) || []

      setOrphans(allOrphans)

      // Calculate statistics
      calculateStatistics(widowsData, allOrphans)
    } catch (error) {
      console.error('Error fetching data:', error)
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء جلب البيانات",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const calculateStatistics = (widowsData: Widow[], orphansData: Orphan[]) => {
    const totalWidows = widowsData.length
    const totalOrphans = orphansData.length

    // Calculate unique families (widows with orphans)
    const widowIds = new Set(orphansData.map(o => o.widow_id))
    const totalFamilies = widowIds.size

    // Average orphans per family
    const avgOrphansPerFamily = totalFamilies > 0 ? totalOrphans / totalFamilies : 0

    // Sponsorship coverage
    const sponsoredWidows = widowsData.filter(w => (w.sponsorships_count || 0) > 0).length
    const sponsorshipCoverage = totalWidows > 0 ? (sponsoredWidows / totalWidows) * 100 : 0

    // Disability percentage
    const widowsWithDisability = widowsData.filter(w => w.disability_flag).length
    const disabilityPercentage = totalWidows > 0 ? (widowsWithDisability / totalWidows) * 100 : 0

    setStatistics([
      { label: 'إجمالي الأرامل', value: totalWidows, format: 'number' },
      { label: 'إجمالي الأيتام', value: totalOrphans, format: 'number' },
      { label: 'العائلات', value: totalFamilies, format: 'number' },
      { label: 'متوسط الأيتام', value: avgOrphansPerFamily, format: 'number' },
      { label: 'نسبة التغطية', value: sponsorshipCoverage, format: 'percentage' },
      { label: 'نسبة الإعاقة', value: disabilityPercentage, format: 'percentage' }
    ])
  }

  const handleGenerate = async (format: ExportFormat) => {
    if (format === 'pdf') {
      await exportToPDF()
      return
    }
    await exportToExcel()
  }

  const exportToExcel = async () => {
    try {
      await api.downloadExcel('/reports/widows.xlsx', appliedFilters)
      toast({ title: "تم تحميل ملف Excel" })
    } catch (error: any) {
      toast({
        title: "تعذر إنشاء الملف",
        description: error?.message || "حدث خطأ أثناء التصدير",
        variant: "destructive",
      })
    }
  }


  const exportToPDF = async () => {
    // Rendered server-side as real text, so the PDF can be selected, searched
    // and edited - and the numbers come from the same aggregate the dialog shows.
    try {
      await api.downloadPdf('/reports/widows.pdf', appliedFilters)
      toast({ title: "تم تحميل التقرير" })
    } catch (error: any) {
      toast({
        title: "خطأ في إنشاء الـ PDF",
        description: error?.message || "حدث خطأ أثناء إنشاء الملف",
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
        filterOptions={filterConfig}
        values={filters}
        onValuesChange={handleFiltersChange}
        onApply={handleApply}
        onClear={handleClear}
      />
    </ReportDialog>
  )
}
