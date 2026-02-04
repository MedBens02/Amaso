"use client"

import { useState, useEffect } from "react"
import { ReportDialog, ExportFormat, StatisticItem } from "../report-dialog"
import { ReportFilters, FilterOption, useReportFilters } from "../report-filters"
import { useToast } from "@/hooks/use-toast"
import api from "@/lib/api"
import {
  exportDataToCSV,
  formatDateForExport,
  formatCurrency,
  paymentMethodArabic,
  statusArabic
} from "@/lib/export-utils"

interface Income {
  id: number
  income_date: string
  amount: string | number
  payment_method: string
  status: string
  fiscal_year: { year: string }
  sub_budget: { label: string }
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
  sub_budget: { label: string }
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
      { label: 'الرصيد', value: balance, format: 'currency', color: balance >= 0 ? 'bg-green-50' : 'bg-red-50' },
      { label: 'من متبرعين', value: donorPercentage, format: 'percentage' },
      { label: 'من كفلاء', value: kafilPercentage, format: 'percentage' },
      { label: 'نقدي', value: cashPercentage, format: 'percentage' }
    ])
  }

  const handleGenerate = async (format: ExportFormat) => {
    switch (format) {
      case 'csv':
        await exportToCSV()
        break
      case 'pdf':
        await exportToPDF()
        break
      case 'print':
        await printReport()
        break
    }
  }

  const exportToCSV = async () => {
    // Export incomes CSV
    const incomesColumnMapping: Record<string, string> = {
      'id': 'رقم الإيراد',
      'income_date': 'التاريخ',
      'amount': 'المبلغ (د.م)',
      'payment_method': 'طريقة الدفع',
      'status': 'الحالة',
      'fiscal_year': 'السنة المالية',
      'sub_budget': 'الميزانية الفرعية',
      'income_category': 'فئة الإيراد',
      'source': 'المصدر'
    }

    const incomesData = incomes.map(income => ({
      id: income.id,
      income_date: formatDateForExport(income.income_date),
      amount: parseFloat(String(income.amount)).toFixed(2),
      payment_method: paymentMethodArabic[income.payment_method] || income.payment_method,
      status: statusArabic[income.status] || income.status,
      fiscal_year: income.fiscal_year.year,
      sub_budget: income.sub_budget.label,
      income_category: income.income_category.label,
      source: income.donor
        ? `متبرع: ${income.donor.first_name} ${income.donor.last_name}`
        : income.kafil
        ? `كافل: ${income.kafil.first_name} ${income.kafil.last_name}`
        : '-'
    }))

    exportDataToCSV(incomesData, 'financial_report_incomes', incomesColumnMapping, {
      entityType: 'incomes',
      filters,
      totalCount: incomes.length
    })

    // Export expenses CSV
    const expensesColumnMapping: Record<string, string> = {
      'id': 'رقم المصروف',
      'expense_date': 'التاريخ',
      'amount': 'المبلغ (د.م)',
      'payment_method': 'طريقة الدفع',
      'status': 'الحالة',
      'sub_budget': 'الميزانية الفرعية',
      'expense_category': 'فئة المصروف',
      'partner': 'الشريك',
      'beneficiaries': 'عدد المستفيدين'
    }

    const expensesData = expenses.map(expense => ({
      id: expense.id,
      expense_date: formatDateForExport(expense.expense_date),
      amount: expense.amount.toFixed(2),
      payment_method: paymentMethodArabic[expense.payment_method] || expense.payment_method,
      status: statusArabic[expense.status] || expense.status,
      sub_budget: expense.sub_budget.label,
      expense_category: expense.expense_category.label,
      partner: expense.partner?.name || '',
      beneficiaries: expense.beneficiaries?.length || 0
    }))

    exportDataToCSV(expensesData, 'financial_report_expenses', expensesColumnMapping, {
      entityType: 'expenses',
      filters,
      totalCount: expenses.length
    })

    // Export summary CSV
    const totalIncome = incomes.reduce((sum, inc) => sum + parseFloat(String(inc.amount)), 0)
    const totalExpenses = expenses.reduce((sum, exp) => sum + parseFloat(String(exp.amount)), 0)
    const balance = totalIncome - totalExpenses

    const summaryData = [{
      description: 'إجمالي الإيرادات',
      amount: totalIncome.toFixed(2)
    }, {
      description: 'إجمالي المصروفات',
      amount: totalExpenses.toFixed(2)
    }, {
      description: 'الرصيد',
      amount: balance.toFixed(2)
    }]

    const summaryColumnMapping: Record<string, string> = {
      'description': 'البيان',
      'amount': 'المبلغ (د.م)'
    }

    exportDataToCSV(summaryData, 'financial_report_summary', summaryColumnMapping, {
      entityType: 'financial_summary',
      filters
    })
  }

  const exportToPDF = async () => {
    toast({
      title: "قريباً",
      description: "تصدير PDF سيكون متاحاً قريباً"
    })
  }

  const printReport = async () => {
    const totalIncome = incomes.reduce((sum, inc) => sum + parseFloat(String(inc.amount)), 0)
    const approvedIncome = incomes
      .filter(inc => inc.status === 'Approved')
      .reduce((sum, inc) => sum + parseFloat(String(inc.amount)), 0)
    const totalExpenses = expenses.reduce((sum, exp) => sum + parseFloat(String(exp.amount)), 0)
    const approvedExpenses = expenses
      .filter(exp => exp.status === 'Approved')
      .reduce((sum, exp) => sum + parseFloat(String(exp.amount)), 0)
    const balance = approvedIncome - approvedExpenses

    // Group incomes by category
    const incomesByCategory: Record<string, number> = {}
    incomes.forEach(income => {
      const category = income.income_category.label
      incomesByCategory[category] = (incomesByCategory[category] || 0) + parseFloat(String(income.amount))
    })

    // Group expenses by category
    const expensesByCategory: Record<string, number> = {}
    expenses.forEach(expense => {
      const category = expense.expense_category.label
      expensesByCategory[category] = (expensesByCategory[category] || 0) + parseFloat(String(expense.amount))
    })

    const htmlContent = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <title>التقرير المالي</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Cairo', 'Segoe UI', Tahoma, sans-serif;
      direction: rtl;
      padding: 20px;
      font-size: 12px;
    }
    .header {
      text-align: center;
      border-bottom: 3px solid #333;
      padding-bottom: 15px;
      margin-bottom: 20px;
    }
    .header h1 { font-size: 24px; margin-bottom: 5px; }
    .summary {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 15px;
      margin-bottom: 30px;
    }
    .summary-card {
      border: 2px solid #ddd;
      padding: 20px;
      text-align: center;
      border-radius: 5px;
    }
    .summary-card.income { border-color: #4CAF50; background: #e8f5e9; }
    .summary-card.expense { border-color: #f44336; background: #ffebee; }
    .summary-card.balance { border-color: #2196F3; background: #e3f2fd; }
    .summary-card h3 { font-size: 12px; color: #666; margin-bottom: 10px; }
    .summary-card p { font-size: 24px; font-weight: bold; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    th {
      background: #333;
      color: white;
      padding: 10px;
      text-align: right;
      font-size: 11px;
    }
    td { padding: 8px; border-bottom: 1px solid #ddd; font-size: 11px; }
    tr:nth-child(even) { background: #f9f9f9; }
    .section-title {
      font-size: 16px;
      font-weight: bold;
      margin: 25px 0 10px 0;
      color: #333;
      border-bottom: 2px solid #ddd;
      padding-bottom: 5px;
    }
    .footer {
      margin-top: 30px;
      padding-top: 10px;
      border-top: 2px solid #333;
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      color: #666;
    }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>جمعية أماسو الخيرية</h1>
    <h2>التقرير المالي الشامل</h2>
  </div>

  <div class="summary">
    <div class="summary-card income">
      <h3>إجمالي الإيرادات</h3>
      <p>${formatCurrency(totalIncome)}</p>
      <small>معتمد: ${formatCurrency(approvedIncome)}</small>
    </div>
    <div class="summary-card expense">
      <h3>إجمالي المصروفات</h3>
      <p>${formatCurrency(totalExpenses)}</p>
      <small>معتمد: ${formatCurrency(approvedExpenses)}</small>
    </div>
    <div class="summary-card balance">
      <h3>الرصيد</h3>
      <p style="color: ${balance >= 0 ? '#4CAF50' : '#f44336'}">${formatCurrency(balance)}</p>
    </div>
  </div>

  <h3 class="section-title">الإيرادات حسب الفئة</h3>
  <table>
    <thead>
      <tr><th>الفئة</th><th>المبلغ</th><th>النسبة</th></tr>
    </thead>
    <tbody>
      ${Object.entries(incomesByCategory).map(([category, amount]) => `
      <tr>
        <td>${category}</td>
        <td><strong>${formatCurrency(amount)}</strong></td>
        <td>${totalIncome > 0 ? ((amount / totalIncome) * 100).toFixed(1) : 0}%</td>
      </tr>
      `).join('')}
    </tbody>
  </table>

  <h3 class="section-title">المصروفات حسب الفئة</h3>
  <table>
    <thead>
      <tr><th>الفئة</th><th>المبلغ</th><th>النسبة</th></tr>
    </thead>
    <tbody>
      ${Object.entries(expensesByCategory).map(([category, amount]) => `
      <tr>
        <td>${category}</td>
        <td><strong>${formatCurrency(amount)}</strong></td>
        <td>${totalExpenses > 0 ? ((amount / totalExpenses) * 100).toFixed(1) : 0}%</td>
      </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="footer">
    <div>
      <p>تاريخ الطباعة: ${formatDateForExport(new Date())}</p>
      <p>الوقت: ${new Date().toLocaleTimeString('ar-MA')}</p>
    </div>
    <div style="text-align: left;">
      <p>جمعية أماسو الخيرية</p>
      <p>قسم المالية</p>
    </div>
  </div>
</body>
</html>
    `

    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      throw new Error('تعذر فتح نافذة الطباعة')
    }

    printWindow.document.write(htmlContent)
    printWindow.document.close()
    printWindow.onload = () => {
      printWindow.print()
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
