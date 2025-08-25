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
import { CalendarIcon, Plus, Trash2, User, Users, Home, Heart, HandHeart } from "lucide-react"
import { formatDateArabic } from "@/lib/date-utils"
import { cn } from "@/lib/utils"
import { KafilSelector } from "@/components/kafils/kafil-selector"
import api from "@/lib/api"

// Validation Schema
const widowSchema = z
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
          schoolLevel: z.string().optional(),
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
    incomes: z
      .array(
        z.object({
          source: z.string().min(1, "مصدر الدخل مطلوب"),
          amount: z.number().positive("المبلغ يجب أن يكون موجباً"),
          remarks: z.string().optional(),
        }),
      )
      .default([]),
    expenses: z
      .array(
        z.object({
          category: z.string().min(1, "فئة المصروف مطلوبة"),
          amount: z.number().positive("المبلغ يجب أن يكون موجباً"),
          remarks: z.string().optional(),
        }),
      )
      .default([]),

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

    // Maouna entries
    maounaEntries: z.array(z.object({
      partner_id: z.string(),
      amount: z.number()
    })).default([]),
    
    // Maouna fields
    maounaActive: z.boolean().default(false),
    maounaAmount: z.number().optional(),
    maounaPartnerId: z.string().optional(),
  })
  .refine(
    (data) => {
      return data.email || data.address
    },
    {
      message: "يجب إدخال البريد الإلكتروني أو العنوان على الأقل",
      path: ["email"],
    },
  )
  .refine(
    (data) => {
      if (data.maounaActive) {
        return data.maounaPartnerId && data.maounaAmount && data.maounaAmount > 0
      }
      return true
    },
    {
      message: "عند تفعيل المعونة يجب اختيار الشريك والمبلغ",
      path: ["maounaPartnerId"],
    },
  )
  .refine(
    (data) => {
      return data.kafils ? data.kafils.every((kafil) => kafil.amount > 0) : true
    },
    {
      message: "جميع مبالغ الكفالة يجب أن تكون موجبة",
      path: ["kafils"],
    },
  )

type WidowFormData = z.infer<typeof widowSchema>

interface AddWidowDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

// Lookup data interfaces
interface LookupOption {
  id: string
  name: string
}

interface LookupData {
  neighborhoods: LookupOption[]
  housingTypes: LookupOption[]
  incomeCategories: LookupOption[]
  expenseCategories: LookupOption[]
  skills: LookupOption[]
  illnesses: LookupOption[]
  aidTypes: LookupOption[]
  partners: LookupOption[]
  kafils: LookupOption[]
}

export function AddWidowDialog({ open, onOpenChange }: AddWidowDialogProps) {
  const [activeTab, setActiveTab] = useState("personal")
  const [lookupData, setLookupData] = useState<LookupData | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const form = useForm<WidowFormData>({
    resolver: zodResolver(widowSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phone: "",
      email: "",
      address: "",
      neighborhood: "",
      maritalStatus: "Widowed",
      educationLevel: "",
      children: [],
      housingType: "1", // Default to first housing type
      housingStatus: "rented",
      hasElectricity: true,
      hasWater: true,
      hasFurniture: 0,
      incomes: [],
      expenses: [],
      selectedSkills: [],
      selectedIllnesses: [],
      selectedAidTypes: [],
      hasChronicDisease: false,
      maounaActive: false,
      maounaAmount: 0,
      maounaPartnerId: "",
      kafils: [],
    },
  })

  const {
    fields: childrenFields,
    append: appendChild,
    remove: removeChild,
  } = useFieldArray({
    control: form.control,
    name: "children",
  })

  const {
    fields: incomeFields,
    append: appendIncome,
    remove: removeIncome,
  } = useFieldArray({
    control: form.control,
    name: "incomes",
  })

  const {
    fields: expenseFields,
    append: appendExpense,
    remove: removeExpense,
  } = useFieldArray({
    control: form.control,
    name: "expenses",
  })

  const {
    fields: kafilFields,
    append: appendKafil,
    remove: removeKafil,
  } = useFieldArray({
    control: form.control,
    name: "kafils",
  })

  // Load lookup data
  useEffect(() => {
    const loadLookupData = async () => {
      try {
        // Fetch real data from APIs
        const [widowsRefData, kafilsData] = await Promise.all([
          fetch('/api/v1/widows-reference-data').then(async res => {
            if (!res.ok) throw new Error(`Widows reference data API error: ${res.status}`)
            return res.json()
          }),
          fetch('/api/v1/kafils').then(async res => {
            if (!res.ok) throw new Error(`Kafils API error: ${res.status}`)
            return res.json()
          })
        ])

        const apiData: LookupData = {
          neighborhoods: [
            { id: "zahra", name: "حي الزهراء" },
            { id: "noor", name: "حي النور" },
            { id: "salam", name: "حي السلام" },
            { id: "amal", name: "حي الأمل" },
          ],
          housingTypes: (widowsRefData?.data?.housing_types || []).map((item: any) => ({
            id: item.id.toString(),
            name: item.label
          })),
          incomeCategories: (widowsRefData?.data?.income_categories || []).map((item: any) => ({
            id: item.id.toString(),
            name: item.name
          })),
          expenseCategories: (widowsRefData?.data?.expense_categories || []).map((item: any) => ({
            id: item.id.toString(),
            name: item.name
          })),
          skills: (widowsRefData?.data?.skills || []).map((item: any) => ({
            id: item.id.toString(),
            name: item.label
          })),
          illnesses: (widowsRefData?.data?.illnesses || []).map((item: any) => ({
            id: item.id.toString(),
            name: item.label
          })),
          aidTypes: (widowsRefData?.data?.aid_types || []).map((item: any) => ({
            id: item.id.toString(),
            name: item.label
          })),
          partners: (widowsRefData?.data?.partners || []).map((item: any) => ({
            id: item.id.toString(),
            name: item.name
          })),
          kafils: (kafilsData?.data || []).map((item: any) => ({
            id: item.id.toString(),
            name: `${item.first_name} ${item.last_name}`
          })),
        }

        setLookupData(apiData)
      } catch (error) {
        console.error("Error loading lookup data:", error)
        // Fallback to empty data
        setLookupData({
          neighborhoods: [
            { id: "zahra", name: "حي الزهراء" },
            { id: "noor", name: "حي النور" },
            { id: "salam", name: "حي السلام" },
            { id: "amal", name: "حي الأمل" },
          ],
          housingTypes: [],
          incomeCategories: [],
          expenseCategories: [],
          skills: [],
          illnesses: [],
          aidTypes: [],
          partners: [],
          kafils: [],
        })
      }
    }

    if (open) {
      loadLookupData()
    }
  }, [open])

  const onSubmit = async (data: WidowFormData) => {
    console.log("Form submit triggered!")
    console.log("Form validation errors:", form.formState.errors)
    console.log("Form is valid:", form.formState.isValid)
    console.log("Children data:", data.children)
    
    setIsSubmitting(true)
    try {
      console.log("Submitting widow data:", data)
      console.log("Maouna fields:", { 
        maounaActive: data.maounaActive, 
        maounaAmount: data.maounaAmount, 
        maounaPartnerId: data.maounaPartnerId 
      })

      // Transform the form data to match the backend API structure
      const apiData = {
        // Basic widow information
        first_name: data.firstName,
        last_name: data.lastName,
        phone: data.phone,
        email: data.email || "",
        address: data.address || "",
        neighborhood: data.neighborhood?.startsWith('__new_option_') 
          ? data.neighborhood.replace('__new_option_', '') 
          : data.neighborhood,
        admission_date: data.admissionDate.toISOString().split('T')[0],
        national_id: data.nationalId || "",
        birth_date: data.birthDate.toISOString().split('T')[0],
        marital_status: data.maritalStatus || "Widowed",
        education_level: data.educationLevel || "",
        disability_flag: data.disabilityFlag || false,
        disability_type: data.disabilityType || "",

        // Widow Files (social situation)
        social_situation: data.socialSituation || 'widow',
        has_chronic_disease: data.hasChronicDisease || false,
        has_maouna: data.maounaActive || false,

        // Social Information
        housing_type_id: data.housingType ? parseInt(data.housingType) : 1, // Default to first housing type if not selected
        housing_status: data.housingStatus || 'owned',
        has_water: data.hasWater || false,
        has_electricity: data.hasElectricity || false,
        has_furniture: data.hasFurniture || 0,

        // Children/Orphans
        children: (data.children || []).map(child => ({
          first_name: child.firstName,
          last_name: child.lastName,
          birth_date: child.birthDate.toISOString().split('T')[0],
          gender: child.sex,
          education_level: child.schoolLevel || "",
          health_status: "" // Add health_status field
        })),

        // Income and Expenses
        income: (data.incomes || []).map(income => {
          const isNewCategory = income.source?.startsWith('__new_option_')
          return {
            category_id: isNewCategory ? null : income.source,
            category_name: isNewCategory ? income.source.replace('__new_option_', '') : null,
            amount: income.amount,
            description: income.remarks || ""
          }
        }),
        expenses: (data.expenses || []).map(expense => {
          const isNewCategory = expense.category?.startsWith('__new_option_')
          return {
            category_id: isNewCategory ? null : expense.category,
            category_name: isNewCategory ? expense.category.replace('__new_option_', '') : null,
            amount: expense.amount,
            description: expense.remarks || ""
          }
        }),

        // Skills - separate existing and new items
        skills: (data.selectedSkills || []).filter(skill => !skill.startsWith('__new_option_')),
        new_skills: (data.selectedSkills || [])
          .filter(skill => skill.startsWith('__new_option_'))
          .map(skill => skill.replace('__new_option_', '')),

        // Illnesses - separate existing and new items  
        illnesses: (data.selectedIllnesses || []).filter(illness => !illness.startsWith('__new_option_')),
        new_illnesses: (data.selectedIllnesses || [])
          .filter(illness => illness.startsWith('__new_option_'))
          .map(illness => illness.replace('__new_option_', '')),

        // Aid Types
        aid_types: data.selectedAidTypes || [],

        // Maouna
        maouna: data.maounaActive && data.maounaPartnerId && data.maounaAmount 
          ? [{ partner_id: parseInt(data.maounaPartnerId), amount: data.maounaAmount }] 
          : []
      }

      console.log("Transformed API data:", apiData)

      const response = await fetch('/api/v1/widows', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to create widow')
      }

      const result = await response.json()
      console.log("API response:", result)

      // Create sponsorships if any kafils are assigned
      if (data.kafils && data.kafils.length > 0) {
        const widowId = result.data.id
        const sponsorshipPromises = []
        const sponsorshipWarnings = []

        for (const kafil of data.kafils) {
          if (kafil.kafilId && kafil.amount > 0) {
            try {
              const sponsorshipResponse = await api.createSponsorship({
                kafil_id: kafil.kafilId,
                widow_id: widowId,
                amount: kafil.amount
              })

              if (sponsorshipResponse.warning) {
                sponsorshipWarnings.push({
                  kafil: kafil.kafilId,
                  warning: sponsorshipResponse.warning
                })
              }
            } catch (sponsorshipError) {
              console.error('Error creating sponsorship:', sponsorshipError)
              // Continue with other sponsorships even if one fails
            }
          }
        }

        // Show warnings if any sponsorships exceed budget
        if (sponsorshipWarnings.length > 0) {
          toast({
            title: "تحذير بشأن الكفالات",
            description: "تم إنشاء الكفالات ولكن بعضها يتجاوز التعهد الشهري للكفيل",
            variant: "destructive",
          })
        }
      }

      toast({
        title: "تم الحفظ بنجاح",
        description: "تم إضافة الأرملة الجديدة وإنشاء الكفالات بنجاح",
      })

      form.reset()
      onOpenChange(false)
    } catch (error) {
      console.error("Error submitting widow:", error)
      toast({
        title: "خطأ في الحفظ",
        description: error instanceof Error ? error.message : "حدث خطأ أثناء إضافة الأرملة",
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

  if (!lookupData) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>إضافة أرملة جديدة</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p>جاري تحميل البيانات...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto" data-dialog-content-root>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            إضافة أرملة جديدة
          </DialogTitle>
          <DialogDescription>أدخل المعلومات الكاملة للأرملة الجديدة في النظام</DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="personal" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                شخصية
              </TabsTrigger>
              <TabsTrigger value="children" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                الأطفال
              </TabsTrigger>
              <TabsTrigger value="social" className="flex items-center gap-2">
                <Home className="h-4 w-4" />
                اجتماعية
              </TabsTrigger>
              <TabsTrigger value="health" className="flex items-center gap-2">
                <Heart className="h-4 w-4" />
                صحة ومهارات
              </TabsTrigger>
              <TabsTrigger value="aid" className="flex items-center gap-2">
                <HandHeart className="h-4 w-4" />
                مساعدات
              </TabsTrigger>
            </TabsList>

            {/* Personal Information Tab */}
            <TabsContent value="personal" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">الاسم الأول *</Label>
                  <Input id="firstName" {...form.register("firstName")} placeholder="أدخل الاسم الأول" />
                  {form.formState.errors.firstName && (
                    <p className="text-sm text-red-600">{form.formState.errors.firstName.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">اسم العائلة *</Label>
                  <Input id="lastName" {...form.register("lastName")} placeholder="أدخل اسم العائلة" />
                  {form.formState.errors.lastName && (
                    <p className="text-sm text-red-600">{form.formState.errors.lastName.message}</p>
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
                    <p className="text-sm text-red-600">{form.formState.errors.birthDate.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nationalId">رقم الهوية</Label>
                  <Input id="nationalId" {...form.register("nationalId")} placeholder="أدخل رقم الهوية" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">رقم الهاتف *</Label>
                  <Input id="phone" {...form.register("phone")} placeholder="أدخل رقم الهاتف" />
                  {form.formState.errors.phone && (
                    <p className="text-sm text-red-600">{form.formState.errors.phone.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">البريد الإلكتروني</Label>
                  <Input id="email" type="email" {...form.register("email")} placeholder="أدخل البريد الإلكتروني" />
                  {form.formState.errors.email && (
                    <p className="text-sm text-red-600">{form.formState.errors.email.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="neighborhood">الحي *</Label>
                  <Controller
                    name="neighborhood"
                    control={form.control}
                    render={({ field }) => (
                      <SingleSelectRS
                        options={lookupData.neighborhoods.map((neighborhood) => ({ 
                          label: neighborhood.name, 
                          value: neighborhood.name 
                        }))}
                        onChange={field.onChange}
                        value={field.value || ""}
                        placeholder="اختر الحي أو اكتب حياً جديداً"
                        isCreatable={true}
                      />
                    )}
                  />
                  {form.formState.errors.neighborhood && (
                    <p className="text-sm text-red-600">{form.formState.errors.neighborhood.message}</p>
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
                    <p className="text-sm text-red-600">{form.formState.errors.admissionDate.message}</p>
                  )}
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
                    appendChild({
                      firstName: "",
                      lastName: "",
                      sex: "male",
                      birthDate: new Date(),
                      schoolLevel: "",
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
                    </div>
                    <div className="space-y-2">
                      <Label>اسم العائلة *</Label>
                      <Input {...form.register(`children.${index}.lastName`)} placeholder="اسم العائلة" />
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
                      <Input {...form.register(`children.${index}.schoolLevel`)} placeholder="الصف الدراسي" />
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
                  </div>
                </div>
              ))}
            </TabsContent>

            {/* Social Snapshot Tab */}
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
                        <div onClick={(e) => e.stopPropagation()}>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger>
                              <SelectValue placeholder="اختر نوع السكن" />
                            </SelectTrigger>
                            <SelectContent>
                              {lookupData.housingTypes.map((type) => (
                                <SelectItem key={type.id} value={type.id.toString()}>
                                  {type.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    />
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

              {/* Income Sources */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">مصادر الدخل</h3>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => appendIncome({ source: "", amount: 0, remarks: "" })}
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
                          name={`incomes.${index}.source`}
                          control={form.control}
                          render={({ field }) => (
                            <SingleSelectRS
                              options={lookupData.incomeCategories.map((category) => ({ 
                                label: category.name, 
                                value: category.id 
                              }))}
                              onChange={field.onChange}
                              value={field.value || ""}
                              placeholder="اختر المصدر"
                              isCreatable={true}
                            />
                          )}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>المبلغ (₪)</Label>
                        <Input
                          type="number"
                          {...form.register(`incomes.${index}.amount`, { valueAsNumber: true })}
                          placeholder="0"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>ملاحظات</Label>
                        <Input {...form.register(`incomes.${index}.remarks`)} placeholder="ملاحظات إضافية" />
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
                    onClick={() => appendExpense({ category: "", amount: 0, remarks: "" })}
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
                          name={`expenses.${index}.category`}
                          control={form.control}
                          render={({ field }) => (
                            <SingleSelectRS
                              options={lookupData.expenseCategories.map((category) => ({ 
                                label: category.name, 
                                value: category.id 
                              }))}
                              onChange={field.onChange}
                              value={field.value || ""}
                              placeholder="اختر الفئة"
                              isCreatable={true}
                            />
                          )}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>المبلغ (₪)</Label>
                        <Input
                          type="number"
                          {...form.register(`expenses.${index}.amount`, { valueAsNumber: true })}
                          placeholder="0"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>ملاحظات</Label>
                        <Input {...form.register(`expenses.${index}.remarks`)} placeholder="ملاحظات إضافية" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* Skills & Health Tab */}
            <TabsContent value="health" className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">المهارات</h3>
                <div className="space-y-2">
                  <Label>المهارات المتوفرة</Label>
                  <Controller
                    name="selectedSkills"
                    control={form.control}
                    render={({ field }) => {
                      console.log('Skills field render:', { 
                        fieldValue: field.value, 
                        fieldName: field.name,
                        skillsOptions: lookupData.skills
                      })
                      return (
                        <MultiSelectRS
                          options={lookupData.skills.map((skill) => ({ label: skill.name, value: skill.id }))}
                          onChange={(newValue) => {
                            console.log('Skills field onChange:', { newValue, fieldName: field.name })
                            field.onChange(newValue)
                          }}
                          value={field.value || []}
                          placeholder="اختر المهارات"
                          isCreatable={true}
                        />
                      )
                    }}
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
                        options={lookupData.illnesses.map((illness) => ({ label: illness.name, value: illness.id }))}
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
                    name="hasChronicDisease"
                    control={form.control}
                    render={({ field }) => (
                      <Switch id="hasChronicDisease" checked={field.value} onCheckedChange={field.onChange} />
                    )}
                  />
                  <Label htmlFor="hasChronicDisease">يوجد مرض مزمن</Label>
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
            </TabsContent>

            {/* Aid & Sponsorship Tab */}
            <TabsContent value="aid" className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">أنواع المساعدات</h3>
                <div className="space-y-2">
                  <Label>أنواع المساعدات المتاحة</Label>
                  <Controller
                    name="selectedAidTypes"
                    control={form.control}
                    render={({ field }) => (
                      <MultiSelectRS
                        options={lookupData.aidTypes.map((aid) => ({ label: aid.name, value: aid.id }))}
                        onChange={field.onChange}
                        value={field.value || []}
                        placeholder="اختر أنواع المساعدات"
                      />
                    )}
                  />
                </div>
              </div>

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
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>مبلغ المعونة (₪)</Label>
                      <Input
                        type="number"
                        {...form.register("maounaAmount", { valueAsNumber: true })}
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>شريك المعونة</Label>
                      <Controller
                        name="maounaPartnerId"
                        control={form.control}
                        render={({ field }) => (
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger>
                              <SelectValue placeholder="اختر الشريك" />
                            </SelectTrigger>
                            <SelectContent>
                              {lookupData.partners.map((partner) => (
                                <SelectItem key={partner.id} value={partner.id}>
                                  {partner.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Kafils Section */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">الكفلاء</h3>
                  <Button type="button" variant="outline" onClick={() => appendKafil({ kafilId: "", amount: 0 })}>
                    <Plus className="h-4 w-4 ml-2" />
                    إضافة كفيل
                  </Button>
                </div>

                {kafilFields.map((field, index) => (
                  <div key={field.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="font-medium">الكفيل {index + 1}</h4>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeKafil(index)}
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
                            <div onClick={(e) => e.stopPropagation()}>
                              <KafilSelector
                                value={field.value}
                                onValueChange={field.onChange}
                                placeholder="اختر الكفيل"
                              />
                            </div>
                          )}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>مبلغ الكفالة (₪)</Label>
                        <Input
                          type="number"
                          {...form.register(`kafils.${index}.amount`, { valueAsNumber: true })}
                          placeholder="0"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              إلغاء
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              onClick={() => console.log("Submit button clicked!")}
            >
              {isSubmitting ? "جاري الحفظ..." : "حفظ البيانات"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
