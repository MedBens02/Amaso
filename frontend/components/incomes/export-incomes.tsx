"use client"

import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { FileText, Printer, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
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
  cheque_number?: string
  receipt_number?: string
  status: string
  remarks?: string
  fiscal_year: {
    id: number
    year: string
  }
  sub_budget: {
    id: number
    label: string
  }
  income_category: {
    id: number
    label: string
  }
  donor?: {
    id: number
    first_name: string
    last_name: string
  }
  kafil?: {
    id: number
    first_name: string
    last_name: string
  }
  bank_account?: {
    id: number
    label: string
    bank_name: string
  }
}

interface ExportIncomesProps {
  incomes: Income[]
  filters?: Record<string, any>
  searchTerm?: string
}

export function ExportIncomes({ incomes, filters = {}, searchTerm }: ExportIncomesProps) {
  const { toast } = useToast()
  const [isExporting, setIsExporting] = useState(false)
  const [exportType, setExportType] = useState<'csv' | 'print' | null>(null)

  const handleExportCSV = async () => {
    setIsExporting(true)
    setExportType('csv')

    try {
      // Column mapping for CSV
      const columnMapping: Record<string, string> = {
        'id': 'رقم الإيراد',
        'income_date': 'التاريخ',
        'amount': 'المبلغ (د.م)',
        'payment_method': 'طريقة الدفع',
        'status': 'الحالة',
        'fiscal_year': 'السنة المالية',
        'sub_budget': 'الميزانية الفرعية',
        'income_category': 'فئة الإيراد',
        'donor': 'المتبرع',
        'kafil': 'الكافل',
        'bank_account': 'الحساب البنكي',
        'cheque_number': 'رقم الشيك',
        'receipt_number': 'رقم الإيصال',
        'remarks': 'ملاحظات'
      }

      // Transform incomes data for CSV
      const csvData = incomes.map(income => ({
        id: income.id,
        income_date: formatDateForExport(income.income_date),
        amount: parseFloat(String(income.amount)).toFixed(2),
        payment_method: paymentMethodArabic[income.payment_method] || income.payment_method,
        status: statusArabic[income.status] || income.status,
        fiscal_year: income.fiscal_year.year,
        sub_budget: income.sub_budget.label,
        income_category: income.income_category.label,
        donor: income.donor ? `${income.donor.first_name} ${income.donor.last_name}` : '',
        kafil: income.kafil ? `${income.kafil.first_name} ${income.kafil.last_name}` : '',
        bank_account: income.bank_account ? `${income.bank_account.label} - ${income.bank_account.bank_name}` : '',
        cheque_number: income.cheque_number || '',
        receipt_number: income.receipt_number || '',
        remarks: income.remarks || ''
      }))

      exportDataToCSV(
        csvData,
        'incomes',
        columnMapping,
        {
          entityType: 'incomes',
          filters,
          searchTerm,
          totalCount: incomes.length
        }
      )

      toast({
        title: "تم التصدير بنجاح",
        description: `تم تصدير ${incomes.length} إيراد إلى ملف CSV`
      })
    } catch (error) {
      console.error('Error exporting CSV:', error)
      toast({
        title: "خطأ في التصدير",
        description: "حدث خطأ أثناء تصدير البيانات",
        variant: "destructive"
      })
    } finally {
      setIsExporting(false)
      setExportType(null)
    }
  }

  const handlePrintReport = () => {
    setIsExporting(true)
    setExportType('print')

    try {
      // Calculate statistics
      const totalIncomes = incomes.length
      const totalAmount = incomes.reduce((sum, inc) => sum + parseFloat(String(inc.amount)), 0)
      const approvedIncomes = incomes.filter(inc => inc.status === 'Approved')
      const approvedAmount = approvedIncomes.reduce((sum, inc) => sum + parseFloat(String(inc.amount)), 0)
      const draftIncomes = incomes.filter(inc => inc.status === 'Draft').length
      const donorIncomes = incomes.filter(inc => inc.donor).length
      const kafilIncomes = incomes.filter(inc => inc.kafil).length

      // Group by category
      const byCategory: Record<string, { count: number; total: number }> = {}
      incomes.forEach(income => {
        const category = income.income_category.label
        if (!byCategory[category]) {
          byCategory[category] = { count: 0, total: 0 }
        }
        byCategory[category].count++
        byCategory[category].total += parseFloat(String(income.amount))
      })

      // Group by payment method
      const byPaymentMethod: Record<string, { count: number; total: number }> = {}
      incomes.forEach(income => {
        const method = paymentMethodArabic[income.payment_method] || income.payment_method
        if (!byPaymentMethod[method]) {
          byPaymentMethod[method] = { count: 0, total: 0 }
        }
        byPaymentMethod[method].count++
        byPaymentMethod[method].total += parseFloat(String(income.amount))
      })

      // Generate HTML for printing
      const htmlContent = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <title>تقرير الإيرادات</title>
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
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 10px;
      margin-bottom: 20px;
    }
    .summary-card {
      background: #f9f9f9;
      border: 1px solid #ddd;
      padding: 15px;
      text-align: center;
      border-radius: 5px;
    }
    .summary-card h3 { font-size: 11px; color: #666; margin-bottom: 5px; }
    .summary-card p { font-size: 18px; font-weight: bold; }
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
    .status-approved { color: green; font-weight: bold; }
    .status-draft { color: orange; font-weight: bold; }
    .status-rejected { color: red; font-weight: bold; }
    .footer {
      margin-top: 20px;
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
    <h2>تقرير الإيرادات</h2>
  </div>

  <div class="summary">
    <div class="summary-card">
      <h3>إجمالي الإيرادات</h3>
      <p>${totalIncomes}</p>
    </div>
    <div class="summary-card">
      <h3>المبلغ الإجمالي</h3>
      <p>${formatCurrency(totalAmount)}</p>
    </div>
    <div class="summary-card">
      <h3>المعتمد</h3>
      <p>${formatCurrency(approvedAmount)}</p>
    </div>
    <div class="summary-card">
      <h3>مسودة</h3>
      <p>${draftIncomes}</p>
    </div>
    <div class="summary-card">
      <h3>من متبرعين</h3>
      <p>${donorIncomes}</p>
    </div>
    <div class="summary-card">
      <h3>من كفلاء</h3>
      <p>${kafilIncomes}</p>
    </div>
  </div>

  <h3 style="margin: 20px 0 10px 0; font-size: 14px;">التوزيع حسب الفئة</h3>
  <table>
    <thead>
      <tr><th>الفئة</th><th>العدد</th><th>المبلغ</th></tr>
    </thead>
    <tbody>
      ${Object.entries(byCategory).map(([cat, data]) => `
      <tr>
        <td>${cat}</td>
        <td>${data.count}</td>
        <td><strong>${formatCurrency(data.total)}</strong></td>
      </tr>
      `).join('')}
    </tbody>
  </table>

  <h3 style="margin: 20px 0 10px 0; font-size: 14px;">تفاصيل الإيرادات</h3>
  <table>
    <thead>
      <tr>
        <th>الرقم</th>
        <th>التاريخ</th>
        <th>الفئة</th>
        <th>المبلغ</th>
        <th>المصدر</th>
        <th>طريقة الدفع</th>
        <th>الحالة</th>
      </tr>
    </thead>
    <tbody>
      ${incomes.map(income => `
      <tr>
        <td>#${income.id}</td>
        <td>${formatDateForExport(income.income_date)}</td>
        <td>${income.income_category.label}</td>
        <td><strong>${formatCurrency(parseFloat(String(income.amount)))}</strong></td>
        <td>${income.donor ? `${income.donor.first_name} ${income.donor.last_name}` : (income.kafil ? `${income.kafil.first_name} ${income.kafil.last_name}` : '-')}</td>
        <td>${paymentMethodArabic[income.payment_method] || income.payment_method}</td>
        <td class="status-${income.status.toLowerCase()}">${statusArabic[income.status] || income.status}</td>
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

      // Open print window
      const printWindow = window.open('', '_blank')
      if (!printWindow) {
        throw new Error('تعذر فتح نافذة الطباعة')
      }

      printWindow.document.write(htmlContent)
      printWindow.document.close()
      printWindow.onload = () => {
        printWindow.print()
      }

      toast({
        title: "تم إعداد التقرير",
        description: "تم فتح نافذة الطباعة"
      })
    } catch (error) {
      console.error('Error generating print report:', error)
      toast({
        title: "خطأ في إنشاء التقرير",
        description: "حدث خطأ أثناء إنشاء التقرير",
        variant: "destructive"
      })
    } finally {
      setIsExporting(false)
      setExportType(null)
    }
  }

  const isLoading = isExporting

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleExportCSV}
        disabled={isLoading || incomes.length === 0}
      >
        {isExporting && exportType === 'csv' ? (
          <Loader2 className="ml-2 h-4 w-4 animate-spin" />
        ) : (
          <FileText className="ml-2 h-4 w-4" />
        )}
        تصدير CSV
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={handlePrintReport}
        disabled={isLoading || incomes.length === 0}
      >
        {isExporting && exportType === 'print' ? (
          <Loader2 className="ml-2 h-4 w-4 animate-spin" />
        ) : (
          <Printer className="ml-2 h-4 w-4" />
        )}
        طباعة التقرير
      </Button>
    </div>
  )
}
