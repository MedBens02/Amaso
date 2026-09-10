"use client"

import { useState, useEffect } from "react"
import { ledgerReportParams } from "@/lib/ledger-filters"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Search, Filter, Download, Wallet, ChevronDown, FileText, FileDown } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ExpensesTable } from "@/components/expenses/expenses-table"
import { NewExpenseDialog } from "@/components/forms/NewExpenseForm"
import { ExpenseFilters, FilterValues } from "@/components/expenses/expense-filters"
import { useToast } from "@/hooks/use-toast"
import api from "@/lib/api"
import { format } from "date-fns"

export default function ExpensesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  const [showNewDialog, setShowNewDialog] = useState(false)
  const [filters, setFilters] = useState<FilterValues>({})
  const [appliedFilters, setAppliedFilters] = useState<FilterValues>({})
  const [isExporting, setIsExporting] = useState(false)
  const { toast } = useToast()
  const [budgets, setBudgets] = useState<any[]>([])
  const [expenseCategories, setExpenseCategories] = useState<any[]>([])
  const [partners, setPartners] = useState<any[]>([])
  const [fiscalYears, setFiscalYears] = useState<any[]>([])

  // Load reference data for filter labels
  useEffect(() => {
    const loadReferenceData = async () => {
      try {
        const [budgetsRes, categoriesRes, partnersRes, fiscalYearsRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1'}/references/budgets`).then(r => r.json()),
          fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1'}/references/expense-categories`).then(r => r.json()),
          fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1'}/references/partners`).then(r => r.json()),
          fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1'}/fiscal-years`).then(r => r.json())
        ])
        setBudgets(budgetsRes.data || [])
        setExpenseCategories(categoriesRes.data || [])
        setPartners(partnersRes.data || [])
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
      case 'expenseCategory':
        const category = expenseCategories.find(cat => cat.id.toString() === value)
        return category ? category.label : value
      case 'partner':
        const partner = partners.find(p => p.id.toString() === value)
        return partner ? partner.name : value
      case 'fiscalYear':
        const fiscalYear = fiscalYears.find(fy => fy.id.toString() === value)
        return fiscalYear ? fiscalYear.year : value
      case 'paymentMethod':
        const paymentMethods: { [key: string]: string } = {
          'Cash': 'نقدي',
          'Cheque': 'شيك',
          'BankWire': 'حوالة بنكية'
        }
        return paymentMethods[value] || value
      case 'status':
        const statuses: { [key: string]: string } = {
          'Draft': 'مسودة',
          'Approved': 'معتمد',
          'Rejected': 'مرفوض'
        }
        return statuses[value] || value
      default:
        return value
    }
  }


  const convertExpensesToCSV = (expenses: any[], filters: FilterValues, search: string, getLabel: (type: string, value: string) => string) => {
    // Utility function to properly escape CSV fields
    const escapeCSVField = (field: any): string => {
      if (field === null || field === undefined) return '""'
      const str = String(field)
      // If field contains comma, newline, or quote, wrap in quotes and escape internal quotes
      if (str.includes(',') || str.includes('\n') || str.includes('"') || str.includes('\r')) {
        return `"${str.replace(/"/g, '""')}"`
      }
      return `"${str}"`
    }

    // Arabic CSV headers with proper escaping
    const headers = [
      'رقم المصروف',
      'التاريخ',
      'السنة المالية', 
      'الميزانية',
      'فئة المصروف',
      'الشريك',
      'التفاصيل',
      'المبلغ (د.م)',
      'طريقة الدفع',
      'رقم الشيك',
      'رقم الإيصال',
      'الحساب البنكي',
      'المستفيدون',
      'عدد المستفيدين',
      'الحالة',
      'تاريخ الاعتماد',
      'معتمد من طرف',
      'الملاحظات',
      'تاريخ الإنشاء'
    ]
    
    // Create header row
    const headerRow = headers.map(header => escapeCSVField(header)).join(',')
    
    // Create metadata rows (export info)
    const metadataRows = [
      `تقرير المصروفات - تم التصدير في: ${format(new Date(), 'dd/MM/yyyy HH:mm:ss')}`,
      search ? `كلمة البحث: ${search}` : '',
      // Add filter information
      Object.entries(filters).filter(([_, value]) => value !== undefined && value !== null && value !== '').map(([key, value]) => {
        const labelMap: { [key: string]: string } = {
          'fromDate': 'من تاريخ',
          'toDate': 'إلى تاريخ',
          'budgetId': 'الميزانية',
          'expenseCategoryId': 'فئة المصروف',
          'partnerId': 'الشريك',
          'paymentMethod': 'طريقة الدفع',
          'status': 'الحالة',
          'minAmount': 'الحد الأدنى للمبلغ',
          'maxAmount': 'الحد الأعلى للمبلغ',
          'fiscalYearId': 'السنة المالية'
        }
        const label = labelMap[key] || key
        if (value instanceof Date) {
          return `${label}: ${format(value, 'dd/MM/yyyy')}`
        }
        return `${label}: ${getLabel(key.replace('Id', ''), value.toString())}`
      }).join(' | '),
      `إجمالي المصروفات: ${expenses.length}`,
      '', // Empty row before data
    ].filter(row => row !== '').map(row => escapeCSVField(row)).join('\n')
    
    // Convert data to CSV rows
    const dataRows = expenses.map(expense => {
      const beneficiariesCount = expense.beneficiaries ? expense.beneficiaries.length : 0
      const beneficiariesList = expense.beneficiaries 
        ? expense.beneficiaries.map((b: any) => b.beneficiary?.full_name || 'غير محدد').join('; ')
        : 'لا يوجد'

      const paymentMethodArabic: { [key: string]: string } = {
        'Cash': 'نقدي',
        'Cheque': 'شيك',
        'BankWire': 'حوالة بنكية'
      }
      
      const statusArabic: { [key: string]: string } = {
        'Draft': 'مسودة',
        'Approved': 'معتمد',
        'Rejected': 'مرفوض'
      }

      return [
        escapeCSVField(expense.id || ''),
        escapeCSVField(expense.expense_date ? format(new Date(expense.expense_date), 'dd/MM/yyyy') : ''),
        escapeCSVField(expense.fiscal_year?.year || ''),
        escapeCSVField(expense.budget?.label || ''),
        escapeCSVField(expense.expense_category?.label || ''),
        escapeCSVField(expense.partner?.name || 'لا يوجد'),
        escapeCSVField(expense.details || ''),
        escapeCSVField(expense.amount || '0'),
        escapeCSVField(paymentMethodArabic[expense.payment_method] || expense.payment_method || ''),
        escapeCSVField(expense.cheque_number || ''),
        escapeCSVField(expense.receipt_number || ''),
        escapeCSVField(expense.bank_account?.label || 'لا يوجد'),
        escapeCSVField(beneficiariesList),
        escapeCSVField(beneficiariesCount.toString()),
        escapeCSVField(statusArabic[expense.status] || expense.status || ''),
        escapeCSVField(expense.approved_at ? format(new Date(expense.approved_at), 'dd/MM/yyyy HH:mm') : ''),
        escapeCSVField(expense.approved_by ? expense.approved_by.name : ''),
        escapeCSVField(expense.remarks || ''),
        escapeCSVField(expense.created_at ? format(new Date(expense.created_at), 'dd/MM/yyyy HH:mm') : '')
      ].join(',')
    })
    
    return [metadataRows, headerRow, ...dataRows].join('\n')
  }

  // The ledger as a real-text PDF, rendered server-side from the same filters
  // the table is showing.
  // The same rows the table is showing, as a branded workbook. Built
  // server-side so the sheet and the PDF come from one report rather than
  // from the table's own idea of the data.
  const handleExportExcel = async () => {
    setIsExporting(true)
    try {
      await api.downloadExcel('/reports/expenses.xlsx', ledgerReportParams(appliedFilters))
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
      await api.downloadPdf('/reports/expenses.pdf', ledgerReportParams(appliedFilters))
      toast({ title: "تم تحميل سجل المصروفات" })
    } catch (error: any) {
      toast({
        title: "خطأ في إنشاء الـ PDF",
        description: error?.message || "حدث خطأ أثناء إنشاء الملف",
        variant: "destructive",
      })
    }
  }

  const handleApplyFilters = () => {
    setAppliedFilters({ ...filters })
    console.log('Applied filters:', filters)
  }

  const handleClearFilters = () => {
    setFilters({})
    setAppliedFilters({})
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Wallet className="h-8 w-8" />
            إدارة المصروفات
          </h1>
          <p className="text-gray-600 mt-2">إدارة وتتبع جميع المصروفات والمساعدات</p>
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" disabled={isExporting}>
                <Download className="h-4 w-4 ml-2" />
                {isExporting ? "جاري التصدير..." : "تصدير"}
                <ChevronDown className="h-3 w-3 mr-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
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
            مصروف جديد
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
                placeholder="البحث في المصروفات..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>
            <Button 
              variant="outline" 
              onClick={() => setShowFilters(!showFilters)}
              className={Object.keys(appliedFilters).length > 0 ? "border-blue-500 bg-blue-50" : ""}
            >
              <Filter className="h-4 w-4 ml-2" />
              الفلاتر المتقدمة
              {Object.keys(appliedFilters).filter(key => appliedFilters[key as keyof FilterValues] !== undefined && appliedFilters[key as keyof FilterValues] !== null && appliedFilters[key as keyof FilterValues] !== '').length > 0 && (
                <span className="bg-blue-500 text-white rounded-full px-2 py-1 text-xs mr-2">
                  {Object.keys(appliedFilters).filter(key => appliedFilters[key as keyof FilterValues] !== undefined && appliedFilters[key as keyof FilterValues] !== null && appliedFilters[key as keyof FilterValues] !== '').length}
                </span>
              )}
            </Button>
          </div>
        </CardHeader>
        {showFilters && (
          <CardContent>
            <ExpenseFilters 
              filters={filters}
              onFiltersChange={setFilters}
              onApply={handleApplyFilters}
              onClear={handleClearFilters}
            />
          </CardContent>
        )}
      </Card>

      {/* Expenses Table */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة المصروفات</CardTitle>
        </CardHeader>
        <CardContent>
          <ExpensesTable 
            searchTerm={searchTerm} 
            appliedFilters={appliedFilters}
          />
        </CardContent>
      </Card>

      <NewExpenseDialog 
        open={showNewDialog} 
        onOpenChange={setShowNewDialog} 
        onSuccess={() => {
          setShowNewDialog(false)
        }}
      />
    </div>
  )
}
