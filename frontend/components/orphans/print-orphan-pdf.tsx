"use client"

import React, { useRef, useState } from 'react'
import { Button } from "@/components/ui/button"
import { FileDown, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import api from "@/lib/api"
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
  const [isGenerating, setIsGenerating] = useState(false)
  const { toast } = useToast()

  const generatePDF = async () => {
    if (isGenerating || !orphan) return

    setIsGenerating(true)
    try {
      await api.downloadPdf(`/cards/orphans/${orphan.id}.pdf`)
      toast({ title: "تم تحميل البطاقة" })
    } catch (error: any) {
      toast({
        title: "خطأ في إنشاء البطاقة",
        description: error?.message || "حدث خطأ أثناء إنشاء الملف",
        variant: "destructive",
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
    </>
  )
}
