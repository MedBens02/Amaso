"use client"

import { useState, useEffect } from "react"
import { ReportDialog, ExportFormat, StatisticItem } from "../report-dialog"
import { ReportFilters, FilterOption, useReportFilters } from "../report-filters"
import { useToast } from "@/hooks/use-toast"
import api from "@/lib/api"
import { exportDataToCSV, formatDateForExport, formatCurrency, printHeader, PRINT_HEADER_STYLES } from "@/lib/export-utils"

interface Donor {
  id: number
  first_name: string
  last_name: string
  phone: string
  email: string
  address?: string
  is_kafil: boolean
  created_at: string
  kafil?: {
    id: number
    monthly_pledge: number
    sponsorship_utilization: number
    sponsorships: any[]
  }
  incomes?: any[]
  total_given?: number
}

interface DonorsReportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DonorsReportDialog({ open, onOpenChange }: DonorsReportDialogProps) {
  const { toast } = useToast()
  const [donors, setDonors] = useState<Donor[]>([])
  const [loading, setLoading] = useState(false)
  const [statistics, setStatistics] = useState<StatisticItem[]>([])

  const { filters, appliedFilters, handleApply, handleClear, handleFiltersChange } = useReportFilters()

  // Define filter configuration
  const filterConfig: FilterOption[] = [
    {
      type: 'dateRange',
      field: 'registration_date',
      label: 'تاريخ التسجيل',
      placeholder: { from: 'من تاريخ', to: 'إلى تاريخ' }
    },
    {
      type: 'toggle',
      field: 'is_kafil',
      label: 'فقط الكفلاء'
    },
    {
      type: 'numberRange',
      field: 'monthly_pledge',
      label: 'التعهد الشهري (د.م)',
      placeholder: { from: 'من', to: 'إلى' }
    },
    {
      type: 'numberRange',
      field: 'utilization',
      label: 'نسبة الاستخدام (%)',
      placeholder: { from: 'من', to: 'إلى' }
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
      // Fetch donors
      const donorsResponse = await api.getDonors({
        per_page: 1000,
        ...appliedFilters
      })
      const donorsData = donorsResponse.data || []
      setDonors(donorsData)

      // Calculate statistics
      calculateStatistics(donorsData)
    } catch (error) {
      console.error('Error fetching donors data:', error)
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء جلب بيانات المتبرعين",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const calculateStatistics = (donorsData: Donor[]) => {
    const totalDonors = donorsData.length
    const kafils = donorsData.filter(d => d.is_kafil)
    const totalKafils = kafils.length

    // Total donations
    const totalDonations = donorsData.reduce((sum, donor) => {
      return sum + (donor.total_given || 0)
    }, 0)

    // Average donation per donor
    const avgDonation = totalDonors > 0 ? totalDonations / totalDonors : 0

    // Total monthly pledges
    const totalPledges = kafils.reduce((sum, donor) => {
      return sum + (donor.kafil?.monthly_pledge || 0)
    }, 0)

    // Average utilization
    const avgUtilization = totalKafils > 0
      ? kafils.reduce((sum, donor) => sum + (donor.kafil?.sponsorship_utilization || 0), 0) / totalKafils
      : 0

    // Kafils at 100% utilization
    const kafilsAt100 = kafils.filter(d => (d.kafil?.sponsorship_utilization || 0) >= 100).length

    // Kafils under 50% utilization
    const kafilsUnder50 = kafils.filter(d => (d.kafil?.sponsorship_utilization || 0) < 50).length

    setStatistics([
      { label: 'إجمالي المتبرعين', value: totalDonors, format: 'number' },
      { label: 'إجمالي الكفلاء', value: totalKafils, format: 'number' },
      { label: 'التبرعات', value: totalDonations, format: 'currency' },
      { label: 'متوسط التبرع', value: avgDonation, format: 'currency' },
      { label: 'التعهدات الشهرية', value: totalPledges, format: 'currency' },
      { label: 'متوسط الاستخدام', value: avgUtilization, format: 'percentage' }
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
      await api.downloadExcel('/reports/donors.xlsx', appliedFilters)
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
      await api.downloadPdf('/reports/donors.pdf', appliedFilters)
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
      title="تقرير الكفلاء والمتبرعين"
      description="إحصائيات المتبرعين والكفلاء ومساهماتهم"
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
