"use client"

import React, { useRef, useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Printer, Users, Home, Activity } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

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
  updated_at: string
  
  // Related data
  orphans?: Array<{
    id: number
    first_name: string
    last_name: string
    birth_date: string
    age: number
    gender: string
    education_level?: string
    health_status?: string
  }>
  
  sponsorships?: Array<{
    id: number
    amount: number
    kafil?: {
      id: number
      first_name: string
      last_name: string
      phone: string
      monthly_pledge: number
      donor?: {
        id: number
        first_name: string
        last_name: string
      }
    }
  }>
  
  // Widow Files
  widow_files?: {
    social_situation: string
    has_chronic_disease: boolean
    has_maouna: boolean
  }
  
  // Social Information
  widow_social?: {
    housing_type?: {
      id: number
      label: string
    }
    housing_status: string
    has_water: boolean
    has_electricity: boolean
    has_furniture: number
  }
  
  // Skills, Illnesses, Aid Types
  skills?: Array<{
    id: number
    label: string
  }>
  
  illnesses?: Array<{
    id: number
    label: string
    is_chronic: boolean
  }>
  
  aid_types?: Array<{
    id: number
    label: string
  }>
  
  // Income and Expenses
  social_income?: Array<{
    id: number
    amount: number
    remarks?: string
    category?: {
      id: number
      name: string
    }
  }>
  
  social_expenses?: Array<{
    id: number
    amount: number
    remarks?: string
    category?: {
      id: number
      name: string
    }
  }>
  
  // Maouna
  active_maouna?: Array<{
    id: number
    amount: number
    is_active: boolean
    partner?: {
      id: number
      name: string
      field?: {
        id: number
        label: string
      }
      subfield?: {
        id: number
        label: string
      }
    }
  }>
  
  // Counts and totals
  orphans_count?: number
  sponsorships_count?: number
  total_sponsorship_amount?: number
}

interface PrintWidowPDFProps {
  widow: Widow
  variant?: 'default' | 'icon'
}

export function PrintWidowPDF({ widow, variant = 'default' }: PrintWidowPDFProps) {
  const printRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()
  const [isGenerating, setIsGenerating] = useState(false)

  const generatePDF = async () => {
    if (!printRef.current || isGenerating) return

    setIsGenerating(true)
    
    try {
      toast({
        title: "جاري إنشاء الـ PDF...",
        description: "يرجى الانتظار بينما يتم إعداد بطاقة الأرملة"
      })

      // Dynamically import PDF libraries only on client side
      const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
        import('jspdf'),
        import('html2canvas')
      ])

      // Configure html2canvas for better Arabic text support
      const canvas = await html2canvas(printRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        letterRendering: true,
        allowTaint: true
      })

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const imgWidth = pageWidth - 20 // 10mm margins on each side
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      
      let yPosition = 10

      // If content is taller than one page, split it
      if (imgHeight > pageHeight - 20) {
        let remainingHeight = imgHeight
        let yOffset = 0
        
        while (remainingHeight > 0) {
          const sliceHeight = Math.min(pageHeight - 20, remainingHeight)
          const sliceCanvas = document.createElement('canvas')
          const sliceContext = sliceCanvas.getContext('2d')
          
          sliceCanvas.width = canvas.width
          sliceCanvas.height = (sliceHeight * canvas.width) / imgWidth
          
          sliceContext?.drawImage(
            canvas,
            0, yOffset * canvas.width / imgWidth,
            canvas.width, sliceCanvas.height,
            0, 0,
            canvas.width, sliceCanvas.height
          )
          
          const sliceImgData = sliceCanvas.toDataURL('image/png')
          pdf.addImage(sliceImgData, 'PNG', 10, yPosition, imgWidth, sliceHeight)
          
          remainingHeight -= sliceHeight
          yOffset += sliceHeight
          
          if (remainingHeight > 0) {
            pdf.addPage()
            yPosition = 10
          }
        }
      } else {
        pdf.addImage(imgData, 'PNG', 10, yPosition, imgWidth, imgHeight)
      }

      // Save the PDF
      const fileName = `widow_card_${widow.full_name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`
      pdf.save(fileName)

      toast({
        title: "تم إنشاء الـ PDF بنجاح",
        description: `تم حفظ بطاقة ${widow.full_name} كملف PDF`
      })

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-EG', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      numberingSystem: 'latn'
    })
  }


  if (variant === 'icon') {
    return (
      <Button
        variant="outline"
        size="icon"
        onClick={generatePDF}
        disabled={isGenerating}
        title="طباعة بطاقة الأرملة"
      >
        <Printer className="h-4 w-4" />
      </Button>
    )
  }

  return (
    <div>
      <Button onClick={generatePDF} disabled={isGenerating} className="mb-4">
        <Printer className="ml-2 h-4 w-4" />
        {isGenerating ? "جاري إنشاء الـ PDF..." : "طباعة بطاقة الأرملة"}
      </Button>

      {/* Hidden printable content */}
      <div 
        ref={printRef} 
        className="fixed -left-[9999px] top-0 bg-white w-[750px]"
        style={{ 
          fontFamily: 'Arial, sans-serif', 
          direction: 'rtl',
          padding: '16px',
          margin: '0',
          boxSizing: 'border-box',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div className="text-center mb-6 border-b-2 border-gray-300 pb-4">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            جمعية أماسو الخيرية
          </h1>
          <h2 className="text-lg text-gray-600 mb-3">
            بطاقة معلومات الأرملة
          </h2>
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-lg font-semibold text-blue-800">
              {widow.full_name}
            </p>
            <p className="text-sm text-gray-600">
              رقم الهوية: {widow.national_id}
            </p>
          </div>
        </div>

        {/* Personal Information */}
        <div className="mb-5">
          <h3 className="text-base font-bold text-gray-800 mb-3 flex items-center">
            <Users className="ml-2 h-4 w-4" />
            المعلومات الشخصية
          </h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">الاسم الكامل:</span>
                <span>{widow.full_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">العمر:</span>
                <span>{Math.floor(widow.age)} سنة</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">الحالة الاجتماعية:</span>
                <span>{widow.marital_status}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">المستوى التعليمي:</span>
                <span>{widow.education_level || 'غير محدد'}</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">رقم الهاتف:</span>
                <span>{widow.phone || 'غير محدد'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">العنوان:</span>
                <span>{widow.address || 'غير محدد'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">الحي:</span>
                <span>{widow.neighborhood || 'غير محدد'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">الإعاقة:</span>
                <span>{widow.disability_flag ? (widow.disability_type || 'يوجد') : 'لا توجد'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Housing Information */}
        {widow.widow_social && (
          <div className="mb-5">
            <h3 className="text-base font-bold text-gray-800 mb-3 flex items-center">
              <Home className="ml-2 h-4 w-4" />
              معلومات السكن
            </h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">نوع السكن:</span>
                  <span>{widow.widow_social.housing_type?.label || 'غير محدد'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">حالة السكن:</span>
                  <span>
                    {widow.widow_social.housing_status === 'owned' ? 'ملك' : 
                     widow.widow_social.housing_status === 'rented' ? 'إيجار' : 
                     widow.widow_social.housing_status === 'free' ? 'مجاني' : 'غير محدد'}
                  </span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">المياه:</span>
                  <span>{widow.widow_social.has_water ? 'متوفر' : 'غير متوفر'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">الكهرباء:</span>
                  <span>{widow.widow_social.has_electricity ? 'متوفر' : 'غير متوفر'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">مستوى الأثاث:</span>
                  <span>{widow.widow_social.has_furniture || 0}/5</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Children Information */}
        {widow.orphans && widow.orphans.length > 0 && (
          <div className="mb-5">
            <h3 className="text-base font-bold text-gray-800 mb-3 flex items-center">
              <Users className="ml-2 h-4 w-4" />
              الأيتام ({widow.orphans.length})
            </h3>
            <div className="space-y-3">
              {widow.orphans.map((orphan, index) => (
                <div key={orphan.id} className="bg-blue-50 p-2 rounded border-r-4 border-blue-400">
                  <div className="grid grid-cols-4 gap-3 text-sm">
                    <div>
                      <span className="font-medium text-gray-600">الاسم:</span>
                      <p>{orphan.first_name} {orphan.last_name}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">العمر:</span>
                      <p>{Math.floor(orphan.age)} سنة</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">الجنس:</span>
                      <p>{orphan.gender === 'male' ? 'ذكر' : 'أنثى'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">التعليم:</span>
                      <p>{orphan.education_level || 'غير محدد'}</p>
                    </div>
                  </div>
                  {orphan.health_status && (
                    <div className="mt-2 text-sm">
                      <span className="font-medium text-gray-600">الحالة الصحية:</span>
                      <p>{orphan.health_status}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}



        {/* Additional Information */}
        <div className="mb-5">
          <h3 className="text-base font-bold text-gray-800 mb-3 flex items-center">
            <Activity className="ml-2 h-4 w-4" />
            معلومات إضافية
          </h3>
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div>
              <p className="font-medium text-gray-600 mb-2">المهارات:</p>
              <div className="space-y-1">
                {widow.skills && widow.skills.length > 0 ? (
                  widow.skills.map((skill) => (
                    <span key={skill.id} className="inline-block bg-blue-100 px-2 py-1 rounded text-xs ml-1 mb-1">
                      {skill.label}
                    </span>
                  ))
                ) : (
                  <span className="text-gray-400">لا توجد</span>
                )}
              </div>
            </div>
            <div>
              <p className="font-medium text-gray-600 mb-2">الأمراض:</p>
              <div className="space-y-1">
                {widow.illnesses && widow.illnesses.length > 0 ? (
                  widow.illnesses.map((illness) => (
                    <div key={illness.id} className="text-xs">
                      <span className={`inline-block px-2 py-1 rounded ml-1 mb-1 ${
                        illness.is_chronic ? 'bg-red-100 text-red-700' : 'bg-gray-100'
                      }`}>
                        {illness.label} {illness.is_chronic && '(مزمن)'}
                      </span>
                    </div>
                  ))
                ) : (
                  <span className="text-gray-400">لا توجد</span>
                )}
              </div>
            </div>
            <div>
              <p className="font-medium text-gray-600 mb-2">أنواع المساعدات:</p>
              <div className="space-y-1">
                {widow.aid_types && widow.aid_types.length > 0 ? (
                  widow.aid_types.map((aid) => (
                    <span key={aid.id} className="inline-block bg-green-100 px-2 py-1 rounded text-xs ml-1 mb-1">
                      {aid.label}
                    </span>
                  ))
                ) : (
                  <span className="text-gray-400">لا توجد</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t-2 border-gray-300 pt-3 mt-6">
          <div className="flex justify-between text-xs text-gray-500">
            <div>
              <p>تاريخ الانتساب: {formatDate(widow.admission_date)}</p>
              <p>تاريخ الطباعة: {formatDate(new Date().toISOString())}</p>
            </div>
            <div className="text-right">
              <p>جمعية أماسو الخيرية</p>
              <p>نظام إدارة المستفيدين</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}