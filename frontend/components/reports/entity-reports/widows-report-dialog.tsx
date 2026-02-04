"use client"

import { useState, useEffect } from "react"
import { ReportDialog, ExportFormat, StatisticItem, useReportDialog } from "../report-dialog"
import { ReportFilters, FilterOption, useReportFilters } from "../report-filters"
import { useToast } from "@/hooks/use-toast"
import api from "@/lib/api"
import {
  exportDataToCSV,
  formatDateForExport,
  formatCurrency,
  maritalStatusArabic
} from "@/lib/export-utils"

interface Widow {
  id: number
  full_name: string
  phone: string
  address?: string
  neighborhood?: string
  age: number
  marital_status: string
  education_level?: string
  disability_flag: boolean
  disability_type?: string
  orphans_count?: number
  sponsorships_count?: number
  total_sponsorship_amount?: number
  created_at: string
  admission_date: string
}

interface Orphan {
  id: number
  full_name: string
  age: number
  gender: string
  birth_date: string
  education_level?: string
  health_status?: string
  widow_id: number
  widow?: {
    full_name: string
    phone: string
  }
}

interface WidowsReportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function WidowsReportDialog({ open, onOpenChange }: WidowsReportDialogProps) {
  const { toast } = useToast()
  const [widows, setWidows] = useState<Widow[]>([])
  const [orphans, setOrphans] = useState<Orphan[]>([])
  const [loading, setLoading] = useState(false)
  const [statistics, setStatistics] = useState<StatisticItem[]>([])

  const { filters, appliedFilters, handleApply, handleClear, handleFiltersChange } = useReportFilters()

  // Define filter configuration
  const filterConfig: FilterOption[] = [
    {
      type: 'dateRange',
      field: 'admission_date',
      label: 'تاريخ القبول',
      placeholder: { from: 'من تاريخ', to: 'إلى تاريخ' }
    },
    {
      type: 'select',
      field: 'neighborhood',
      label: 'الحي',
      placeholder: 'اختر الحي',
      options: [] // Will be populated dynamically
    },
    {
      type: 'select',
      field: 'marital_status',
      label: 'الحالة الاجتماعية',
      placeholder: 'اختر الحالة',
      options: [
        { label: 'أرملة', value: 'widow' },
        { label: 'مطلقة', value: 'divorced' },
        { label: 'متزوجة', value: 'married' },
        { label: 'عزباء', value: 'single' }
      ]
    },
    {
      type: 'toggle',
      field: 'disability_flag',
      label: 'فقط ذوات الإعاقة'
    },
    {
      type: 'select',
      field: 'education_level',
      label: 'المستوى التعليمي',
      placeholder: 'اختر المستوى',
      options: [
        { label: 'أمي', value: 'أمي' },
        { label: 'ابتدائي', value: 'ابتدائي' },
        { label: 'إعدادي', value: 'إعدادي' },
        { label: 'ثانوي', value: 'ثانوي' },
        { label: 'جامعي', value: 'جامعي' }
      ]
    },
    {
      type: 'numberRange',
      field: 'age',
      label: 'العمر',
      placeholder: { from: 'من', to: 'إلى' }
    },
    {
      type: 'toggle',
      field: 'has_sponsorship',
      label: 'فقط المكفولات'
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
      // Fetch widows
      const widowsResponse = await api.getWidows({
        per_page: 1000,
        ...appliedFilters
      })
      const widowsData = widowsResponse.data || []
      setWidows(widowsData)

      // Fetch orphans
      const orphansResponse = await api.getOrphans({
        per_page: 1000
      })

      // Flatten orphan groups
      const allOrphans = orphansResponse.data?.flatMap((group: any) =>
        group.orphans?.map((orphan: any) => ({
          ...orphan,
          widow: {
            full_name: group.widow.full_name,
            phone: group.widow.phone
          }
        })) || []
      ) || []

      setOrphans(allOrphans)

      // Calculate statistics
      calculateStatistics(widowsData, allOrphans)
    } catch (error) {
      console.error('Error fetching data:', error)
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء جلب البيانات",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const calculateStatistics = (widowsData: Widow[], orphansData: Orphan[]) => {
    const totalWidows = widowsData.length
    const totalOrphans = orphansData.length

    // Calculate unique families (widows with orphans)
    const widowIds = new Set(orphansData.map(o => o.widow_id))
    const totalFamilies = widowIds.size

    // Average orphans per family
    const avgOrphansPerFamily = totalFamilies > 0 ? totalOrphans / totalFamilies : 0

    // Sponsorship coverage
    const sponsoredWidows = widowsData.filter(w => (w.sponsorships_count || 0) > 0).length
    const sponsorshipCoverage = totalWidows > 0 ? (sponsoredWidows / totalWidows) * 100 : 0

    // Disability percentage
    const widowsWithDisability = widowsData.filter(w => w.disability_flag).length
    const disabilityPercentage = totalWidows > 0 ? (widowsWithDisability / totalWidows) * 100 : 0

    setStatistics([
      { label: 'إجمالي الأرامل', value: totalWidows, format: 'number' },
      { label: 'إجمالي الأيتام', value: totalOrphans, format: 'number' },
      { label: 'العائلات', value: totalFamilies, format: 'number' },
      { label: 'متوسط الأيتام', value: avgOrphansPerFamily, format: 'number' },
      { label: 'نسبة التغطية', value: sponsorshipCoverage, format: 'percentage' },
      { label: 'نسبة الإعاقة', value: disabilityPercentage, format: 'percentage' }
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
    // Export widows CSV
    const widowsColumnMapping: Record<string, string> = {
      'id': 'رقم الأرملة',
      'full_name': 'الاسم الكامل',
      'age': 'العمر',
      'phone': 'رقم الهاتف',
      'address': 'العنوان',
      'neighborhood': 'الحي',
      'marital_status': 'الحالة الاجتماعية',
      'education_level': 'المستوى التعليمي',
      'disability_flag': 'إعاقة',
      'disability_type': 'نوع الإعاقة',
      'orphans_count': 'عدد الأيتام',
      'sponsorships_count': 'عدد الكفالات',
      'total_sponsorship_amount': 'إجمالي الكفالات (د.م)',
      'admission_date': 'تاريخ القبول'
    }

    const widowsData = widows.map(widow => ({
      id: widow.id,
      full_name: widow.full_name,
      age: widow.age,
      phone: widow.phone || '',
      address: widow.address || '',
      neighborhood: widow.neighborhood || '',
      marital_status: maritalStatusArabic[widow.marital_status] || widow.marital_status,
      education_level: widow.education_level || '',
      disability_flag: widow.disability_flag ? 'نعم' : 'لا',
      disability_type: widow.disability_type || '',
      orphans_count: widow.orphans_count || 0,
      sponsorships_count: widow.sponsorships_count || 0,
      total_sponsorship_amount: (widow.total_sponsorship_amount || 0).toFixed(2),
      admission_date: formatDateForExport(widow.admission_date)
    }))

    exportDataToCSV(widowsData, 'widows_report', widowsColumnMapping, {
      entityType: 'widows',
      filters,
      totalCount: widows.length
    })

    // Export orphans CSV
    const orphansColumnMapping: Record<string, string> = {
      'id': 'رقم اليتيم',
      'full_name': 'الاسم الكامل',
      'age': 'العمر',
      'gender': 'الجنس',
      'birth_date': 'تاريخ الميلاد',
      'education_level': 'المستوى التعليمي',
      'health_status': 'الحالة الصحية',
      'widow_name': 'اسم الأم',
      'widow_phone': 'هاتف الأم'
    }

    const orphansData = orphans.map(orphan => ({
      id: orphan.id,
      full_name: orphan.full_name,
      age: orphan.age,
      gender: orphan.gender === 'male' ? 'ذكر' : 'أنثى',
      birth_date: formatDateForExport(orphan.birth_date),
      education_level: orphan.education_level || '',
      health_status: orphan.health_status || '',
      widow_name: orphan.widow?.full_name || '',
      widow_phone: orphan.widow?.phone || ''
    }))

    exportDataToCSV(orphansData, 'orphans_report', orphansColumnMapping, {
      entityType: 'orphans',
      totalCount: orphans.length
    })
  }

  const exportToPDF = async () => {
    toast({
      title: "قريباً",
      description: "تصدير PDF سيكون متاحاً قريباً"
    })
  }

  const printReport = async () => {
    const totalWidows = widows.length
    const totalOrphans = orphans.length
    const avgAge = totalWidows > 0 ? (widows.reduce((sum, w) => sum + w.age, 0) / totalWidows).toFixed(1) : '0'
    const sponsoredWidows = widows.filter(w => (w.sponsorships_count || 0) > 0).length
    const widowsWithDisability = widows.filter(w => w.disability_flag).length
    const sponsorshipCoverage = totalWidows > 0 ? ((sponsoredWidows / totalWidows) * 100).toFixed(1) : '0'
    const totalSponsorshipAmount = widows.reduce((sum, w) => sum + (w.total_sponsorship_amount || 0), 0)

    // Group orphans by gender
    const maleOrphans = orphans.filter(o => o.gender === 'male').length
    const femaleOrphans = orphans.filter(o => o.gender === 'female').length

    const htmlContent = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <title>تقرير الأرامل والأيتام</title>
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
    .footer {
      margin-top: 20px;
      padding-top: 10px;
      border-top: 2px solid #333;
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      color: #666;
    }
    .section-title {
      font-size: 16px;
      font-weight: bold;
      margin: 20px 0 10px 0;
      color: #333;
    }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>جمعية أماسو الخيرية</h1>
    <h2>تقرير الأرامل والأيتام</h2>
  </div>

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
  </div>

  <h3 class="section-title">قائمة الأرامل (${totalWidows})</h3>
  <table>
    <thead>
      <tr>
        <th>الرقم</th>
        <th>الاسم</th>
        <th>العمر</th>
        <th>الهاتف</th>
        <th>الحي</th>
        <th>الأيتام</th>
        <th>الكفالات</th>
      </tr>
    </thead>
    <tbody>
      ${widows.map(widow => `
      <tr>
        <td>#${widow.id}</td>
        <td>${widow.full_name}</td>
        <td>${widow.age} سنة</td>
        <td>${widow.phone || '-'}</td>
        <td>${widow.neighborhood || '-'}</td>
        <td>${widow.orphans_count || 0}</td>
        <td>${formatCurrency(widow.total_sponsorship_amount || 0)}</td>
      </tr>
      `).join('')}
    </tbody>
  </table>

  <h3 class="section-title">إحصائيات الأيتام</h3>
  <div class="summary" style="margin-bottom: 15px;">
    <div class="summary-card">
      <h3>إجمالي الأيتام</h3>
      <p>${totalOrphans}</p>
    </div>
    <div class="summary-card">
      <h3>ذكور</h3>
      <p>${maleOrphans}</p>
    </div>
    <div class="summary-card">
      <h3>إناث</h3>
      <p>${femaleOrphans}</p>
    </div>
  </div>

  <div class="footer">
    <div>
      <p>تاريخ الطباعة: ${formatDateForExport(new Date())}</p>
      <p>الوقت: ${new Date().toLocaleTimeString('ar-MA')}</p>
    </div>
    <div style="text-align: left;">
      <p>جمعية أماسو الخيرية</p>
      <p>قسم الأرامل والأيتام</p>
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
      title="تقرير الأرامل والأيتام"
      description="إحصائيات شاملة عن الأرامل والأيتام المسجلين"
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
