"use client"

import React, { useRef, useState } from 'react'
import { Button } from "@/components/ui/button"
import { FileDown, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { PDFCardTemplate, PDFCardSection, InfoGrid, InfoItem, Users, GraduationCap, Heart, Phone, MapPin } from "@/components/reports"
import { formatDateArabic } from "@/lib/date-utils"

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
  widow?: {
    id: number
    full_name: string
    phone?: string
    email?: string
    neighborhood?: string
    address?: string
  }
}

interface PrintOrphanPDFProps {
  orphan: Orphan
  variant?: 'default' | 'icon'
}

export function PrintOrphanPDF({ orphan, variant = 'default' }: PrintOrphanPDFProps) {
  const printRef = useRef<HTMLDivElement>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const { toast } = useToast()

  const generatePDF = async () => {
    if (!printRef.current) return

    setIsGenerating(true)
    try {
      // Dynamic imports for PDF generation
      const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
        import('jspdf'),
        import('html2canvas')
      ])

      // Generate canvas from HTML
      const canvas = await html2canvas(printRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        letterRendering: true
      })

      // Calculate dimensions
      const imgWidth = 210 // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      const pageHeight = 297 // A4 height in mm

      // Create PDF
      const pdf = new jsPDF('p', 'mm', 'a4')
      let heightLeft = imgHeight
      let position = 0

      // Add first page
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight

      // Add additional pages if needed
      while (heightLeft > 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }

      // Save PDF
      const fileName = `orphan_card_${orphan.id}_${orphan.full_name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`
      pdf.save(fileName)

      toast({
        title: "تم إنشاء البطاقة",
        description: `تم تحميل بطاقة اليتيم ${orphan.full_name} بنجاح`
      })
    } catch (error) {
      console.error('Error generating PDF:', error)
      toast({
        title: "خطأ في إنشاء البطاقة",
        description: "حدث خطأ أثناء إنشاء بطاقة PDF",
        variant: "destructive"
      })
    } finally {
      setIsGenerating(false)
    }
  }

  // Prepare sections for PDF card
  const sections: PDFCardSection[] = []

  // Personal Information Section
  const personalInfo: InfoItem[] = [
    { label: "الاسم الكامل", value: orphan.full_name, fullWidth: true, highlight: true },
    { label: "العمر", value: `${orphan.age} سنة` },
    { label: "الجنس", value: orphan.gender === 'male' ? 'ذكر' : 'أنثى' },
    { label: "تاريخ الميلاد", value: orphan.birth_date ? formatDateArabic(new Date(orphan.birth_date), "PPP") : 'غير محدد' },
    { label: "رقم اليتيم", value: `#${orphan.id}` }
  ]

  sections.push({
    title: "المعلومات الشخصية",
    icon: Users,
    content: <InfoGrid items={personalInfo} columns={2} />,
    columns: 1
  })

  // Education and Health Section
  if (orphan.education_level || orphan.health_status) {
    const educationHealthInfo: InfoItem[] = []

    if (orphan.education_level) {
      educationHealthInfo.push({
        label: "المستوى التعليمي",
        value: orphan.education_level
      })
    }

    if (orphan.health_status) {
      educationHealthInfo.push({
        label: "الحالة الصحية",
        value: orphan.health_status
      })
    }

    sections.push({
      title: "التعليم والصحة",
      icon: GraduationCap,
      content: <InfoGrid items={educationHealthInfo} columns={2} />,
      columns: 1
    })
  }

  // Mother/Widow Information Section
  if (orphan.widow) {
    const widowInfo: InfoItem[] = [
      { label: "اسم الأم", value: orphan.widow.full_name, fullWidth: true }
    ]

    if (orphan.widow.phone) {
      widowInfo.push({ label: "رقم الهاتف", value: orphan.widow.phone })
    }

    if (orphan.widow.email) {
      widowInfo.push({ label: "البريد الإلكتروني", value: orphan.widow.email })
    }

    if (orphan.widow.neighborhood) {
      widowInfo.push({ label: "الحي", value: orphan.widow.neighborhood })
    }

    if (orphan.widow.address) {
      widowInfo.push({ label: "العنوان", value: orphan.widow.address, fullWidth: true })
    }

    sections.push({
      title: "معلومات الأم (الأرملة)",
      icon: Users,
      content: <InfoGrid items={widowInfo} columns={2} />,
      columns: 1
    })
  }

  const ButtonContent = isGenerating ? (
    <>
      <Loader2 className="ml-2 h-4 w-4 animate-spin" />
      جاري الإنشاء...
    </>
  ) : variant === 'icon' ? (
    <FileDown className="h-4 w-4" />
  ) : (
    <>
      <FileDown className="ml-2 h-4 w-4" />
      طباعة بطاقة اليتيم
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

      {/* Hidden PDF content */}
      <div ref={printRef} className="fixed -left-[9999px] top-0">
        <PDFCardTemplate
          header={{
            organizationName: "جمعية أماسو الخيرية",
            title: "بطاقة يتيم",
            subtitle: "معلومات اليتيم الشاملة",
            entityName: orphan.full_name,
            entityId: `#${orphan.id}`,
            badge: {
              text: orphan.gender === 'male' ? 'ذكر' : 'أنثى',
              color: orphan.gender === 'male' ? 'blue' : 'red'
            }
          }}
          sections={sections}
          footer={{
            leftContent: (
              <>
                <p>تاريخ الطباعة: {formatDateArabic(new Date(), "PPP")}</p>
                <p>الوقت: {formatDateArabic(new Date(), "HH:mm")}</p>
                <p>تاريخ التسجيل: {formatDateArabic(new Date(orphan.created_at), "PPP")}</p>
              </>
            ),
            rightContent: (
              <>
                <p>جمعية أماسو الخيرية</p>
                <p>قسم الأيتام</p>
                <p>نظام إدارة الجمعية</p>
              </>
            )
          }}
        />
      </div>
    </>
  )
}
