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
  type PDFCardSection,
  type InfoItem
} from "@/components/reports"
import { generatePDFFromHTML, generatePDFFilename } from "@/lib/pdf-generator"
import { formatCurrency, formatDateForExport, formatDateTimeForExport } from "@/lib/export-utils"

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
    id: number
    monthly_pledge: number
    total_sponsorship_amount: number
    remaining_pledge_amount: number
    sponsorship_utilization: number
    sponsorships: Array<{
      id: number
      amount: number
      widow: {
        id: number
        first_name: string
        last_name: string
        full_name: string
        orphans_count?: number
      }
    }>
  }
  // Optional: donation history (if fetched)
  incomes?: Array<{
    id: number
    income_date: string
    amount: number
    payment_method: string
    status: string
    income_category?: {
      label: string
    }
  }>
}

interface PrintDonorPDFProps {
  donor: Donor
  variant?: 'default' | 'icon'
  showDonationHistory?: boolean
}

export function PrintDonorPDF({ donor, variant = 'default', showDonationHistory = true }: PrintDonorPDFProps) {
  const printRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()
  const [isGenerating, setIsGenerating] = useState(false)

  const fullName = donor.full_name || `${donor.first_name} ${donor.last_name}`

  const generatePDF = async () => {
    if (!printRef.current || isGenerating) return

    setIsGenerating(true)

    try {
      toast({
        title: "جاري إنشاء الـ PDF...",
        description: "يرجى الانتظار بينما يتم إعداد بطاقة المتبرع"
      })

      const filename = generatePDFFilename('donor', fullName)
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
    { label: "رقم الهاتف", value: donor.phone || 'غير محدد' },
    { label: "البريد الإلكتروني", value: donor.email || 'غير محدد' },
    { label: "العنوان", value: donor.address || 'غير محدد', fullWidth: true },
    { label: "تاريخ التسجيل", value: formatDateForExport(donor.created_at) }
  ]

  sections.push({
    title: "المعلومات الشخصية",
    icon: Users,
    content: <InfoGrid items={personalInfo} columns={2} />
  })

  // Financial Summary Section
  const totalDonations = donor.incomes?.length || 0
  const averageDonation = totalDonations > 0 ? donor.total_given / totalDonations : 0
  const lastDonation = donor.incomes?.[0] // Assuming sorted by date desc

  const financialInfo: InfoItem[] = [
    {
      label: "إجمالي التبرعات",
      value: formatCurrency(donor.total_given),
      highlight: true
    },
    {
      label: "عدد التبرعات",
      value: totalDonations
    },
    {
      label: "متوسط التبرع",
      value: formatCurrency(averageDonation)
    },
    {
      label: "آخر تبرع",
      value: lastDonation ? formatDateForExport(lastDonation.income_date) : 'لا يوجد'
    }
  ]

  sections.push({
    title: "الملخص المالي",
    icon: DollarSign,
    content: <InfoGrid items={financialInfo} columns={2} />
  })

  // Kafil Information (if applicable)
  if (donor.is_kafil && donor.kafil) {
    const kafilInfo: InfoItem[] = [
      {
        label: "التعهد الشهري",
        value: formatCurrency(donor.kafil.monthly_pledge),
        highlight: true
      },
      {
        label: "إجمالي الكفالات",
        value: formatCurrency(donor.kafil.total_sponsorship_amount)
      },
      {
        label: "المتبقي من التعهد",
        value: formatCurrency(donor.kafil.remaining_pledge_amount)
      },
      {
        label: "نسبة الاستخدام",
        value: `${donor.kafil.sponsorship_utilization.toFixed(1)}%`
      }
    ]

    sections.push({
      title: "معلومات الكفالة",
      icon: DollarSign,
      content: (
        <>
          <InfoGrid items={kafilInfo} columns={2} />
          {donor.kafil.sponsorships && donor.kafil.sponsorships.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-semibold mb-2">الأرامل المكفولة</h4>
              <PDFTable
                headers={["الأرملة", "عدد الأيتام", "مبلغ الكفالة"]}
                rows={donor.kafil.sponsorships.map(sp => [
                  sp.widow.full_name,
                  sp.widow.orphans_count || '-',
                  formatCurrency(sp.amount)
                ])}
              />
            </div>
          )}
        </>
      )
    })
  }

  // Donation History Section (if data available and requested)
  if (showDonationHistory && donor.incomes && donor.incomes.length > 0) {
    const recentDonations = donor.incomes.slice(0, 10) // Last 10 donations

    sections.push({
      title: "آخر التبرعات (آخر 10)",
      icon: FileText,
      content: (
        <PDFTable
          headers={["التاريخ", "المبلغ", "الفئة", "طريقة الدفع", "الحالة"]}
          rows={recentDonations.map(income => [
            formatDateForExport(income.income_date),
            formatCurrency(parseFloat(String(income.amount))),
            income.income_category?.label || 'غير محدد',
            income.payment_method === 'Cash' ? 'نقدي' :
              income.payment_method === 'Cheque' ? 'شيك' :
                income.payment_method === 'BankWire' ? 'حوالة بنكية' : income.payment_method,
            income.status === 'Approved' ? 'معتمد' :
              income.status === 'Draft' ? 'مسودة' : income.status
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
      طباعة بطاقة المتبرع
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
              title: "بطاقة معلومات المتبرع",
              subtitle: donor.is_kafil ? "متبرع وكافل" : undefined,
              entityName: fullName,
              entityId: `#${donor.id}`,
              badge: donor.is_kafil ? { text: "كافل", color: "blue" } : undefined
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
                  <p>نظام إدارة الجمعية</p>
                </>
              )
            }}
          />
        </div>
      </HiddenPDFWrapper>
    </>
  )
}
