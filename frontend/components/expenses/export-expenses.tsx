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

interface Expense {
  id: number
  expense_date: string
  amount: number
  payment_method: string
  status: string
  details?: string
  remarks?: string
  cheque_number?: string
  receipt_number?: string
  unrelated_to_benef: boolean
  sub_budget: {
    id: number
    label: string
  }
  expense_category: {
    id: number
    label: string
  }
  partner?: {
    id: number
    name: string
  }
  bank_account?: {
    id: number
    name: string
    bank_name: string
  }
  beneficiaries?: Array<{
    id: number
    amount: number
    beneficiary: {
      full_name: string
      type: string
    }
  }>
}

interface ExportExpensesProps {
  expenses: Expense[]
  filters?: Record<string, any>
  searchTerm?: string
}

export function ExportExpenses({ expenses, filters = {}, searchTerm }: ExportExpensesProps) {
  const { toast } = useToast()
  const [isExporting, setIsExporting] = useState(false)
  const [exportType, setExportType] = useState<'csv' | 'print' | null>(null)

  const handleExportCSV = async () => {
    setIsExporting(true)
    setExportType('csv')

    try {
      // Column mapping for CSV
      const columnMapping: Record<string, string> = {
        'id': 'رقم المصروف',
        'expense_date': 'التاريخ',
        'amount': 'المبلغ (د.م)',
        'payment_method': 'طريقة الدفع',
        'status': 'الحالة',
        'sub_budget': 'الميزانية الفرعية',
        'expense_category': 'فئة المصروف',
        'partner': 'الشريك',
        'bank_account': 'الحساب البنكي',
        'cheque_number': 'رقم الشيك',
        'receipt_number': 'رقم الإيصال',
        'beneficiary_count': 'عدد المستفيدين',
        'details': 'التفاصيل',
        'remarks': 'ملاحظات'
      }

      // Transform expenses data for CSV
      const csvData = expenses.map(expense => ({
        id: expense.id,
        expense_date: formatDateForExport(expense.expense_date),
        amount: expense.amount.toFixed(2),
        payment_method: paymentMethodArabic[expense.payment_method] || expense.payment_method,
        status: statusArabic[expense.status] || expense.status,
        sub_budget: expense.sub_budget.label,
        expense_category: expense.expense_category.label,
        partner: expense.partner?.name || '',
        bank_account: expense.bank_account ? `${expense.bank_account.name} - ${expense.bank_account.bank_name}` : '',
        cheque_number: expense.cheque_number || '',
        receipt_number: expense.receipt_number || '',
        beneficiary_count: expense.beneficiaries?.length || 0,
        details: expense.details || '',
        remarks: expense.remarks || ''
      }))

      exportDataToCSV(
        csvData,
        'expenses',
        columnMapping,
        {
          entityType: 'expenses',
          filters,
          searchTerm,
          totalCount: expenses.length
        }
      )

      toast({
        title: "تم التصدير بنجاح",
        description: `تم تصدير ${expenses.length} مصروف إلى ملف CSV`
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
      const totalExpenses = expenses.length
      const totalAmount = expenses.reduce((sum, exp) => sum + parseFloat(String(exp.amount)), 0)
      const approvedExpenses = expenses.filter(exp => exp.status === 'Approved')
      const approvedAmount = approvedExpenses.reduce((sum, exp) => sum + parseFloat(String(exp.amount)), 0)
      const draftExpenses = expenses.filter(exp => exp.status === 'Draft').length
      const totalBeneficiaries = expenses.reduce((sum, exp) => sum + (exp.beneficiaries?.length || 0), 0)

      // Group by category
      const byCategory: Record<string, { count: number; total: number }> = {}
      expenses.forEach(expense => {
        const category = expense.expense_category.label
        if (!byCategory[category]) {
          byCategory[category] = { count: 0, total: 0 }
        }
        byCategory[category].count++
        byCategory[category].total += parseFloat(String(expense.amount))
      })

      // Group by payment method
      const byPaymentMethod: Record<string, { count: number; total: number }> = {}
      expenses.forEach(expense => {
        const method = paymentMethodArabic[expense.payment_method] || expense.payment_method
        if (!byPaymentMethod[method]) {
          byPaymentMethod[method] = { count: 0, total: 0 }
        }
        byPaymentMethod[method].count++
        byPaymentMethod[method].total += parseFloat(String(expense.amount))
      })

      // Generate HTML for printing
      const htmlContent = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <title>تقرير المصروفات</title>
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
    <h2>تقرير المصروفات</h2>
  </div>

  <div class="summary">
    <div class="summary-card">
      <h3>إجمالي المصروفات</h3>
      <p>${totalExpenses}</p>
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
      <p>${draftExpenses}</p>
    </div>
    <div class="summary-card">
      <h3>المستفيدون</h3>
      <p>${totalBeneficiaries}</p>
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

  <h3 style="margin: 20px 0 10px 0; font-size: 14px;">تفاصيل المصروفات</h3>
  <table>
    <thead>
      <tr>
        <th>الرقم</th>
        <th>التاريخ</th>
        <th>الفئة</th>
        <th>المبلغ</th>
        <th>طريقة الدفع</th>
        <th>الحالة</th>
      </tr>
    </thead>
    <tbody>
      ${expenses.map(expense => `
      <tr>
        <td>#${expense.id}</td>
        <td>${formatDateForExport(expense.expense_date)}</td>
        <td>${expense.expense_category.label}</td>
        <td><strong>${formatCurrency(parseFloat(String(expense.amount)))}</strong></td>
        <td>${paymentMethodArabic[expense.payment_method] || expense.payment_method}</td>
        <td class="status-${expense.status.toLowerCase()}">${statusArabic[expense.status] || expense.status}</td>
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
        disabled={isLoading || expenses.length === 0}
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
        disabled={isLoading || expenses.length === 0}
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
