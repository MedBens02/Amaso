"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useForm, useFieldArray, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { api } from "@/lib/api"
import { CalendarIcon, Plus, Trash2, Users, DollarSign, FileText, CreditCard } from "lucide-react"
import { format } from "date-fns"
import { ar } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { formatDateArabic } from "@/lib/date-utils"

// Form validation schema
const expenseSchema = z.object({
  fiscal_year_id: z.number().min(1, "السنة المالية مطلوبة"),
  sub_budget_id: z.number().min(1, "الميزانية الفرعية مطلوبة"),
  expense_category_id: z.number().min(1, "فئة المصروف مطلوبة"),
  partner_id: z.number().optional(),
  expense_date: z.date({ required_error: "تاريخ المصروف مطلوب" }),
  amount: z.number().min(0.01, "المبلغ يجب أن يكون أكبر من صفر"),
  payment_method: z.enum(["Cash", "Cheque", "BankWire"], { required_error: "طريقة الدفع مطلوبة" }),
  cheque_number: z.string().optional(),
  receipt_number: z.string().optional(),
  bank_account_id: z.number().optional(),
  details: z.string().optional(),
  remarks: z.string().optional(),
  unrelated_to_benef: z.boolean().default(false),
  beneficiaries: z.array(z.object({
    beneficiary_id: z.number(),
    amount: z.number().min(0),
    notes: z.string().optional()
  })).optional()
}).refine((data) => {
  // Payment method specific validations
  if (data.payment_method === "Cheque" && !data.cheque_number) {
    return false
  }
  if ((data.payment_method === "Cheque" || data.payment_method === "BankWire") && !data.bank_account_id) {
    return false
  }
  return true
}, {
  message: "تأكد من ملء جميع الحقول المطلوبة لطريقة الدفع المختارة"
}).refine((data) => {
  // Beneficiaries validation
  if (!data.unrelated_to_benef) {
    const hasBeneficiaries = data.beneficiaries && data.beneficiaries.length > 0
    const hasGroups = data.beneficiary_groups && data.beneficiary_groups.length > 0
    return hasBeneficiaries || hasGroups
  }
  return true
}, {
  message: "يجب اختيار مستفيدين أو مجموعات مستفيدين إذا كان المصروف مرتبط بالمستفيدين"
})

type ExpenseFormData = z.infer<typeof expenseSchema>

// Types
interface SubBudget {
  id: number
  label: string
}

interface ExpenseCategory {
  id: number
  label: string
  sub_budget_id: number
}

interface Partner {
  id: number
  name: string
}

interface BankAccount {
  id: number
  name: string
  bank_name: string
}

interface Beneficiary {
  id: number
  first_name: string
  last_name: string
  type: 'Widow' | 'Orphan'
  full_name?: string
  orphan?: {
    id: number
    widow_id: number
    birth_date: string
    gender: string
    health_status?: string
    education_level?: {
      name_ar: string
    }
  }
  widow?: {
    id: number
    full_name: string
    birth_date: string
    disability_flag: boolean
    disability_type?: string
  }
}


interface NewExpenseFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
  initialData?: Partial<ExpenseFormData>
}

export function NewExpenseDialog({ open, onOpenChange, onSuccess, initialData }: NewExpenseFormProps) {
  // Form state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("basic")
  
  // Reference data
  const [subBudgets, setSubBudgets] = useState<SubBudget[]>([])
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>([])
  const [partners, setPartners] = useState<Partner[]>([])
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([])
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([])
  const [widows, setWidows] = useState<Beneficiary[]>([])
  const [activeFiscalYear, setActiveFiscalYear] = useState<any>(null)
  
  // Beneficiary search
  const [beneficiarySearchTerm, setBeneficiarySearchTerm] = useState("")
  const [beneficiaryTypeFilter, setBeneficiaryTypeFilter] = useState<'all' | 'Widow' | 'Orphan'>('all')
  const [beneficiarySearchLoading, setBeneficiarySearchLoading] = useState(false)
  
  const { toast } = useToast()
  
  // Form setup
  const form = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      payment_method: "Cash",
      unrelated_to_benef: false,
      amount: 0,
      beneficiaries: [],
      beneficiary_groups: []
    }
  })
  
  const { fields: beneficiaryFields, append: addBeneficiary, remove: removeBeneficiary } = useFieldArray({
    control: form.control,
    name: "beneficiaries"
  })
  
  
  // Watch form values
  const paymentMethod = form.watch("payment_method")
  const subBudgetId = form.watch("sub_budget_id")
  const unrelatedToBenef = form.watch("unrelated_to_benef")
  const totalAmount = form.watch("amount") || 0
  
  // Load data when dialog opens
  useEffect(() => {
    if (open) {
      loadReferenceData()
      resetForm()
    }
  }, [open])
  
  // Reset form
  const resetForm = () => {
    form.reset({
      payment_method: "Cash",
      unrelated_to_benef: false,
      amount: 0,
      beneficiaries: [],
      ...initialData
    })
    setActiveTab("basic")
  }
  
  // Load reference data
  const loadReferenceData = async () => {
    setLoading(true)
    try {
      // Try to load real data from API
      const [subBudgetsRes, categoriesRes, partnersRes, bankAccountsRes, fiscalYearRes] = await Promise.all([
        api.getSubBudgets(),
        api.getExpenseCategories(),
        api.getPartners(),
        api.getBankAccounts(),
        api.getActiveFiscalYear()
      ])
      
      // Use real data from API
      setSubBudgets(subBudgetsRes.data || [])
      setExpenseCategories(categoriesRes.data || [])
      setPartners(partnersRes.data || [])
      setBankAccounts(bankAccountsRes.data || [])
      setBeneficiaries([]) // Start with empty - user must search
      setActiveFiscalYear(fiscalYearRes || null)
      
      // Load widows data for orphan mother names
      try {
        const widowsRes = await api.getBeneficiaries()
        const widowsData = widowsRes.data?.filter((b: any) => b.type === 'Widow') || []
        setWidows(widowsData)
      } catch (error) {
        console.error('Error loading widows data:', error)
      }
      
      if (fiscalYearRes) {
        form.setValue("fiscal_year_id", fiscalYearRes.id)
      }
      
      console.log('Successfully loaded real data from API')
      
    } catch (error) {
      console.error('Error loading reference data from API:', error)
      
      // Fallback data only if API fails
      const fallbackData = {
        subBudgets: [
          { id: 1, label: "المساعدات الشهرية" },
          { id: 2, label: "التعليم" },
          { id: 3, label: "الطوارئ" },
          { id: 4, label: "الصحة" }
        ],
        expenseCategories: [
          { id: 1, label: "مساعدات نقدية", sub_budget_id: 1 },
          { id: 2, label: "رسوم دراسية", sub_budget_id: 2 },
          { id: 3, label: "مساعدات طبية", sub_budget_id: 3 },
          { id: 4, label: "أدوية", sub_budget_id: 4 }
        ],
        partners: [
          { id: 1, name: "شريك المعونة الأول" },
          { id: 2, name: "وزارة التعليم" },
          { id: 3, name: "مستشفى الأمل" }
        ],
        bankAccounts: [
          { id: 1, name: "الحساب الرئيسي", bank_name: "البنك الأهلي" },
          { id: 2, name: "حساب المساعدات", bank_name: "بنك المغرب" }
        ],
        beneficiaries: [
          { id: 1, first_name: "فاطمة", last_name: "أحمد محمد", type: "Widow" as const, full_name: "فاطمة أحمد محمد" },
          { id: 2, first_name: "خديجة", last_name: "علي حسن", type: "Widow" as const, full_name: "خديجة علي حسن" },
          { id: 3, first_name: "أحمد", last_name: "محمد علي", type: "Orphan" as const, full_name: "أحمد محمد علي" },
          { id: 4, first_name: "سارة", last_name: "علي حسن", type: "Orphan" as const, full_name: "سارة علي حسن" }
        ],
        fiscalYear: { id: 1, year: "2024", isActive: true }
      }
      
      console.log('Using fallback data due to API error')
      setSubBudgets(fallbackData.subBudgets)
      setExpenseCategories(fallbackData.expenseCategories)
      setPartners(fallbackData.partners)
      setBankAccounts(fallbackData.bankAccounts)
      setBeneficiaries([]) // Start with empty - user must search
      setActiveFiscalYear(fallbackData.fiscalYear)
      
      if (fallbackData.fiscalYear) {
        form.setValue("fiscal_year_id", fallbackData.fiscalYear.id)
      }
      
      toast({
        title: "تحذير",
        description: "تم تحميل بيانات تجريبية، تأكد من اتصال الخادم",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }
  
  // Search beneficiaries
  const searchBeneficiaries = async () => {
    if (!beneficiarySearchTerm.trim() && beneficiaryTypeFilter === 'all') {
      setBeneficiaries([])
      return
    }
    
    setBeneficiarySearchLoading(true)
    try {
      const params: any = {}
      if (beneficiarySearchTerm.trim()) {
        params.search = beneficiarySearchTerm.trim()
      }
      if (beneficiaryTypeFilter !== 'all') {
        params.type = beneficiaryTypeFilter
      }
      
      const response = await api.getBeneficiaries()
      
      // Filter results based on search criteria
      let filteredBeneficiaries = response.data || []
      
      if (beneficiarySearchTerm.trim()) {
        const searchLower = beneficiarySearchTerm.toLowerCase()
        filteredBeneficiaries = filteredBeneficiaries.filter((b: any) => 
          (b.full_name && b.full_name.toLowerCase().includes(searchLower)) ||
          (b.first_name && b.first_name.toLowerCase().includes(searchLower)) ||
          (b.last_name && b.last_name.toLowerCase().includes(searchLower))
        )
      }
      
      if (beneficiaryTypeFilter !== 'all') {
        filteredBeneficiaries = filteredBeneficiaries.filter((b: any) => b.type === beneficiaryTypeFilter)
      }
      
      setBeneficiaries(filteredBeneficiaries.slice(0, 50)) // Limit to 50 results
    } catch (error) {
      console.error('Error searching beneficiaries:', error)
      toast({
        title: "خطأ",
        description: "حدث خطأ في البحث عن المستفيدين",
        variant: "destructive"
      })
    } finally {
      setBeneficiarySearchLoading(false)
    }
  }
  
  // Search when filter changes
  useEffect(() => {
    if (beneficiaryTypeFilter !== 'all') {
      searchBeneficiaries()
    } else {
      // Clear beneficiaries when switching to 'all' to force user to search
      setBeneficiaries([])
    }
  }, [beneficiaryTypeFilter])
  
  

  // Helper functions for orphan data
  const calculateAge = (birthDate: string) => {
    const today = new Date()
    const birth = new Date(birthDate)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    return age
  }

  const findMotherName = (orphan: Beneficiary) => {
    if (orphan.type !== 'Orphan' || !orphan.orphan?.widow_id) return null
    
    const mother = widows.find(w => w.widow?.id === orphan.orphan?.widow_id)
    return mother?.widow?.full_name || mother?.full_name || 'غير محدد'
  }

  // Memoized set for tracking beneficiary selections
  const selectedBeneficiaryIds = useMemo(() => {
    return new Set(beneficiaryFields.map(field => field.beneficiary_id))
  }, [beneficiaryFields])

  // Filter categories based on selected sub-budget
  const filteredCategories = expenseCategories.filter(cat => 
    !subBudgetId || cat.sub_budget_id === subBudgetId
  )
  
  // Handle beneficiary selection
  const handleBeneficiarySelect = (beneficiaryId: number, checked: boolean) => {
    if (checked) {
      // Check if already selected
      if (selectedBeneficiaryIds.has(beneficiaryId)) return
      
      // Add to form with default amount
      addBeneficiary({
        beneficiary_id: beneficiaryId,
        amount: 0,
        notes: ""
      })
    } else {
      // Remove from form
      const index = beneficiaryFields.findIndex(field => field.beneficiary_id === beneficiaryId)
      if (index !== -1) {
        removeBeneficiary(index)
      }
    }
  }
  
  // Handle form submission
  const onSubmit = async (data: ExpenseFormData) => {
    setIsSubmitting(true)
    try {
      console.log('Submitting expense data:', data)
      
      // Prepare data for API
      const apiData = {
        ...data,
        fiscal_year_id: activeFiscalYear?.id || 1,
        sub_budget_id: Number(data.sub_budget_id),
        expense_category_id: Number(data.expense_category_id),
        partner_id: data.partner_id && data.partner_id > 0 ? Number(data.partner_id) : undefined,
        bank_account_id: data.bank_account_id && data.bank_account_id > 0 ? Number(data.bank_account_id) : undefined,
        expense_date: data.expense_date ? format(data.expense_date, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')
      }
      
      console.log('API data to be sent:', apiData)
      
      const response = await api.createExpense(apiData)
      
      console.log('Expense created successfully:', response)
      
      toast({
        title: "تم إنشاء المصروف بنجاح",
        description: "تم حفظ المصروف في قاعدة البيانات"
      })
      onOpenChange(false)
      onSuccess?.()
    } catch (error: any) {
      console.error('Error creating expense:', error)
      console.error('Error details:', error.errors)
      
      let errorMessage = "حدث خطأ أثناء حفظ المصروف"
      
      if (error.errors) {
        // Show specific validation errors
        const firstError = Object.values(error.errors)[0]
        if (Array.isArray(firstError) && firstError.length > 0) {
          errorMessage = firstError[0]
        }
      } else if (error.message) {
        errorMessage = error.message
      }
      
      toast({
        title: "خطأ في إنشاء المصروف",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            إنشاء مصروف جديد
          </DialogTitle>
        </DialogHeader>
        
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="mr-3">جاري التحميل...</span>
          </div>
        ) : (
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  البيانات الأساسية
                </TabsTrigger>
                <TabsTrigger value="payment" className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  طريقة الدفع
                </TabsTrigger>
                <TabsTrigger value="beneficiaries" className="flex items-center gap-2" disabled={unrelatedToBenef}>
                  <Users className="h-4 w-4" />
                  المستفيدون
                </TabsTrigger>
              </TabsList>
              
              {/* Basic Information Tab */}
              <TabsContent value="basic" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>معلومات المصروف</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Expense Date */}
                    <div className="space-y-2">
                      <Label>تاريخ المصروف *</Label>
                      <Controller
                        name="expense_date"
                        control={form.control}
                        render={({ field }) => (
                          <Input
                            type="date"
                            value={field.value ? format(field.value, 'yyyy-MM-dd') : ''}
                            onChange={(e) => {
                              const dateValue = e.target.value ? new Date(e.target.value) : undefined
                              field.onChange(dateValue)
                            }}
                            className="w-full"
                          />
                        )}
                      />
                      {form.formState.errors.expense_date && (
                        <p className="text-sm text-red-600">{form.formState.errors.expense_date.message}</p>
                      )}
                    </div>
                    
                    {/* Sub Budget */}
                    <div className="space-y-2">
                      <Label>الميزانية الفرعية *</Label>
                      <Select onValueChange={(value) => form.setValue("sub_budget_id", parseInt(value))}>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر الميزانية الفرعية" />
                        </SelectTrigger>
                        <SelectContent>
                          {subBudgets.map(budget => (
                            <SelectItem key={budget.id} value={budget.id.toString()}>
                              {budget.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {form.formState.errors.sub_budget_id && (
                        <p className="text-sm text-red-600">{form.formState.errors.sub_budget_id.message}</p>
                      )}
                    </div>
                    
                    {/* Expense Category */}
                    <div className="space-y-2">
                      <Label>فئة المصروف *</Label>
                      <Select onValueChange={(value) => form.setValue("expense_category_id", parseInt(value))}>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر فئة المصروف" />
                        </SelectTrigger>
                        <SelectContent>
                          {filteredCategories.map(category => (
                            <SelectItem key={category.id} value={category.id.toString()}>
                              {category.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {form.formState.errors.expense_category_id && (
                        <p className="text-sm text-red-600">{form.formState.errors.expense_category_id.message}</p>
                      )}
                    </div>
                    
                    {/* Partner */}
                    <div className="space-y-2">
                      <Label>الشريك</Label>
                      <Select onValueChange={(value) => form.setValue("partner_id", parseInt(value))}>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر الشريك (اختياري)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">بدون شريك</SelectItem>
                          {partners.map(partner => (
                            <SelectItem key={partner.id} value={partner.id.toString()}>
                              {partner.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Amount */}
                    <div className="space-y-2">
                      <Label>المبلغ الإجمالي (DH) *</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        {...form.register("amount", { valueAsNumber: true })}
                        onChange={(e) => {
                          form.setValue("amount", parseFloat(e.target.value) || 0)
                        }}
                      />
                      {form.formState.errors.amount && (
                        <p className="text-sm text-red-600">{form.formState.errors.amount.message}</p>
                      )}
                    </div>
                    
                    {/* Project (Disabled) */}
                    <div className="space-y-2">
                      <Label className="text-gray-400">المشروع الممول</Label>
                      <Select disabled>
                        <SelectTrigger className="bg-gray-50 text-gray-400 cursor-not-allowed">
                          <SelectValue placeholder="غير متاح حالياً" />
                        </SelectTrigger>
                      </Select>
                      <p className="text-sm text-gray-400">إدارة المشاريع غير متاحة حالياً</p>
                    </div>
                    
                    {/* Details */}
                    <div className="space-y-2 md:col-span-2">
                      <Label>تفاصيل المصروف</Label>
                      <Textarea
                        placeholder="أدخل تفاصيل المصروف..."
                        {...form.register("details")}
                      />
                    </div>
                    
                    {/* Unrelated to beneficiaries checkbox */}
                    <div className="md:col-span-2 flex items-center space-x-2 space-x-reverse">
                      <Checkbox
                        id="unrelated_to_benef"
                        checked={unrelatedToBenef}
                        onCheckedChange={(checked) => {
                          form.setValue("unrelated_to_benef", checked as boolean)
                          if (checked) {
                            setActiveTab("payment")
                          }
                        }}
                      />
                      <Label htmlFor="unrelated_to_benef" className="text-sm font-normal cursor-pointer">
                        هذا المصروف غير مرتبط بالمستفيدين (مصروف إداري)
                      </Label>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Payment Method Tab */}
              <TabsContent value="payment" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>طريقة الدفع</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Payment Method Selection */}
                    <div className="space-y-2">
                      <Label>طريقة الدفع *</Label>
                      <Select onValueChange={(value) => form.setValue("payment_method", value as any)}>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر طريقة الدفع" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Cash">نقدي</SelectItem>
                          <SelectItem value="Cheque">شيك</SelectItem>
                          <SelectItem value="BankWire">حوالة بنكية</SelectItem>
                        </SelectContent>
                      </Select>
                      {form.formState.errors.payment_method && (
                        <p className="text-sm text-red-600">{form.formState.errors.payment_method.message}</p>
                      )}
                    </div>
                    
                    {/* Bank Account (for Cheque and BankWire) */}
                    {(paymentMethod === "Cheque" || paymentMethod === "BankWire") && (
                      <div className="space-y-2">
                        <Label>الحساب البنكي *</Label>
                        <Select onValueChange={(value) => form.setValue("bank_account_id", parseInt(value))}>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر الحساب البنكي" />
                          </SelectTrigger>
                          <SelectContent>
                            {bankAccounts.map(account => (
                              <SelectItem key={account.id} value={account.id.toString()}>
                                {account.label || account.name} - {account.bank_name} (رصيد: {Number(account.balance).toLocaleString()} DH)
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {form.formState.errors.bank_account_id && (
                          <p className="text-sm text-red-600">{form.formState.errors.bank_account_id.message}</p>
                        )}
                      </div>
                    )}
                    
                    {/* Cheque Number (for Cheque) */}
                    {paymentMethod === "Cheque" && (
                      <div className="space-y-2">
                        <Label>رقم الشيك *</Label>
                        <Input
                          placeholder="أدخل رقم الشيك"
                          {...form.register("cheque_number")}
                        />
                        {form.formState.errors.cheque_number && (
                          <p className="text-sm text-red-600">{form.formState.errors.cheque_number.message}</p>
                        )}
                      </div>
                    )}
                    
                    {/* Receipt Number */}
                    <div className="space-y-2">
                      <Label>رقم الإيصال</Label>
                      <Input
                        placeholder="أدخل رقم الإيصال (اختياري)"
                        {...form.register("receipt_number")}
                      />
                    </div>
                    
                    {/* Remarks */}
                    <div className="space-y-2">
                      <Label>ملاحظات</Label>
                      <Textarea
                        placeholder="أدخل أي ملاحظات إضافية..."
                        {...form.register("remarks")}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Beneficiaries Tab */}
              <TabsContent value="beneficiaries" className="space-y-4">
                {!unrelatedToBenef && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        المستفيدون من المصروف
                        <Badge variant="outline">
                          {beneficiaryFields.length} محدد
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Search Section */}
                      <div className="space-y-3">
                        <div className="flex gap-2">
                          <div className="flex-1">
                            <Input
                              type="text"
                              placeholder="ابحث عن المستفيدين بالاسم..."
                              value={beneficiarySearchTerm}
                              onChange={(e) => setBeneficiarySearchTerm(e.target.value)}
                              onKeyPress={(e) => e.key === 'Enter' && searchBeneficiaries()}
                            />
                          </div>
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={searchBeneficiaries}
                            disabled={beneficiarySearchLoading}
                          >
                            {beneficiarySearchLoading ? "جاري البحث..." : "بحث"}
                          </Button>
                        </div>
                        
                        {/* Type Filter */}
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant={beneficiaryTypeFilter === 'all' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setBeneficiaryTypeFilter('all')}
                          >
                            الكل
                          </Button>
                          <Button
                            type="button"
                            variant={beneficiaryTypeFilter === 'Widow' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setBeneficiaryTypeFilter('Widow')}
                          >
                            الأرامل
                          </Button>
                          <Button
                            type="button"
                            variant={beneficiaryTypeFilter === 'Orphan' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setBeneficiaryTypeFilter('Orphan')}
                          >
                            الأيتام
                          </Button>
                        </div>
                      </div>

                      {/* Search Results */}
                      {beneficiaries.length === 0 && !beneficiarySearchLoading ? (
                        <div className="text-center py-8 text-gray-500">
                          <p>ابحث عن المستفيدين لإضافتهم</p>
                        </div>
                      ) : (
                        <div className="space-y-4 max-h-80 overflow-y-auto">
                          {beneficiaries.map(beneficiary => {
                            const isSelected = selectedBeneficiaryIds.has(beneficiary.id)
                            const isOrphan = beneficiary.type === 'Orphan'
                            const isWidow = beneficiary.type === 'Widow'
                            const motherName = isOrphan ? findMotherName(beneficiary) : null
                            const age = isOrphan && beneficiary.orphan?.birth_date ? calculateAge(beneficiary.orphan.birth_date) : null
                            const hasDisability = isWidow && beneficiary.widow?.disability_flag
                            const disabilityType = isWidow ? beneficiary.widow?.disability_type : null
                            
                            return (
                              <div
                                key={beneficiary.id}
                                className={cn(
                                  "relative p-4 rounded-xl border-2 transition-all duration-200 hover:shadow-md",
                                  isSelected 
                                    ? "border-blue-400 bg-gradient-to-l from-blue-50 to-blue-100 shadow-lg" 
                                    : "border-gray-200 hover:border-gray-300 bg-white"
                                )}
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex items-start justify-start">
                                    <Checkbox
                                      checked={isSelected}
                                      onCheckedChange={(checked) => handleBeneficiarySelect(beneficiary.id, checked as boolean)}
                                      className="mt-1 ml-4"
                                    />
                                  </div>
                                  
                                  <div className="flex-1 space-y-2 text-right">
                                    <div className="flex items-center justify-end space-x-2 space-x-reverse">
                                      <h4 className="font-semibold text-gray-900 text-lg">
                                        {beneficiary.full_name || `${beneficiary.first_name} ${beneficiary.last_name}`}
                                      </h4>
                                      <Badge variant={isWidow ? 'secondary' : 'outline'} className="text-xs">
                                        {isWidow ? 'أرملة' : 'يتيم'}
                                      </Badge>
                                      {age && (
                                        <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                                          {age} سنة
                                        </Badge>
                                      )}
                                    </div>
                                    
                                    {isOrphan && motherName && (
                                      <div className="flex items-center justify-end space-x-2 space-x-reverse text-sm text-gray-600">
                                        <span className="font-medium">{motherName}</span>
                                        <span className="text-gray-500">:الأم</span>
                                      </div>
                                    )}
                                    
                                    {isOrphan && beneficiary.orphan?.education_level?.name_ar && (
                                      <div className="flex items-center justify-end space-x-2 space-x-reverse text-sm text-gray-600">
                                        <span>{beneficiary.orphan.education_level.name_ar}</span>
                                        <span className="text-gray-500">:التعليم</span>
                                      </div>
                                    )}
                                    
                                    {isWidow && hasDisability && (
                                      <div className="flex items-center justify-end space-x-2 space-x-reverse text-sm">
                                        <Badge variant="destructive" className="text-xs">
                                          إعاقة
                                        </Badge>
                                        {disabilityType && (
                                          <span className="text-red-600 font-medium">{disabilityType}</span>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                  
                                  {isSelected && (
                                    <div className="flex items-center space-x-3 space-x-reverse bg-white rounded-lg p-3 shadow-sm border mr-4">
                                      <Label className="text-sm font-medium text-gray-700">:المبلغ</Label>
                                      <Input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        className="w-28 text-center font-semibold"
                                        placeholder="0.00"
                                        {...form.register(`beneficiaries.${beneficiaryFields.findIndex(f => f.beneficiary_id === beneficiary.id)}.amount`, { valueAsNumber: true })}
                                      />
                                      <span className="text-sm font-medium text-gray-600">DH</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}

                      {/* Selected Beneficiaries Summary */}
                      {beneficiaryFields.length > 0 && (
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200">
                          <div className="flex items-center space-x-2 space-x-reverse mb-4">
                            <Users className="h-5 w-5 text-blue-600" />
                            <h4 className="font-semibold text-blue-900">ملخص المستفيدين المحددين</h4>
                          </div>
                          <div className="grid grid-cols-3 gap-4 text-center">
                            <div className="bg-white p-3 rounded-lg border border-blue-100">
                              <p className="text-2xl font-bold text-blue-600">{beneficiaryFields.length}</p>
                              <p className="text-xs text-gray-600">مستفيد</p>
                            </div>
                            <div className="bg-white p-3 rounded-lg border border-green-100">
                              <p className="text-2xl font-bold text-green-600">
                                {beneficiaryFields.reduce((sum, field) => sum + (parseFloat(field.amount) || 0), 0).toFixed(0)}
                              </p>
                              <p className="text-xs text-gray-600">DH موزع</p>
                            </div>
                            <div className="bg-white p-3 rounded-lg border border-orange-100">
                              <p className="text-2xl font-bold text-orange-600">{(parseFloat(totalAmount) || 0).toFixed(0)}</p>
                              <p className="text-xs text-gray-600">DH إجمالي</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
            
            {/* Form Actions */}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                إلغاء
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    جاري الحفظ...
                  </>
                ) : (
                  "حفظ المصروف"
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

// Export the dialog for use in pages
export function NewExpenseForm(props: NewExpenseFormProps) {
  return <NewExpenseDialog {...props} />
}