"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Banknote } from "lucide-react"
import { format } from "date-fns"
import { ar } from "date-fns/locale"
import { cn } from "@/lib/utils"

// Sample bank accounts
const bankAccounts = [
  {
    id: "acc1",
    name: "الحساب الجاري",
    bank: "البنك الأهلي",
    accountNumber: "123456789",
  },
  {
    id: "acc2",
    name: "حساب التوفير",
    bank: "بنك فلسطين",
    accountNumber: "987654321",
  },
  {
    id: "acc3",
    name: "حساب الطوارئ",
    bank: "البنك الإسلامي",
    accountNumber: "456789123",
  },
]

interface TransferIncomeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  items: any[]
  onSuccess: () => void
}

export function TransferIncomeDialog({ open, onOpenChange, items, onSuccess }: TransferIncomeDialogProps) {
  const [transferDate, setTransferDate] = useState<Date>(new Date())
  const [selectedAccount, setSelectedAccount] = useState<string>("")
  const [remarks, setRemarks] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const totalAmount = items.reduce((sum, item) => sum + item.amount, 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedAccount) return

    setIsSubmitting(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Here you would typically make an API call to transfer the incomes
    console.log("Transferring items:", {
      items: items.map((item) => item.id),
      transferDate,
      accountId: selectedAccount,
      remarks,
      totalAmount,
    })

    setIsSubmitting(false)
    onSuccess()

    // Reset form
    setTransferDate(new Date())
    setSelectedAccount("")
    setRemarks("")
  }

  const getPaymentMethodBadge = (method: string) => {
    const variants = {
      نقدي: "default",
      شيك: "secondary",
      "حوالة بنكية": "outline",
    } as const

    return <Badge variant={variants[method as keyof typeof variants] || "outline"}>{method}</Badge>
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
                      <TableCell className="text-right">{format(item.date, "dd/MM/yyyy", { locale: ar })}</TableCell>
                      <TableCell className="text-right">
                        {item.donor && (
                          <div className="flex items-center gap-1 justify-end">
                            <span>{item.donor}</span>
                            <span className="text-xs text-blue-600">:متبرع</span>
                          </div>
                        )}
                        {item.kafil && (
                          <div className="flex items-center gap-1 justify-end">
                            <span>{item.kafil}</span>
                            <span className="text-xs text-green-600">:كفيل</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-bold text-green-600">
                        DH {item.amount.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">{getPaymentMethodBadge(item.paymentMethod)}</TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">{item.remarks}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Total Amount */}
            <div className="flex justify-end">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="text-sm text-blue-600">إجمالي المبلغ المراد تحويله</div>
                <div className="text-2xl font-bold text-blue-800">DH {totalAmount.toLocaleString()}</div>
              </div>
            </div>
          </div>

          {/* Transfer Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="transferDate">تاريخ التحويل</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-right font-normal",
                      !transferDate && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {transferDate ? format(transferDate, "dd/MM/yyyy", { locale: ar }) : "اختر التاريخ"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={transferDate}
                    onSelect={(date) => date && setTransferDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="account">الحساب البنكي</Label>
              <Select value={selectedAccount} onValueChange={setSelectedAccount} required>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الحساب البنكي" />
                </SelectTrigger>
                <SelectContent>
                  {bankAccounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      <div className="text-right">
                        <div className="font-medium">{account.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {account.bank} - {account.accountNumber}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
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
