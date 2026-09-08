"use client"

import { useState, useEffect } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import ReactSelect from "react-select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { useToast } from "@/hooks/use-toast"
import { CalendarIcon, HandCoins, Plus } from "lucide-react"
import { format } from "date-fns"
import { ar } from "date-fns/locale"
import { formatDateArabic } from "@/lib/date-utils"
import { cn } from "@/lib/utils"
import { AddDonorSheet } from "@/components/donors/add-donor-sheet"
import { KafalaChamilaSplitEditor } from "@/components/forms/KafalaChamilaSplitEditor"
import api from "@/lib/api"

const incomeSchema = z
  .object({
    income_date: z.date({ required_error: "التاريخ مطلوب" }),
    sub_budget_id: z.string().optional(),
    income_category_id: z.string().optional(),
    income_type: z.enum(["donation", "kafala", "kafala_chamila"], { required_error: "نوع الإيراد مطلوب" }),
    donor_id: z.string().optional(),
    kafil_id: z.string().optional(),
    amount: z.number().positive("المبلغ يجب أن يكون موجباً"),
    kafala_chamila_splits: z.array(z.object({ split_id: z.number(), amount: z.number() })).optional(),
    payment_method: z.enum(["Cash", "Cheque", "BankWire"], { required_error: "طريقة الدفع مطلوبة" }),
    cheque_number: z.string().optional(),
    receipt_number: z.string().optional(),
    bank_account_id: z.string().optional(),
    remarks: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.payment_method === "Cheque") {
        return data.cheque_number && data.cheque_number.length > 0
      }
      return true
    },
    {
      message: "رقم الشيك مطلوب",
      path: ["cheque_number"],
    },
  )
  .refine(
    (data) => {
      if (data.payment_method === "Cash") {
        return data.receipt_number && data.receipt_number.length > 0
      }
      return true
    },
    {
      message: "رقم الإيصال مطلوب",
      path: ["receipt_number"],
    },
  )
  .refine(
    (data) => {
      if (data.payment_method === "BankWire") {
        return data.bank_account_id && data.bank_account_id.length > 0
      }
      return true
    },
    {
      message: "الحساب البنكي مطلوب",
      path: ["bank_account_id"],
    },
  )
  .refine(
    (data) => {
      if (data.income_type === "donation") {
        return data.donor_id && data.donor_id.length > 0
      } else if (data.income_type === "kafala" || data.income_type === "kafala_chamila") {
        return data.kafil_id && data.kafil_id.length > 0
      }
      return true
    },
    {
      message: "يجب اختيار المتبرع أو الكفيل",
      path: ["donor_id"],
    },
  )
  .refine((data) => data.income_type === "kafala_chamila" || (data.sub_budget_id && data.sub_budget_id.length > 0), {
    message: "الميزانية الفرعية مطلوبة",
    path: ["sub_budget_id"],
  })
  .refine(
    (data) => data.income_type === "kafala_chamila" || (data.income_category_id && data.income_category_id.length > 0),
    {
      message: "الفئة مطلوبة",
      path: ["income_category_id"],
    },
  )
  .refine(
    (data) => {
      if (data.income_type !== "kafala_chamila") return true
      const splits = data.kafala_chamila_splits || []
      return splits.length > 0 && splits.some((s) => s.amount > 0)
    },
    {
      message: "يجب إدخال مبلغ واحد على الأقل في بنود توزيع الكفالة الشاملة",
      path: ["kafala_chamila_splits"],
    },
  )

type IncomeFormData = z.infer<typeof incomeSchema>

interface NewIncomeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialData?: any
  onSuccess?: () => void
}

export function NewIncomeDialog({ open, onOpenChange, initialData, onSuccess }: NewIncomeDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  const [showAddDonorSheet, setShowAddDonorSheet] = useState(false)
  
  // Form data states
  const [subBudgets, setSubBudgets] = useState<any[]>([])
  const [incomeCategories, setIncomeCategories] = useState<any[]>([])
  const [filteredCategories, setFilteredCategories] = useState<any[]>([])
  const [donors, setDonors] = useState<any[]>([])
  const [kafils, setKafils] = useState<any[]>([])
  const [bankAccounts, setBankAccounts] = useState<any[]>([])
  const [selectedKafilSponsorship, setSelectedKafilSponsorship] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [activeFiscalYear, setActiveFiscalYear] = useState<any>(null)
  const [showFiscalYearWarning, setShowFiscalYearWarning] = useState(false)
  const [pendingSubmitData, setPendingSubmitData] = useState<IncomeFormData | null>(null)

  const handleClose = () => {
    // Force remove any lingering pointer-events blocking
    setTimeout(() => {
      document.body.style.pointerEvents = 'auto'
    }, 100)
    onOpenChange(false)
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Force remove any lingering pointer-events blocking
      setTimeout(() => {
        document.body.style.pointerEvents = 'auto'
      }, 100)
      onOpenChange(false)
    }
  }

  const form = useForm<IncomeFormData>({
    resolver: zodResolver(incomeSchema),
    defaultValues: {
      income_type: "donation",
      payment_method: "Cash",
      kafala_chamila_splits: [],
      ...initialData,
    },
  })

  // Load form data when dialog opens
  useEffect(() => {
    if (open) {
      loadFormData()
      if (initialData) {
        form.reset({
          income_type: "donation",
          payment_method: "Cash",
          kafala_chamila_splits: [],
          ...initialData,
        })
      }
    }
  }, [open, initialData, form])
  
  // Load form reference data
  const loadFormData = async () => {
    setLoading(true)
    try {
      const [subBudgetsRes, categoriesRes, donorsRes, kafilsRes, bankAccountsRes, fiscalYearRes] = await Promise.all([
        api.getSubBudgets(),
        api.getIncomeCategories(),
        api.getDonors(),
        api.getKafilsForSponsorship(),
        api.getBankAccounts(),
        api.getActiveFiscalYear()
      ])
      
      setSubBudgets(subBudgetsRes.data || [])
      setIncomeCategories(categoriesRes.data || [])
      setDonors(donorsRes.data || [])
      setKafils(kafilsRes.data || [])
      setBankAccounts(bankAccountsRes.data || [])
      setActiveFiscalYear(fiscalYearRes)
    } catch (error) {
      console.error('Error loading form data:', error)
      toast({
        title: "خطأ في تحميل البيانات",
        description: "حدث خطأ أثناء تحميل بيانات النموذج",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }
  
  // Auto-set sub-budget and category when kafala income type is selected
  useEffect(() => {
    const incomeType = form.watch('income_type')
    if (incomeType === 'kafala') {
      // Find kafala sub-budget and income category
      const kafalaSubBudget = subBudgets.find(sb => sb.label === 'كفالة شاملة')
      const kafalaCategory = incomeCategories.find(cat => cat.label === 'كفالة شاملة')

      if (kafalaSubBudget) {
        form.setValue('sub_budget_id', kafalaSubBudget.id.toString())
      }
      if (kafalaCategory) {
        form.setValue('income_category_id', kafalaCategory.id.toString())
      }
    } else if (incomeType === 'kafala_chamila') {
      // Each split part carries its own sub-budget/category server-side -
      // there's no single one to select here.
      form.setValue('sub_budget_id', '')
      form.setValue('income_category_id', '')
      if (!form.getValues('amount')) {
        form.setValue('amount', 800)
      }
    }
  }, [form.watch('income_type'), subBudgets, incomeCategories, form])

  // Filter categories based on selected sub-budget
  useEffect(() => {
    const subBudgetId = form.watch('sub_budget_id')
    if (subBudgetId) {
      const filtered = incomeCategories.filter(cat => cat.sub_budget_id === parseInt(subBudgetId))
      setFilteredCategories(filtered)
    } else {
      setFilteredCategories([])
    }
  }, [form.watch('sub_budget_id'), incomeCategories])
  
  // Handle kafil selection and auto-fill amount
  const handleKafilChange = (kafil: any) => {
    if (kafil && kafil.sponsorships && kafil.sponsorships.length > 0) {
      // Set all sponsorships for display
      setSelectedKafilSponsorship(kafil)
      // Auto-fill with total amount of all sponsorships or monthly pledge -
      // kafala chamila is a flat package price (800 by default), not tied
      // to this kafil's per-widow sponsorship total, so it's left alone.
      if (form.getValues('income_type') !== 'kafala_chamila') {
        const totalAmount = kafil.sponsorships.reduce((sum: number, sp: any) => sum + parseFloat(sp.amount || 0), 0)
        const monthlyPledge = parseFloat(kafil.monthly_pledge || 0)
        form.setValue('amount', (totalAmount || monthlyPledge).toString())
      }
    } else {
      setSelectedKafilSponsorship(null)
    }
  }

  const paymentMethod = form.watch("payment_method")
  const incomeType = form.watch("income_type")
  const selectedSubBudget = form.watch("sub_budget_id")
  
  // Clear irrelevant fields when payment method changes
  useEffect(() => {
    if (paymentMethod === 'Cash') {
      form.setValue('cheque_number', '')
      form.setValue('bank_account_id', '')
    } else if (paymentMethod === 'Cheque') {
      form.setValue('receipt_number', '')
      form.setValue('bank_account_id', '')
    } else if (paymentMethod === 'BankWire') {
      form.setValue('cheque_number', '')
      form.setValue('receipt_number', '')
    }
  }, [paymentMethod, form])

  const handleDonorAdded = (newDonorId: string) => {
    // Auto-select the newly added donor
    form.setValue("donor_id", newDonorId)
    setShowAddDonorSheet(false)
    // Reload donors list to include the new donor
    api.getDonors().then(res => setDonors(res.data || []))
  }

  // Check if date is outside active fiscal year
  const isDateOutsideFiscalYear = (date: Date) => {
    if (!activeFiscalYear) return false
    
    const incomeYear = date.getFullYear()
    const fiscalYear = parseInt(activeFiscalYear.year)
    
    return incomeYear !== fiscalYear
  }

  // Process form submission with fiscal year validation
  const processSubmission = async (data: IncomeFormData) => {
    setIsSubmitting(true)
    try {
      // Determine transferred_at for BankWire payments
      const transferredAt = data.payment_method === 'BankWire' ? format(data.income_date, 'yyyy-MM-dd') : undefined

      // Always use active fiscal year ID
      const fiscalYearId = activeFiscalYear?.id || 1

      // A kafala chamila payment is recorded as one income per split part,
      // via its own dedicated endpoint - not the regular single-category form below.
      if (data.income_type === 'kafala_chamila') {
        const splits = (data.kafala_chamila_splits || [])
          .filter((s) => s.amount > 0)
          .map((s) => ({ split_id: s.split_id, amount: s.amount }))

        const result = await api.createKafalaChamilaIncome({
          kafil_id: parseInt(data.kafil_id!),
          fiscal_year_id: fiscalYearId,
          income_date: format(data.income_date, 'yyyy-MM-dd'),
          payment_method: data.payment_method,
          cheque_number: data.payment_method === 'Cheque' ? (data.cheque_number || undefined) : undefined,
          receipt_number: data.payment_method === 'Cash' ? (data.receipt_number || undefined) : undefined,
          bank_account_id: data.payment_method === 'BankWire' && data.bank_account_id ?
            parseInt(data.bank_account_id) : undefined,
          remarks: data.remarks || undefined,
          transferred_at: transferredAt,
          splits,
        })

        toast({
          title: "تم الحفظ بنجاح",
          description: result?.message || "تم إنشاء إيرادات الكفالة الشاملة وهي في انتظار الموافقة",
        })

        form.reset()
        handleClose()
        onSuccess?.()
        return
      }

      // Prepare data with only relevant fields based on payment method
      const incomeData = {
        fiscal_year_id: fiscalYearId,
        sub_budget_id: parseInt(data.sub_budget_id!),
        income_category_id: parseInt(data.income_category_id!),
        donor_id: data.income_type === 'donation' && data.donor_id ? parseInt(data.donor_id) : undefined,
        kafil_id: data.income_type === 'kafala' && data.kafil_id ? parseInt(data.kafil_id) : undefined,
        income_date: format(data.income_date, 'yyyy-MM-dd'),
        amount: data.amount,
        payment_method: data.payment_method,
        // Only include relevant fields based on payment method
        cheque_number: data.payment_method === 'Cheque' ? (data.cheque_number || undefined) : undefined,
        receipt_number: data.payment_method === 'Cash' ? (data.receipt_number || undefined) : undefined,
        bank_account_id: data.payment_method === 'BankWire' && data.bank_account_id ?
          parseInt(data.bank_account_id) : undefined,
        remarks: data.remarks || undefined,
        transferred_at: transferredAt,
      }

      // Create or update income via API
      if (initialData?.id) {
        await api.updateIncome(initialData.id, incomeData)
      } else {
        await api.createIncome(incomeData)
      }

      toast({
        title: "تم الحفظ بنجاح",
        description: initialData?.id ? "تم تحديث الإيراد بنجاح" : "تم إضافة الإيراد الجديد وهو في انتظار الموافقة",
      })

      form.reset()
      handleClose()
      onSuccess?.()
    } catch (error: any) {
      toast({
        title: "خطأ في الحفظ",
        description: error.message || "حدث خطأ أثناء حفظ البيانات",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const onSubmit = async (data: IncomeFormData) => {
    // Check if date is outside fiscal year
    if (isDateOutsideFiscalYear(data.income_date)) {
      setPendingSubmitData(data)
      setShowFiscalYearWarning(true)
      return
    }

    // If date is within fiscal year, proceed with submission
    await processSubmission(data)
  }

  // Handle warning dialog confirmation
  const handleWarningConfirm = async () => {
    setShowFiscalYearWarning(false)
    if (pendingSubmitData) {
      await processSubmission(pendingSubmitData)
      setPendingSubmitData(null)
    }
  }

  // Handle warning dialog cancel
  const handleWarningCancel = () => {
    setShowFiscalYearWarning(false)
    setPendingSubmitData(null)
  }

  // React Select custom styles
  const selectStyles = {
    control: (base: any) => ({
      ...base,
      minHeight: "40px",
      border: "1px solid hsl(var(--border))",
      borderRadius: "calc(var(--radius) - 2px)",
      "&:hover": {
        border: "1px solid hsl(var(--border))",
      },
    }),
    menu: (base: any) => ({
      ...base,
      zIndex: 9999,
    }),
  }

  // Custom date picker component
  const CustomDatePicker = ({
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
      "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
      "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
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

  return (
    <>
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HandCoins className="h-5 w-5" />
            {initialData?.id ? "تحرير الإيراد" : "إضافة إيراد جديد"}
          </DialogTitle>
          <DialogDescription>أدخل تفاصيل الإيراد أو التبرع الجديد</DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="flex justify-center py-8">
            <div className="animate-spin h-8 w-8 border-4 border-gray-300 border-t-blue-600 rounded-full"></div>
          </div>
        )}

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Date and Income Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>تاريخ الإيراد *</Label>
              <Controller
                name="income_date"
                control={form.control}
                render={({ field }) => (
                  <CustomDatePicker
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="اختر تاريخ الإيراد"
                  />
                )}
              />
              {form.formState.errors.income_date && (
                <p className="text-sm text-red-600">{form.formState.errors.income_date.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>نوع الإيراد *</Label>
              <Controller
                name="income_type"
                control={form.control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر نوع الإيراد" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="donation">تبرع عادي</SelectItem>
                      <SelectItem value="kafala">كفالة</SelectItem>
                      {/* A kafala chamila batch creates several new income rows at once - not meaningful when editing one existing row. */}
                      {!initialData?.id && (
                        <SelectItem value="kafala_chamila">كفالة شاملة</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                )}
              />
              {form.formState.errors.income_type && (
                <p className="text-sm text-red-600">{form.formState.errors.income_type.message}</p>
              )}
            </div>
          </div>

          {/* Sub Budget and Category */}
          {incomeType !== 'kafala_chamila' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>الميزانية الفرعية *</Label>
              <Controller
                name="sub_budget_id"
                control={form.control}
                render={({ field }) => (
                  <ReactSelect
                    {...field}
                    options={subBudgets.map(budget => ({
                      value: budget.id.toString(),
                      label: budget.label
                    }))}
                    value={subBudgets.find(budget => budget.id.toString() === field.value) ? 
                      { value: field.value, label: subBudgets.find(budget => budget.id.toString() === field.value)?.label } : 
                      null}
                    onChange={(option: any) => {
                      field.onChange(option?.value || "")
                      // Reset category when sub-budget changes
                      form.setValue('income_category_id', "")
                    }}
                    placeholder={incomeType === 'kafala' ? "كفالة شاملة (محدد تلقائياً)" : "اختر الميزانية الفرعية..."}
                    styles={selectStyles}
                    isClearable={incomeType !== 'kafala'}
                    isSearchable={incomeType !== 'kafala'}
                    isDisabled={incomeType === 'kafala'}
                    isRtl
                  />
                )}
              />
              {form.formState.errors.sub_budget_id && (
                <p className="text-sm text-red-600">{form.formState.errors.sub_budget_id.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>فئة الإيراد *</Label>
              <Controller
                name="income_category_id"
                control={form.control}
                render={({ field }) => (
                  <ReactSelect
                    {...field}
                    options={filteredCategories.map(category => ({
                      value: category.id.toString(),
                      label: category.label
                    }))}
                    value={filteredCategories.find(category => category.id.toString() === field.value) ? 
                      { value: field.value, label: filteredCategories.find(category => category.id.toString() === field.value)?.label } : 
                      null}
                    onChange={(option: any) => field.onChange(option?.value || "")}
                    placeholder={incomeType === 'kafala' ? "كفالة شاملة (محدد تلقائياً)" : (selectedSubBudget ? "اختر فئة الإيراد..." : "اختر الميزانية الفرعية أولاً")}
                    styles={selectStyles}
                    isClearable={incomeType !== 'kafala'}
                    isSearchable={incomeType !== 'kafala'}
                    isRtl
                    isDisabled={incomeType === 'kafala' || !selectedSubBudget}
                  />
                )}
              />
              {form.formState.errors.income_category_id && (
                <p className="text-sm text-red-600">{form.formState.errors.income_category_id.message}</p>
              )}
            </div>
          </div>
          )}

          {/* Donor/Kafil Selection */}
          <div className="space-y-4">
            {incomeType === "donation" ? (
              <div className="space-y-2">
                <Label>المتبرع *</Label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Controller
                      name="donor_id"
                      control={form.control}
                      render={({ field }) => (
                        <ReactSelect
                          {...field}
                          options={donors.map(donor => ({
                            value: donor.id.toString(),
                            label: `${donor.first_name} ${donor.last_name}${donor.phone ? ` - ${donor.phone}` : ''}`
                          }))}
                          value={donors.find(donor => donor.id.toString() === field.value) ? 
                            { value: field.value, label: `${donors.find(donor => donor.id.toString() === field.value)?.first_name} ${donors.find(donor => donor.id.toString() === field.value)?.last_name}` } : 
                            null}
                          onChange={(option: any) => field.onChange(option?.value || "")}
                          placeholder="ابحث عن المتبرع..."
                          styles={selectStyles}
                          isClearable
                          isSearchable
                          isRtl
                        />
                      )}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setShowAddDonorSheet(true)}
                    className="shrink-0"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {form.formState.errors.donor_id && (
                  <p className="text-sm text-red-600">{form.formState.errors.donor_id.message}</p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <Label>الكفيل *</Label>
                <Controller
                  name="kafil_id"
                  control={form.control}
                  render={({ field }) => (
                    <ReactSelect
                      {...field}
                      options={kafils.map(kafil => {
                        const totalWidows = kafil.sponsorships?.length || 0
                        const totalAmount = kafil.sponsorships?.reduce((sum: number, sp: any) => sum + parseFloat(sp.amount || 0), 0) || 0
                        const monthlyPledge = parseFloat(kafil.monthly_pledge || 0)
                        const widowsList = kafil.sponsorships?.map((sp: any) => sp.widow?.first_name + ' ' + sp.widow?.last_name).join(' | ') || 'لا توجد كفالات'
                        
                        return {
                          value: kafil.id.toString(),
                          label: `${kafil.first_name} ${kafil.last_name} - التعهد الشهري: ${monthlyPledge} د.م - يكفل ${totalWidows} أرامل (${totalAmount} د.م)`,
                          kafil: kafil,
                          widowsList: widowsList,
                          totalAmount: totalAmount,
                          monthlyPledge: monthlyPledge,
                          sponsorships: kafil.sponsorships
                        }
                      })}
                      value={kafils.find(kafil => kafil.id.toString() === field.value) ? 
                        { 
                          value: field.value, 
                          label: `${kafils.find(kafil => kafil.id.toString() === field.value)?.first_name} ${kafils.find(kafil => kafil.id.toString() === field.value)?.last_name}`,
                          sponsorships: kafils.find(kafil => kafil.id.toString() === field.value)?.sponsorships
                        } : 
                        null}
                      onChange={(option: any) => {
                        field.onChange(option?.value || "")
                        handleKafilChange(option?.kafil)
                      }}
                      placeholder="ابحث عن الكفيل..."
                      styles={{
                        ...selectStyles,
                        option: (provided: any, state: any) => ({
                          ...provided,
                          fontSize: '14px',
                          padding: '8px 12px'
                        }),
                        singleValue: (provided: any) => ({
                          ...provided,
                          fontSize: '14px'
                        })
                      }}
                      isClearable
                      isSearchable
                      isRtl
                    />
                  )}
                />
                {selectedKafilSponsorship && (
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg">
                    <div className="mb-3">
                      <h4 className="text-lg font-semibold text-blue-900 flex items-center gap-2">
                        <HandCoins className="h-5 w-5" />
                        معلومات الكفيل: {selectedKafilSponsorship.first_name} {selectedKafilSponsorship.last_name}
                      </h4>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="bg-white p-3 rounded-lg border">
                        <p className="text-sm font-medium text-gray-700">التعهد الشهري:</p>
                        <p className="text-lg font-bold text-green-600">{parseFloat(selectedKafilSponsorship.monthly_pledge || 0)} د.م</p>
                      </div>
                      <div className="bg-white p-3 rounded-lg border">
                        <p className="text-sm font-medium text-gray-700">عدد الأرامل المكفولات:</p>
                        <p className="text-lg font-bold text-blue-600">{selectedKafilSponsorship.sponsorships?.length || 0} أرملة</p>
                      </div>
                    </div>

                    {selectedKafilSponsorship.sponsorships && selectedKafilSponsorship.sponsorships.length > 0 && (
                      <div className="bg-white p-4 rounded-lg border">
                        <h5 className="text-md font-semibold text-gray-800 mb-3">الأرامل المكفولات:</h5>
                        <div className="space-y-2">
                          {selectedKafilSponsorship.sponsorships.map((sponsorship: any, index: number) => (
                            <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                              <span className="font-medium text-gray-700">
                                {sponsorship.widow?.first_name} {sponsorship.widow?.last_name}
                              </span>
                              <span className="text-green-600 font-semibold">
                                {parseFloat(sponsorship.amount || 0)} د.م
                              </span>
                            </div>
                          ))}
                        </div>
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <div className="flex justify-between items-center">
                            <span className="font-semibold text-gray-800">إجمالي المبالغ:</span>
                            <span className="text-xl font-bold text-blue-600">
                              {selectedKafilSponsorship.sponsorships.reduce((sum: number, sp: any) => sum + parseFloat(sp.amount || 0), 0)} د.م
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {incomeType === 'kafala' && (
                      <div className="mt-3 text-xs text-blue-600 bg-blue-100 p-2 rounded">
                        💡 تم تعيين المبلغ تلقائياً حسب إجمالي الكفالات. يمكن تعديل المبلغ حسب الحاجة.
                      </div>
                    )}
                  </div>
                )}
                {form.formState.errors.kafil_id && (
                  <p className="text-sm text-red-600">{form.formState.errors.kafil_id.message}</p>
                )}
              </div>
            )}
          </div>

          {/* Amount and Payment Method */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{incomeType === 'kafala_chamila' ? 'المبلغ الإجمالي المستهدف (د.م) *' : 'المبلغ (د.م) *'}</Label>
              <Input
                type="number"
                {...form.register("amount", { valueAsNumber: true })}
                placeholder="أدخل المبلغ"
                step="0.01"
                min="0"
              />
              {incomeType === 'kafala_chamila' && (
                <p className="text-xs text-gray-500">يُستخدم لتوليد التوزيع أدناه، ويبقى قابلاً للتعديل يدوياً لكل بند</p>
              )}
              {form.formState.errors.amount && (
                <p className="text-sm text-red-600">{form.formState.errors.amount.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>طريقة الدفع *</Label>
              <Controller
                name="payment_method"
                control={form.control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر طريقة الدفع" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cash">نقدي</SelectItem>
                      <SelectItem value="Cheque">شيك</SelectItem>
                      <SelectItem value="BankWire">حوالة بنكية</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {form.formState.errors.payment_method && (
                <p className="text-sm text-red-600">{form.formState.errors.payment_method.message}</p>
              )}
            </div>
          </div>

          {/* Kafala Chamila Split */}
          {incomeType === 'kafala_chamila' && (
            <div className="space-y-2">
              <Controller
                name="kafala_chamila_splits"
                control={form.control}
                render={({ field }) => (
                  <KafalaChamilaSplitEditor
                    totalAmount={form.watch('amount') || 0}
                    value={field.value || []}
                    onChange={field.onChange}
                  />
                )}
              />
              {form.formState.errors.kafala_chamila_splits && (
                <p className="text-sm text-red-600">{form.formState.errors.kafala_chamila_splits.message}</p>
              )}
            </div>
          )}

          {/* Payment Method Specific Fields */}
          {paymentMethod === "Cheque" && (
            <div className="space-y-2">
              <Label>رقم الشيك *</Label>
              <Input {...form.register("cheque_number")} placeholder="أدخل رقم الشيك" />
              {form.formState.errors.cheque_number && (
                <p className="text-sm text-red-600">{form.formState.errors.cheque_number.message}</p>
              )}
              <p className="text-xs text-gray-500">
                سيتم تحويل الشيك إلى الحساب البنكي لاحقاً عند إيداعه
              </p>
            </div>
          )}

          {paymentMethod === "Cash" && (
            <div className="space-y-2">
              <Label>رقم الإيصال *</Label>
              <Input {...form.register("receipt_number")} placeholder="أدخل رقم الإيصال" />
              {form.formState.errors.receipt_number && (
                <p className="text-sm text-red-600">{form.formState.errors.receipt_number.message}</p>
              )}
            </div>
          )}

          {paymentMethod === "BankWire" && (
            <div className="space-y-2">
              <Label>الحساب البنكي *</Label>
              <Controller
                name="bank_account_id"
                control={form.control}
                render={({ field }) => (
                  <ReactSelect
                    {...field}
                    options={bankAccounts.map(account => ({
                      value: account.id.toString(),
                      label: `${account.label} - ${account.bank_name}`
                    }))}
                    value={bankAccounts.find(account => account.id.toString() === field.value) ? 
                      { value: field.value, label: `${bankAccounts.find(account => account.id.toString() === field.value)?.label} - ${bankAccounts.find(account => account.id.toString() === field.value)?.bank_name}` } : 
                      null}
                    onChange={(option: any) => field.onChange(option?.value || "")}
                    placeholder="اختر الحساب البنكي..."
                    styles={selectStyles}
                    isClearable
                    isSearchable
                    isRtl
                  />
                )}
              />
              {form.formState.errors.bank_account_id && (
                <p className="text-sm text-red-600">{form.formState.errors.bank_account_id.message}</p>
              )}
            </div>
          )}

          {/* Remarks */}
          <div className="space-y-2">
            <Label>ملاحظات</Label>
            <Textarea {...form.register("remarks")} placeholder="أي ملاحظات إضافية" rows={3} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
              إلغاء
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "جاري الحفظ..." : initialData?.id ? "تحديث الإيراد" : "حفظ الإيراد"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>

      <AddDonorSheet 
        open={showAddDonorSheet} 
        onOpenChange={setShowAddDonorSheet}
        onSuccess={handleDonorAdded}
      />
    </Dialog>

    {/* Fiscal Year Warning Dialog - Separate from main dialog */}
    <Dialog open={showFiscalYearWarning} onOpenChange={setShowFiscalYearWarning}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-orange-600">
            ⚠️ تحذير السنة المالية
          </DialogTitle>
          <DialogDescription>
            التاريخ المحدد ({pendingSubmitData ? format(pendingSubmitData.income_date, 'yyyy/MM/dd') : ''}) لا يقع ضمن السنة المالية النشطة ({activeFiscalYear?.year}).
            <br /><br />
            سيتم ربط هذا الإيراد بالسنة المالية النشطة ({activeFiscalYear?.year}) وليس بسنة التاريخ المحدد.
            <br /><br />
            هل تريد المتابعة؟
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button 
            variant="outline" 
            onClick={handleWarningCancel}
            disabled={isSubmitting}
          >
            إلغاء
          </Button>
          <Button 
            onClick={handleWarningConfirm}
            disabled={isSubmitting}
            className="bg-orange-600 hover:bg-orange-700"
          >
            {isSubmitting ? "جاري الحفظ..." : "متابعة"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  )
}