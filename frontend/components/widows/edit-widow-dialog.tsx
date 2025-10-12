"use client"

import { useState, useEffect } from "react"
import { useForm, useFieldArray, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { MultiSelectRS } from "@/components/common/MultiSelectRS"
import { SingleSelectRS } from "@/components/common/SingleSelectRS"
import { StarRating } from "@/components/common/StarRating"
import { useToast } from "@/hooks/use-toast"
import { CalendarIcon, Plus, Trash2, User, Users, Home, Heart, HandHeart, Edit } from "lucide-react"
import { formatDateArabic } from "@/lib/date-utils"
import { cn } from "@/lib/utils"
import { KafilSelector } from "@/components/kafils/kafil-selector"
import api from "@/lib/api"

// Same validation schema as AddWidowDialog but adapted for editing
const editWidowSchema = z
  .object({
    // Personal Information
    firstName: z.string().min(1, "الاسم الأول مطلوب"),
    lastName: z.string().min(1, "اسم العائلة مطلوب"),
    birthDate: z.date({ required_error: "تاريخ الميلاد مطلوب" }),
    nationalId: z.string().optional(),
    phone: z.string().min(1, "رقم الهاتف مطلوب"),
    email: z.string().email("بريد إلكتروني غير صحيح").optional().or(z.literal("")),
    neighborhood: z.string().min(1, "الحي مطلوب"),
    address: z.string().optional(),
    admissionDate: z.date({ required_error: "تاريخ الانضمام مطلوب" }),
    maritalStatus: z.string().optional(),
    educationLevel: z.string().optional(),
    disabilityFlag: z.boolean().default(false),
    disabilityType: z.string().optional(),

    // Children
    children: z
      .array(
        z.object({
          firstName: z.string().min(1, "اسم الطفل مطلوب"),
          lastName: z.string().min(1, "اسم العائلة مطلوب"),
          sex: z.enum(["male", "female"], { required_error: "الجنس مطلوب" }),
          birthDate: z.date({ required_error: "تاريخ الميلاد مطلوب" }),
          education_level_id: z.string().optional(), // Education level ID as string for form
          schoolName: z.string().optional(),
        }),
      )
      .default([]),

    // Social Snapshot
    socialSituation: z.string().default("widow"),
    hasChronicDisease: z.boolean().default(false),
    housingType: z.string().min(1, "نوع السكن مطلوب"),
    housingStatus: z.enum(["owned", "rented", "free"], { required_error: "حالة السكن مطلوبة" }),
    hasElectricity: z.boolean().default(false),
    hasWater: z.boolean().default(false),
    hasFurniture: z.number().min(0).max(5).default(0),

    // Skills & Health
    selectedSkills: z.array(z.string()).default([]),
    newSkills: z.array(z.string()).default([]),
    selectedIllnesses: z.array(z.string()).default([]),
    selectedAidTypes: z.array(z.string()).default([]),
    
    // Income and Expenses arrays
    incomeEntries: z.array(z.object({
      category_id: z.string(),
      amount: z.number(),
      description: z.string().optional()
    })).default([]),
    expenseEntries: z.array(z.object({
      category_id: z.string(),
      amount: z.number(),
      description: z.string().optional()
    })).default([]),

    // Maouna fields
    maounaActive: z.boolean().default(false),
    maounaAmount: z.number().optional(),
    maounaPartnerId: z.string().optional(),
    
    // Kafils
    kafils: z.array(z.object({
      kafilId: z.string().optional(),
      amount: z.number().optional(),
    })).default([]),
  })
  .refine(
    (data) => {
      return data.email || data.address
    },
    {
      message: "يجب إدخال البريد الإلكتروني أو العنوان على الأقل",
      path: ["email"],
    }
  )

type EditWidowFormData = z.infer<typeof editWidowSchema>

interface Widow {
  id: number
  first_name: string
  last_name: string
  phone: string
  email: string
  address?: string
  neighborhood?: string
  admission_date: string
  national_id: string
  birth_date: string
  marital_status: string
  education_level?: string
  disability_flag: boolean
  disability_type?: string
  
  // Extended data for editing
  orphans?: any[]
  widow_files?: any
  widow_social?: any
  skills?: any[]
  illnesses?: any[]
  aid_types?: any[]
  social_income?: any[]
  social_expenses?: any[]
  active_maouna?: any[]
  sponsorships?: any[]
}

interface EditWidowDialogProps {
  widow: Widow | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function EditWidowDialog({ widow, open, onOpenChange, onSuccess }: EditWidowDialogProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [educationLevels, setEducationLevels] = useState<any[]>([])
  const [referenceData, setReferenceData] = useState({
    housing_types: [],
    skills: [],
    illnesses: [],
    aid_types: [],
    income_categories: [],
    expense_categories: [],
    partners: [],
    partnerFields: [],
    partnerSubfields: [],
  })

  // Partner filtering state
  const [selectedPartnerField, setSelectedPartnerField] = useState<any>(null)
  const [selectedPartnerSubfield, setSelectedPartnerSubfield] = useState<any>(null)
  const [filteredPartners, setFilteredPartners] = useState<any[]>([])

  // Form setup with react-hook-form
  const form = useForm<EditWidowFormData>({
    resolver: zodResolver(editWidowSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      birthDate: new Date(),
      nationalId: "",
      phone: "",
      email: "",
      neighborhood: "",
      address: "",
      admissionDate: new Date(),
      maritalStatus: "Widowed",
      educationLevel: "",
      disabilityFlag: false,
      disabilityType: "",
      children: [],
      socialSituation: "widow",
      hasChronicDisease: false,
      housingType: "",
      housingStatus: "owned",
      hasElectricity: false,
      hasWater: false,
      hasFurniture: 0,
      selectedSkills: [],
      newSkills: [],
      selectedIllnesses: [],
      selectedAidTypes: [],
      incomeEntries: [],
      expenseEntries: [],
      maounaActive: false,
      maounaAmount: undefined,
      maounaPartnerId: "",
      kafils: [],
    },
  })

  const {
    fields: childrenFields,
    append: addChild,
    remove: removeChild,
  } = useFieldArray({
    control: form.control,
    name: "children",
  })

  const {
    fields: incomeFields,
    append: addIncome,
    remove: removeIncome,
  } = useFieldArray({
    control: form.control,
    name: "incomeEntries",
  })

  const {
    fields: expenseFields,
    append: addExpense,
    remove: removeExpense,
  } = useFieldArray({
    control: form.control,
    name: "expenseEntries",
  })

  // Load reference data
  useEffect(() => {
    const loadReferenceData = async () => {
      try {
        const [widowsResponse, educationLevelsResponse, partnerFieldsResponse, partnerSubfieldsResponse] = await Promise.all([
          api.getWidowsReferenceData(),
          api.getOrphansEducationLevels(),
          fetch('/api/v1/references/partner-fields').then(res => res.ok ? res.json() : { data: [] }),
          fetch('/api/v1/references/partner-subfields').then(res => res.ok ? res.json() : { data: [] })
        ])
        setReferenceData({
          ...widowsResponse.data,
          partnerFields: partnerFieldsResponse.data || [],
          partnerSubfields: partnerSubfieldsResponse.data || []
        })
        setEducationLevels(educationLevelsResponse.data || [])
      } catch (error) {
        console.error("Failed to load reference data:", error)
      }
    }
    
    if (open) {
      loadReferenceData()
    }
  }, [open])

  // Populate form when widow data changes
  useEffect(() => {
    if (widow && open) {
      // Parse dates
      const birthDate = widow.birth_date ? new Date(widow.birth_date) : new Date()
      const admissionDate = widow.admission_date ? new Date(widow.admission_date) : new Date()

      // Transform widow data to form format
      form.reset({
        firstName: widow.first_name || "",
        lastName: widow.last_name || "",
        birthDate: birthDate,
        nationalId: widow.national_id || "",
        phone: widow.phone || "",
        email: widow.email || "",
        neighborhood: widow.neighborhood || "",
        address: widow.address || "",
        admissionDate: admissionDate,
        maritalStatus: widow.marital_status || "Widowed",
        educationLevel: widow.education_level || "",
        disabilityFlag: widow.disability_flag || false,
        disabilityType: widow.disability_type || "",
        
        // Children/Orphans
        children: widow.orphans?.map(child => ({
          firstName: child.first_name || "",
          lastName: child.last_name || "",
          sex: child.gender || "male",
          birthDate: child.birth_date ? new Date(child.birth_date) : new Date(),
          education_level_id: child.education_level_id ? child.education_level_id.toString() : "0",
          schoolName: "", // Not available in current data
        })) || [],
        
        // Social data
        socialSituation: widow.widow_files?.social_situation || "widow",
        hasChronicDisease: widow.widow_files?.has_chronic_disease || false,
        housingType: widow.widow_social?.housing_type?.id?.toString() || "",
        housingStatus: widow.widow_social?.housing_status || "owned",
        hasElectricity: widow.widow_social?.has_electricity || false,
        hasWater: widow.widow_social?.has_water || false,
        hasFurniture: widow.widow_social?.has_furniture || 0,
        
        // Skills, illnesses, aid types
        selectedSkills: widow.skills?.map(skill => skill.id.toString()) || [],
        selectedIllnesses: widow.illnesses?.map(illness => illness.id.toString()) || [],
        selectedAidTypes: widow.aid_types?.map(aid => aid.id.toString()) || [],
        
        // Income entries
        incomeEntries: widow.social_income?.map(income => ({
          category_id: income.category?.id?.toString() || "",
          amount: parseFloat(income.amount) || 0,
          description: income.remarks || "",
        })) || [],
        
        // Expense entries  
        expenseEntries: widow.social_expenses?.map(expense => ({
          category_id: expense.category?.id?.toString() || "",
          amount: parseFloat(expense.amount) || 0,
          description: expense.remarks || "",
        })) || [],
        
        // Maouna
        maounaActive: widow.widow_files?.has_maouna || false,
        maounaAmount: widow.active_maouna?.[0]?.amount ? parseFloat(widow.active_maouna[0].amount) : undefined,
        maounaPartnerId: widow.active_maouna?.[0]?.partner?.id?.toString() || "",
        
        // Kafils/Sponsorships
        kafils: widow.sponsorships?.map(sponsorship => ({
          kafilId: sponsorship.kafil?.id?.toString() || "",
          amount: parseFloat(sponsorship.amount) || 0,
        })) || [],
        
        newSkills: [],
      })
    }
  }, [widow, open, form])

  // Update filtered partners when field/subfield selection changes
  useEffect(() => {
    if (!referenceData?.partners) {
      setFilteredPartners([])
      return
    }

    let filtered = [...referenceData.partners]

    if (selectedPartnerField) {
      filtered = filtered.filter((partner: any) => 
        partner.field_id === selectedPartnerField.value || partner.field?.id === selectedPartnerField.value
      )
    }

    if (selectedPartnerSubfield) {
      filtered = filtered.filter((partner: any) => 
        partner.subfield_id === selectedPartnerSubfield.value || partner.subfield?.id === selectedPartnerSubfield.value
      )
    }

    setFilteredPartners(filtered)
  }, [referenceData?.partners, selectedPartnerField, selectedPartnerSubfield])

  // Initialize filtered partners when lookup data loads
  useEffect(() => {
    if (referenceData?.partners) {
      setFilteredPartners(referenceData.partners)
    }
  }, [referenceData?.partners])

  const handleSubmit = async (data: EditWidowFormData) => {
    if (!widow) return

    setIsSubmitting(true)
    try {
      // Transform form data to API format (similar to AddWidowDialog)
      const updateData = {
        first_name: data.firstName,
        last_name: data.lastName,
        phone: data.phone,
        email: data.email || undefined,
        address: data.address || undefined,
        neighborhood: data.neighborhood,
        admission_date: data.admissionDate.toISOString().split('T')[0],
        national_id: data.nationalId || undefined,
        birth_date: data.birthDate.toISOString().split('T')[0],
        marital_status: data.maritalStatus as 'Widowed' | 'Divorced' | 'Single',
        education_level: data.educationLevel || undefined,
        disability_flag: data.disabilityFlag,
        disability_type: data.disabilityFlag ? data.disabilityType : undefined,
        
        // Additional data for comprehensive update
        social_situation: data.socialSituation,
        has_chronic_disease: data.hasChronicDisease,
        housing_type_id: data.housingType ? parseInt(data.housingType) : undefined,
        housing_status: data.housingStatus,
        has_electricity: data.hasElectricity,
        has_water: data.hasWater,
        has_furniture: data.hasFurniture,
        
        // Children
        children: data.children.map((child, childIndex) => {
          console.log(`EDIT - Processing child ${childIndex} for submission:`, child);
          console.log(`EDIT - Raw education_level_id value for child ${childIndex}:`, child.education_level_id);
          console.log(`EDIT - Type of education_level_id:`, typeof child.education_level_id);
          
          const educationLevelId = child.education_level_id && child.education_level_id !== "0" ? parseInt(child.education_level_id) : null;
          console.log(`EDIT - Processed education_level_id for child ${childIndex}:`, educationLevelId);
          
          const childData = {
            first_name: child.firstName,
            last_name: child.lastName,
            birth_date: child.birthDate.toISOString().split('T')[0],
            gender: child.sex,
            education_level_id: educationLevelId,
          };
          console.log(`EDIT - Final child data for child ${childIndex}:`, childData);
          return childData;
        }),
        
        // Skills
        skills: data.selectedSkills.map(id => parseInt(id)),
        new_skills: data.newSkills,
        
        // Illnesses and Aid types
        illnesses: data.selectedIllnesses.map(id => parseInt(id)),
        aid_types: data.selectedAidTypes.map(id => parseInt(id)),
        
        // Income and Expenses
        income: data.incomeEntries.map(entry => ({
          category_id: parseInt(entry.category_id),
          amount: entry.amount,
          description: entry.description,
        })),
        expenses: data.expenseEntries.map(entry => ({
          category_id: parseInt(entry.category_id),
          amount: entry.amount,
          description: entry.description,
        })),
        
        // Maouna
        has_maouna: data.maounaActive,
        maouna: data.maounaActive && data.maounaPartnerId && data.maounaAmount ? [{
          partner_id: parseInt(data.maounaPartnerId),
          amount: data.maounaAmount,
        }] : [],
        
        // Kafils
        kafils: data.kafils.filter(k => k.kafilId && k.amount).map(kafil => ({
          kafil_id: kafil.kafilId,
          amount: kafil.amount,
        })),
      }

      console.log("EDIT - Final API update data:", updateData);
      console.log("EDIT - JSON payload being sent to API:", JSON.stringify(updateData));

      // Call API to update widow (we'll need to create this endpoint)
      await api.updateWidow(widow.id, updateData)

      toast({
        title: "تم التحديث بنجاح",
        description: "تم تحديث جميع بيانات الأرملة بنجاح",
      })

      onSuccess()
      onOpenChange(false)
    } catch (error: any) {
      console.error("Update failed:", error)
      toast({
        title: "خطأ في التحديث",
        description: error.message || "حدث خطأ أثناء تحديث البيانات",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const DatePicker = ({
    value,
    onChange,
    placeholder,
  }: {
    value?: Date
    onChange: (date: Date | undefined) => void
    placeholder: string
  }) => {
    const [open, setOpen] = useState(false)
    const [currentMonth, setCurrentMonth] = useState<Date>(value || new Date())

    const handleOpenChange = (newOpen: boolean) => {
      setOpen(newOpen)
    }

    const handleSelect = (date: Date | undefined) => {
      onChange(date)
      setOpen(false)
    }

    const handleMonthChange = (newMonth: Date) => {
      setCurrentMonth(newMonth)
    }

    const years = Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i)
    const months = [
      "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
      "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
    ]

    return (
      <Popover open={open} onOpenChange={handleOpenChange} modal={true}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn("w-full justify-start text-left font-normal", !value && "text-muted-foreground")}
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setOpen(!open)
            }}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value ? formatDateArabic(value, "PPP") : placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto p-0"
          align="start"
          sideOffset={4}
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <div className="p-3 border-b">
            <div className="flex gap-2 mb-3">
              <Select
                value={currentMonth.getFullYear().toString()}
                onValueChange={(year) => {
                  const newDate = new Date(currentMonth)
                  newDate.setFullYear(parseInt(year))
                  setCurrentMonth(newDate)
                }}
              >
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={currentMonth.getMonth().toString()}
                onValueChange={(month) => {
                  const newDate = new Date(currentMonth)
                  newDate.setMonth(parseInt(month))
                  setCurrentMonth(newDate)
                }}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month, index) => (
                    <SelectItem key={index} value={index.toString()}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Calendar
            mode="single"
            selected={value}
            onSelect={handleSelect}
            disabled={(date) => date > new Date()}
            month={currentMonth}
            onMonthChange={handleMonthChange}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    )
  }

  if (!widow) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[95vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            تعديل بيانات الأرملة - {widow.first_name} {widow.last_name}
          </DialogTitle>
          <DialogDescription>
            يمكنك تعديل جميع بيانات الأرملة بما في ذلك الأطفال والبيانات الاجتماعية والمالية
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col flex-1 min-h-0">
          <Tabs defaultValue="personal" className="flex flex-col flex-1 min-h-0">
            <TabsList className="grid w-full grid-cols-6 flex-shrink-0">
              <TabsTrigger value="personal">المعلومات الشخصية</TabsTrigger>
              <TabsTrigger value="children">الأطفال</TabsTrigger>
              <TabsTrigger value="social">البيانات الاجتماعية</TabsTrigger>
              <TabsTrigger value="financial">الوضع المالي</TabsTrigger>
              <TabsTrigger value="health">الصحة والمهارات</TabsTrigger>
              <TabsTrigger value="support">المساعدات والكفالة</TabsTrigger>
            </TabsList>

            <div className="flex-1 min-h-0 overflow-y-auto mt-4 px-1">
              {/* Personal Information Tab */}
              <TabsContent value="personal" className="space-y-4">
                {/* Same content structure as AddWidowDialog personal tab */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">الاسم الأول *</Label>
                    <Input
                      id="firstName"
                      {...form.register("firstName")}
                      placeholder="أدخل الاسم الأول"
                    />
                    {form.formState.errors.firstName && (
                      <p className="text-sm text-red-500">{form.formState.errors.firstName.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="lastName">اسم العائلة *</Label>
                    <Input
                      id="lastName"
                      {...form.register("lastName")}
                      placeholder="أدخل اسم العائلة"
                    />
                    {form.formState.errors.lastName && (
                      <p className="text-sm text-red-500">{form.formState.errors.lastName.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">رقم الهاتف *</Label>
                    <Input
                      id="phone"
                      {...form.register("phone")}
                      placeholder="أدخل رقم الهاتف"
                    />
                    {form.formState.errors.phone && (
                      <p className="text-sm text-red-500">{form.formState.errors.phone.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">البريد الإلكتروني</Label>
                    <Input
                      id="email"
                      type="email"
                      {...form.register("email")}
                      placeholder="أدخل البريد الإلكتروني"
                    />
                    {form.formState.errors.email && (
                      <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>تاريخ الميلاد *</Label>
                    <Controller
                      name="birthDate"
                      control={form.control}
                      render={({ field }) => (
                        <div onClick={(e) => e.stopPropagation()}>
                          <DatePicker value={field.value} onChange={field.onChange} placeholder="اختر تاريخ الميلاد" />
                        </div>
                      )}
                    />
                    {form.formState.errors.birthDate && (
                      <p className="text-sm text-red-500">{form.formState.errors.birthDate.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nationalId">رقم الهوية</Label>
                    <Input
                      id="nationalId"
                      {...form.register("nationalId")}
                      placeholder="أدخل رقم الهوية"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="maritalStatus">الحالة الاجتماعية</Label>
                    <Controller
                      name="maritalStatus"
                      control={form.control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر الحالة الاجتماعية" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Widowed">أرملة</SelectItem>
                            <SelectItem value="Divorced">مطلقة</SelectItem>
                            <SelectItem value="Single">عزباء</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="educationLevel">المستوى التعليمي</Label>
                    <Controller
                      name="educationLevel"
                      control={form.control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر المستوى التعليمي" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="لا يقرأ ولا يكتب">لا يقرأ ولا يكتب</SelectItem>
                            <SelectItem value="يقرأ ويكتب">يقرأ ويكتب</SelectItem>
                            <SelectItem value="ابتدائي">ابتدائي</SelectItem>
                            <SelectItem value="إعدادي">إعدادي</SelectItem>
                            <SelectItem value="ثانوي">ثانوي</SelectItem>
                            <SelectItem value="دبلوم">دبلوم</SelectItem>
                            <SelectItem value="بكالوريوس">بكالوريوس</SelectItem>
                            <SelectItem value="ماجستير">ماجستير</SelectItem>
                            <SelectItem value="دكتوراه">دكتوراه</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="neighborhood">الحي *</Label>
                    <Input
                      id="neighborhood"
                      {...form.register("neighborhood")}
                      placeholder="أدخل الحي"
                    />
                    {form.formState.errors.neighborhood && (
                      <p className="text-sm text-red-500">{form.formState.errors.neighborhood.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>تاريخ الانضمام *</Label>
                    <Controller
                      name="admissionDate"
                      control={form.control}
                      render={({ field }) => (
                        <div onClick={(e) => e.stopPropagation()}>
                          <DatePicker value={field.value} onChange={field.onChange} placeholder="اختر تاريخ الانضمام" />
                        </div>
                      )}
                    />
                    {form.formState.errors.admissionDate && (
                      <p className="text-sm text-red-500">{form.formState.errors.admissionDate.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">العنوان التفصيلي</Label>
                  <Textarea id="address" {...form.register("address")} placeholder="أدخل العنوان التفصيلي" rows={3} />
                </div>
              </TabsContent>

              {/* Children Tab */}
              <TabsContent value="children" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">الأطفال</h3>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      addChild({
                        firstName: "",
                        lastName: "",
                        sex: "male",
                        birthDate: new Date(),
                        education_level_id: "0",
                        schoolName: "",
                      })
                    }
                  >
                    <Plus className="h-4 w-4 ml-2" />
                    إضافة طفل
                  </Button>
                </div>

                {childrenFields.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    لا توجد أطفال مضافين. اضغط "إضافة طفل" لإضافة طفل جديد.
                  </div>
                )}

                {childrenFields.map((field, index) => (
                  <div key={field.id} className="border rounded-lg p-4 space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium">الطفل {index + 1}</h4>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeChild(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>الاسم الأول *</Label>
                        <Input {...form.register(`children.${index}.firstName`)} placeholder="اسم الطفل" />
                        {form.formState.errors.children?.[index]?.firstName && (
                          <p className="text-sm text-red-500">{form.formState.errors.children[index]?.firstName?.message}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label>اسم العائلة *</Label>
                        <Input {...form.register(`children.${index}.lastName`)} placeholder="اسم العائلة" />
                        {form.formState.errors.children?.[index]?.lastName && (
                          <p className="text-sm text-red-500">{form.formState.errors.children[index]?.lastName?.message}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>الجنس *</Label>
                        <Controller
                          name={`children.${index}.sex`}
                          control={form.control}
                          render={({ field }) => (
                            <Select onValueChange={field.onChange} value={field.value}>
                              <SelectTrigger>
                                <SelectValue placeholder="اختر الجنس" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="male">ذكر</SelectItem>
                                <SelectItem value="female">أنثى</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>المرحلة الدراسية</Label>
                        <Controller
                          name={`children.${index}.education_level_id`}
                          control={form.control}
                          render={({ field }) => {
                            console.log(`EDIT - Child ${index} education_level_id field value:`, field.value);
                            console.log(`EDIT - Available education levels:`, educationLevels);
                            console.log(`EDIT - Field onChange function:`, typeof field.onChange);
                            
                            const currentValue = field.value || "0";
                            console.log(`EDIT - Current value for Select:`, currentValue);
                            
                            return (
                              <Select 
                                value={currentValue} 
                                onValueChange={(value) => {
                                  console.log(`EDIT - Child ${index} education level selected:`, value);
                                  console.log(`EDIT - About to call field.onChange with:`, value);
                                  field.onChange(value);
                                  console.log(`EDIT - After field.onChange, field.value is:`, field.value);
                                  
                                  // Additional verification - get the form values
                                  setTimeout(() => {
                                    const formValues = form.getValues();
                                    console.log(`EDIT - Form values after selection:`, formValues.children[index]?.education_level_id);
                                  }, 100);
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="اختر المرحلة الدراسية" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="0">غير محدد</SelectItem>
                                  {educationLevels.map((level) => (
                                    <SelectItem key={level.id} value={level.id.toString()}>
                                      {level.name_ar}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            );
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>اسم المدرسة</Label>
                        <Input {...form.register(`children.${index}.schoolName`)} placeholder="اسم المدرسة" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>تاريخ الميلاد *</Label>
                      <Controller
                        name={`children.${index}.birthDate`}
                        control={form.control}
                        render={({ field }) => (
                          <div onClick={(e) => e.stopPropagation()}>
                            <DatePicker value={field.value} onChange={field.onChange} placeholder="اختر تاريخ الميلاد" />
                          </div>
                        )}
                      />
                      {form.formState.errors.children?.[index]?.birthDate && (
                        <p className="text-sm text-red-500">{form.formState.errors.children[index]?.birthDate?.message}</p>
                      )}
                    </div>
                  </div>
                ))}
              </TabsContent>

              {/* Social Information Tab */}
              <TabsContent value="social" className="space-y-6">
                {/* Housing Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">معلومات السكن</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>نوع السكن *</Label>
                      <Controller
                        name="housingType"
                        control={form.control}
                        render={({ field }) => (
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger>
                              <SelectValue placeholder="اختر نوع السكن" />
                            </SelectTrigger>
                            <SelectContent>
                              {referenceData.housing_types.map((type: any) => (
                                <SelectItem key={type.id} value={type.id.toString()}>
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                      {form.formState.errors.housingType && (
                        <p className="text-sm text-red-500">{form.formState.errors.housingType.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>حالة السكن *</Label>
                      <Controller
                        name="housingStatus"
                        control={form.control}
                        render={({ field }) => (
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger>
                              <SelectValue placeholder="اختر حالة السكن" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="owned">ملك</SelectItem>
                              <SelectItem value="rented">إيجار</SelectItem>
                              <SelectItem value="free">مجاني</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <Controller
                        name="hasElectricity"
                        control={form.control}
                        render={({ field }) => (
                          <Checkbox id="hasElectricity" checked={field.value} onCheckedChange={field.onChange} />
                        )}
                      />
                      <Label htmlFor="hasElectricity">يوجد كهرباء</Label>
                    </div>
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <Controller
                        name="hasWater"
                        control={form.control}
                        render={({ field }) => (
                          <Checkbox id="hasWater" checked={field.value} onCheckedChange={field.onChange} />
                        )}
                      />
                      <Label htmlFor="hasWater">يوجد ماء</Label>
                    </div>
                    <div className="space-y-2">
                      <Label>تقييم الأثاث (من 0 إلى 5)</Label>
                      <Controller
                        name="hasFurniture"
                        control={form.control}
                        render={({ field }) => (
                          <StarRating
                            value={field.value || 0}
                            onChange={field.onChange}
                            maxStars={5}
                            labels={['لا يوجد', 'سيء جداً', 'سيء', 'متوسط', 'جيد', 'ممتاز']}
                            className="flex-col items-start"
                          />
                        )}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 space-x-reverse">
                  <Controller
                    name="hasChronicDisease"
                    control={form.control}
                    render={({ field }) => (
                      <Switch id="hasChronicDisease" checked={field.value} onCheckedChange={field.onChange} />
                    )}
                  />
                  <Label htmlFor="hasChronicDisease">يوجد مرض مزمن</Label>
                </div>
              </TabsContent>

              {/* Financial Information Tab */}
              <TabsContent value="financial" className="space-y-6">
                {/* Income Sources */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">مصادر الدخل</h3>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => addIncome({ category_id: "", amount: 0, description: "" })}
                    >
                      <Plus className="h-4 w-4 ml-2" />
                      إضافة مصدر دخل
                    </Button>
                  </div>

                  {incomeFields.map((field, index) => (
                    <div key={field.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="font-medium">مصدر الدخل {index + 1}</h4>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeIncome(index)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>المصدر</Label>
                          <Controller
                            name={`incomeEntries.${index}.category_id`}
                            control={form.control}
                            render={({ field }) => (
                              <Select onValueChange={field.onChange} value={field.value}>
                                <SelectTrigger>
                                  <SelectValue placeholder="اختر المصدر" />
                                </SelectTrigger>
                                <SelectContent>
                                  {referenceData.income_categories.map((category: any) => (
                                    <SelectItem key={category.id} value={category.id.toString()}>
                                      {category.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>المبلغ (DH)</Label>
                          <Input
                            type="number"
                            {...form.register(`incomeEntries.${index}.amount`, { valueAsNumber: true })}
                            placeholder="0"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>ملاحظات</Label>
                          <Input {...form.register(`incomeEntries.${index}.description`)} placeholder="ملاحظات إضافية" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Expenses */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">المصروفات</h3>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => addExpense({ category_id: "", amount: 0, description: "" })}
                    >
                      <Plus className="h-4 w-4 ml-2" />
                      إضافة مصروف
                    </Button>
                  </div>

                  {expenseFields.map((field, index) => (
                    <div key={field.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="font-medium">المصروف {index + 1}</h4>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeExpense(index)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>الفئة</Label>
                          <Controller
                            name={`expenseEntries.${index}.category_id`}
                            control={form.control}
                            render={({ field }) => (
                              <Select onValueChange={field.onChange} value={field.value}>
                                <SelectTrigger>
                                  <SelectValue placeholder="اختر الفئة" />
                                </SelectTrigger>
                                <SelectContent>
                                  {referenceData.expense_categories.map((category: any) => (
                                    <SelectItem key={category.id} value={category.id.toString()}>
                                      {category.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>المبلغ (DH)</Label>
                          <Input
                            type="number"
                            {...form.register(`expenseEntries.${index}.amount`, { valueAsNumber: true })}
                            placeholder="0"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>ملاحظات</Label>
                          <Input {...form.register(`expenseEntries.${index}.description`)} placeholder="ملاحظات إضافية" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              {/* Health & Skills Tab */}
              <TabsContent value="health" className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">المهارات</h3>
                  <div className="space-y-2">
                    <Label>المهارات المتوفرة</Label>
                    <Controller
                      name="selectedSkills"
                      control={form.control}
                      render={({ field }) => (
                        <MultiSelectRS
                          options={referenceData.skills.map((skill: any) => ({ label: skill.label, value: skill.id.toString() }))}
                          onChange={field.onChange}
                          value={field.value || []}
                          placeholder="اختر المهارات"
                          isCreatable={true}
                        />
                      )}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">الحالة الصحية</h3>
                  <div className="space-y-2">
                    <Label>الأمراض</Label>
                    <Controller
                      name="selectedIllnesses"
                      control={form.control}
                      render={({ field }) => (
                        <MultiSelectRS
                          options={referenceData.illnesses.map((illness: any) => ({ label: illness.label, value: illness.id.toString() }))}
                          onChange={field.onChange}
                          value={field.value || []}
                          placeholder="اختر الأمراض إن وجدت"
                          isCreatable={true}
                        />
                      )}
                    />
                  </div>

                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Controller
                      name="disabilityFlag"
                      control={form.control}
                      render={({ field }) => (
                        <Switch id="disabilityFlag" checked={field.value} onCheckedChange={field.onChange} />
                      )}
                    />
                    <Label htmlFor="disabilityFlag">يوجد إعاقة</Label>
                  </div>

                  {form.watch("disabilityFlag") && (
                    <div className="space-y-2">
                      <Label htmlFor="disabilityType">نوع الإعاقة</Label>
                      <Textarea
                        id="disabilityType"
                        {...form.register("disabilityType")}
                        placeholder="اذكر نوع الإعاقة"
                        rows={3}
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">أنواع المساعدات</h3>
                  <div className="space-y-2">
                    <Label>أنواع المساعدات المتاحة</Label>
                    <Controller
                      name="selectedAidTypes"
                      control={form.control}
                      render={({ field }) => (
                        <MultiSelectRS
                          options={referenceData.aid_types.map((aid: any) => ({ label: aid.label, value: aid.id.toString() }))}
                          onChange={field.onChange}
                          value={field.value || []}
                          placeholder="اختر أنواع المساعدات"
                        />
                      )}
                    />
                  </div>
                </div>
              </TabsContent>

              {/* Support & Aid Tab */}
              <TabsContent value="support" className="space-y-6">
                {/* Maouna Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">المعونة</h3>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Controller
                      name="maounaActive"
                      control={form.control}
                      render={({ field }) => (
                        <Switch id="maounaActive" checked={field.value} onCheckedChange={field.onChange} />
                      )}
                    />
                    <Label htmlFor="maounaActive">المعونة نشطة</Label>
                  </div>

                  {form.watch("maounaActive") && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>مبلغ المعونة (DH)</Label>
                          <Input
                            type="number"
                            {...form.register("maounaAmount", { valueAsNumber: true })}
                            placeholder="0"
                          />
                        </div>
                      </div>

                      {/* Partner Field and Subfield Filters */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>تصفية حسب المجال (اختياري)</Label>
                          <SingleSelectRS
                            options={[
                              { label: "جميع المجالات", value: null },
                              ...(referenceData.partnerFields || []).map((field: any) => ({
                                label: field.label,
                                value: field.id
                              }))
                            ]}
                            onChange={(value) => {
                              setSelectedPartnerField(value ? { label: "", value } : null)
                              setSelectedPartnerSubfield(null) // Reset subfield when field changes
                            }}
                            value={selectedPartnerField?.value || null}
                            placeholder="اختر المجال (اختياري)"
                            isClearable={true}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label>تصفية حسب التخصص (اختياري)</Label>
                          <SingleSelectRS
                            options={[
                              { label: "جميع التخصصات", value: null },
                              ...(selectedPartnerField 
                                ? (referenceData.partnerSubfields || [])
                                    .filter((subfield: any) => subfield.field_id === selectedPartnerField.value)
                                    .map((subfield: any) => ({
                                      label: subfield.label,
                                      value: subfield.id
                                    }))
                                : []
                              )
                            ]}
                            onChange={(value) => {
                              setSelectedPartnerSubfield(value ? { label: "", value } : null)
                            }}
                            value={selectedPartnerSubfield?.value || null}
                            placeholder={!selectedPartnerField ? "اختر المجال أولاً" : "اختر التخصص (اختياري)"}
                            isDisabled={!selectedPartnerField}
                            isClearable={true}
                          />
                        </div>
                      </div>

                      {/* Partner Selection */}
                      <div className="space-y-2">
                        <Label>اختيار الشريك *</Label>
                        <Controller
                          name="maounaPartnerId"
                          control={form.control}
                          render={({ field }) => (
                            <SingleSelectRS
                              options={(filteredPartners || []).map((partner: any) => ({
                                label: partner.name,
                                value: partner.id.toString()
                              }))}
                              onChange={field.onChange}
                              value={field.value || ""}
                              placeholder="اختر الشريك"
                              isSearchable={true}
                              noOptionsMessage={() => "لم يتم العثور على شركاء"}
                            />
                          )}
                        />
                        {form.formState.errors.maounaPartnerId && (
                          <p className="text-sm text-red-600">{form.formState.errors.maounaPartnerId.message}</p>
                        )}
                      </div>

                      {/* Show filtered partners count */}
                      {referenceData.partners && (
                        <div className="text-sm text-gray-600">
                          {(selectedPartnerField || selectedPartnerSubfield) ? (
                            <span>عرض {filteredPartners.length} من أصل {referenceData.partners.length} شريك</span>
                          ) : (
                            <span>{referenceData.partners.length} شريك متاح</span>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Kafils Section - Using KafilSelector from AddWidowDialog */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">الكفلاء</h3>
                    <Button type="button" variant="outline" onClick={() => form.setValue('kafils', [...(form.getValues('kafils') || []), { kafilId: '', amount: 0 }])}>
                      <Plus className="h-4 w-4 ml-2" />
                      إضافة كفيل
                    </Button>
                  </div>

                  {(form.watch('kafils') || []).map((kafil, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="font-medium">الكفيل {index + 1}</h4>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const currentKafils = form.getValues('kafils') || []
                            const newKafils = currentKafils.filter((_, i) => i !== index)
                            form.setValue('kafils', newKafils)
                          }}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>اسم الكفيل</Label>
                          <Controller
                            name={`kafils.${index}.kafilId`}
                            control={form.control}
                            render={({ field }) => (
                              <KafilSelector
                                value={field.value || ''}
                                onValueChange={field.onChange}
                                placeholder="اختر الكفيل"
                                excludeIds={form.watch("kafils")
                                  ?.map((k, i) => i !== index ? k.kafilId : null)
                                  ?.filter(Boolean) || []}
                              />
                            )}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>مبلغ الكفالة (DH)</Label>
                          <Input
                            type="number"
                            {...form.register(`kafils.${index}.amount`, { valueAsNumber: true })}
                            placeholder="0"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Display kafils validation errors */}
                  {form.formState.errors.kafils && (
                    <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
                      {form.formState.errors.kafils.message || JSON.stringify(form.formState.errors.kafils)}
                    </div>
                  )}
                </div>
              </TabsContent>
            </div>
          </Tabs>

          <DialogFooter className="flex-shrink-0 mt-6 pt-4 border-t bg-background">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              إلغاء
            </Button>
            <Button type="submit" disabled={isSubmitting} className="min-w-[200px]">
              {isSubmitting ? "جاري الحفظ..." : "حفظ جميع التغييرات"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}