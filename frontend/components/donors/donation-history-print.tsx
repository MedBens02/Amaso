"use client"

import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Printer, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { formatCurrency, paymentMethodArabic, statusArabic } from "@/lib/export-utils"
import { formatDateForExport } from "@/lib/export-utils"

interface Income {
  id: number
  income_date: string
  amount: number
  payment_method: string
  cheque_number?: string
  receipt_number?: string
  status: string
  remarks?: string
  income_category?: {
    label: string
  }
  sub_budget?: {
    label: string
  }
  fiscal_year?: {
    year: string
  }
}

interface Donor {
  id: number
  first_name: string
  last_name: string
  full_name?: string
  phone?: string
  email?: string
  is_kafil?: boolean
}

interface DonationHistoryPrintProps {
  donor: Donor
  incomes: Income[]
  dateRange?: {
    from?: Date
    to?: Date
  }
  variant?: 'default' | 'icon'
}

export function DonationHistoryPrint({
  donor,
  incomes,
  dateRange,
  variant = 'default'
}: DonationHistoryPrintProps) {
  const { toast } = useToast()
  const [isGenerating, setIsGenerating] = useState(false)

  const fullName = donor.full_name || `${donor.first_name} ${donor.last_name}`

  const generatePrint = () => {
    setIsGenerating(true)

    try {
      // Calculate statistics
      const totalAmount = incomes.reduce((sum, income) => sum + parseFloat(String(income.amount)), 0)
      const approvedIncomes = incomes.filter(inc => inc.status === 'Approved')
      const approvedAmount = approvedIncomes.reduce((sum, income) => sum + parseFloat(String(income.amount)), 0)

      // Group by category
      const byCategory: Record<string, { count: number; total: number }> = {}
      incomes.forEach(income => {
        const category = income.income_category?.label || 'غير محدد'
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

      // Generate HTML content
      const htmlContent = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <title>كشف حساب المتبرع - ${fullName}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
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
    .header h1 {
      font-size: 24px;
      color: #333;
      margin-bottom: 5px;
    }
    .header h2 {
      font-size: 18px;
      color: #666;
      margin-bottom: 10px;
    }
    .donor-info {
      background: #f5f5f5;
      padding: 15px;
      border-radius: 5px;
      margin-bottom: 20px;
    }
    .donor-info table {
      width: 100%;
    }
    .donor-info td {
      padding: 5px;
    }
    .donor-info td:first-child {
      font-weight: bold;
      width: 150px;
      color: #666;
    }
    .period {
      background: #e3f2fd;
      padding: 10px;
      border-radius: 5px;
      margin-bottom: 20px;
      text-align: center;
      font-weight: bold;
    }
    .summary {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
      margin-bottom: 20px;
    }
    .summary-card {
      background: #f9f9f9;
      border: 1px solid #ddd;
      padding: 15px;
      border-radius: 5px;
      text-align: center;
    }
    .summary-card h3 {
      font-size: 11px;
      color: #666;
      margin-bottom: 5px;
    }
    .summary-card p {
      font-size: 18px;
      font-weight: bold;
      color: #333;
    }
    .section-title {
      font-size: 16px;
      font-weight: bold;
      margin: 20px 0 10px 0;
      padding-bottom: 5px;
      border-bottom: 2px solid #ddd;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    th {
      background: #333;
      color: white;
      padding: 10px;
      text-align: right;
      font-size: 11px;
    }
    td {
      padding: 8px;
      border-bottom: 1px solid #ddd;
      font-size: 11px;
    }
    tr:nth-child(even) {
      background: #f9f9f9;
    }
    .status-approved {
      color: green;
      font-weight: bold;
    }
    .status-draft {
      color: orange;
      font-weight: bold;
    }
    .status-rejected {
      color: red;
      font-weight: bold;
    }
    .subtotal-row {
      background: #f0f0f0 !important;
      font-weight: bold;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #333;
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      color: #666;
    }
    .signature-line {
      margin-top: 60px;
      text-align: center;
    }
    .signature-line div {
      display: inline-block;
      width: 200px;
      border-top: 1px solid #333;
      padding-top: 5px;
      margin: 0 50px;
    }
    @media print {
      body {
        padding: 0;
      }
      .no-print {
        display: none;
      }
    }
  </style>
</head>
<body>
  <!-- Header -->
  <div class="header">
    <h1>جمعية أماسو الخيرية</h1>
    <h2>كشف حساب المتبرع</h2>
    <p style="font-size: 11px; color: #999;">نظام إدارة الجمعية</p>
  </div>

  <!-- Donor Information -->
  <div class="donor-info">
    <table>
      <tr>
        <td>اسم المتبرع:</td>
        <td><strong style="font-size: 14px;">${fullName}</strong></td>
      </tr>
      ${donor.phone ? `
      <tr>
        <td>رقم الهاتف:</td>
        <td>${donor.phone}</td>
      </tr>
      ` : ''}
      ${donor.email ? `
      <tr>
        <td>البريد الإلكتروني:</td>
        <td>${donor.email}</td>
      </tr>
      ` : ''}
      <tr>
        <td>رقم المتبرع:</td>
        <td>#${donor.id}</td>
      </tr>
      ${donor.is_kafil ? `
      <tr>
        <td>النوع:</td>
        <td><strong style="color: #2196F3;">متبرع وكافل</strong></td>
      </tr>
      ` : ''}
    </table>
  </div>

  <!-- Period -->
  ${dateRange && (dateRange.from || dateRange.to) ? `
  <div class="period">
    فترة الكشف:
    ${dateRange.from ? formatDateForExport(dateRange.from) : 'البداية'}
    -
    ${dateRange.to ? formatDateForExport(dateRange.to) : 'النهاية'}
  </div>
  ` : `
  <div class="period">
    كشف حساب شامل - جميع التبرعات
  </div>
  `}

  <!-- Summary Cards -->
  <div class="summary">
    <div class="summary-card">
      <h3>إجمالي التبرعات</h3>
      <p>${incomes.length}</p>
    </div>
    <div class="summary-card">
      <h3>المبلغ الإجمالي</h3>
      <p>${formatCurrency(totalAmount)}</p>
    </div>
    <div class="summary-card">
      <h3>المعتمد</h3>
      <p>${formatCurrency(approvedAmount)}</p>
    </div>
  </div>

  <!-- Transactions Table -->
  <div class="section-title">تفاصيل التبرعات</div>
  <table>
    <thead>
      <tr>
        <th>التاريخ</th>
        <th>رقم الإيصال</th>
        <th>الفئة</th>
        <th>المبلغ (د.م)</th>
        <th>طريقة الدفع</th>
        <th>رقم الشيك</th>
        <th>الحالة</th>
        <th>ملاحظات</th>
      </tr>
    </thead>
    <tbody>
      ${incomes.map(income => `
      <tr>
        <td>${formatDateForExport(income.income_date)}</td>
        <td>${income.receipt_number || '-'}</td>
        <td>${income.income_category?.label || 'غير محدد'}</td>
        <td><strong>${formatCurrency(parseFloat(String(income.amount)))}</strong></td>
        <td>${paymentMethodArabic[income.payment_method] || income.payment_method}</td>
        <td>${income.cheque_number || '-'}</td>
        <td class="status-${income.status.toLowerCase()}">${statusArabic[income.status] || income.status}</td>
        <td>${income.remarks || '-'}</td>
      </tr>
      `).join('')}
      <tr class="subtotal-row">
        <td colspan="3" style="text-align: center;">المجموع</td>
        <td><strong>${formatCurrency(totalAmount)}</strong></td>
        <td colspan="4"></td>
      </tr>
    </tbody>
  </table>

  <!-- Breakdown by Category -->
  ${Object.keys(byCategory).length > 0 ? `
  <div class="section-title">التوزيع حسب الفئة</div>
  <table>
    <thead>
      <tr>
        <th>الفئة</th>
        <th>عدد التبرعات</th>
        <th>المبلغ الإجمالي (د.م)</th>
      </tr>
    </thead>
    <tbody>
      ${Object.entries(byCategory).map(([category, data]) => `
      <tr>
        <td>${category}</td>
        <td>${data.count}</td>
        <td><strong>${formatCurrency(data.total)}</strong></td>
      </tr>
      `).join('')}
    </tbody>
  </table>
  ` : ''}

  <!-- Breakdown by Payment Method -->
  ${Object.keys(byPaymentMethod).length > 0 ? `
  <div class="section-title">التوزيع حسب طريقة الدفع</div>
  <table>
    <thead>
      <tr>
        <th>طريقة الدفع</th>
        <th>عدد التبرعات</th>
        <th>المبلغ الإجمالي (د.م)</th>
      </tr>
    </thead>
    <tbody>
      ${Object.entries(byPaymentMethod).map(([method, data]) => `
      <tr>
        <td>${method}</td>
        <td>${data.count}</td>
        <td><strong>${formatCurrency(data.total)}</strong></td>
      </tr>
      `).join('')}
    </tbody>
  </table>
  ` : ''}

  <!-- Signature Section -->
  <div class="signature-line">
    <div>
      <p>إمضاء المسؤول</p>
    </div>
    <div>
      <p>إمضاء المحاسب</p>
    </div>
  </div>

  <!-- Footer -->
  <div class="footer">
    <div>
      <p>تاريخ الطباعة: ${formatDateForExport(new Date())}</p>
      <p>الوقت: ${new Date().toLocaleTimeString('ar-MA')}</p>
    </div>
    <div style="text-align: left;">
      <p>جمعية أماسو الخيرية</p>
      <p>قسم المالية والمحاسبة</p>
    </div>
  </div>
</body>
</html>
      `

      // Open print window
      const printWindow = window.open('', '_blank')
      if (!printWindow) {
        throw new Error('تعذر فتح نافذة الطباعة. يرجى التحقق من إعدادات المتصفح.')
      }

      printWindow.document.write(htmlContent)
      printWindow.document.close()

      // Trigger print after content loads
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
        description: error instanceof Error ? error.message : "حدث خطأ أثناء إنشاء التقرير",
        variant: "destructive"
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const ButtonContent = isGenerating ? (
    <>
      <Loader2 className="ml-2 h-4 w-4 animate-spin" />
      جاري التحضير...
    </>
  ) : variant === 'icon' ? (
    <Printer className="h-4 w-4" />
  ) : (
    <>
      <Printer className="ml-2 h-4 w-4" />
      طباعة كشف الحساب
    </>
  )

  return (
    <Button
      onClick={generatePrint}
      disabled={isGenerating || incomes.length === 0}
      variant={variant === 'icon' ? 'ghost' : 'outline'}
      size={variant === 'icon' ? 'sm' : 'default'}
    >
      {ButtonContent}
    </Button>
  )
}
