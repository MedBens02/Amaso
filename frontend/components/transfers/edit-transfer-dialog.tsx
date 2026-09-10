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
import { useToast } from "@/hooks/use-toast"
import { ArrowLeftRight, Banknote, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { toDateInputValue, fromDateInputValue } from "@/lib/date-utils"

interface BankAccount {
  id: number
  label: string
  bank_name: string
  account_number: string
  balance: number
  notes?: string
}

interface Transfer {
  id: number
  fiscal_year_id: number
  transfer_date: string
  from_account_id: number
  to_account_id: number
  amount: string
  remarks?: string
  status: 'Draft' | 'Approved'
  from_account: {
    id: number
    label: string
    bank_name: string
    account_number: string
    balance: string
  }
  to_account: {
    id: number
    label: string
    bank_name: string
    account_number: string
    balance: string
  }
}

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

interface EditTransferDialogProps {
  transfer: Transfer | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onTransferUpdated?: () => void
}

export function EditTransferDialog({ transfer, open, onOpenChange, onTransferUpdated }: EditTransferDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const form = useForm<TransferFormData>({
    resolver: zodResolver(transferSchema),
  })

  const fromAccount = form.watch("fromAccount")
  const toAccount = form.watch("toAccount")

  // Fetch bank accounts when dialog opens
  useEffect(() => {
    if (open) {
      fetchBankAccounts()
    }
  }, [open])

  // Set form values when transfer changes
  useEffect(() => {
    if (transfer && bankAccounts.length > 0) {
      form.reset({
        transferDate: new Date(transfer.transfer_date),
        fromAccount: transfer.from_account_id.toString(),
        toAccount: transfer.to_account_id.toString(),
        amount: parseFloat(transfer.amount),
        remarks: transfer.remarks || ''
      })
    }
  }, [transfer, bankAccounts, form])

  const fetchBankAccounts = async () => {
    setLoading(true)
    try {
      const response = await fetch('http://127.0.0.1:8000/api/v1/bank-accounts')
      const data = await response.json()

      if (data.data) {
        setBankAccounts(data.data)
      }
    } catch (error) {
      toast({
        title: "خطأ في تحميل البيانات",
        description: "فشل في تحميل بيانات الحسابات المصرفية",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const getAccountBalance = (accountId: string) => {
    const account = bankAccounts.find((acc) => acc.id.toString() === accountId)
    return account ? account.balance : 0
  }



  const onSubmit = async (data: TransferFormData) => {
    if (!transfer) return

    setIsSubmitting(true)
    try {
      const transferData = {
        fiscal_year_id: transfer.fiscal_year_id,
        transfer_date: format(data.transferDate, 'yyyy-MM-dd'),
        from_account_id: parseInt(data.fromAccount),
        to_account_id: parseInt(data.toAccount),
        amount: data.amount,
        remarks: data.remarks || ''
      }

      const response = await fetch(`http://127.0.0.1:8000/api/v1/transfers/${transfer.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(transferData)
      })

      const result = await response.json()

      if (response.ok) {
        toast({
          title: "تم تحديث التحويل بنجاح",
          description: result.message,
        })

        onTransferUpdated?.()
        onOpenChange(false)
      } else {
        throw new Error(result.message || 'فشل في تحديث التحويل')
      }
    } catch (error) {
      toast({
        title: "خطأ في تحديث التحويل",
        description: error instanceof Error ? error.message : "حدث خطأ أثناء تحديث التحويل",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!transfer) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowLeftRight className="h-5 w-5" />
            تعديل التحويل
          </DialogTitle>
          <DialogDescription>تعديل بيانات التحويل</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">جاري تحميل البيانات...</p>
            </div>
          </div>
        ) : (
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label>تاريخ التحويل *</Label>
              <Controller
                name="transferDate"
                control={form.control}
                render={({ field }) => (
                  <div onClick={(e) => e.stopPropagation()}>
                    <Input
                      type="date"
                      value={toDateInputValue(field.value)}
                      onChange={(e) => field.onChange(fromDateInputValue(e.target.value))}
                    />
                  </div>
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
                      {bankAccounts.map((account) => (
                        <SelectItem key={account.id} value={account.id.toString()}>
                          <div className="flex items-center justify-between w-full">
                            <span>{account.label}</span>
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
                      {bankAccounts
                        .filter((account) => account.id.toString() !== fromAccount)
                        .map((account) => (
                          <SelectItem key={account.id} value={account.id.toString()}>
                            <div className="flex items-center justify-between w-full">
                              <span>{account.label}</span>
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
              <Button 
                type="submit" 
                disabled={isSubmitting}
              >
                {isSubmitting ? "جاري التحديث..." : "تحديث التحويل"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}