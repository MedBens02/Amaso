"use client"

import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { FileText, Printer, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  exportDataToCSV,
  formatDateForExport,
  formatCurrency,
  maritalStatusArabic
} from "@/lib/export-utils"

interface Widow {
  id: number
  first_name: string
  last_name: string
  full_name: string
  phone: string
  email: string
  address?: string
  neighborhood?: string
  admission_date: string
  national_id: string
  birth_date: string
  age: number
  marital_status: string
  education_level?: string
  disability_flag: boolean
  disability_type?: string
  created_at: string
  orphans_count?: number
  sponsorships_count?: number
  total_sponsorship_amount?: number
}

interface ExportWidowsProps {
  widows: Widow[]
  filters?: Record<string, any>
  searchTerm?: string
}

export function ExportWidows({ widows, filters = {}, searchTerm }: ExportWidowsProps) {
  const { toast } = useToast()
  const [isExporting, setIsExporting] = useState(false)
  const [exportType, setExportType] = useState<'csv' | 'print' | null>(null)

  const handleExportCSV = async () => {
    setIsExporting(true)
    setExportType('csv')

    try {
      // Column mapping for CSV
      const columnMapping: Record<string, string> = {
        'id': 'رقم الأرملة',
        'full_name': 'الاسم الكامل',
        'national_id': 'رقم البطاقة الوطنية',
        'age': 'العمر',
        'birth_date': 'تاريخ الميلاد',
        'phone': 'رقم الهاتف',
        'email': 'البريد الإلكتروني',
        'address': 'العنوان',
        'neighborhood': 'الحي',
        'marital_status': 'الحالة الاجتماعية',
        'education_level': 'المستوى التعليمي',
        'disability_flag': 'إعاقة',
        'disability_type': 'نوع الإعاقة',
        'orphans_count': 'عدد الأيتام',
        'sponsorships_count': 'عدد الكفالات',
        'total_sponsorship_amount': 'إجمالي الكفالات (د.م)',
        'admission_date': 'تاريخ القبول',
        'created_at': 'تاريخ التسجيل'
      }

      // Transform widows data for CSV
      const csvData = widows.map(widow => ({
        id: widow.id,
        full_name: widow.full_name,
        national_id: widow.national_id || '',
        age: widow.age,
        birth_date: formatDateForExport(widow.birth_date),
        phone: widow.phone || '',
        email: widow.email || '',
        address: widow.address || '',
        neighborhood: widow.neighborhood || '',
        marital_status: maritalStatusArabic[widow.marital_status] || widow.marital_status,
        education_level: widow.education_level || '',
        disability_flag: widow.disability_flag ? 'نعم' : 'لا',
        disability_type: widow.disability_type || '',
        orphans_count: widow.orphans_count || 0,
        sponsorships_count: widow.sponsorships_count || 0,
        total_sponsorship_amount: widow.total_sponsorship_amount?.toFixed(2) || '0.00',
        admission_date: formatDateForExport(widow.admission_date),
        created_at: formatDateForExport(widow.created_at)
      }))

      exportDataToCSV(
        csvData,
        'widows',
        columnMapping,
        {
          entityType: 'widows',
          filters,
          searchTerm,
          totalCount: widows.length
        }
      )

      toast({
        title: "تم التصدير بنجاح",
        description: `تم تصدير ${widows.length} أرملة إلى ملف CSV`
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
      const totalWidows = widows.length
      const avgAge = totalWidows > 0 ? (widows.reduce((sum, w) => sum + w.age, 0) / totalWidows).toFixed(1) : '0'
      const totalOrphans = widows.reduce((sum, w) => sum + (w.orphans_count || 0), 0)
      const totalSponsorships = widows.reduce((sum, w) => sum + (w.sponsorships_count || 0), 0)
      const totalSponsorshipAmount = widows.reduce((sum, w) => sum + (w.total_sponsorship_amount || 0), 0)
      const sponsoredWidows = widows.filter(w => (w.sponsorships_count || 0) > 0).length
      const widowsWithDisability = widows.filter(w => w.disability_flag).length
      const sponsorshipCoverage = totalWidows > 0 ? ((sponsoredWidows / totalWidows) * 100).toFixed(1) : '0'

      // Marital status breakdown
      const maritalStatusBreakdown: Record<string, number> = {}
      widows.forEach(w => {
        const status = maritalStatusArabic[w.marital_status] || w.marital_status
        maritalStatusBreakdown[status] = (maritalStatusBreakdown[status] || 0) + 1
      })

      // Neighborhood breakdown
      const neighborhoodBreakdown: Record<string, number> = {}
      widows.forEach(w => {
        if (w.neighborhood) {
          neighborhoodBreakdown[w.neighborhood] = (neighborhoodBreakdown[w.neighborhood] || 0) + 1
        }
      })

      // Generate HTML for printing
      const htmlContent = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <title>تقرير الأرامل</title>
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
    .breakdown {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
      margin-bottom: 20px;
    }
    .breakdown-section {
      background: #f9f9f9;
      padding: 15px;
      border-radius: 5px;
    }
    .breakdown-section h3 {
      font-size: 14px;
      margin-bottom: 10px;
      color: #333;
    }
    .breakdown-item {
      display: flex;
      justify-content: space-between;
      padding: 5px 0;
      border-bottom: 1px solid #ddd;
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
    .badge {
      padding: 2px 6px;
      border-radius: 3px;
      font-size: 10px;
      font-weight: bold;
    }
    .badge-sponsored {
      background: #4CAF50;
      color: white;
    }
    .badge-not-sponsored {
      background: #f44336;
      color: white;
    }
    .badge-disability {
      background: #FF9800;
      color: white;
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
    <h2>تقرير الأرامل</h2>
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
      <h3>إجمالي الأرامل</h3>
      <p>${totalWidows}</p>
    </div>
    <div class="summary-card">
      <h3>متوسط العمر</h3>
      <p>${avgAge} سنة</p>
    </div>
    <div class="summary-card">
      <h3>إجمالي الأيتام</h3>
      <p>${totalOrphans}</p>
    </div>
    <div class="summary-card">
      <h3>أرامل مكفولة</h3>
      <p>${sponsoredWidows}</p>
    </div>
    <div class="summary-card">
      <h3>نسبة التغطية</h3>
      <p>${sponsorshipCoverage}%</p>
    </div>
    <div class="summary-card">
      <h3>إجمالي الكفالات</h3>
      <p>${formatCurrency(totalSponsorshipAmount)}</p>
    </div>
    <div class="summary-card">
      <h3>ذوات إعاقة</h3>
      <p>${widowsWithDisability}</p>
    </div>
    <div class="summary-card">
      <h3>نسبة الإعاقة</h3>
      <p>${totalWidows > 0 ? ((widowsWithDisability / totalWidows) * 100).toFixed(1) : 0}%</p>
    </div>
  </div>

  <div class="breakdown">
    ${Object.keys(maritalStatusBreakdown).length > 0 ? `
    <div class="breakdown-section">
      <h3>التوزيع حسب الحالة الاجتماعية</h3>
      ${Object.entries(maritalStatusBreakdown).map(([status, count]) => `
      <div class="breakdown-item">
        <span>${status}</span>
        <strong>${count}</strong>
      </div>
      `).join('')}
    </div>
    ` : ''}

    ${Object.keys(neighborhoodBreakdown).length > 0 ? `
    <div class="breakdown-section">
      <h3>التوزيع حسب الأحياء</h3>
      ${Object.entries(neighborhoodBreakdown).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([neighborhood, count]) => `
      <div class="breakdown-item">
        <span>${neighborhood}</span>
        <strong>${count}</strong>
      </div>
      `).join('')}
    </div>
    ` : ''}
  </div>

  <h3 style="margin: 20px 0 10px 0; font-size: 16px;">قائمة الأرامل</h3>

  <table>
    <thead>
      <tr>
        <th>الرقم</th>
        <th>الاسم الكامل</th>
        <th>العمر</th>
        <th>الهاتف</th>
        <th>الحي</th>
        <th>الأيتام</th>
        <th>الكفالات</th>
        <th>المبلغ</th>
        <th>الحالة</th>
      </tr>
    </thead>
    <tbody>
      ${widows.map(widow => `
      <tr>
        <td>#${widow.id}</td>
        <td><strong>${widow.full_name}</strong></td>
        <td>${widow.age} سنة</td>
        <td>${widow.phone || '-'}</td>
        <td>${widow.neighborhood || '-'}</td>
        <td>${widow.orphans_count || 0}</td>
        <td>${widow.sponsorships_count || 0}</td>
        <td>${formatCurrency(widow.total_sponsorship_amount || 0)}</td>
        <td>
          ${(widow.sponsorships_count || 0) > 0
            ? '<span class="badge badge-sponsored">مكفولة</span>'
            : '<span class="badge badge-not-sponsored">غير مكفولة</span>'}
          ${widow.disability_flag ? '<span class="badge badge-disability">إعاقة</span>' : ''}
        </td>
      </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="footer">
    <div>
      <p>تاريخ الطباعة: ${formatDateForExport(new Date())}</p>
      <p>الوقت: ${new Date().toLocaleTimeString('ar-MA')}</p>
      <p>إجمالي السجلات: ${totalWidows} أرملة</p>
    </div>
    <div style="text-align: left;">
      <p>جمعية أماسو الخيرية</p>
      <p>قسم الأرامل</p>
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
        disabled={isLoading || widows.length === 0}
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
        disabled={isLoading || widows.length === 0}
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
