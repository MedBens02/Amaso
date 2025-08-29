"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, CheckCircle, XCircle, Calendar, DollarSign, TrendingUp, TrendingDown, ArrowRight } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface FiscalYear {
  id: number
  year: string
  status: string
  totalIncomes: number
  totalSpent: number
  carryOver: number
  isActive: boolean
}

interface ClosingSummary {
  fiscalYear: {
    id: number
    year: string
    isActive: boolean
  }
  unapprovedIncomes: number
  unapprovedExpenses: number
  unapprovedTransfers: number
  currentCash: number
  cashIsValid: boolean
  canClose: boolean
  validationMessages: string[]
}

interface CloseFiscalYearDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  fiscalYear: FiscalYear | null
  onSuccess: () => void
}

export function CloseFiscalYearDialog({ 
  open, 
  onOpenChange, 
  fiscalYear, 
  onSuccess 
}: CloseFiscalYearDialogProps) {
  const [closingSummary, setClosingSummary] = useState<ClosingSummary | null>(null)
  const [loading, setLoading] = useState(false)
  const [closing, setClosing] = useState(false)
  const { toast } = useToast()

  const formatAmount = (amount: number | string | undefined | null): string => {
    if (amount === undefined || amount === null || amount === '') return '0'
    const num = typeof amount === 'string' ? parseFloat(amount) : amount
    return isNaN(num) ? '0' : num.toLocaleString('ar-MA', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })
  }

  // Fetch closing summary when dialog opens
  useEffect(() => {
    if (open && fiscalYear) {
      fetchClosingSummary()
    } else {
      setClosingSummary(null)
    }
  }, [open, fiscalYear])

  const fetchClosingSummary = async () => {
    if (!fiscalYear) return
    
    setLoading(true)
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/v1/fiscal-years/${fiscalYear.id}/closing-summary`)
      const data = await response.json()
      
      if (data.success) {
        setClosingSummary(data.data)
      } else {
        toast({
          title: "خطأ في تحميل البيانات",
          description: "فشل في تحميل ملخص الإغلاق",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "خطأ في الاتصال",
        description: "فشل في الاتصال بالخادم",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmClose = async () => {
    if (!fiscalYear || !closingSummary) return
    
    setClosing(true)
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/v1/fiscal-years/${fiscalYear.id}/close`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      const data = await response.json()
      
      if (data.success) {
        toast({
          title: "تم إغلاق السنة المالية بنجاح",
          description: (
            <div className="space-y-2">
              <p>تم إغلاق السنة المالية {fiscalYear.year}</p>
              <p>تم فتح السنة المالية {data.nextYear?.year}</p>
              <p>المبلغ المرحل: {formatAmount(data.carryoverValue)} درهم</p>
            </div>
          ),
        })
        onOpenChange(false)
        onSuccess()
      } else {
        toast({
          title: "فشل في إغلاق السنة المالية",
          description: data.message || "حدث خطأ غير متوقع",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "خطأ في الإغلاق",
        description: "فشل في إغلاق السنة المالية",
        variant: "destructive"
      })
    } finally {
      setClosing(false)
    }
  }

  if (!fiscalYear) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Calendar className="h-6 w-6" />
            تأكيد إغلاق السنة المالية {fiscalYear.year}
          </DialogTitle>
          <DialogDescription>
            يرجى مراجعة المعلومات التالية قبل تأكيد إغلاق السنة المالية وفتح السنة الجديدة
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : closingSummary ? (
            <>
              {/* Status Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {closingSummary.canClose ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                    حالة الإغلاق
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge 
                    variant={closingSummary.canClose ? "default" : "destructive"}
                    className="text-sm p-2"
                  >
                    {closingSummary.canClose ? "✓ يمكن إغلاق السنة المالية" : "✗ لا يمكن إغلاق السنة المالية"}
                  </Badge>
                  
                  {closingSummary.validationMessages.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <h4 className="font-medium text-sm">الملاحظات:</h4>
                      <ul className="space-y-1">
                        {closingSummary.validationMessages.map((message, index) => (
                          <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                            <span className="text-yellow-500 mt-1">•</span>
                            {message}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Financial Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Current Year Financial Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">ملخص السنة المالية {fiscalYear.year}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium">إجمالي الإيرادات المعتمدة</span>
                        </div>
                        <span className="font-bold text-green-700">
                          {formatAmount(fiscalYear.totalIncomes)} د.م
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <TrendingDown className="h-4 w-4 text-red-600" />
                          <span className="text-sm font-medium">إجمالي المصروفات المعتمدة</span>
                        </div>
                        <span className="font-bold text-red-700">
                          {formatAmount(fiscalYear.totalSpent)} د.م
                        </span>
                      </div>

                      <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium">الرصيد النقدي الحالي</span>
                        </div>
                        <span className="font-bold text-blue-700">
                          {formatAmount(closingSummary.currentCash)} د.م
                        </span>
                      </div>

                      {fiscalYear.carryOver > 0 && (
                        <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                          <span className="text-sm font-medium">المرحل من السنة السابقة</span>
                          <span className="font-bold text-purple-700">
                            {formatAmount(fiscalYear.carryOver)} د.م
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Validation Details */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">تفاصيل التحقق</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className={`p-3 rounded-lg ${
                        closingSummary.unapprovedIncomes === 0 ? 'bg-green-50' : 'bg-yellow-50'
                      }`}>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">الإيرادات غير المعتمدة</span>
                          <div className="flex items-center gap-2">
                            <span className="font-bold">
                              {closingSummary.unapprovedIncomes}
                            </span>
                            {closingSummary.unapprovedIncomes === 0 ? (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                              <AlertTriangle className="h-4 w-4 text-yellow-600" />
                            )}
                          </div>
                        </div>
                      </div>

                      <div className={`p-3 rounded-lg ${
                        closingSummary.unapprovedExpenses === 0 ? 'bg-green-50' : 'bg-yellow-50'
                      }`}>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">المصروفات غير المعتمدة</span>
                          <div className="flex items-center gap-2">
                            <span className="font-bold">
                              {closingSummary.unapprovedExpenses}
                            </span>
                            {closingSummary.unapprovedExpenses === 0 ? (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                              <AlertTriangle className="h-4 w-4 text-yellow-600" />
                            )}
                          </div>
                        </div>
                      </div>

                      <div className={`p-3 rounded-lg ${
                        closingSummary.unapprovedTransfers === 0 ? 'bg-green-50' : 'bg-yellow-50'
                      }`}>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">التحويلات غير المعتمدة</span>
                          <div className="flex items-center gap-2">
                            <span className="font-bold">
                              {closingSummary.unapprovedTransfers}
                            </span>
                            {closingSummary.unapprovedTransfers === 0 ? (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                              <AlertTriangle className="h-4 w-4 text-yellow-600" />
                            )}
                          </div>
                        </div>
                      </div>

                      <div className={`p-3 rounded-lg ${
                        closingSummary.cashIsValid ? 'bg-green-50' : 'bg-red-50'
                      }`}>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">صحة الرصيد النقدي</span>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm">
                              {closingSummary.cashIsValid ? 'صحيح' : 'خطأ'}
                            </span>
                            {closingSummary.cashIsValid ? (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-600" />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Next Year Preview */}
              {closingSummary.canClose && (
                <Card className="border-green-200 bg-green-50">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <ArrowRight className="h-5 w-5 text-green-600" />
                      السنة المالية الجديدة {parseInt(fiscalYear.year) + 1}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-700">
                        سيتم تطبيق الإجراءات التالية عند إغلاق السنة المالية:
                      </p>
                      <ul className="list-disc list-inside text-sm text-gray-600 space-y-1 mr-4">
                        <li>إغلاق السنة المالية {fiscalYear.year}</li>
                        <li>إنشاء/تفعيل السنة المالية {parseInt(fiscalYear.year) + 1}</li>
                        <li>
                          ترحيل المبلغ النقدي الحالي ({formatAmount(closingSummary.currentCash)} د.م) 
                          للسنة الجديدة كرصيد مرحل
                        </li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <div className="text-center py-8 text-gray-500">
              فشل في تحميل بيانات الإغلاق
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={closing}
          >
            إلغاء
          </Button>
          
          {closingSummary?.canClose && (
            <Button 
              onClick={handleConfirmClose}
              disabled={closing || !closingSummary.canClose}
              className="bg-green-600 hover:bg-green-700"
            >
              {closing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b border-white ml-2"></div>
                  جاري الإغلاق...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 ml-2" />
                  تأكيد إغلاق السنة المالية
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}