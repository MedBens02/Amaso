"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Banknote } from "lucide-react"
import { format } from "date-fns"
import { ar } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { formatDateArabic } from "@/lib/date-utils"
import { useToast } from "@/hooks/use-toast"
import api from "@/lib/api"

interface TransferIncomeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  items: any[]
  onSuccess: () => void
}

export function TransferIncomeDialog({ open, onOpenChange, items, onSuccess }: TransferIncomeDialogProps) {
  const [selectedAccount, setSelectedAccount] = useState<string>("")
  const [transferDate, setTransferDate] = useState<Date>(new Date())
  const [remarks, setRemarks] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [bankAccounts, setBankAccounts] = useState<any[]>([])
  const { toast } = useToast()

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

  const totalAmount = items.reduce((sum, item) => sum + parseFloat(item.amount), 0)

  // Load bank accounts
  useEffect(() => {
    if (open) {
      loadBankAccounts()
    }
  }, [open])

  const loadBankAccounts = async () => {
    try {
      const response = await api.getBankAccounts()
      setBankAccounts(response.data || [])
    } catch (error) {
      console.error('Error loading bank accounts:', error)
      toast({
        title: "خطأ في تحميل البيانات",
        description: "حدث خطأ أثناء تحميل الحسابات البنكية",
        variant: "destructive",
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedAccount) return

    setIsSubmitting(true)

    try {
      // Update each income item to mark it as transferred
      const transferResults = []
      const transferDateStr = format(transferDate, 'yyyy-MM-dd') // Use selected transfer date
      
      for (const item of items) {
        try {
          // Use the new transfer-specific API method
          const response = await api.transferIncomeToBank(item.id, {
            bank_account_id: parseInt(selectedAccount),
            transferred_at: transferDateStr, // Set to current timestamp
            remarks: remarks ? `تحويل بنكي: ${remarks}` : undefined,
          })
          transferResults.push({ success: true, id: item.id })
        } catch (error) {
          console.error(`Error transferring income ${item.id}:`, error)
          transferResults.push({ success: false, id: item.id, error })
        }
      }

      const successCount = transferResults.filter(r => r.success).length
      const failCount = transferResults.filter(r => !r.success).length

      if (successCount > 0) {
        toast({
          title: "تم التحويل بنجاح",
          description: `تم تحويل ${successCount} إيراد إلى البنك بنجاح${failCount > 0 ? ` (فشل ${failCount})` : ''}`,
        })
      }

      if (failCount > 0) {
        toast({
          title: "خطأ جزئي في التحويل",
          description: `فشل في تحويل ${failCount} إيراد`,
          variant: "destructive",
        })
      }

      onSuccess()
      handleClose()

      // Reset form
      setSelectedAccount("")
      setTransferDate(new Date())
      setRemarks("")
    } catch (error) {
      console.error('Error in bulk transfer:', error)
      toast({
        title: "خطأ في التحويل",
        description: "حدث خطأ أثناء تحويل الإيرادات",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getPaymentMethodBadge = (method: string) => {
    const methodMap = {
      "Cash": "نقدي",
      "Cheque": "شيك", 
      "BankWire": "حوالة بنكية",
    } as const

    const arabicMethod = methodMap[method as keyof typeof methodMap] || method

    const variants = {
      "نقدي": "default",
      "شيك": "secondary",
      "حوالة بنكية": "outline",
    } as const

    return <Badge variant={variants[arabicMethod as keyof typeof variants] || "outline"}>{arabicMethod}</Badge>
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
            {value ? format(value, "PPP", { locale: ar }) : placeholder}
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
            month={currentMonth}
            onMonthChange={handleMonthChange}
            locale={ar}
            className="rounded-md"
          />
        </PopoverContent>
      </Popover>
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Banknote className="h-5 w-5" />
            تحويل الإيرادات إلى البنك
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Items Summary */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">الإيرادات المراد تحويلها</h3>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">التاريخ</TableHead>
                    <TableHead className="text-right">المتبرع/الكفيل</TableHead>
                    <TableHead className="text-right">المبلغ</TableHead>
                    <TableHead className="text-right">طريقة الدفع</TableHead>
                    <TableHead className="text-right">الملاحظات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="text-right">
                        {formatDateArabic(new Date(item.income_date), "dd/MM/yyyy")}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.donor && (
                          <div className="flex items-center gap-1 justify-end">
                            <span>{`${item.donor.first_name} ${item.donor.last_name}`}</span>
                            <span className="text-xs text-blue-600">متبرع:</span>
                          </div>
                        )}
                        {item.kafil && (
                          <div className="flex items-center gap-1 justify-end">
                            <span>{`${item.kafil.first_name} ${item.kafil.last_name}`}</span>
                            <span className="text-xs text-green-600">كفيل:</span>
                          </div>
                        )}
                        {!item.donor && !item.kafil && (
                          <span className="text-gray-500">غير محدد</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-bold text-green-600">
                        {parseFloat(item.amount).toLocaleString()} د.م
                      </TableCell>
                      <TableCell className="text-right">{getPaymentMethodBadge(item.payment_method)}</TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">{item.remarks || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Total Amount */}
            <div className="flex justify-end">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="text-sm text-blue-600">إجمالي المبلغ المراد تحويله</div>
                <div className="text-2xl font-bold text-blue-800">{totalAmount.toLocaleString()} د.م</div>
              </div>
            </div>
          </div>

          {/* Transfer Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="transferDate">تاريخ التحويل *</Label>
              <CustomDatePicker
                value={transferDate}
                onChange={(date) => date && setTransferDate(date)}
                placeholder="اختر تاريخ التحويل"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="account">الحساب البنكي *</Label>
              <Select value={selectedAccount} onValueChange={setSelectedAccount} required>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الحساب البنكي" />
                </SelectTrigger>
                <SelectContent>
                  {bankAccounts.map((account) => (
                    <SelectItem key={account.id} value={account.id.toString()}>
                      <div className="text-right">
                        <div className="font-medium">{account.label}</div>
                        <div className="text-sm text-muted-foreground">
                          {account.bank_name} - {account.account_number || account.id}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-800">
              <strong>ملاحظة:</strong> تاريخ الإيراد الأصلي سيبقى كما هو، وسيتم تسجيل تاريخ التحويل المحدد أعلاه
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="remarks">ملاحظات التحويل</Label>
            <Textarea
              id="remarks"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="أدخل أي ملاحظات إضافية حول التحويل..."
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
              إلغاء
            </Button>
            <Button type="submit" disabled={!selectedAccount || isSubmitting}>
              {isSubmitting ? "جاري التحويل..." : `تحويل ${items.length} إيراد`}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
