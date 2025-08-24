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
import { cn } from "@/lib/utils"
import { AddDonorSheet } from "@/components/donors/add-donor-sheet"
import api from "@/lib/api"

const incomeSchema = z
  .object({
    date: z.date({ required_error: "التاريخ مطلوب" }),
    subBudget: z.string().min(1, "الميزانية الفرعية مطلوبة"),
    category: z.string().min(1, "الفئة مطلوبة"),
    donorType: z.enum(["donor", "kafil"], { required_error: "نوع المتبرع مطلوب" }),
    donorId: z.string().min(1, "المتبرع مطلوب"),
    amount: z.number().positive("المبلغ يجب أن يكون موجباً"),
    paymentMethod: z.enum(["cash", "cheque", "bank-wire"], { required_error: "طريقة الدفع مطلوبة" }),
    chequeNumber: z.string().optional(),
    receiptNumber: z.string().optional(),
    bankAccount: z.string().optional(),
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

  const form = useForm<IncomeFormData>({
    resolver: zodResolver(incomeSchema),
    defaultValues: {
      donorType: "donor",
      paymentMethod: "cash",
      ...initialData,
    },
  })

  // Reset form when initialData changes
  useEffect(() => {
    if (initialData && open) {
      form.reset({
        donorType: "donor",
        paymentMethod: "cash",
        ...initialData,
      })
    }
  }, [initialData, open, form])

  const paymentMethod = form.watch("paymentMethod")
  const donorType = form.watch("donorType")

  const handleDonorAdded = (newDonorId: string) => {
    // Auto-select the newly added donor
    form.setValue("donorId", newDonorId)
    setShowAddDonorSheet(false)
  }

  const onSubmit = async (data: IncomeFormData) => {
    setIsSubmitting(true)
    try {
      // Create income via API
      await api.createIncome({
        fiscal_year_id: 1, // Use the active fiscal year
        sub_budget_id: parseInt(data.subBudget),
        income_category_id: parseInt(data.category),
        donor_id: data.donorType === 'donor' ? parseInt(data.donorId) : undefined,
        kafil_id: data.donorType === 'kafil' ? parseInt(data.donorId) : undefined,
        entry_date: format(data.date, 'yyyy-MM-dd'),
        amount: data.amount,
        payment_method: data.paymentMethod === 'cash' ? 'Cash' : 
                       data.paymentMethod === 'cheque' ? 'Cheque' : 'BankWire',
        cheque_number: data.chequeNumber || undefined,
        receipt_number: data.receiptNumber || undefined,
        bank_account_id: data.bankAccount ? parseInt(data.bankAccount) : undefined,
        remarks: data.notes || undefined,
      })

      toast({
        title: "تم الحفظ بنجاح",
        description: initialData?.id ? "تم تحديث الإيراد بنجاح" : "تم إضافة الإيراد الجديد وهو في انتظار الموافقة",
      })

      form.reset()
      onOpenChange(false)
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HandCoins className="h-5 w-5" />
            {initialData?.id ? "تحرير الإيراد" : "إضافة إيراد جديد"}
          </DialogTitle>
          <DialogDescription>أدخل تفاصيل الإيراد أو التبرع الجديد</DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                    <SelectItem value="cash-donation">تبرع نقدي</SelectItem>
                    <SelectItem value="sponsorship">كفالة</SelectItem>
                    <SelectItem value="zakat">زكاة</SelectItem>
                    <SelectItem value="sadaqah">صدقة</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {form.formState.errors.category && (
              <p className="text-sm text-red-600">{form.formState.errors.category.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>نوع المتبرع *</Label>
              <Controller
                name="donorType"
                control={form.control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر النوع" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="donor">متبرع</SelectItem>
                      <SelectItem value="kafil">كفيل</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-2">
              <Label>{donorType === "donor" ? "المتبرع" : "الكفيل"} *</Label>
              <div className="flex gap-2">
                <Controller
                  name="donorId"
                  control={form.control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder={`اختر ${donorType === "donor" ? "المتبرع" : "الكفيل"}`} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="donor1">محمد أحمد السيد</SelectItem>
                        <SelectItem value="donor2">فاطمة علي حسن</SelectItem>
                        <SelectItem value="donor3">عبدالله محمود</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
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
              {form.formState.errors.donorId && (
                <p className="text-sm text-red-600">{form.formState.errors.donorId.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>المبلغ (₪) *</Label>
              <Input type="number" {...form.register("amount", { valueAsNumber: true })} placeholder="أدخل المبلغ" />
              {form.formState.errors.amount && (
                <p className="text-sm text-red-600">{form.formState.errors.amount.message}</p>
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

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              إلغاء
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "جاري الحفظ..." : initialData?.id ? "تحديث الإيراد" : "حفظ الإيراد"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
      <AddDonorSheet open={showAddDonorSheet} onOpenChange={setShowAddDonorSheet} />
    </Dialog>
  )
}
