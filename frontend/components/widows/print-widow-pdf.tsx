"use client"

import React, { useRef, useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Printer, Users, Home, Activity } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import api from "@/lib/api"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"

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

export interface WidowCardSections {
  personal: boolean
  housing: boolean
  orphans: boolean
  additional: boolean
}

const DEFAULT_SECTIONS: WidowCardSections = {
  personal: true,
  housing: true,
  orphans: true,
  additional: true,
}

const SECTION_OPTIONS: Array<{ key: keyof WidowCardSections; label: string }> = [
  { key: 'personal', label: 'المعلومات الشخصية' },
  { key: 'housing', label: 'معلومات السكن' },
  { key: 'orphans', label: 'الأيتام' },
  { key: 'additional', label: 'المهارات والأمراض والمساعدات' },
]

interface PrintWidowPDFProps {
  widow: Widow
  variant?: 'default' | 'icon'
}

/** Button that opens the widow-card print dialog (pick sections, then PDF). */
export function PrintWidowPDF({ widow, variant = 'default' }: PrintWidowPDFProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      {variant === 'icon' ? (
        <Button variant="outline" size="icon" onClick={() => setOpen(true)} title="طباعة بطاقة الأرملة">
          <Printer className="h-4 w-4" />
        </Button>
      ) : (
        <Button onClick={() => setOpen(true)}>
          <Printer className="ml-2 h-4 w-4" />
          طباعة بطاقة الأرملة
        </Button>
      )}
      <WidowCardPrintDialog widow={widow} open={open} onOpenChange={setOpen} />
    </>
  )
}

interface WidowCardPrintDialogProps {
  widow: Widow | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Section-selection dialog + hidden printable card. The chosen sections
 * control what ends up in the generated PDF.
 */
export function WidowCardPrintDialog({ widow, open, onOpenChange }: WidowCardPrintDialogProps) {
  const { toast } = useToast()
  const [isGenerating, setIsGenerating] = useState(false)
  const [sections, setSections] = useState<WidowCardSections>(DEFAULT_SECTIONS)

  const generatePDF = async () => {
    if (isGenerating || !widow) return

    setIsGenerating(true)
    try {
      // Rendered server-side as real text so the card can be searched and
      // corrected; the chosen sections travel as query flags.
      await api.downloadPdf(`/cards/widows/${widow.id}.pdf`, sections)
      toast({ title: "تم تحميل البطاقة" })
      onOpenChange(false)
    } catch (error: any) {
      toast({
        title: "خطأ في إنشاء الـ PDF",
        description: error?.message || "حدث خطأ أثناء إنشاء الملف",
        variant: "destructive",
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


  if (!widow) {
    return null
  }

  return (
    <div>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>طباعة بطاقة "{widow.full_name}"</DialogTitle>
            <DialogDescription>اختر الأقسام التي تريد إظهارها في البطاقة</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {SECTION_OPTIONS.map(({ key, label }) => (
              <div key={key} className="flex items-center gap-2">
                <Checkbox
                  id={`card-section-${key}`}
                  checked={sections[key]}
                  onCheckedChange={(checked) => setSections((prev) => ({ ...prev, [key]: checked === true }))}
                />
                <Label htmlFor={`card-section-${key}`}>{label}</Label>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>إلغاء</Button>
            <Button type="button" onClick={generatePDF} disabled={isGenerating}>
              <Printer className="ml-2 h-4 w-4" />
              {isGenerating ? "جاري الإنشاء..." : "إنشاء PDF"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  )
}