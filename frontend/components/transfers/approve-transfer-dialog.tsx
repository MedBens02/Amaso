"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { CheckCircle, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

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

interface ApproveTransferDialogProps {
  transfer: Transfer | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onApprovalComplete: () => void
}

export function ApproveTransferDialog({
  transfer,
  open,
  onOpenChange,
  onApprovalComplete
}: ApproveTransferDialogProps) {
  const [remarks, setRemarks] = useState("")
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleApprove = async () => {
    if (!transfer) return

    setLoading(true)
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/v1/transfers/${transfer.id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ remarks })
      })
      const data = await response.json()
      
      if (response.ok) {
        toast({
          title: "تم اعتماد التحويل",
          description: data.message,
          variant: "default"
        })
        onApprovalComplete()
        onOpenChange(false)
        setRemarks("")
      } else {
        toast({
          title: "خطأ في الاعتماد",
          description: data.message,
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "خطأ في الاعتماد",
        description: "فشل في اعتماد التحويل",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!loading) {
      if (!newOpen) {
        setRemarks("")
      } else if (transfer?.remarks) {
        setRemarks(transfer.remarks)
      }
      onOpenChange(newOpen)
    }
  }

  // Update remarks when transfer changes
  React.useEffect(() => {
    if (transfer?.remarks) {
      setRemarks(transfer.remarks)
    } else {
      setRemarks("")
    }
  }, [transfer])

  if (!transfer) return null

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-right">
            <CheckCircle className="h-5 w-5 text-green-600" />
            اعتماد التحويل
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-right">
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">المبلغ:</span>
              <span className="font-bold text-blue-600">
                DH {parseFloat(transfer.amount).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">من:</span>
              <span className="font-medium">{transfer.from_account.label}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">إلى:</span>
              <span className="font-medium">{transfer.to_account.label}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">التاريخ:</span>
              <span className="font-medium">
                {new Date(transfer.transfer_date).toLocaleDateString('ar-MA')}
              </span>
            </div>
          </div>

          {/* Show existing remarks if any */}
          {transfer.remarks && (
            <div className="space-y-2">
              <Label className="text-right block text-sm font-medium text-gray-700">
                الملاحظات الحالية
              </Label>
              <div className="p-3 bg-gray-50 border rounded-lg text-right text-sm text-gray-700">
                {transfer.remarks}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="remarks" className="text-right block">
              {transfer.remarks ? "تحديث الملاحظات (اختياري)" : "ملاحظات التحويل (اختياري)"}
            </Label>
            <Textarea
              id="remarks"
              placeholder={transfer.remarks ? "تعديل الملاحظات..." : "أضف ملاحظات للتحويل..."}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="text-right resize-none"
              rows={3}
              dir="rtl"
            />
            {transfer.remarks && remarks !== transfer.remarks && (
              <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                💡 تم تعديل الملاحظات - سيتم حفظ النسخة الجديدة
              </div>
            )}
          </div>

          <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg">
            <p className="text-sm text-amber-700 text-right">
              ⚠️ سيتم تحديث أرصدة الحسابات فور اعتماد هذا التحويل
            </p>
          </div>
        </div>

        <DialogFooter className="flex gap-2 justify-start">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={loading}
          >
            إلغاء
          </Button>
          <Button
            onClick={handleApprove}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                جاري الاعتماد...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 ml-2" />
                اعتماد التحويل
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}