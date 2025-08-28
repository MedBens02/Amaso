"use client"

import { useState } from "react"
import { useForm, Controller, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
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
import { CalendarIcon, Wallet, Trash2, Search, UserCheck } from "lucide-react"
import { format } from "date-fns"
import { ar } from "date-fns/locale"
import { cn } from "@/lib/utils"

// Mock data for beneficiaries
const widowsData = [
  { id: "w1", name: "فاطمة أحمد محمد", type: "widow", neighborhood: "حي الزهراء", hasChronicDisease: true },
  { id: "w2", name: "خديجة علي حسن", type: "widow", neighborhood: "حي النور", hasChronicDisease: false },
  { id: "w3", name: "مريم محمود عبدالله", type: "widow", neighborhood: "حي السلام", hasChronicDisease: true },
  { id: "w4", name: "عائشة يوسف إبراهيم", type: "widow", neighborhood: "حي الأمل", hasChronicDisease: false },
]

const orphansData = [
  { id: "o1", name: "أحمد محمد علي", type: "orphan", age: 12, motherName: "فاطمة أحمد محمد" },
  { id: "o2", name: "سارة علي حسن", type: "orphan", age: 9, motherName: "خديجة علي حسن" },
  { id: "o3", name: "محمد عبدالله يوسف", type: "orphan", age: 15, motherName: "مريم محمود عبدالله" },
  { id: "o4", name: "فاطمة يوسف إبراهيم", type: "orphan", age: 7, motherName: "عائشة يوسف إبراهيم" },
]

// Predefined groups
const beneficiaryGroups = [
  {
    id: "chronic-widows",
    name: "الأرامل ذوات الأمراض المزمنة",
    description: "جميع الأرامل اللواتي يعانين من أمراض مزمنة",
    count: 2,
    beneficiaries: widowsData.filter((w) => w.hasChronicDisease),
  },
  {
    id: "all-widows",
    name: "جميع الأرامل",
    description: "جميع الأرامل المسجلات في النظام",
    count: 4,
    beneficiaries: widowsData,
  },
  {
    id: "school-age-orphans",
    name: "الأيتام في سن المدرسة",
    description: "الأيتام من عمر 6-18 سنة",
    count: 4,
    beneficiaries: orphansData.filter((o) => o.age >= 6 && o.age <= 18),
  },
  {
    id: "zahra-neighborhood",
    name: "مستفيدو حي الزهراء",
    description: "جميع المستفيدين في حي الزهراء",
    count: 2,
    beneficiaries: [...widowsData, ...orphansData].filter(
      (b) =>
        b.neighborhood === "حي الزهراء" ||
        (b.type === "orphan" && widowsData.find((w) => w.name === b.motherName)?.neighborhood === "حي الزهراء"),
    ),
  },
]

const expenseSchema = z
  .object({
    date: z.date({ required_error: "التاريخ مطلوب" }),
    subBudget: z.string().min(1, "الميزانية الفرعية مطلوبة"),
    category: z.string().min(1, "الفئة مطلوبة"),
    partner: z.string().min(1, "الشريك مطلوب"),
    budgetedProject: z.string().optional(),
    totalAmount: z.number().positive("المبلغ الإجمالي يجب أن يكون موجباً"),
    paymentMethod: z.enum(["cash", "cheque", "bank-wire"], { required_error: "طريقة الدفع مطلوبة" }),
    chequeNumber: z.string().optional(),
    receiptNumber: z.string().optional(),
    bankAccount: z.string().optional(),
    beneficiaries: z
      .array(
        z.object({
          id: z.string(),
          name: z.string(),
          type: z.string(),
          amount: z.number().positive("المبلغ يجب أن يكون موجباً"),
        }),
      )
      .min(1, "يجب اختيار مستفيد واحد على الأقل"),
    remarks: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.paymentMethod === "cheque") {
        return data.chequeNumber && data.chequeNumber.length > 0
      }
      return true
    },
    {
      message: "رقم الشيك مطلوب",
      path: ["chequeNumber"],
    },
  )
  .refine(
    (data) => {
      if (data.paymentMethod === "cash") {
        return data.receiptNumber && data.receiptNumber.length > 0
      }
      return true
    },
    {
      message: "رقم الإيصال مطلوب",
      path: ["receiptNumber"],
    },
  )
  .refine(
    (data) => {
      if (data.paymentMethod === "bank-wire") {
        return data.bankAccount && data.bankAccount.length > 0
      }
      return true
    },
    {
      message: "الحساب البنكي مطلوب",
      path: ["bankAccount"],
    },
  )
  .refine(
    (data) => {
      const totalBeneficiaryAmount = data.beneficiaries.reduce((sum, b) => sum + b.amount, 0)
      return Math.abs(totalBeneficiaryAmount - data.totalAmount) < 0.01 // Allow for small rounding differences
    },
    {
      message: "مجموع مبالغ المستفيدين يجب أن يساوي المبلغ الإجمالي",
      path: ["beneficiaries"],
    },
  )

type ExpenseFormData = z.infer<typeof expenseSchema>

interface NewExpenseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function NewExpenseDialog({ open, onOpenChange }: NewExpenseDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState("basic")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedBeneficiaries, setSelectedBeneficiaries] = useState<Set<string>>(new Set())
  const { toast } = useToast()

  const form = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      paymentMethod: "cash",
      beneficiaries: [],
      budgetedProject: "",
    },
  })

  const {
    fields: beneficiaryFields,
    append: appendBeneficiary,
    remove: removeBeneficiary,
    update: updateBeneficiary,
  } = useFieldArray({
    control: form.control,
    name: "beneficiaries",
  })

  const paymentMethod = form.watch("paymentMethod")
  const totalAmount = form.watch("totalAmount") || 0

  // Filter beneficiaries based on search
  const allBeneficiaries = [...widowsData, ...orphansData]
  const filteredBeneficiaries = allBeneficiaries.filter((b) => b.name.toLowerCase().includes(searchTerm.toLowerCase()))

  const handleBeneficiaryToggle = (beneficiary: any) => {
    const newSelected = new Set(selectedBeneficiaries)
    if (newSelected.has(beneficiary.id)) {
      newSelected.delete(beneficiary.id)
      // Remove from form
      const index = beneficiaryFields.findIndex((f) => f.id === beneficiary.id)
      if (index !== -1) {
        removeBeneficiary(index)
      }
    } else {
      newSelected.add(beneficiary.id)
      // Add to form with equal distribution
      const currentBeneficiaryCount = beneficiaryFields.length + 1
      const amountPerBeneficiary = totalAmount / currentBeneficiaryCount

      // Update existing beneficiaries with new amount
      beneficiaryFields.forEach((field, index) => {
        updateBeneficiary(index, { ...field, amount: amountPerBeneficiary })
      })

      // Add new beneficiary
      appendBeneficiary({
        id: beneficiary.id,
        name: beneficiary.name,
        type: beneficiary.type,
        amount: amountPerBeneficiary,
      })
    }
    setSelectedBeneficiaries(newSelected)
  }

  const handleGroupSelect = (group: any) => {
    const newSelected = new Set<string>()

    // Clear existing beneficiaries
    while (beneficiaryFields.length > 0) {
      removeBeneficiary(0)
    }

    // Add group beneficiaries
    const amountPerBeneficiary = totalAmount / group.beneficiaries.length
    group.beneficiaries.forEach((beneficiary: any) => {
      newSelected.add(beneficiary.id)
      appendBeneficiary({
        id: beneficiary.id,
        name: beneficiary.name,
        type: beneficiary.type,
        amount: amountPerBeneficiary,
      })
    })

    setSelectedBeneficiaries(newSelected)
    toast({
      title: "تم اختيار المجموعة",
      description: `تم اختيار ${group.beneficiaries.length} مستفيد من مجموعة "${group.name}"`,
    })
  }

  const redistributeAmounts = () => {
    if (beneficiaryFields.length === 0) return

    const amountPerBeneficiary = totalAmount / beneficiaryFields.length
    beneficiaryFields.forEach((field, index) => {
      updateBeneficiary(index, { ...field, amount: amountPerBeneficiary })
    })
  }

  const onSubmit = async (data: ExpenseFormData) => {
    setIsSubmitting(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))

      console.log("Submitting expense data:", data)

      toast({
        title: "تم الحفظ بنجاح",
        description: `تم إضافة المصروف بقيمة DH ${data.totalAmount.toLocaleString()} لـ ${data.beneficiaries.length} مستفيد`,
      })

      form.reset()
      setSelectedBeneficiaries(new Set())
      onOpenChange(false)
    } catch (error) {
      toast({
        title: "خطأ في الحفظ",
        description: "حدث خطأ أثناء حفظ البيانات",
        variant: "destructive",
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
            <Wallet className="h-5 w-5" />
            إضافة مصروف جديد
          </DialogTitle>
          <DialogDescription>أدخل تفاصيل المصروف واختر المستفيدين</DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">المعلومات الأساسية</TabsTrigger>
              <TabsTrigger value="beneficiaries">اختيار المستفيدين</TabsTrigger>
              <TabsTrigger value="amounts">توزيع المبالغ</TabsTrigger>
            </TabsList>

            {/* Basic Information Tab */}
            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>التاريخ *</Label>
                  <Controller
                    name="date"
                    control={form.control}
                    render={({ field }) => (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !field.value && "text-muted-foreground",
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value ? format(field.value, "PPP", { locale: ar }) : "اختر التاريخ"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                        </PopoverContent>
                      </Popover>
                    )}
                  />
                  {form.formState.errors.date && (
                    <p className="text-sm text-red-600">{form.formState.errors.date.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>الميزانية الفرعية *</Label>
                  <Controller
                    name="subBudget"
                    control={form.control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر الميزانية" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="monthly-aid">المساعدات الشهرية</SelectItem>
                          <SelectItem value="education">التعليم</SelectItem>
                          <SelectItem value="emergency">الطوارئ</SelectItem>
                          <SelectItem value="medical">الطبية</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {form.formState.errors.subBudget && (
                    <p className="text-sm text-red-600">{form.formState.errors.subBudget.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>الفئة *</Label>
                <Controller
                  name="category"
                  control={form.control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر الفئة" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash-aid">مساعدات نقدية</SelectItem>
                        <SelectItem value="medical-aid">مساعدات طبية</SelectItem>
                        <SelectItem value="educational-fees">رسوم دراسية</SelectItem>
                        <SelectItem value="emergency-aid">مساعدات طارئة</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {form.formState.errors.category && (
                  <p className="text-sm text-red-600">{form.formState.errors.category.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>الشريك *</Label>
                <Controller
                  name="partner"
                  control={form.control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر الشريك" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="partner1">شريك المعونة الأول</SelectItem>
                        <SelectItem value="ministry">وزارة التعليم</SelectItem>
                        <SelectItem value="hospital">مستشفى الأمل</SelectItem>
                        <SelectItem value="direct">مباشر للمستفيدين</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {form.formState.errors.partner && (
                  <p className="text-sm text-red-600">{form.formState.errors.partner.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>المشروع الممول</Label>
                <Controller
                  name="budgetedProject"
                  control={form.control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر المشروع (اختياري)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">بدون مشروع</SelectItem>
                        <SelectItem value="project1">مشروع كفالة الأيتام 2024</SelectItem>
                        <SelectItem value="project2">مشروع التعليم المتميز</SelectItem>
                        <SelectItem value="project3">مشروع الرعاية الصحية</SelectItem>
                        <SelectItem value="project4">مشروع الإغاثة الطارئة</SelectItem>
                        <SelectItem value="project5">مشروع بناء المدرسة</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {form.formState.errors.budgetedProject && (
                  <p className="text-sm text-red-600">{form.formState.errors.budgetedProject.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>المبلغ الإجمالي (DH) *</Label>
                <Input
                  type="number"
                  {...form.register("totalAmount", { valueAsNumber: true })}
                  placeholder="أدخل المبلغ الإجمالي"
                  onChange={(e) => {
                    form.setValue("totalAmount", Number.parseFloat(e.target.value) || 0)
                    // Auto-redistribute amounts when total changes
                    setTimeout(redistributeAmounts, 100)
                  }}
                />
                {form.formState.errors.totalAmount && (
                  <p className="text-sm text-red-600">{form.formState.errors.totalAmount.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>طريقة الدفع *</Label>
                <Controller
                  name="paymentMethod"
                  control={form.control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر الطريقة" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">نقدي</SelectItem>
                        <SelectItem value="cheque">شيك</SelectItem>
                        <SelectItem value="bank-wire">حوالة بنكية</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              {/* Payment Method Specific Fields */}
              {paymentMethod === "cheque" && (
                <div className="space-y-2">
                  <Label>رقم الشيك *</Label>
                  <Input {...form.register("chequeNumber")} placeholder="أدخل رقم الشيك" />
                  {form.formState.errors.chequeNumber && (
                    <p className="text-sm text-red-600">{form.formState.errors.chequeNumber.message}</p>
                  )}
                </div>
              )}

              {paymentMethod === "cash" && (
                <div className="space-y-2">
                  <Label>رقم الإيصال *</Label>
                  <Input {...form.register("receiptNumber")} placeholder="أدخل رقم الإيصال" />
                  {form.formState.errors.receiptNumber && (
                    <p className="text-sm text-red-600">{form.formState.errors.receiptNumber.message}</p>
                  )}
                </div>
              )}

              {paymentMethod === "bank-wire" && (
                <div className="space-y-2">
                  <Label>الحساب البنكي *</Label>
                  <Input {...form.register("bankAccount")} placeholder="أدخل رقم الحساب البنكي" />
                  {form.formState.errors.bankAccount && (
                    <p className="text-sm text-red-600">{form.formState.errors.bankAccount.message}</p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label>ملاحظات</Label>
                <Textarea {...form.register("remarks")} placeholder="أي ملاحظات إضافية" rows={3} />
              </div>
            </TabsContent>

            {/* Beneficiaries Selection Tab */}
            <TabsContent value="beneficiaries" className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">اختيار المستفيدين</h3>
                  <Badge variant="secondary">{selectedBeneficiaries.size} مستفيد محدد</Badge>
                </div>

                {/* Predefined Groups */}
                <div className="space-y-3">
                  <h4 className="font-medium">المجموعات المحددة مسبقاً</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {beneficiaryGroups.map((group) => (
                      <div key={group.id} className="border rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-medium">{group.name}</h5>
                          <Badge variant="outline">{group.count} مستفيد</Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{group.description}</p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleGroupSelect(group)}
                          className="w-full"
                        >
                          <UserCheck className="h-4 w-4 ml-1" />
                          اختيار المجموعة
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Individual Selection */}
                <div className="space-y-3">
                  <h4 className="font-medium">اختيار فردي</h4>

                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="البحث في المستفيدين..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pr-10"
                    />
                  </div>

                  {/* Beneficiaries List */}
                  <div className="max-h-60 overflow-y-auto border rounded-lg">
                    {filteredBeneficiaries.map((beneficiary) => (
                      <div
                        key={beneficiary.id}
                        className="flex items-center space-x-3 space-x-reverse p-3 border-b last:border-b-0"
                      >
                        <Checkbox
                          checked={selectedBeneficiaries.has(beneficiary.id)}
                          onCheckedChange={() => handleBeneficiaryToggle(beneficiary)}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{beneficiary.name}</span>
                            <Badge variant={beneficiary.type === "widow" ? "default" : "secondary"}>
                              {beneficiary.type === "widow" ? "أرملة" : "يتيم"}
                            </Badge>
                            {beneficiary.type === "widow" && beneficiary.hasChronicDisease && (
                              <Badge variant="destructive" className="text-xs">
                                مرض مزمن
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">
                            {beneficiary.type === "widow"
                              ? beneficiary.neighborhood
                              : `العمر: ${beneficiary.age} - الأم: ${beneficiary.motherName}`}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Amount Distribution Tab */}
            <TabsContent value="amounts" className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">توزيع المبالغ</h3>
                  <div className="flex items-center gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={redistributeAmounts}>
                      توزيع متساوي
                    </Button>
                    <Badge variant="secondary">
                      المجموع: DH{" "}
                      {beneficiaryFields.reduce((sum, field) => sum + (field.amount || 0), 0).toLocaleString()}
                    </Badge>
                  </div>
                </div>

                {beneficiaryFields.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    لم يتم اختيار أي مستفيدين بعد. انتقل إلى تبويب "اختيار المستفيدين" لإضافة مستفيدين.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {beneficiaryFields.map((field, index) => (
                      <div key={field.id} className="flex items-center gap-4 p-3 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{field.name}</span>
                            <Badge variant={field.type === "widow" ? "default" : "secondary"}>
                              {field.type === "widow" ? "أرملة" : "يتيم"}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Label className="text-sm">المبلغ (DH):</Label>
                          <Input
                            type="number"
                            value={field.amount}
                            onChange={(e) => {
                              const newAmount = Number.parseFloat(e.target.value) || 0
                              updateBeneficiary(index, { ...field, amount: newAmount })
                            }}
                            className="w-24"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            removeBeneficiary(index)
                            const newSelected = new Set(selectedBeneficiaries)
                            newSelected.delete(field.id)
                            setSelectedBeneficiaries(newSelected)
                          }}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {form.formState.errors.beneficiaries && (
                  <p className="text-sm text-red-600">{form.formState.errors.beneficiaries.message}</p>
                )}
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              إلغاء
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "جاري الحفظ..." : "حفظ المصروف"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
