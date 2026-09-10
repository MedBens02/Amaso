"use client"

import { useState, useEffect } from "react"
import { ReportDialog, ExportFormat, StatisticItem } from "../report-dialog"
import { ReportFilters, FilterOption, useReportFilters } from "../report-filters"
import { useToast } from "@/hooks/use-toast"
import api from "@/lib/api"
import { exportDataToCSV, formatDateForExport, formatCurrency, paymentMethodArabic, statusArabic, printHeader, PRINT_HEADER_STYLES } from "@/lib/export-utils"

interface Income {
  id: number
  income_date: string
  amount: string | number
  payment_method: string
  status: string
  fiscal_year: { year: string }
  budget: { label: string }
  income_category: { label: string }
  donor?: { first_name: string; last_name: string }
  kafil?: { first_name: string; last_name: string }
}

interface Expense {
  id: number
  expense_date: string
  amount: number
  payment_method: string
  status: string
  budget: { label: string }
  expense_category: { label: string }
  partner?: { name: string }
  beneficiaries?: any[]
}

interface FinancialReportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function FinancialReportDialog({ open, onOpenChange }: FinancialReportDialogProps) {
  const { toast } = useToast()
  const [incomes, setIncomes] = useState<Income[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(false)
  const [statistics, setStatistics] = useState<StatisticItem[]>([])

  const { filters, appliedFilters, handleApply, handleClear, handleFiltersChange } = useReportFilters()

  // Define filter configuration
  const filterConfig: FilterOption[] = [
    {
      type: 'dateRange',
      field: 'date_range',
      label: 'الفترة الزمنية',
      placeholder: { from: 'من تاريخ', to: 'إلى تاريخ' }
    },
    {
      type: 'select',
      field: 'fiscal_year',
      label: 'السنة المالية',
      placeholder: 'اختر السنة',
      options: [] // Will be populated dynamically
    },
    {
      type: 'select',
      field: 'payment_method',
      label: 'طريقة الدفع',
      placeholder: 'اختر الطريقة',
      options: [
        { label: 'نقدي', value: 'cash' },
        { label: 'شيك', value: 'cheque' },
        { label: 'تحويل بنكي', value: 'bank_transfer' }
      ]
    },
    {
      type: 'select',
      field: 'status',
      label: 'الحالة',
      placeholder: 'اختر الحالة',
      options: [
        { label: 'معتمد', value: 'Approved' },
        { label: 'مسودة', value: 'Draft' },
        { label: 'مرفوض', value: 'Rejected' }
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
      // Fetch incomes
      const incomesResponse = await api.getIncomes({
        per_page: 1000,
        ...appliedFilters
      })
      const incomesData = incomesResponse.data || []
      setIncomes(incomesData)

      // Fetch expenses
      const expensesResponse = await api.getExpenses({
        per_page: 1000,
        ...appliedFilters
      })
      const expensesData = expensesResponse.data || []
      setExpenses(expensesData)

      // Calculate statistics
      calculateStatistics(incomesData, expensesData)
    } catch (error) {
      console.error('Error fetching financial data:', error)
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء جلب البيانات المالية",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const calculateStatistics = (incomesData: Income[], expensesData: Expense[]) => {
    // Total income
    const totalIncome = incomesData.reduce((sum, inc) => sum + parseFloat(String(inc.amount)), 0)
    const approvedIncome = incomesData
      .filter(inc => inc.status === 'Approved')
      .reduce((sum, inc) => sum + parseFloat(String(inc.amount)), 0)

    // Total expenses
    const totalExpenses = expensesData.reduce((sum, exp) => sum + parseFloat(String(exp.amount)), 0)
    const approvedExpenses = expensesData
      .filter(exp => exp.status === 'Approved')
      .reduce((sum, exp) => sum + parseFloat(String(exp.amount)), 0)

    // Balance
    const balance = approvedIncome - approvedExpenses

    // Donations vs Kafala
    const donorIncome = incomesData
      .filter(inc => inc.donor)
      .reduce((sum, inc) => sum + parseFloat(String(inc.amount)), 0)
    const kafilIncome = incomesData
      .filter(inc => inc.kafil)
      .reduce((sum, inc) => sum + parseFloat(String(inc.amount)), 0)

    const donorPercentage = totalIncome > 0 ? (donorIncome / totalIncome) * 100 : 0
    const kafilPercentage = totalIncome > 0 ? (kafilIncome / totalIncome) * 100 : 0

    // Payment method breakdown
    const cashIncome = incomesData
      .filter(inc => inc.payment_method === 'cash')
      .reduce((sum, inc) => sum + parseFloat(String(inc.amount)), 0)
    const cashPercentage = totalIncome > 0 ? (cashIncome / totalIncome) * 100 : 0

    setStatistics([
      { label: 'إجمالي الإيرادات', value: totalIncome, format: 'currency' },
      { label: 'إجمالي المصروفات', value: totalExpenses, format: 'currency' },
      { label: 'الرصيد', value: balance, format: 'currency', color: balance >= 0 ? 'bg-green-50 dark:bg-green-950/40' : 'bg-red-50 dark:bg-red-950/40' },
      { label: 'من متبرعين', value: donorPercentage, format: 'percentage' },
      { label: 'من كفلاء', value: kafilPercentage, format: 'percentage' },
      { label: 'نقدي', value: cashPercentage, format: 'percentage' }
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
      await api.downloadExcel('/reports/financial.xlsx', appliedFilters)
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
      await api.downloadPdf('/reports/financial.pdf', appliedFilters)
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
      title="التقرير المالي الشامل"
      description="ملخص الإيرادات والمصروفات مع التحليلات المالية"
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
