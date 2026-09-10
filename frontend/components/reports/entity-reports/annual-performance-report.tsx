"use client"

import { useState, useEffect } from "react"
import { ReportDialog, ExportFormat, StatisticItem } from "../report-dialog"
import { ReportFilters, FilterOption, useReportFilters } from "../report-filters"
import { useToast } from "@/hooks/use-toast"
import api from "@/lib/api"
import { exportDataToCSV, formatDateForExport, formatCurrency, printHeader, PRINT_HEADER_STYLES } from "@/lib/export-utils"

interface AnnualPerformanceReportProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AnnualPerformanceReport({ open, onOpenChange }: AnnualPerformanceReportProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [statistics, setStatistics] = useState<StatisticItem[]>([])
  const [performanceData, setPerformanceData] = useState<any>(null)

  const { filters, appliedFilters, handleApply, handleClear, handleFiltersChange } = useReportFilters()

  // Define filter configuration
  const filterConfig: FilterOption[] = [
    {
      type: 'select',
      field: 'fiscal_year',
      label: 'السنة المالية',
      placeholder: 'اختر السنة',
      options: [
        { label: '2026', value: '2026' },
        { label: '2025', value: '2025' },
        { label: '2024', value: '2024' }
      ]
    },
    {
      type: 'select',
      field: 'quarter',
      label: 'الربع (اختياري)',
      placeholder: 'جميع الأرباع',
      options: [
        { label: 'الربع الأول', value: 'Q1' },
        { label: 'الربع الثاني', value: 'Q2' },
        { label: 'الربع الثالث', value: 'Q3' },
        { label: 'الربع الرابع', value: 'Q4' }
      ]
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
      // Fetch all necessary data
      const [incomesRes, expensesRes, widowsRes, orphansRes, donorsRes] = await Promise.all([
        api.getIncomes({ per_page: 1000, ...filters }),
        api.getExpenses({ per_page: 1000, ...filters }),
        api.getWidows({ per_page: 1000 }),
        api.getOrphans({ per_page: 1000 }),
        api.getDonors({ per_page: 1000 })
      ])

      const incomes = incomesRes.data || []
      const expenses = expensesRes.data || []
      const widows = widowsRes.data || []
      const orphans = orphansRes.data || []
      const donors = donorsRes.data || []

      // Flatten orphans
      const allOrphans = orphans.flatMap((group: any) => group.orphans || [])

      // Calculate comprehensive statistics
      calculateStatistics({
        incomes,
        expenses,
        widows,
        orphans: allOrphans,
        donors
      })

      setPerformanceData({
        incomes,
        expenses,
        widows,
        orphans: allOrphans,
        donors
      })
    } catch (error) {
      console.error('Error fetching performance data:', error)
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء جلب بيانات الأداء",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const calculateStatistics = (data: any) => {
    const { incomes, expenses, widows, orphans, donors } = data

    // Financial Performance
    const totalIncome = incomes.reduce((sum: number, inc: any) => sum + parseFloat(inc.amount || 0), 0)
    const totalExpenses = expenses.reduce((sum: number, exp: any) => sum + parseFloat(exp.amount || 0), 0)
    const balance = totalIncome - totalExpenses
    const growthRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0

    // Beneficiaries
    const totalWidows = widows.length
    const totalOrphans = orphans.length
    const totalBeneficiaries = totalWidows + totalOrphans

    // Donor Engagement
    const totalDonors = donors.length
    const activeDonors = donors.filter((d: any) => d.total_given && d.total_given > 0).length
    const avgDonation = activeDonors > 0 ? totalIncome / activeDonors : 0

    setStatistics([
      { label: 'إجمالي الإيرادات', value: totalIncome, format: 'currency' },
      { label: 'إجمالي المصروفات', value: totalExpenses, format: 'currency' },
      { label: 'صافي الرصيد', value: balance, format: 'currency', color: balance >= 0 ? 'bg-green-50' : 'bg-red-50' },
      { label: 'المستفيدون', value: totalBeneficiaries, format: 'number' },
      { label: 'المتبرعون النشطون', value: activeDonors, format: 'number' },
      { label: 'متوسط التبرع', value: avgDonation, format: 'currency' }
    ])
  }

  const handleGenerate = async (format: ExportFormat) => {
    if (!performanceData) {
      toast({
        title: "خطأ",
        description: "لا توجد بيانات للتصدير",
        variant: "destructive"
      })
      return
    }

    if (format === 'pdf') {
      await exportToPDF()
      return
    }
    await exportToExcel()
  }

  const exportToExcel = async () => {
    try {
      await api.downloadExcel('/reports/annual.xlsx', filters)
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
      await api.downloadPdf('/reports/annual.pdf', filters)
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
      title="تقرير الأداء السنوي"
      description="تحليل شامل للأداء المالي والاجتماعي للجمعية"
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
