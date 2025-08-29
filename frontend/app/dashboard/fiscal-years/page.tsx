"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Calendar, Lock, Unlock, TrendingUp, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { StartNewFiscalYearDialog } from "@/components/forms/StartNewFiscalYearForm"
import { CloseFiscalYearDialog } from "@/components/forms/CloseFiscalYearDialog"
import { useToast } from "@/hooks/use-toast"

interface FiscalYear {
  id: number
  year: string
  status: string
  startDate: string
  endDate: string
  current_cash?: number
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
  unapprovedTransfers: number
  currentCash: number
  cashIsValid: boolean
  canClose: boolean
  validationMessages: string[]
}

export default function FiscalYearsPage() {
  const [showNewDialog, setShowNewDialog] = useState(false)
  const [fiscalYears, setFiscalYears] = useState<FiscalYear[]>([])
  const [loading, setLoading] = useState(true)
  const [closingYear, setClosingYear] = useState<number | null>(null)
  const [closingSummaries, setClosingSummaries] = useState<{[key: number]: ClosingSummary}>({})
  const [showCloseDialog, setShowCloseDialog] = useState(false)
  const [selectedYearForClosing, setSelectedYearForClosing] = useState<FiscalYear | null>(null)
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

  // Helper function to get current amount available
  const getCurrentAmount = (year: FiscalYear): number => {
    if (year.isActive && year.current_cash !== undefined) {
      return year.current_cash
    }
    // For closed years, use remaining calculation
    const remaining = year.remaining
    return isNaN(remaining) ? 0 : remaining
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

  const handleCloseFiscalYear = (fiscalYear: FiscalYear) => {
    setSelectedYearForClosing(fiscalYear)
    setShowCloseDialog(true)
  }

  const handleCloseSuccess = () => {
    fetchFiscalYears() // Refresh data
    setSelectedYearForClosing(null)
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
                {/* Current Cash from Database View */}
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-blue-700">الرصيد النقدي الحالي:</span>
                    <span className="font-bold text-blue-800">
                      {year.isActive ? `DH ${formatAmount(year.current_cash)}` : 'NaN'}
                    </span>
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
                  
                </div>

                {/* Real-time Bank Information for Active Years */}
                {year.isActive && closingSummaries[year.id] && (
                  <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-green-700">الرصيد النقدي الحالي:</span>
                      <span className="font-bold text-green-800">
                        DH {formatAmount(closingSummaries[year.id].currentCash)}
                      </span>
                    </div>
                    {!closingSummaries[year.id].cashIsValid && (
                      <div className="text-xs text-amber-600 mt-1">
                        ⚠️ خطأ في حساب الرصيد النقدي
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
                    {closingSummaries[year.id].unapprovedTransfers > 0 && (
                      <div>• تحويلات غير معتمدة: {closingSummaries[year.id].unapprovedTransfers}</div>
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
                    className={closingSummaries[year.id]?.canClose ? "bg-green-600 hover:bg-green-700" : ""}
                  >
                    <X className="h-4 w-4 ml-1" />
                    {closingSummaries[year.id]?.canClose ? 'إغلاق السنة ✓' : 'إغلاق السنة'}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <StartNewFiscalYearDialog open={showNewDialog} onOpenChange={setShowNewDialog} />
      <CloseFiscalYearDialog 
        open={showCloseDialog} 
        onOpenChange={setShowCloseDialog}
        fiscalYear={selectedYearForClosing}
        onSuccess={handleCloseSuccess}
      />
    </div>
  )
}
