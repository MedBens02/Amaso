"use client"

import { useState } from "react"
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
import { CalendarIcon, ArrowLeftRight, Banknote } from "lucide-react"
import { format } from "date-fns"
import { ar } from "date-fns/locale"
import { cn } from "@/lib/utils"

const transferSchema = z
  .object({
    transferDate: z.date({ required_error: "تاريخ التحويل مطلوب" }),
    fromAccount: z.string().min(1, "الحساب المرسل مطلوب"),
    toAccount: z.string().min(1, "الحساب المستقبل مطلوب"),
    amount: z.number().positive("المبلغ يجب أن يكون موجباً"),
    remarks: z.string().optional(),
  })
  .refine(
    (data) => {
      return data.fromAccount !== data.toAccount
    },
    {
      message: "لا يمكن التحويل إلى نفس الحساب",
      path: ["toAccount"],
    },
  )

type TransferFormData = z.infer<typeof transferSchema>

interface NewTransferDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const accounts = [
  { id: "current", name: "الحساب الجاري", balance: 125680, bank: "البنك الأهلي" },
  { id: "emergency", name: "حساب الطوارئ", balance: 45230, bank: "بنك فلسطين" },
  { id: "savings", name: "حساب التوفير", balance: 89450, bank: "البنك الإسلامي" },
]

export function NewTransferDialog({ open, onOpenChange }: NewTransferDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const form = useForm<TransferFormData>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      transferDate: new Date(),
    },
  })

  const fromAccount = form.watch("fromAccount")
  const toAccount = form.watch("toAccount")

  const getAccountBalance = (accountId: string) => {
    const account = accounts.find((acc) => acc.id === accountId)
    return account ? account.balance : 0
  }

  const getAccountInfo = (accountId: string) => {
    return accounts.find((acc) => acc.id === accountId)
  }

  const onSubmit = async (data: TransferFormData) => {
    setIsSubmitting(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      console.log("Submitting transfer data:", data)

      toast({
        title: "تم الحفظ بنجاح",
        description: "تم إنشاء التحويل بنجاح",
      })

      form.reset()
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
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowLeftRight className="h-5 w-5" />
            تحويل جديد
          </DialogTitle>
          <DialogDescription>إنشاء تحويل جديد بين الحسابات المصرفية</DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label>تاريخ التحويل *</Label>
            <Controller
              name="transferDate"
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
            {form.formState.errors.transferDate && (
              <p className="text-sm text-red-600">{form.formState.errors.transferDate.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>من حساب *</Label>
            <Controller
              name="fromAccount"
              control={form.control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الحساب المرسل" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        <div className="flex items-center justify-between w-full">
                          <span>{account.name}</span>
                          <span className="text-sm text-gray-500">DH {account.balance.toLocaleString()}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {fromAccount && (
              <div className="text-sm text-gray-600 flex items-center gap-2">
                <Banknote className="h-4 w-4" />
                الرصيد الحالي: DH {getAccountBalance(fromAccount).toLocaleString()}
              </div>
            )}
            {form.formState.errors.fromAccount && (
              <p className="text-sm text-red-600">{form.formState.errors.fromAccount.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>إلى حساب *</Label>
            <Controller
              name="toAccount"
              control={form.control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الحساب المستقبل" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts
                      .filter((account) => account.id !== fromAccount)
                      .map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          <div className="flex items-center justify-between w-full">
                            <span>{account.name}</span>
                            <span className="text-sm text-gray-500">DH {account.balance.toLocaleString()}</span>
                          </div>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              )}
            />
            {toAccount && (
              <div className="text-sm text-gray-600 flex items-center gap-2">
                <Banknote className="h-4 w-4" />
                الرصيد الحالي: DH {getAccountBalance(toAccount).toLocaleString()}
              </div>
            )}
            {form.formState.errors.toAccount && (
              <p className="text-sm text-red-600">{form.formState.errors.toAccount.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>المبلغ (DH) *</Label>
            <Input type="number" {...form.register("amount", { valueAsNumber: true })} placeholder="أدخل المبلغ" />
            {form.formState.errors.amount && (
              <p className="text-sm text-red-600">{form.formState.errors.amount.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>ملاحظات</Label>
            <Textarea {...form.register("remarks")} placeholder="سبب التحويل أو ملاحظات إضافية" rows={3} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              إلغاء
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "جاري التحويل..." : "تنفيذ التحويل"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
