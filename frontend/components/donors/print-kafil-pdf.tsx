"use client"

import React, { useRef, useState } from 'react'
import { Button } from "@/components/ui/button"
import { Printer, FileDown, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  PDFCardTemplate,
  HiddenPDFWrapper,
  InfoGrid,
  PDFTable,
  PDFBadge,
  Users,
  Phone,
  MapPin,
  DollarSign,
  FileText,
  Heart,
  type PDFCardSection,
  type InfoItem
} from "@/components/reports"
import { generatePDFFromHTML, generatePDFFilename } from "@/lib/pdf-generator"
import { formatCurrency, formatDateForExport } from "@/lib/export-utils"

interface Widow {
  id: number
  first_name: string
  last_name: string
  full_name: string
  national_id?: string
  phone?: string
  neighborhood?: string
  orphans_count?: number
  orphans?: Array<{
    id: number
    first_name: string
    last_name: string
    age: number
    gender: string
    education_level?: string
  }>
}

interface Sponsorship {
  id: number
  widow_id: number
  amount: number
  created_at?: string
  widow?: Widow
}

interface Kafil {
  id: number
  first_name: string
  last_name: string
  full_name?: string
  phone?: string
  email?: string
  address?: string
  donor_id: number
  monthly_pledge: number
  total_sponsorship_amount: number
  remaining_pledge_amount: number
  sponsorship_utilization: number
  sponsorships: Sponsorship[]
  donor?: {
    id: number
    first_name: string
    last_name: string
    full_name: string
    total_given: number
  }
  created_at?: string
  // Optional: donation history
  incomes?: Array<{
    id: number
    income_date: string
    amount: number
    payment_method: string
    status: string
  }>
}

interface PrintKafilPDFProps {
  kafil: Kafil
  variant?: 'default' | 'icon'
  showDetailedWidows?: boolean
}

export function PrintKafilPDF({ kafil, variant = 'default', showDetailedWidows = true }: PrintKafilPDFProps) {
  const printRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()
  const [isGenerating, setIsGenerating] = useState(false)

  const fullName = kafil.full_name || `${kafil.first_name} ${kafil.last_name}`

  const generatePDF = async () => {
    if (!printRef.current || isGenerating) return

    setIsGenerating(true)

    try {
      toast({
        title: "جاري إنشاء الـ PDF...",
        description: "يرجى الانتظار بينما يتم إعداد بطاقة الكفيل"
      })

      const filename = generatePDFFilename('kafil', fullName)
      const result = await generatePDFFromHTML(printRef, filename, {
        scale: 2,
        multiPage: true
      })

      if (result.success) {
        toast({
          title: "تم إنشاء الـ PDF بنجاح",
          description: `تم حفظ بطاقة ${fullName} كملف PDF`
        })
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error('Error generating PDF:', error)
      toast({
        title: "خطأ في إنشاء الـ PDF",
        description: "حدث خطأ أثناء إنشاء ملف الـ PDF. يرجى المحاولة مرة أخرى",
        variant: "destructive"
      })
    } finally {
      setIsGenerating(false)
    }
  }

  // Build sections
  const sections: PDFCardSection[] = []

  // Personal Information Section
  const personalInfo: InfoItem[] = [
    { label: "الاسم الكامل", value: fullName, highlight: true, fullWidth: true },
    { label: "رقم الهاتف", value: kafil.phone || 'غير محدد' },
    { label: "البريد الإلكتروني", value: kafil.email || 'غير محدد' },
    { label: "العنوان", value: kafil.address || 'غير محدد', fullWidth: true }
  ]

  if (kafil.donor) {
    personalInfo.push({
      label: "المتبرع المرتبط",
      value: kafil.donor.full_name,
      fullWidth: true
    })
  }

  if (kafil.created_at) {
    personalInfo.push({
      label: "تاريخ التسجيل ككافل",
      value: formatDateForExport(kafil.created_at)
    })
  }

  sections.push({
    title: "المعلومات الشخصية",
    icon: Users,
    content: <InfoGrid items={personalInfo} columns={2} />
  })

  // Sponsorship Commitment Section
  const utilizationPercentage = kafil.sponsorship_utilization
  const utilizationColor =
    utilizationPercentage >= 90 ? 'red' :
    utilizationPercentage >= 70 ? 'yellow' :
    'green'

  const commitmentInfo: InfoItem[] = [
    {
      label: "التعهد الشهري",
      value: formatCurrency(kafil.monthly_pledge),
      highlight: true
    },
    {
      label: "إجمالي الكفالات الشهرية",
      value: formatCurrency(kafil.total_sponsorship_amount)
    },
    {
      label: "المتبقي من التعهد",
      value: formatCurrency(kafil.remaining_pledge_amount)
    },
    {
      label: "نسبة استخدام التعهد",
      value: `${utilizationPercentage.toFixed(1)}%`
    },
    {
      label: "عدد الأرامل المكفولة",
      value: kafil.sponsorships?.length || 0
    },
    {
      label: "إجمالي التبرعات",
      value: kafil.donor ? formatCurrency(kafil.donor.total_given) : 'غير متوفر'
    }
  ]

  sections.push({
    title: "معلومات الكفالة والتعهد",
    icon: Heart,
    content: (
      <div className="space-y-3">
        <InfoGrid items={commitmentInfo} columns={2} />
        <div className={`p-3 rounded ${
          utilizationColor === 'red' ? 'bg-red-50' :
          utilizationColor === 'yellow' ? 'bg-yellow-50' :
          'bg-green-50'
        }`}>
          <p className="text-xs font-semibold mb-1">حالة الاستخدام</p>
          <p className="text-sm">
            {utilizationPercentage >= 100 ? 'تم تجاوز التعهد الشهري' :
             utilizationPercentage >= 90 ? 'قريب من الحد الأقصى' :
             utilizationPercentage >= 70 ? 'استخدام جيد' :
             'يوجد مساحة متاحة للكفالة'}
          </p>
        </div>
      </div>
    )
  })

  // Sponsored Widows Summary Section
  if (kafil.sponsorships && kafil.sponsorships.length > 0) {
    const totalOrphans = kafil.sponsorships.reduce((sum, sp) => {
      return sum + (sp.widow?.orphans_count || 0)
    }, 0)

    sections.push({
      title: `الأرامل المكفولة (${kafil.sponsorships.length})`,
      icon: Users,
      content: (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3 mb-3">
            <div className="bg-blue-50 p-3 rounded text-center">
              <p className="text-xs text-gray-600 mb-1">عدد الأرامل</p>
              <p className="text-lg font-bold">{kafil.sponsorships.length}</p>
            </div>
            <div className="bg-green-50 p-3 rounded text-center">
              <p className="text-xs text-gray-600 mb-1">إجمالي الأيتام</p>
              <p className="text-lg font-bold">{totalOrphans}</p>
            </div>
            <div className="bg-purple-50 p-3 rounded text-center">
              <p className="text-xs text-gray-600 mb-1">المبلغ الشهري</p>
              <p className="text-lg font-bold">{formatCurrency(kafil.total_sponsorship_amount)}</p>
            </div>
          </div>

          <PDFTable
            headers={["الأرملة", "الحي", "عدد الأيتام", "مبلغ الكفالة الشهرية"]}
            rows={kafil.sponsorships.map(sp => [
              sp.widow?.full_name || 'غير محدد',
              sp.widow?.neighborhood || '-',
              sp.widow?.orphans_count || '-',
              formatCurrency(sp.amount)
            ])}
          />
        </div>
      )
    })
  }

  // Detailed Widow Information (if requested and data available)
  if (showDetailedWidows && kafil.sponsorships && kafil.sponsorships.length > 0) {
    const widowsWithDetails = kafil.sponsorships.filter(sp => sp.widow?.orphans && sp.widow.orphans.length > 0)

    if (widowsWithDetails.length > 0) {
      widowsWithDetails.forEach((sp, index) => {
        const widow = sp.widow!

        sections.push({
          title: `تفاصيل العائلة ${index + 1}: ${widow.full_name}`,
          icon: Users,
          className: "bg-gray-50 p-3 rounded",
          content: (
            <div className="space-y-3">
              <InfoGrid
                items={[
                  { label: "اسم الأرملة", value: widow.full_name },
                  { label: "رقم الهاتف", value: widow.phone || 'غير محدد' },
                  { label: "الحي", value: widow.neighborhood || 'غير محدد' },
                  { label: "مبلغ الكفالة الشهرية", value: formatCurrency(sp.amount), highlight: true }
                ]}
                columns={2}
              />

              {widow.orphans && widow.orphans.length > 0 && (
                <div className="mt-3">
                  <h5 className="text-sm font-semibold mb-2">الأيتام ({widow.orphans.length})</h5>
                  <PDFTable
                    headers={["الاسم", "العمر", "الجنس", "المستوى التعليمي"]}
                    rows={widow.orphans.map(orphan => [
                      `${orphan.first_name} ${orphan.last_name}`,
                      orphan.age,
                      orphan.gender === 'Male' ? 'ذكر' : 'أنثى',
                      orphan.education_level || 'غير محدد'
                    ])}
                  />
                </div>
              )}
            </div>
          )
        })
      })
    }
  }

  // Recent Donations Section (if available)
  if (kafil.incomes && kafil.incomes.length > 0) {
    const recentDonations = kafil.incomes.slice(0, 5)

    sections.push({
      title: "آخر التبرعات (آخر 5)",
      icon: DollarSign,
      content: (
        <PDFTable
          headers={["التاريخ", "المبلغ", "طريقة الدفع", "الحالة"]}
          rows={recentDonations.map(income => [
            formatDateForExport(income.income_date),
            formatCurrency(parseFloat(String(income.amount))),
            income.payment_method === 'Cash' ? 'نقدي' :
              income.payment_method === 'Cheque' ? 'شيك' :
                income.payment_method === 'BankWire' ? 'حوالة بنكية' : income.payment_method,
            income.status === 'Approved' ? 'معتمد' : income.status === 'Draft' ? 'مسودة' : income.status
          ])}
        />
      )
    })
  }

  // Render button
  const ButtonContent = isGenerating ? (
    <>
      <Loader2 className="ml-2 h-4 w-4 animate-spin" />
      جاري الإنشاء...
    </>
  ) : variant === 'icon' ? (
    <FileDown className="h-4 w-4" />
  ) : (
    <>
      <Printer className="ml-2 h-4 w-4" />
      طباعة بطاقة الكفيل
    </>
  )

  return (
    <>
      <Button
        onClick={generatePDF}
        disabled={isGenerating}
        variant={variant === 'icon' ? 'ghost' : 'outline'}
        size={variant === 'icon' ? 'sm' : 'default'}
      >
        {ButtonContent}
      </Button>

      <HiddenPDFWrapper>
        <div ref={printRef}>
          <PDFCardTemplate
            header={{
              organizationName: "جمعية أماسو الخيرية",
              title: "بطاقة معلومات الكفيل",
              subtitle: "كفالة الأرامل والأيتام",
              entityName: fullName,
              entityId: `#${kafil.id}`,
              badge: {
                text: `${kafil.sponsorships?.length || 0} أرملة مكفولة`,
                color: "blue"
              }
            }}
            sections={sections}
            footer={{
              leftContent: (
                <>
                  <p>تاريخ الطباعة: {formatDateForExport(new Date())}</p>
                  <p>الوقت: {new Date().toLocaleTimeString('ar-MA')}</p>
                </>
              ),
              rightContent: (
                <>
                  <p>جمعية أماسو الخيرية</p>
                  <p>نظام إدارة الجمعية - قسم الكفالات</p>
                </>
              )
            }}
          />
        </div>
      </HiddenPDFWrapper>
    </>
  )
}
