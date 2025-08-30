"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Eye, Calendar, DollarSign, CreditCard, User, Building, FileText, CheckCircle } from "lucide-react"
import { formatDateArabic } from "@/lib/date-utils"

interface IncomeData {
  id: number
  fiscal_year_id: number
  sub_budget_id: number
  income_category_id: number
  donor_id?: number
  kafil_id?: number
  income_date: string
  amount: string
  payment_method: "Cash" | "Cheque" | "BankWire"
  cheque_number?: string
  receipt_number?: string
  bank_account_id?: number
  remarks?: string
  status: "Draft" | "Approved" | "Rejected"
  created_by?: number
  approved_by?: number
  approved_at?: string
  transferred_at?: string
  created_at: string
  updated_at: string
  fiscal_year: {
    id: number
    year: string
    is_active: boolean
  }
  sub_budget: {
    id: number
    label: string
  }
  income_category: {
    id: number
    label: string
  }
  donor?: {
    id: number
    first_name: string
    last_name: string
    phone?: string
    email?: string
  }
  kafil?: {
    id: number
    first_name: string
    last_name: string
    phone?: string
    email?: string
  }
  bank_account?: {
    id: number
    label: string
    bank_name: string
  }
}

interface ViewIncomeDialogProps {
  income: IncomeData | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ViewIncomeDialog({ income, open, onOpenChange }: ViewIncomeDialogProps) {
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

  // Don't render anything if income is null
  if (!income) {
    return null
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Approved":
        return <Badge variant="default" className="bg-green-600">معتمد</Badge>
      case "Draft":
        return <Badge variant="secondary">مسودة</Badge>
      case "Rejected":
        return <Badge variant="destructive">مرفوض</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
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

  const getTransferStatus = () => {
    if (income.payment_method === "BankWire") {
      return (
        <div className="flex items-center gap-2 text-blue-600">
          <CheckCircle className="h-4 w-4" />
          <span>حوالة بنكية - في الحساب مباشرة</span>
        </div>
      )
    }

    if (income.transferred_at) {
      return (
        <div className="flex items-center gap-2 text-green-600">
          <CheckCircle className="h-4 w-4" />
          <span>محول في {formatDateArabic(new Date(income.transferred_at), "dd/MM/yyyy")}</span>
        </div>
      )
    }

    return (
      <div className="flex items-center gap-2 text-orange-600">
        <Calendar className="h-4 w-4" />
        <span>غير محول - في انتظار التحويل</span>
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            تفاصيل الإيراد #{income.id}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status and Basic Info */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <div className="text-sm font-medium text-gray-600">الحالة</div>
              <div className="mt-1">{getStatusBadge(income.status)}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-600">السنة المالية</div>
              <div className="mt-1 font-semibold">{income.fiscal_year.year}</div>
            </div>
          </div>

          {/* Amount and Date */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-4 border rounded-lg">
              <DollarSign className="h-8 w-8 text-green-600" />
              <div>
                <div className="text-sm font-medium text-gray-600">المبلغ</div>
                <div className="text-xl font-bold text-green-600">
                  {parseFloat(income.amount).toLocaleString()} د.م
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 border rounded-lg">
              <Calendar className="h-8 w-8 text-blue-600" />
              <div>
                <div className="text-sm font-medium text-gray-600">تاريخ الإيراد</div>
                <div className="text-lg font-semibold">
                  {formatDateArabic(new Date(income.income_date), "dd/MM/yyyy")}
                </div>
              </div>
            </div>
          </div>

          {/* Budget and Category */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-medium text-gray-600">الميزانية الفرعية</div>
              <div className="mt-1 font-semibold">{income.sub_budget.label}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-600">فئة الإيراد</div>
              <div className="mt-1 font-semibold">{income.income_category.label}</div>
            </div>
          </div>

          {/* Donor/Kafil Information */}
          {(income.donor || income.kafil) && (
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <User className="h-5 w-5" />
                <div className="text-sm font-medium text-gray-600">
                  {income.donor ? 'المتبرع' : 'الكفيل'}
                </div>
              </div>
              {income.donor && (
                <div>
                  <div className="font-semibold">{income.donor.first_name} {income.donor.last_name}</div>
                  {income.donor.phone && (
                    <div className="text-sm text-gray-600">الهاتف: {income.donor.phone}</div>
                  )}
                  {income.donor.email && (
                    <div className="text-sm text-gray-600">الإيميل: {income.donor.email}</div>
                  )}
                </div>
              )}
              {income.kafil && (
                <div>
                  <div className="font-semibold">{income.kafil.first_name} {income.kafil.last_name}</div>
                  {income.kafil.phone && (
                    <div className="text-sm text-gray-600">الهاتف: {income.kafil.phone}</div>
                  )}
                  {income.kafil.email && (
                    <div className="text-sm text-gray-600">الإيميل: {income.kafil.email}</div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Payment Information */}
          <div className="space-y-4 p-4 border rounded-lg">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              <div className="text-sm font-medium text-gray-600">معلومات الدفع</div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-medium text-gray-600">طريقة الدفع</div>
                <div className="mt-1">{getPaymentMethodBadge(income.payment_method)}</div>
              </div>
              
              {income.cheque_number && (
                <div>
                  <div className="text-sm font-medium text-gray-600">رقم الشيك</div>
                  <div className="mt-1 font-semibold">{income.cheque_number}</div>
                </div>
              )}
              
              {income.receipt_number && (
                <div>
                  <div className="text-sm font-medium text-gray-600">رقم الإيصال</div>
                  <div className="mt-1 font-semibold">{income.receipt_number}</div>
                </div>
              )}
            </div>

            {income.bank_account && (
              <div>
                <div className="text-sm font-medium text-gray-600">الحساب البنكي</div>
                <div className="mt-1 font-semibold">{income.bank_account.label} - {income.bank_account.bank_name}</div>
              </div>
            )}

            <div>
              <div className="text-sm font-medium text-gray-600">حالة التحويل</div>
              <div className="mt-1">{getTransferStatus()}</div>
            </div>
          </div>

          {/* Remarks */}
          {income.remarks && (
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-5 w-5" />
                <div className="text-sm font-medium text-gray-600">الملاحظات</div>
              </div>
              <div className="text-sm">{income.remarks}</div>
            </div>
          )}

          {/* Audit Information */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg text-xs text-gray-600">
            <div>
              <div>تاريخ الإنشاء: {formatDateArabic(new Date(income.created_at), "dd/MM/yyyy HH:mm")}</div>
              <div>آخر تعديل: {formatDateArabic(new Date(income.updated_at), "dd/MM/yyyy HH:mm")}</div>
            </div>
            {income.approved_at && (
              <div>
                <div>تاريخ الاعتماد: {formatDateArabic(new Date(income.approved_at), "dd/MM/yyyy HH:mm")}</div>
                {income.transferred_at && income.transferred_at !== income.income_date && (
                  <div>تاريخ التحويل: {formatDateArabic(new Date(income.transferred_at), "dd/MM/yyyy")}</div>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end">
            <Button variant="outline" onClick={handleClose}>
              إغلاق
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}