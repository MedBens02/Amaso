"use client"

import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { FileText, Printer, Loader2, FileDown } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import {
  exportDataToCSV,
  formatCurrency,
  formatDateForExport,
  paymentMethodArabic,
  statusArabic
} from "@/lib/export-utils"

interface Donor {
  id: number
  first_name: string
  last_name: string
  full_name?: string
  phone: string
  email: string
  address?: string
  is_kafil: boolean
  total_given: number
  created_at: string
  kafil?: {
    monthly_pledge: number
    total_sponsorship_amount: number
    sponsorship_utilization: number
    sponsorships: any[]
  }
}

interface ExportDonorsProps {
  donors: Donor[]
  filters?: Record<string, any>
  searchTerm?: string
}

export function ExportDonors({ donors, filters = {}, searchTerm }: ExportDonorsProps) {
  const { toast } = useToast()
  const [isExporting, setIsExporting] = useState(false)
  const [exportType, setExportType] = useState<'csv' | 'print' | null>(null)

  const handleExportCSV = async () => {
    setIsExporting(true)
    setExportType('csv')

    try {
      // Column mapping for CSV
      const columnMapping: Record<string, string> = {
        'id': 'رقم المتبرع',
        'full_name': 'الاسم الكامل',
        'phone': 'رقم الهاتف',
        'email': 'البريد الإلكتروني',
        'address': 'العنوان',
        'is_kafil': 'كافل',
        'total_given': 'إجمالي التبرعات (د.م)',
        'kafil.monthly_pledge': 'التعهد الشهري (د.م)',
        'kafil.total_sponsorship_amount': 'إجمالي الكفالات (د.م)',
        'kafil.sponsorship_utilization': 'نسبة الاستخدام (%)',
        'kafil.sponsorships.length': 'عدد الأرامل المكفولة',
        'created_at': 'تاريخ التسجيل'
      }

      // Transform donors data for CSV
      const csvData = donors.map(donor => ({
        id: donor.id,
        full_name: donor.full_name || `${donor.first_name} ${donor.last_name}`,
        phone: donor.phone || '',
        email: donor.email || '',
        address: donor.address || '',
        is_kafil: donor.is_kafil ? 'نعم' : 'لا',
        total_given: donor.total_given.toFixed(2),
        'kafil.monthly_pledge': donor.kafil?.monthly_pledge?.toFixed(2) || '',
        'kafil.total_sponsorship_amount': donor.kafil?.total_sponsorship_amount?.toFixed(2) || '',
        'kafil.sponsorship_utilization': donor.kafil?.sponsorship_utilization?.toFixed(1) || '',
        'kafil.sponsorships.length': donor.kafil?.sponsorships?.length || '',
        created_at: formatDateForExport(donor.created_at)
      }))

      exportDataToCSV(
        csvData,
        'donors',
        columnMapping,
        filters,
        searchTerm
      )

      toast({
        title: "تم التصدير بنجاح",
        description: `تم تصدير ${donors.length} متبرع إلى ملف CSV`
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
      const totalDonors = donors.length
      const totalKafils = donors.filter(d => d.is_kafil).length
      const totalDonations = donors.reduce((sum, d) => sum + d.total_given, 0)
      const totalMonthlyPledges = donors.reduce((sum, d) => sum + (d.kafil?.monthly_pledge || 0), 0)
      const totalSponsorships = donors.reduce((sum, d) => sum + (d.kafil?.sponsorships?.length || 0), 0)

      // Generate HTML for printing
      const htmlContent = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <title>تقرير المتبرعين والكفلاء</title>
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
      margin-bottom: 5px;
    }
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
    .summary-card h3 {
      font-size: 11px;
      color: #666;
      margin-bottom: 5px;
    }
    .summary-card p {
      font-size: 18px;
      font-weight: bold;
    }
    .filters {
      background: #e3f2fd;
      padding: 10px;
      border-radius: 5px;
      margin-bottom: 20px;
      font-size: 11px;
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
    .kafil-badge {
      background: #2196F3;
      color: white;
      padding: 2px 6px;
      border-radius: 3px;
      font-size: 10px;
    }
    .footer {
      margin-top: 20px;
      padding-top: 10px;
      border-top: 2px solid #333;
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      color: #666;
    }
    @media print {
      body { padding: 0; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>جمعية أماسو الخيرية</h1>
    <h2>تقرير المتبرعين والكفلاء</h2>
  </div>

  ${searchTerm || Object.keys(filters).length > 0 ? `
  <div class="filters">
    <strong>التصفية المطبقة:</strong>
    ${searchTerm ? `كلمة البحث: ${searchTerm}` : ''}
    ${Object.entries(filters).map(([key, value]) => {
      if (value) return ` | ${key}: ${value}`
      return ''
    }).join('')}
  </div>
  ` : ''}

  <div class="summary">
    <div class="summary-card">
      <h3>إجمالي المتبرعين</h3>
      <p>${totalDonors}</p>
    </div>
    <div class="summary-card">
      <h3>عدد الكفلاء</h3>
      <p>${totalKafils}</p>
    </div>
    <div class="summary-card">
      <h3>إجمالي التبرعات</h3>
      <p>${formatCurrency(totalDonations)}</p>
    </div>
    <div class="summary-card">
      <h3>التعهدات الشهرية</h3>
      <p>${formatCurrency(totalMonthlyPledges)}</p>
    </div>
    <div class="summary-card">
      <h3>الأرامل المكفولة</h3>
      <p>${totalSponsorships}</p>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>الرقم</th>
        <th>الاسم الكامل</th>
        <th>الهاتف</th>
        <th>النوع</th>
        <th>إجمالي التبرعات</th>
        <th>التعهد الشهري</th>
        <th>الأرامل المكفولة</th>
        <th>نسبة الاستخدام</th>
      </tr>
    </thead>
    <tbody>
      ${donors.map(donor => `
      <tr>
        <td>#${donor.id}</td>
        <td><strong>${donor.full_name || `${donor.first_name} ${donor.last_name}`}</strong></td>
        <td>${donor.phone || '-'}</td>
        <td>${donor.is_kafil ? '<span class="kafil-badge">كافل</span>' : 'متبرع'}</td>
        <td>${formatCurrency(donor.total_given)}</td>
        <td>${donor.kafil ? formatCurrency(donor.kafil.monthly_pledge) : '-'}</td>
        <td>${donor.kafil ? donor.kafil.sponsorships.length : '-'}</td>
        <td>${donor.kafil ? `${donor.kafil.sponsorship_utilization.toFixed(1)}%` : '-'}</td>
      </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="footer">
    <div>
      <p>تاريخ الطباعة: ${formatDateForExport(new Date())}</p>
      <p>الوقت: ${new Date().toLocaleTimeString('ar-MA')}</p>
      <p>إجمالي السجلات: ${donors.length}</p>
    </div>
    <div style="text-align: left;">
      <p>جمعية أماسو الخيرية</p>
      <p>قسم المتبرعين والكفلاء</p>
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
        disabled={isLoading || donors.length === 0}
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
        disabled={isLoading || donors.length === 0}
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
