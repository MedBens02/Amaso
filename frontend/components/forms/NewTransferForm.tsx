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

interface FiscalYear {
  id: number
  year: number
  status: string
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

interface NewTransferDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onTransferCreated?: () => void
}

export function NewTransferDialog({ open, onOpenChange, onTransferCreated }: NewTransferDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([])
  const [fiscalYears, setFiscalYears] = useState<FiscalYear[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const form = useForm<TransferFormData>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      transferDate: new Date(),
    },
  })

  const fromAccount = form.watch("fromAccount")
  const toAccount = form.watch("toAccount")

  // Fetch bank accounts and fiscal years
  useEffect(() => {
    if (open) {
      fetchInitialData()
    }
  }, [open])

  const fetchInitialData = async () => {
    setLoading(true)
    try {
      const [accountsResponse, fiscalYearsResponse] = await Promise.all([
        fetch('http://127.0.0.1:8000/api/v1/bank-accounts'),
        fetch('http://127.0.0.1:8000/api/v1/fiscal-years')
      ])

      const accountsData = await accountsResponse.json()
      const fiscalYearsData = await fiscalYearsResponse.json()

      if (accountsData.data) {
        setBankAccounts(accountsData.data)
      }

      if (fiscalYearsData.data) {
        setFiscalYears(fiscalYearsData.data)
      }
    } catch (error) {
      toast({
        title: "خطأ في تحميل البيانات",
        description: "فشل في تحميل بيانات الحسابات والسنوات المالية",
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

  const getAccountInfo = (accountId: string) => {
    return bankAccounts.find((acc) => acc.id.toString() === accountId)
  }



  const onSubmit = async (data: TransferFormData) => {
    setIsSubmitting(true)
    try {
      // Get the open fiscal year (handle both Arabic and English status)
      const openFiscalYear = fiscalYears.find(fy => fy.status === 'Open' || fy.status === 'مفتوح')
      if (!openFiscalYear) {
        throw new Error('لا توجد سنة مالية مفتوحة')
      }

      const transferData = {
        fiscal_year_id: openFiscalYear.id,
        transfer_date: format(data.transferDate, 'yyyy-MM-dd'),
        from_account_id: parseInt(data.fromAccount),
        to_account_id: parseInt(data.toAccount),
        amount: data.amount,
        remarks: data.remarks || ''
      }

      const response = await fetch('http://127.0.0.1:8000/api/v1/transfers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(transferData)
      })

      const result = await response.json()

      if (response.ok) {
        toast({
          title: "تم إنشاء التحويل بنجاح",
          description: result.message,
        })

        form.reset({
          transferDate: new Date(),
          fromAccount: '',
          toAccount: '',
          amount: undefined,
          remarks: ''
        })
        
        onTransferCreated?.()
        onOpenChange(false)
      } else {
        throw new Error(result.message || 'فشل في إنشاء التحويل')
      }
    } catch (error) {
      toast({
        title: "خطأ في إنشاء التحويل",
        description: error instanceof Error ? error.message : "حدث خطأ أثناء إنشاء التحويل",
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

        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">جاري تحميل البيانات...</p>
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
                            <span className="text-sm text-muted-foreground">DH {account.balance.toLocaleString()}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {fromAccount && (
                <div className="text-sm text-muted-foreground flex items-center gap-2">
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
                              <span className="text-sm text-muted-foreground">DH {account.balance.toLocaleString()}</span>
                            </div>
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {toAccount && (
                <div className="text-sm text-muted-foreground flex items-center gap-2">
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
                {isSubmitting ? "جاري إنشاء التحويل..." : "إنشاء التحويل"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}