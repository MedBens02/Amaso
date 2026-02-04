"use client"

import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { FileText, Printer, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  exportDataToCSV,
  formatDateForExport,
  genderArabic
} from "@/lib/export-utils"

interface Orphan {
  id: number
  full_name: string
  first_name: string
  last_name: string
  age: number
  gender: string
  birth_date: string
  education_level?: string
  health_status?: string
  created_at: string
}

interface WidowGroup {
  widow: {
    id: number
    full_name: string
    phone?: string
    neighborhood?: string
  }
  orphans: Orphan[]
}

interface ExportOrphansProps {
  orphanGroups: WidowGroup[]
  filters?: Record<string, any>
  searchTerm?: string
}

export function ExportOrphans({ orphanGroups, filters = {}, searchTerm }: ExportOrphansProps) {
  const { toast } = useToast()
  const [isExporting, setIsExporting] = useState(false)
  const [exportType, setExportType] = useState<'csv' | 'print' | null>(null)

  // Flatten orphans from groups for CSV export
  const allOrphans = orphanGroups.flatMap(group =>
    group.orphans.map(orphan => ({
      ...orphan,
      widow_name: group.widow.full_name,
      widow_phone: group.widow.phone || '',
      widow_neighborhood: group.widow.neighborhood || ''
    }))
  )

  const handleExportCSV = async () => {
    setIsExporting(true)
    setExportType('csv')

    try {
      // Column mapping for CSV
      const columnMapping: Record<string, string> = {
        'id': 'رقم اليتيم',
        'full_name': 'الاسم الكامل',
        'age': 'العمر',
        'gender': 'الجنس',
        'birth_date': 'تاريخ الميلاد',
        'education_level': 'المستوى التعليمي',
        'health_status': 'الحالة الصحية',
        'widow_name': 'اسم الأم',
        'widow_phone': 'هاتف الأم',
        'widow_neighborhood': 'حي السكن',
        'created_at': 'تاريخ التسجيل'
      }

      // Transform orphans data for CSV
      const csvData = allOrphans.map(orphan => ({
        id: orphan.id,
        full_name: orphan.full_name,
        age: orphan.age,
        gender: genderArabic[orphan.gender] || orphan.gender,
        birth_date: formatDateForExport(orphan.birth_date),
        education_level: orphan.education_level || '',
        health_status: orphan.health_status || '',
        widow_name: orphan.widow_name,
        widow_phone: orphan.widow_phone,
        widow_neighborhood: orphan.widow_neighborhood,
        created_at: formatDateForExport(orphan.created_at)
      }))

      exportDataToCSV(
        csvData,
        'orphans',
        columnMapping,
        {
          entityType: 'orphans',
          filters,
          searchTerm,
          totalCount: allOrphans.length
        }
      )

      toast({
        title: "تم التصدير بنجاح",
        description: `تم تصدير ${allOrphans.length} يتيم إلى ملف CSV`
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
      const totalOrphans = allOrphans.length
      const totalFamilies = orphanGroups.length
      const maleOrphans = allOrphans.filter(o => o.gender === 'male').length
      const femaleOrphans = allOrphans.filter(o => o.gender === 'female').length
      const avgOrphansPerFamily = totalFamilies > 0 ? (totalOrphans / totalFamilies).toFixed(1) : '0'

      // Age distribution
      const ageGroups = {
        '0-5': allOrphans.filter(o => o.age >= 0 && o.age <= 5).length,
        '6-12': allOrphans.filter(o => o.age >= 6 && o.age <= 12).length,
        '13-18': allOrphans.filter(o => o.age >= 13 && o.age <= 18).length,
        '18+': allOrphans.filter(o => o.age > 18).length
      }

      // Generate HTML for printing
      const htmlContent = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <title>تقرير الأيتام</title>
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
    .family-group {
      margin-bottom: 30px;
      border: 1px solid #ddd;
      border-radius: 5px;
      overflow: hidden;
    }
    .family-header {
      background: #2196F3;
      color: white;
      padding: 10px 15px;
      font-weight: bold;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th {
      background: #f5f5f5;
      color: #333;
      padding: 8px;
      text-align: right;
      font-size: 11px;
      border-bottom: 2px solid #ddd;
    }
    td {
      padding: 8px;
      border-bottom: 1px solid #ddd;
      font-size: 11px;
    }
    tr:nth-child(even) {
      background: #fafafa;
    }
    .gender-male {
      color: #2196F3;
      font-weight: bold;
    }
    .gender-female {
      color: #E91E63;
      font-weight: bold;
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
    <h2>تقرير الأيتام</h2>
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
      <h3>إجمالي الأيتام</h3>
      <p>${totalOrphans}</p>
    </div>
    <div class="summary-card">
      <h3>عدد الأسر</h3>
      <p>${totalFamilies}</p>
    </div>
    <div class="summary-card">
      <h3>متوسط الأيتام لكل أسرة</h3>
      <p>${avgOrphansPerFamily}</p>
    </div>
    <div class="summary-card">
      <h3>ذكور</h3>
      <p style="color: #2196F3;">${maleOrphans}</p>
    </div>
    <div class="summary-card">
      <h3>إناث</h3>
      <p style="color: #E91E63;">${femaleOrphans}</p>
    </div>
    <div class="summary-card">
      <h3>0-5 سنوات</h3>
      <p>${ageGroups['0-5']}</p>
    </div>
    <div class="summary-card">
      <h3>6-12 سنة</h3>
      <p>${ageGroups['6-12']}</p>
    </div>
    <div class="summary-card">
      <h3>13-18 سنة</h3>
      <p>${ageGroups['13-18']}</p>
    </div>
  </div>

  <h3 style="margin: 20px 0 10px 0; font-size: 16px;">الأيتام مجموعين حسب الأسر</h3>

  ${orphanGroups.map(group => `
  <div class="family-group">
    <div class="family-header">
      <span>الأم: ${group.widow.full_name}</span>
      ${group.widow.phone ? `<span style="margin-right: 20px;">📞 ${group.widow.phone}</span>` : ''}
      ${group.widow.neighborhood ? `<span style="margin-right: 20px;">📍 ${group.widow.neighborhood}</span>` : ''}
      <span style="float: left;">عدد الأيتام: ${group.orphans.length}</span>
    </div>
    <table>
      <thead>
        <tr>
          <th>الرقم</th>
          <th>الاسم الكامل</th>
          <th>العمر</th>
          <th>الجنس</th>
          <th>تاريخ الميلاد</th>
          <th>المستوى التعليمي</th>
          <th>الحالة الصحية</th>
        </tr>
      </thead>
      <tbody>
        ${group.orphans.map(orphan => `
        <tr>
          <td>#${orphan.id}</td>
          <td><strong>${orphan.full_name}</strong></td>
          <td>${orphan.age} سنة</td>
          <td class="gender-${orphan.gender}">${orphan.gender === 'male' ? 'ذكر' : 'أنثى'}</td>
          <td>${formatDateForExport(orphan.birth_date)}</td>
          <td>${orphan.education_level || '-'}</td>
          <td>${orphan.health_status || '-'}</td>
        </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
  `).join('')}

  <div class="footer">
    <div>
      <p>تاريخ الطباعة: ${formatDateForExport(new Date())}</p>
      <p>الوقت: ${new Date().toLocaleTimeString('ar-MA')}</p>
      <p>إجمالي السجلات: ${totalOrphans} يتيم في ${totalFamilies} أسرة</p>
    </div>
    <div style="text-align: left;">
      <p>جمعية أماسو الخيرية</p>
      <p>قسم الأيتام</p>
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
        disabled={isLoading || allOrphans.length === 0}
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
        disabled={isLoading || allOrphans.length === 0}
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
