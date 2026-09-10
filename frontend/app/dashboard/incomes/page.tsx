"use client"

import { useState, useEffect } from "react"
import { ledgerFilterParams, ledgerReportParams } from "@/lib/ledger-filters"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Search, Filter, Download, HandCoins, FileDown } from "lucide-react"
import { IncomesTable } from "@/components/incomes/incomes-table"
import { NewIncomeDialog } from "@/components/forms/NewIncomeForm"
import { IncomeFilters, FilterValues } from "@/components/incomes/income-filters"
import { useToast } from "@/hooks/use-toast"
import api from "@/lib/api"
import { format } from "date-fns"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ChevronDown, FileText } from "lucide-react"

export default function IncomesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  const [showNewDialog, setShowNewDialog] = useState(false)
  const [incomesRefreshKey, setIncomesRefreshKey] = useState(0)
  const [filters, setFilters] = useState<FilterValues>({})
  const [appliedFilters, setAppliedFilters] = useState<FilterValues>({})
  const [isExporting, setIsExporting] = useState(false)
  const { toast } = useToast()
  const [budgets, setBudgets] = useState<any[]>([])
  const [fiscalYears, setFiscalYears] = useState<any[]>([])

  // Load reference data for filter labels
  useEffect(() => {
    const loadReferenceData = async () => {
      try {
        const [budgetsRes, fiscalYearsRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1'}/budgets`).then(r => r.json()),
          fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1'}/fiscal-years`).then(r => r.json())
        ])
        setBudgets(budgetsRes.data || [])
        setFiscalYears(fiscalYearsRes.data || [])
      } catch (error) {
        console.error('Error loading reference data:', error)
      }
    }
    loadReferenceData()
  }, [])

  // Helper to get readable filter labels
  const getFilterLabel = (type: string, value: string) => {
    switch (type) {
      case 'budget':
        const budget = budgets.find(sb => sb.id.toString() === value)
        return budget ? budget.label : value
      case 'fiscalYear':
        const fiscalYear = fiscalYears.find(fy => fy.id.toString() === value)
        return fiscalYear ? fiscalYear.year : value
      default:
        return value
    }
  }

  // The same rows the table is showing, as a branded workbook. Built
  // server-side so the sheet and the PDF come from one report rather than
  // from the table's own idea of the data.
  const handleExportExcel = async () => {
    setIsExporting(true)
    try {
      await api.downloadExcel('/reports/incomes.xlsx', ledgerReportParams(appliedFilters))
      toast({ title: "تم تحميل ملف Excel" })
    } catch (error: any) {
      toast({
        title: "خطأ في التصدير",
        description: error?.message || "حدث خطأ أثناء إنشاء الملف",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  const handleDownloadPdf = async () => {
    try {
      await api.downloadPdf('/reports/incomes.pdf', ledgerReportParams(appliedFilters))
      toast({ title: "تم تحميل سجل الإيرادات" })
    } catch (error: any) {
      toast({
        title: "خطأ في إنشاء الـ PDF",
        description: error?.message || "حدث خطأ أثناء إنشاء الملف",
        variant: "destructive",
      })
    }
  }


  const handleFiltersChange = (newFilters: FilterValues) => {
    setFilters(newFilters)
  }

  const handleApplyFilters = () => {
    setAppliedFilters(filters)
  }

  const handleClearFilters = () => {
    const emptyFilters = {}
    setFilters(emptyFilters)
    setAppliedFilters(emptyFilters)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <HandCoins className="h-8 w-8" />
            إدارة الإيرادات
          </h1>
          <p className="text-gray-600 mt-2">إدارة وتتبع جميع الإيرادات والتبرعات</p>
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" disabled={isExporting}>
                <Download className="h-4 w-4 ml-2" />
                {isExporting ? "جاري التصدير..." : "تصدير"}
                {!isExporting && <ChevronDown className="h-4 w-4 mr-2" />}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleDownloadPdf}>
                <FileDown className="h-4 w-4 ml-2" />
                تصدير PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportExcel} disabled={isExporting}>
                <Download className="h-4 w-4 ml-2" />
                تصدير Excel
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={() => setShowNewDialog(true)}>
            <Plus className="h-4 w-4 ml-2" />
            إيراد جديد
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="البحث في الإيرادات..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>
            <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
              <Filter className="h-4 w-4 ml-2" />
              الفلاتر المتقدمة
            </Button>
          </div>
        </CardHeader>
        {showFilters && (
          <CardContent>
            <IncomeFilters
              filters={filters}
              onFiltersChange={handleFiltersChange}
              onApply={handleApplyFilters}
              onClear={handleClearFilters}
            />
          </CardContent>
        )}
      </Card>

      {/* Incomes Table */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة الإيرادات</CardTitle>
        </CardHeader>
        <CardContent>
          <IncomesTable searchTerm={searchTerm} filters={appliedFilters} refreshKey={incomesRefreshKey} />
        </CardContent>
      </Card>

      <NewIncomeDialog
        open={showNewDialog}
        onOpenChange={setShowNewDialog}
        onSuccess={() => setIncomesRefreshKey((k) => k + 1)}
      />
    </div>
  )
}
