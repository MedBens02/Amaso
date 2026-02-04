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

interface Donor {
  id: number
  first_name: string
  last_name: string
  phone: string
  email: string
  address?: string
  is_kafil: boolean
  created_at: string
  kafil?: {
    id: number
    monthly_pledge: number
    sponsorship_utilization: number
    sponsorships: any[]
  }
  incomes?: any[]
  total_given?: number
}

interface DonorsReportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DonorsReportDialog({ open, onOpenChange }: DonorsReportDialogProps) {
  const { toast } = useToast()
  const [donors, setDonors] = useState<Donor[]>([])
  const [loading, setLoading] = useState(false)
  const [statistics, setStatistics] = useState<StatisticItem[]>([])

  const { filters, appliedFilters, handleApply, handleClear, handleFiltersChange } = useReportFilters()

  // Define filter configuration
  const filterConfig: FilterOption[] = [
    {
      type: 'dateRange',
      field: 'registration_date',
      label: 'تاريخ التسجيل',
      placeholder: { from: 'من تاريخ', to: 'إلى تاريخ' }
    },
    {
      type: 'toggle',
      field: 'is_kafil',
      label: 'فقط الكفلاء'
    },
    {
      type: 'numberRange',
      field: 'monthly_pledge',
      label: 'التعهد الشهري (د.م)',
      placeholder: { from: 'من', to: 'إلى' }
    },
    {
      type: 'numberRange',
      field: 'utilization',
      label: 'نسبة الاستخدام (%)',
      placeholder: { from: 'من', to: 'إلى' }
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
      // Fetch donors
      const donorsResponse = await api.getDonors({
        per_page: 1000,
        ...appliedFilters
      })
      const donorsData = donorsResponse.data || []
      setDonors(donorsData)

      // Calculate statistics
      calculateStatistics(donorsData)
    } catch (error) {
      console.error('Error fetching donors data:', error)
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء جلب بيانات المتبرعين",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const calculateStatistics = (donorsData: Donor[]) => {
    const totalDonors = donorsData.length
    const kafils = donorsData.filter(d => d.is_kafil)
    const totalKafils = kafils.length

    // Total donations
    const totalDonations = donorsData.reduce((sum, donor) => {
      return sum + (donor.total_given || 0)
    }, 0)

    // Average donation per donor
    const avgDonation = totalDonors > 0 ? totalDonations / totalDonors : 0

    // Total monthly pledges
    const totalPledges = kafils.reduce((sum, donor) => {
      return sum + (donor.kafil?.monthly_pledge || 0)
    }, 0)

    // Average utilization
    const avgUtilization = totalKafils > 0
      ? kafils.reduce((sum, donor) => sum + (donor.kafil?.sponsorship_utilization || 0), 0) / totalKafils
      : 0

    // Kafils at 100% utilization
    const kafilsAt100 = kafils.filter(d => (d.kafil?.sponsorship_utilization || 0) >= 100).length

    // Kafils under 50% utilization
    const kafilsUnder50 = kafils.filter(d => (d.kafil?.sponsorship_utilization || 0) < 50).length

    setStatistics([
      { label: 'إجمالي المتبرعين', value: totalDonors, format: 'number' },
      { label: 'إجمالي الكفلاء', value: totalKafils, format: 'number' },
      { label: 'التبرعات', value: totalDonations, format: 'currency' },
      { label: 'متوسط التبرع', value: avgDonation, format: 'currency' },
      { label: 'التعهدات الشهرية', value: totalPledges, format: 'currency' },
      { label: 'متوسط الاستخدام', value: avgUtilization, format: 'percentage' }
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
    // Export donors CSV
    const donorsColumnMapping: Record<string, string> = {
      'id': 'رقم المتبرع',
      'full_name': 'الاسم الكامل',
      'phone': 'رقم الهاتف',
      'email': 'البريد الإلكتروني',
      'address': 'العنوان',
      'is_kafil': 'كافل',
      'total_given': 'إجمالي التبرعات (د.م)',
      'monthly_pledge': 'التعهد الشهري (د.م)',
      'utilization': 'نسبة الاستخدام (%)',
      'sponsorships_count': 'عدد الكفالات',
      'registration_date': 'تاريخ التسجيل'
    }

    const donorsData = donors.map(donor => ({
      id: donor.id,
      full_name: `${donor.first_name} ${donor.last_name}`,
      phone: donor.phone || '',
      email: donor.email || '',
      address: donor.address || '',
      is_kafil: donor.is_kafil ? 'نعم' : 'لا',
      total_given: (donor.total_given || 0).toFixed(2),
      monthly_pledge: donor.kafil ? donor.kafil.monthly_pledge.toFixed(2) : '0.00',
      utilization: donor.kafil ? donor.kafil.sponsorship_utilization.toFixed(1) : '0.0',
      sponsorships_count: donor.kafil ? donor.kafil.sponsorships.length : 0,
      registration_date: formatDateForExport(donor.created_at)
    }))

    exportDataToCSV(donorsData, 'donors_report', donorsColumnMapping, {
      entityType: 'donors',
      filters,
      totalCount: donors.length
    })

    // Export kafils detailed CSV
    const kafils = donors.filter(d => d.is_kafil && d.kafil)
    const kafilsColumnMapping: Record<string, string> = {
      'id': 'رقم الكافل',
      'full_name': 'الاسم الكامل',
      'phone': 'رقم الهاتف',
      'email': 'البريد الإلكتروني',
      'monthly_pledge': 'التعهد الشهري (د.م)',
      'total_sponsorship_amount': 'إجمالي الكفالات (د.م)',
      'remaining_pledge': 'المتبقي (د.م)',
      'utilization': 'نسبة الاستخدام (%)',
      'sponsorships_count': 'عدد الكفالات',
      'total_donated': 'إجمالي التبرعات (د.م)'
    }

    const kafilsData = kafils.map(donor => {
      const totalSponsorship = donor.kafil!.sponsorships.reduce((sum: number, s: any) => sum + parseFloat(s.amount || 0), 0)
      const remaining = donor.kafil!.monthly_pledge - totalSponsorship

      return {
        id: donor.id,
        full_name: `${donor.first_name} ${donor.last_name}`,
        phone: donor.phone || '',
        email: donor.email || '',
        monthly_pledge: donor.kafil!.monthly_pledge.toFixed(2),
        total_sponsorship_amount: totalSponsorship.toFixed(2),
        remaining_pledge: remaining.toFixed(2),
        utilization: donor.kafil!.sponsorship_utilization.toFixed(1),
        sponsorships_count: donor.kafil!.sponsorships.length,
        total_donated: (donor.total_given || 0).toFixed(2)
      }
    })

    exportDataToCSV(kafilsData, 'kafils_detailed_report', kafilsColumnMapping, {
      entityType: 'kafils',
      filters,
      totalCount: kafils.length
    })
  }

  const exportToPDF = async () => {
    toast({
      title: "قريباً",
      description: "تصدير PDF سيكون متاحاً قريباً"
    })
  }

  const printReport = async () => {
    const totalDonors = donors.length
    const kafils = donors.filter(d => d.is_kafil)
    const totalKafils = kafils.length

    const totalDonations = donors.reduce((sum, donor) => sum + (donor.total_given || 0), 0)
    const avgDonation = totalDonors > 0 ? totalDonations / totalDonors : 0

    const totalPledges = kafils.reduce((sum, donor) => sum + (donor.kafil?.monthly_pledge || 0), 0)
    const avgUtilization = totalKafils > 0
      ? kafils.reduce((sum, donor) => sum + (donor.kafil?.sponsorship_utilization || 0), 0) / totalKafils
      : 0

    // Top 10 donors
    const topDonors = [...donors]
      .sort((a, b) => (b.total_given || 0) - (a.total_given || 0))
      .slice(0, 10)

    // Kafils by utilization
    const kafilsAt100 = kafils.filter(d => (d.kafil?.sponsorship_utilization || 0) >= 100)
    const kafilsUnder50 = kafils.filter(d => (d.kafil?.sponsorship_utilization || 0) < 50)

    const htmlContent = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <title>تقرير الكفلاء والمتبرعين</title>
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
    .section-title {
      font-size: 16px;
      font-weight: bold;
      margin: 25px 0 10px 0;
      color: #333;
      border-bottom: 2px solid #ddd;
      padding-bottom: 5px;
    }
    .badge {
      padding: 2px 8px;
      border-radius: 3px;
      font-size: 10px;
      font-weight: bold;
    }
    .badge-excellent { background: #4CAF50; color: white; }
    .badge-good { background: #8BC34A; color: white; }
    .badge-warning { background: #FF9800; color: white; }
    .badge-danger { background: #f44336; color: white; }
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
    <h2>تقرير الكفلاء والمتبرعين</h2>
  </div>

  <div class="summary">
    <div class="summary-card">
      <h3>إجمالي المتبرعين</h3>
      <p>${totalDonors}</p>
    </div>
    <div class="summary-card">
      <h3>إجمالي الكفلاء</h3>
      <p>${totalKafils}</p>
    </div>
    <div class="summary-card">
      <h3>إجمالي التبرعات</h3>
      <p>${formatCurrency(totalDonations)}</p>
    </div>
    <div class="summary-card">
      <h3>متوسط التبرع</h3>
      <p>${formatCurrency(avgDonation)}</p>
    </div>
    <div class="summary-card">
      <h3>التعهدات الشهرية</h3>
      <p>${formatCurrency(totalPledges)}</p>
    </div>
    <div class="summary-card">
      <h3>متوسط الاستخدام</h3>
      <p>${avgUtilization.toFixed(1)}%</p>
    </div>
  </div>

  <h3 class="section-title">أبرز المتبرعين (أعلى 10)</h3>
  <table>
    <thead>
      <tr>
        <th>المرتبة</th>
        <th>الاسم</th>
        <th>الهاتف</th>
        <th>إجمالي التبرعات</th>
        <th>كافل</th>
      </tr>
    </thead>
    <tbody>
      ${topDonors.map((donor, index) => `
      <tr>
        <td>${index + 1}</td>
        <td><strong>${donor.first_name} ${donor.last_name}</strong></td>
        <td>${donor.phone || '-'}</td>
        <td><strong>${formatCurrency(donor.total_given || 0)}</strong></td>
        <td>${donor.is_kafil ? '✓' : '-'}</td>
      </tr>
      `).join('')}
    </tbody>
  </table>

  <h3 class="section-title">الكفلاء حسب نسبة الاستخدام</h3>
  <table>
    <thead>
      <tr>
        <th>الاسم</th>
        <th>التعهد الشهري</th>
        <th>الكفالات</th>
        <th>نسبة الاستخدام</th>
        <th>الحالة</th>
      </tr>
    </thead>
    <tbody>
      ${kafils.map(donor => {
        const utilization = donor.kafil?.sponsorship_utilization || 0
        const badgeClass = utilization >= 90 ? 'badge-excellent' :
                          utilization >= 70 ? 'badge-good' :
                          utilization >= 50 ? 'badge-warning' : 'badge-danger'
        const totalSponsorship = donor.kafil!.sponsorships.reduce((sum: number, s: any) => sum + parseFloat(s.amount || 0), 0)

        return `
      <tr>
        <td>${donor.first_name} ${donor.last_name}</td>
        <td>${formatCurrency(donor.kafil!.monthly_pledge)}</td>
        <td>${formatCurrency(totalSponsorship)}</td>
        <td><strong>${utilization.toFixed(1)}%</strong></td>
        <td>
          <span class="badge ${badgeClass}">
            ${utilization >= 90 ? 'ممتاز' : utilization >= 70 ? 'جيد' : utilization >= 50 ? 'متوسط' : 'ضعيف'}
          </span>
        </td>
      </tr>
      `}).join('')}
    </tbody>
  </table>

  <div class="footer">
    <div>
      <p>تاريخ الطباعة: ${formatDateForExport(new Date())}</p>
      <p>الوقت: ${new Date().toLocaleTimeString('ar-MA')}</p>
    </div>
    <div style="text-align: left;">
      <p>جمعية أماسو الخيرية</p>
      <p>قسم الكفلاء والمتبرعين</p>
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
      title="تقرير الكفلاء والمتبرعين"
      description="إحصائيات المتبرعين والكفلاء ومساهماتهم"
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
