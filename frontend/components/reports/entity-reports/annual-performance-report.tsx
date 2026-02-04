"use client"

import { useState, useEffect } from "react"
import { ReportDialog, ExportFormat, StatisticItem } from "../report-dialog"
import { ReportFilters, FilterOption, useReportFilters } from "../report-filters"
import { useToast } from "@/hooks/use-toast"
import api from "@/lib/api"
import {
  exportDataToCSV,
  formatDateForExport,
  formatCurrency
} from "@/lib/export-utils"

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
    if (!performanceData) return

    const { incomes, expenses, widows, orphans, donors } = performanceData

    // 1. Annual Financial Summary
    const totalIncome = incomes.reduce((sum: number, inc: any) => sum + parseFloat(inc.amount || 0), 0)
    const totalExpenses = expenses.reduce((sum: number, exp: any) => sum + parseFloat(exp.amount || 0), 0)

    const summaryData = [{
      metric: 'إجمالي الإيرادات',
      value: totalIncome.toFixed(2),
      count: incomes.length
    }, {
      metric: 'إجمالي المصروفات',
      value: totalExpenses.toFixed(2),
      count: expenses.length
    }, {
      metric: 'صافي الرصيد',
      value: (totalIncome - totalExpenses).toFixed(2),
      count: '-'
    }]

    exportDataToCSV(summaryData, 'annual_financial_summary', {
      'metric': 'المؤشر',
      'value': 'القيمة (د.م)',
      'count': 'العدد'
    }, { entityType: 'annual_summary', filters })

    // 2. Beneficiaries Stats
    const beneficiariesData = [{
      category: 'أرامل',
      total: widows.length,
      sponsored: widows.filter((w: any) => (w.sponsorships_count || 0) > 0).length,
      coverage: widows.length > 0 ? ((widows.filter((w: any) => (w.sponsorships_count || 0) > 0).length / widows.length) * 100).toFixed(1) : '0'
    }, {
      category: 'أيتام',
      total: orphans.length,
      sponsored: 0,
      coverage: '0'
    }]

    exportDataToCSV(beneficiariesData, 'beneficiaries_stats', {
      'category': 'الفئة',
      'total': 'الإجمالي',
      'sponsored': 'المكفولون',
      'coverage': 'نسبة التغطية (%)'
    }, { entityType: 'beneficiaries', filters })

    // 3. Donor Stats
    const totalDonations = donors.reduce((sum: number, d: any) => sum + (d.total_given || 0), 0)
    const kafils = donors.filter((d: any) => d.is_kafil)

    const donorData = [{
      category: 'متبرعون',
      count: donors.length,
      total_amount: totalDonations.toFixed(2),
      average: donors.length > 0 ? (totalDonations / donors.length).toFixed(2) : '0'
    }, {
      category: 'كفلاء',
      count: kafils.length,
      total_amount: kafils.reduce((sum: number, d: any) => sum + (d.total_given || 0), 0).toFixed(2),
      average: kafils.length > 0 ? (kafils.reduce((sum: number, d: any) => sum + (d.total_given || 0), 0) / kafils.length).toFixed(2) : '0'
    }]

    exportDataToCSV(donorData, 'donor_stats', {
      'category': 'الفئة',
      'count': 'العدد',
      'total_amount': 'الإجمالي (د.م)',
      'average': 'المتوسط (د.م)'
    }, { entityType: 'donor_stats', filters })
  }

  const exportToPDF = async () => {
    toast({
      title: "قريباً",
      description: "تصدير PDF سيكون متاحاً قريباً"
    })
  }

  const printReport = async () => {
    if (!performanceData) return

    const { incomes, expenses, widows, orphans, donors } = performanceData

    // Calculate metrics
    const totalIncome = incomes.reduce((sum: number, inc: any) => sum + parseFloat(inc.amount || 0), 0)
    const totalExpenses = expenses.reduce((sum: number, exp: any) => sum + parseFloat(exp.amount || 0), 0)
    const balance = totalIncome - totalExpenses

    const totalWidows = widows.length
    const totalOrphans = orphans.length
    const sponsoredWidows = widows.filter((w: any) => (w.sponsorships_count || 0) > 0).length
    const sponsorshipCoverage = totalWidows > 0 ? ((sponsoredWidows / totalWidows) * 100).toFixed(1) : '0'

    const totalDonors = donors.length
    const kafils = donors.filter((d: any) => d.is_kafil)
    const totalKafils = kafils.length
    const avgDonation = totalDonors > 0 ? totalIncome / totalDonors : 0

    // Income breakdown by category
    const incomeByCategory: Record<string, number> = {}
    incomes.forEach((inc: any) => {
      const category = inc.income_category?.label || 'غير محدد'
      incomeByCategory[category] = (incomeByCategory[category] || 0) + parseFloat(inc.amount || 0)
    })

    // Expense breakdown by category
    const expenseByCategory: Record<string, number> = {}
    expenses.forEach((exp: any) => {
      const category = exp.expense_category?.label || 'غير محدد'
      expenseByCategory[category] = (expenseByCategory[category] || 0) + parseFloat(exp.amount || 0)
    })

    const htmlContent = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <title>تقرير الأداء السنوي</title>
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
      border-bottom: 4px solid #333;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header h1 { font-size: 28px; margin-bottom: 5px; color: #333; }
    .header h2 { font-size: 16px; color: #666; }
    .executive-summary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 30px;
    }
    .executive-summary h3 { font-size: 18px; margin-bottom: 15px; }
    .executive-summary p { font-size: 13px; line-height: 1.6; }
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
    .summary-card.primary { border-color: #2196F3; background: #e3f2fd; }
    .summary-card.success { border-color: #4CAF50; background: #e8f5e9; }
    .summary-card.danger { border-color: #f44336; background: #ffebee; }
    .summary-card h3 { font-size: 12px; color: #666; margin-bottom: 10px; }
    .summary-card p { font-size: 24px; font-weight: bold; }
    .section {
      margin-bottom: 30px;
      page-break-inside: avoid;
    }
    .section-title {
      font-size: 18px;
      font-weight: bold;
      margin-bottom: 15px;
      color: #333;
      border-bottom: 2px solid #ddd;
      padding-bottom: 8px;
    }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    th {
      background: #333;
      color: white;
      padding: 12px;
      text-align: right;
      font-size: 11px;
    }
    td { padding: 10px; border-bottom: 1px solid #ddd; font-size: 11px; }
    tr:nth-child(even) { background: #f9f9f9; }
    .footer {
      margin-top: 40px;
      padding-top: 15px;
      border-top: 3px solid #333;
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      color: #666;
    }
    @media print {
      body { padding: 0; }
      .section { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>جمعية أماسو الخيرية</h1>
    <h2>تقرير الأداء السنوي - ${filters.fiscal_year || new Date().getFullYear()}</h2>
  </div>

  <div class="executive-summary">
    <h3>الملخص التنفيذي</h3>
    <p>
      حققت الجمعية خلال العام إيرادات بلغت ${formatCurrency(totalIncome)} وبلغت المصروفات ${formatCurrency(totalExpenses)}،
      مع رصيد ${balance >= 0 ? 'إيجابي' : 'سلبي'} قدره ${formatCurrency(Math.abs(balance))}.
      تم خدمة ${totalWidows} أرملة و ${totalOrphans} يتيم، بنسبة تغطية كفالات ${sponsorshipCoverage}%.
      ساهم ${totalDonors} متبرع بمتوسط ${formatCurrency(avgDonation)} للمتبرع.
    </p>
  </div>

  <div class="summary">
    <div class="summary-card success">
      <h3>إجمالي الإيرادات</h3>
      <p>${formatCurrency(totalIncome)}</p>
      <small>${incomes.length} معاملة</small>
    </div>
    <div class="summary-card danger">
      <h3>إجمالي المصروفات</h3>
      <p>${formatCurrency(totalExpenses)}</p>
      <small>${expenses.length} معاملة</small>
    </div>
    <div class="summary-card ${balance >= 0 ? 'primary' : 'danger'}">
      <h3>صافي الرصيد</h3>
      <p style="color: ${balance >= 0 ? '#2196F3' : '#f44336'}">${formatCurrency(balance)}</p>
      <small>${balance >= 0 ? 'فائض' : 'عجز'}</small>
    </div>
  </div>

  <div class="section">
    <h3 class="section-title">الأداء المالي</h3>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
      <div>
        <h4 style="font-size: 14px; margin-bottom: 10px;">الإيرادات حسب الفئة</h4>
        <table>
          <thead><tr><th>الفئة</th><th>المبلغ</th><th>النسبة</th></tr></thead>
          <tbody>
            ${Object.entries(incomeByCategory).map(([cat, amount]) => `
            <tr>
              <td>${cat}</td>
              <td><strong>${formatCurrency(amount)}</strong></td>
              <td>${totalIncome > 0 ? ((amount / totalIncome) * 100).toFixed(1) : 0}%</td>
            </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      <div>
        <h4 style="font-size: 14px; margin-bottom: 10px;">المصروفات حسب الفئة</h4>
        <table>
          <thead><tr><th>الفئة</th><th>المبلغ</th><th>النسبة</th></tr></thead>
          <tbody>
            ${Object.entries(expenseByCategory).map(([cat, amount]) => `
            <tr>
              <td>${cat}</td>
              <td><strong>${formatCurrency(amount)}</strong></td>
              <td>${totalExpenses > 0 ? ((amount / totalExpenses) * 100).toFixed(1) : 0}%</td>
            </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  </div>

  <div class="section">
    <h3 class="section-title">المستفيدون</h3>
    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 15px;">
      <div class="summary-card">
        <h3>إجمالي الأرامل</h3>
        <p>${totalWidows}</p>
      </div>
      <div class="summary-card">
        <h3>أرامل مكفولة</h3>
        <p>${sponsoredWidows}</p>
      </div>
      <div class="summary-card">
        <h3>إجمالي الأيتام</h3>
        <p>${totalOrphans}</p>
      </div>
      <div class="summary-card">
        <h3>نسبة التغطية</h3>
        <p>${sponsorshipCoverage}%</p>
      </div>
    </div>
  </div>

  <div class="section">
    <h3 class="section-title">المتبرعون والكفلاء</h3>
    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px;">
      <div class="summary-card">
        <h3>إجمالي المتبرعين</h3>
        <p>${totalDonors}</p>
      </div>
      <div class="summary-card">
        <h3>إجمالي الكفلاء</h3>
        <p>${totalKafils}</p>
      </div>
      <div class="summary-card">
        <h3>متوسط التبرع</h3>
        <p style="font-size: 16px;">${formatCurrency(avgDonation)}</p>
      </div>
      <div class="summary-card">
        <h3>نسبة الكفلاء</h3>
        <p>${totalDonors > 0 ? ((totalKafils / totalDonors) * 100).toFixed(1) : 0}%</p>
      </div>
    </div>
  </div>

  <div class="footer">
    <div>
      <p><strong>تاريخ إصدار التقرير:</strong> ${formatDateForExport(new Date())}</p>
      <p><strong>الوقت:</strong> ${new Date().toLocaleTimeString('ar-MA')}</p>
    </div>
    <div style="text-align: left;">
      <p>جمعية أماسو الخيرية</p>
      <p>تقرير الأداء السنوي</p>
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
