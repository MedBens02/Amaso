"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ArrowLeftRight, Eye, CheckCircle, Clock, Banknote, Calendar, User } from "lucide-react"
import { format } from "date-fns"
import { ar } from "date-fns/locale"

interface Transfer {
  id: number
  fiscal_year_id: number
  transfer_date: string
  from_account_id: number
  to_account_id: number
  amount: string
  remarks?: string
  status: 'Draft' | 'Approved'
  created_by: any
  approved_by: any
  approved_at?: string
  created_at: string
  updated_at: string
  fiscal_year: any
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

interface ViewTransferDialogProps {
  transfer: Transfer | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ViewTransferDialog({ transfer, open, onOpenChange }: ViewTransferDialogProps) {
  if (!transfer) return null

  const getStatusBadge = (status: 'Draft' | 'Approved') => {
    switch (status) {
      case "Approved":
        return (
          <Badge variant="default" className="flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            معتمد
          </Badge>
        )
      case "Draft":
        return (
          <Badge variant="secondary" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            مسودة
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            تفاصيل التحويل
          </DialogTitle>
          <DialogDescription>عرض تفاصيل التحويل بين الحسابات المصرفية</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Transfer Status and Amount */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <ArrowLeftRight className="h-8 w-8 text-blue-600" />
              <div>
                <h3 className="text-lg font-bold text-blue-600">
                  DH {parseFloat(transfer.amount).toLocaleString()}
                </h3>
                <p className="text-sm text-gray-600">مبلغ التحويل</p>
              </div>
            </div>
            <div className="text-right">
              {getStatusBadge(transfer.status)}
            </div>
          </div>

          {/* Transfer Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* From Account */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                <Banknote className="h-4 w-4" />
                من حساب
              </label>
              <div className="p-3 border rounded-lg bg-red-50 border-red-200">
                <div className="font-medium text-gray-900">{transfer.from_account.label}</div>
                <div className="text-sm text-gray-600">{transfer.from_account.bank_name}</div>
                <div className="text-xs text-gray-500">{transfer.from_account.account_number}</div>
                <div className="text-sm font-medium text-red-600 mt-1">
                  الرصيد: DH {parseFloat(transfer.from_account.balance).toLocaleString()}
                </div>
              </div>
            </div>

            {/* To Account */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                <Banknote className="h-4 w-4" />
                إلى حساب
              </label>
              <div className="p-3 border rounded-lg bg-green-50 border-green-200">
                <div className="font-medium text-gray-900">{transfer.to_account.label}</div>
                <div className="text-sm text-gray-600">{transfer.to_account.bank_name}</div>
                <div className="text-xs text-gray-500">{transfer.to_account.account_number}</div>
                <div className="text-sm font-medium text-green-600 mt-1">
                  الرصيد: DH {parseFloat(transfer.to_account.balance).toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {/* Transfer Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                تاريخ التحويل
              </label>
              <div className="p-3 border rounded-lg">
                {format(new Date(transfer.transfer_date), "dd/MM/yyyy", { locale: ar })}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                رقم التحويل
              </label>
              <div className="p-3 border rounded-lg font-mono">
                #{transfer.id}
              </div>
            </div>
          </div>

          {/* Remarks */}
          {transfer.remarks && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                ملاحظات
              </label>
              <div className="p-3 border rounded-lg bg-gray-50">
                {transfer.remarks}
              </div>
            </div>
          )}

          {/* Approval Information */}
          {transfer.status === 'Approved' && transfer.approved_at && (
            <div className="p-4 border rounded-lg bg-green-50 border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">معلومات الاعتماد</span>
              </div>
              <div className="text-sm text-green-700">
                تم اعتماد التحويل في: {format(new Date(transfer.approved_at), "dd/MM/yyyy HH:mm", { locale: ar })}
              </div>
            </div>
          )}

          {/* Creation Information */}
          <div className="pt-4 border-t border-gray-200">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <User className="h-4 w-4" />
              تم إنشاؤه في: {format(new Date(transfer.created_at), "dd/MM/yyyy HH:mm", { locale: ar })}
            </div>
            {transfer.updated_at !== transfer.created_at && (
              <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                <User className="h-4 w-4" />
                آخر تحديث: {format(new Date(transfer.updated_at), "dd/MM/yyyy HH:mm", { locale: ar })}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            إغلاق
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}