"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Calendar, Lock, Unlock, TrendingUp, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { StartNewFiscalYearDialog } from "@/components/forms/StartNewFiscalYearForm"
import { useToast } from "@/hooks/use-toast"

interface FiscalYear {
  id: number
  year: string
  status: string
  startDate: string
  endDate: string
  totalBudget: number
  totalIncomes: number
  totalSpent: number
  carryOver: number
  carryoverNextYear: number
  remaining: number
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
  bankTotal: string
  budgetCurrentAmount: string
  budgetMatchesBank: boolean
  canClose: boolean
  validationMessages: string[]
}

export default function FiscalYearsPage() {
  const [showNewDialog, setShowNewDialog] = useState(false)
  const [fiscalYears, setFiscalYears] = useState<FiscalYear[]>([])
  const [loading, setLoading] = useState(true)
  const [closingYear, setClosingYear] = useState<number | null>(null)
  const [closingSummaries, setClosingSummaries] = useState<{[key: number]: ClosingSummary}>({})
  const { toast } = useToast()

  // Fetch fiscal years from API
  useEffect(() => {
    fetchFiscalYears()
  }, [])

  // Helper function to safely format numbers
  const formatAmount = (amount: number | string | undefined | null): string => {
    if (amount === undefined || amount === null || amount === '') return '0'
    const num = typeof amount === 'string' ? parseFloat(amount) : amount
    return isNaN(num) ? '0' : num.toLocaleString()
  }

  // Helper function to get current amount available (total budget minus spent)
  const getCurrentAmount = (year: FiscalYear): number => {
    const currentAmount = year.totalBudget - year.totalSpent
    return isNaN(currentAmount) ? 0 : currentAmount
  }

  const fetchFiscalYears = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/v1/fiscal-years')
      const data = await response.json()
      
      if (data.success) {
        setFiscalYears(data.data)
        
        // Fetch closing summaries for active fiscal years
        const activeYears = data.data.filter((year: FiscalYear) => year.isActive)
        for (const year of activeYears) {
          try {
            const summaryResponse = await fetch(`http://127.0.0.1:8000/api/v1/fiscal-years/${year.id}/closing-summary`)
            const summaryData = await summaryResponse.json()
            if (summaryData.success) {
              setClosingSummaries(prev => ({
                ...prev,
                [year.id]: summaryData.data
              }))
            }
          } catch (error) {
            console.error(`Failed to fetch closing summary for year ${year.year}:`, error)
          }
        }
      } else {
        toast({
          title: "خطأ في تحميل البيانات",
          description: "فشل في تحميل السنوات المالية",
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

  const handleCloseFiscalYear = async (fiscalYear: FiscalYear) => {
    setClosingYear(fiscalYear.id)
    
    try {
      // First check closing status
      const statusResponse = await fetch(`http://127.0.0.1:8000/api/v1/fiscal-years/${fiscalYear.id}/closing-status`)
      const statusData = await statusResponse.json()
      
      if (!statusData.data.canClose) {
        toast({
          title: "لا يمكن إغلاق السنة المالية",
          description: `هناك مشاكل يجب حلها أولاً:\n${statusData.data.validationErrors.join('\n')}`,
          variant: "destructive"
        })
        return
      }

      // Proceed with closing
      const closeResponse = await fetch(`http://127.0.0.1:8000/api/v1/fiscal-years/${fiscalYear.id}/close`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      const closeData = await closeResponse.json()
      
      if (closeData.success) {
        toast({
          title: "تم إغلاق السنة المالية",
          description: `تم إغلاق السنة المالية ${fiscalYear.year} بنجاح`
        })
        fetchFiscalYears() // Refresh data
      } else {
        toast({
          title: "فشل في إغلاق السنة المالية",
          description: closeData.message || "حدث خطأ غير متوقع",
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
      setClosingYear(null)
    }
  }

  const getStatusBadge = (status: string) => {
    return status === "مفتوح" ? (
      <Badge variant="default" className="flex items-center gap-1">
        <Unlock className="h-3 w-3" />
        مفتوح
      </Badge>
    ) : (
      <Badge variant="secondary" className="flex items-center gap-1">
        <Lock className="h-3 w-3" />
        مغلق
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-center items-center min-h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">جاري تحميل السنوات المالية...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="h-8 w-8" />
            السنوات المالية
          </h1>
          <p className="text-gray-600 mt-2">إدارة السنوات المالية والميزانيات</p>
        </div>
        <Button onClick={() => setShowNewDialog(true)}>
          <Plus className="h-4 w-4 ml-2" />
          بدء سنة مالية جديدة
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {fiscalYears.map((year) => (
          <Card key={year.id} className="relative">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">السنة المالية {year.year}</CardTitle>
                {getStatusBadge(year.status)}
              </div>
              <p className="text-sm text-gray-600">
                {year.startDate} - {year.endDate}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {/* Budget Overview */}
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-blue-700">إجمالي الميزانية:</span>
                    <span className="font-bold text-blue-800">DH {formatAmount(year.totalBudget)}</span>
                  </div>
                  {year.carryOver > 0 && (
                    <div className="flex justify-between text-xs text-blue-600">
                      <span>• المرحل من السنة السابقة:</span>
                      <span>DH {formatAmount(year.carryOver)}</span>
                    </div>
                  )}
                </div>
                
                {/* Financial Activity */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>الإيرادات المعتمدة:</span>
                    <span className="font-bold text-green-600">DH {formatAmount(year.totalIncomes)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>المصروفات المعتمدة:</span>
                    <span className="font-bold text-red-600">DH {formatAmount(year.totalSpent)}</span>
                  </div>
                  
                  {/* Current Available Amount */}
                  <div className="flex justify-between text-sm font-semibold bg-gray-50 p-2 rounded border">
                    <span>المبلغ المتاح حالياً:</span>
                    <span className="text-blue-700">
                      DH {formatAmount(getCurrentAmount(year))}
                    </span>
                  </div>
                </div>

                {/* Real-time Bank Information for Active Years */}
                {year.isActive && closingSummaries[year.id] && (
                  <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-green-700">إجمالي أرصدة البنوك:</span>
                      <span className="font-bold text-green-800">
                        DH {formatAmount(closingSummaries[year.id].bankTotal)}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs text-green-600">
                      <span>• المبلغ الحالي للميزانية:</span>
                      <span>DH {formatAmount(closingSummaries[year.id].budgetCurrentAmount)}</span>
                    </div>
                    {!closingSummaries[year.id].budgetMatchesBank && (
                      <div className="text-xs text-amber-600 mt-1">
                        ⚠️ الميزانية لا تتطابق مع أرصدة البنوك
                      </div>
                    )}
                  </div>
                )}

                {/* Pending Items for Active Years */}
                {year.isActive && closingSummaries[year.id] && (
                  <div className="text-xs text-gray-600 space-y-1">
                    {closingSummaries[year.id].unapprovedIncomes > 0 && (
                      <div>• إيرادات غير معتمدة: {closingSummaries[year.id].unapprovedIncomes}</div>
                    )}
                    {closingSummaries[year.id].unapprovedExpenses > 0 && (
                      <div>• مصروفات غير معتمدة: {closingSummaries[year.id].unapprovedExpenses}</div>
                    )}
                  </div>
                )}
                
                {/* Carryover to Next Year (for closed years) */}
                {year.carryoverNextYear > 0 && (
                  <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                    <div className="flex justify-between text-sm">
                      <span className="text-purple-700">المرحل للسنة القادمة:</span>
                      <span className="font-bold text-purple-800">DH {formatAmount(year.carryoverNextYear)}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Progress Bar - Spending vs Budget */}
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: year.totalBudget > 0 ? 
                      `${Math.min(Math.max(((year.totalSpent || 0) / (year.totalBudget || 1)) * 100, 0), 100)}%` : 
                      '0%' 
                  }}
                ></div>
              </div>
              
              <div className="text-xs text-gray-500 text-center">
                استخدام الميزانية: {year.totalBudget > 0 ? 
                  `${Math.round(((year.totalSpent || 0) / (year.totalBudget || 1)) * 100)}%` : 
                  '0%'
                }
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                  <TrendingUp className="h-4 w-4 ml-1" />
                  عرض التفاصيل
                </Button>
                {year.status === "مفتوح" && (
                  <Button 
                    variant={closingSummaries[year.id]?.canClose ? "default" : "outline"} 
                    size="sm"
                    onClick={() => handleCloseFiscalYear(year)}
                    disabled={closingYear === year.id || (closingSummaries[year.id] && !closingSummaries[year.id].canClose)}
                    className={closingSummaries[year.id]?.canClose ? "bg-green-600 hover:bg-green-700" : ""}
                  >
                    {closingYear === year.id ? (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 border-b border-gray-600 ml-1"></div>
                        جاري الإغلاق...
                      </>
                    ) : (
                      <>
                        <X className="h-4 w-4 ml-1" />
                        {closingSummaries[year.id]?.canClose ? 'إغلاق السنة ✓' : 'إغلاق السنة'}
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <StartNewFiscalYearDialog open={showNewDialog} onOpenChange={setShowNewDialog} />
    </div>
  )
}
