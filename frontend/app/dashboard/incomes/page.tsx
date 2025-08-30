"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Search, Filter, Download, HandCoins } from "lucide-react"
import { IncomesTable } from "@/components/incomes/incomes-table"
import { NewIncomeDialog } from "@/components/forms/NewIncomeForm"
import { IncomeFilters, FilterValues } from "@/components/incomes/income-filters"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ChevronDown, FileText } from "lucide-react"

export default function IncomesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  const [showNewDialog, setShowNewDialog] = useState(false)
  const [filters, setFilters] = useState<FilterValues>({})
  const [appliedFilters, setAppliedFilters] = useState<FilterValues>({})
  const [isExporting, setIsExporting] = useState(false)
  const { toast } = useToast()
  const [subBudgets, setSubBudgets] = useState<any[]>([])
  const [fiscalYears, setFiscalYears] = useState<any[]>([])

  // Load reference data for filter labels
  useEffect(() => {
    const loadReferenceData = async () => {
      try {
        const [subBudgetsRes, fiscalYearsRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1'}/sub-budgets`).then(r => r.json()),
          fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1'}/fiscal-years`).then(r => r.json())
        ])
        setSubBudgets(subBudgetsRes.data || [])
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
      case 'subBudget':
        const subBudget = subBudgets.find(sb => sb.id.toString() === value)
        return subBudget ? subBudget.label : value
      case 'fiscalYear':
        const fiscalYear = fiscalYears.find(fy => fy.id.toString() === value)
        return fiscalYear ? fiscalYear.year : value
      default:
        return value
    }
  }

  const handleExportCSV = async () => {
    setIsExporting(true)
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1'
      const url = new URL(`${baseUrl}/incomes`)
      
      const params = new URLSearchParams()
      params.append('per_page', '10000') // Get all records for export
      
      // Apply the same filters as the table
      if (appliedFilters.fromDate) {
        params.append('from_date', appliedFilters.fromDate.toISOString().split('T')[0])
      }
      if (appliedFilters.toDate) {
        params.append('to_date', appliedFilters.toDate.toISOString().split('T')[0])
      }
      if (appliedFilters.subBudgetId) {
        params.append('sub_budget_id', appliedFilters.subBudgetId)
      }
      if (appliedFilters.paymentMethod) {
        params.append('payment_method', appliedFilters.paymentMethod)
      }
      if (appliedFilters.status) {
        params.append('status', appliedFilters.status)
      }
      if (appliedFilters.minAmount) {
        params.append('min_amount', appliedFilters.minAmount)
      }
      if (appliedFilters.maxAmount) {
        params.append('max_amount', appliedFilters.maxAmount)
      }
      if (appliedFilters.fiscalYearId) {
        params.append('fiscal_year_id', appliedFilters.fiscalYearId)
      }

      url.search = params.toString()
      
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error('Failed to fetch data for export')
      }
      
      const result = await response.json()
      let allIncomes = result.data || []

      // Apply client-side search filter (same as in table)
      if (searchTerm.trim()) {
        const searchLower = searchTerm.toLowerCase()
        allIncomes = allIncomes.filter((income: any) => (
          income.sub_budget.label.toLowerCase().includes(searchLower) ||
          income.income_category.label.toLowerCase().includes(searchLower) ||
          (income.donor && `${income.donor.first_name} ${income.donor.last_name}`.toLowerCase().includes(searchLower)) ||
          (income.kafil && `${income.kafil.first_name} ${income.kafil.last_name}`.toLowerCase().includes(searchLower)) ||
          (income.remarks && income.remarks.toLowerCase().includes(searchLower))
        ))
      }

      // Convert to CSV
      const csvContent = convertIncomesToCSV(allIncomes, appliedFilters, searchTerm, getFilterLabel)
      
      // Create and download file
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url_obj = URL.createObjectURL(blob)
      link.setAttribute('href', url_obj)
      
      const currentDate = format(new Date(), 'yyyy-MM-dd')
      link.setAttribute('download', `incomes_export_${currentDate}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: "تم التصدير بنجاح",
        description: `تم تصدير ${allIncomes.length} إيراد إلى ملف CSV`,
      })
    } catch (error) {
      console.error('Error exporting CSV:', error)
      toast({
        title: "خطأ في التصدير",
        description: "حدث خطأ أثناء تصدير البيانات",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  const convertIncomesToCSV = (incomes: any[], filters: FilterValues, search: string, getLabel: (type: string, value: string) => string) => {
    // Debug logging
    console.log('CSV Export - Applied filters:', filters)
    console.log('CSV Export - Search term:', search)
    console.log('CSV Export - Sub budgets:', subBudgets)
    console.log('CSV Export - Fiscal years:', fiscalYears)
    
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
      'رقم الإيراد',
      'التاريخ',
      'السنة المالية', 
      'الميزانية الفرعية',
      'الفئة',
      'المتبرع/الكفيل',
      'النوع',
      'المبلغ (د.م)',
      'طريقة الدفع',
      'رقم الشيك',
      'رقم الإيصال',
      'الحالة',
      'تاريخ الاعتماد',
      'تاريخ التحويل',
      'الملاحظات',
      'تاريخ الإنشاء'
    ]
    
    // Create header row with design
    const headerRow = headers.map(header => escapeCSVField(header)).join(',')
    
    // Convert data to CSV rows
    const dataRows = incomes.map(income => {
      const donorKafil = income.donor 
        ? `${income.donor.first_name} ${income.donor.last_name} (متبرع)`
        : income.kafil 
        ? `${income.kafil.first_name} ${income.kafil.last_name} (كفيل)`
        : 'غير محدد'
      
      const paymentMethodArabic = {
        'Cash': 'نقدي',
        'Cheque': 'شيك',
        'BankWire': 'حوالة بنكية'
      }[income.payment_method] || income.payment_method

      const statusArabic = {
        'Draft': 'مسودة',
        'Approved': 'معتمد', 
        'Rejected': 'مرفوض'
      }[income.status] || income.status

      // Format amount without Arabic locale to avoid alignment issues
      const formattedAmount = parseFloat(income.amount).toFixed(2)

      const row = [
        income.id,
        format(new Date(income.income_date), 'yyyy-MM-dd'),
        income.fiscal_year?.year || '',
        income.sub_budget?.label || '',
        income.income_category?.label || '',
        donorKafil,
        income.donor ? 'تبرع' : income.kafil ? 'كفالة' : '',
        formattedAmount,
        paymentMethodArabic,
        income.cheque_number || '',
        income.receipt_number || '',
        statusArabic,
        income.approved_at ? format(new Date(income.approved_at), 'yyyy-MM-dd') : '',
        income.transferred_at ? format(new Date(income.transferred_at), 'yyyy-MM-dd') : '',
        income.remarks || '',
        format(new Date(income.created_at), 'yyyy-MM-dd HH:mm')
      ]

      return row.map(field => escapeCSVField(field)).join(',')
    })
    
    // Create CSV with title and metadata
    const currentDate = format(new Date(), 'yyyy-MM-dd HH:mm')
    const totalAmount = incomes.reduce((sum, income) => sum + parseFloat(income.amount), 0)
    
    // Build filter lines dynamically
    const filterLines = []
    if (filters.fromDate) {
      filterLines.push(escapeCSVField(`من تاريخ: ${format(filters.fromDate, 'yyyy-MM-dd')}`))
    }
    if (filters.toDate) {
      filterLines.push(escapeCSVField(`إلى تاريخ: ${format(filters.toDate, 'yyyy-MM-dd')}`))
    }
    if (filters.fiscalYearId) {
      filterLines.push(escapeCSVField(`السنة المالية: ${getLabel('fiscalYear', filters.fiscalYearId)}`))
    }
    if (filters.subBudgetId) {
      filterLines.push(escapeCSVField(`الميزانية الفرعية: ${getLabel('subBudget', filters.subBudgetId)}`))
    }
    if (filters.status) {
      const statusArabic = filters.status === 'Approved' ? 'معتمد' : filters.status === 'Draft' ? 'مسودة' : filters.status === 'Rejected' ? 'مرفوض' : filters.status
      filterLines.push(escapeCSVField(`الحالة: ${statusArabic}`))
    }
    if (filters.paymentMethod) {
      const paymentArabic = filters.paymentMethod === 'Cash' ? 'نقدي' : filters.paymentMethod === 'Cheque' ? 'شيك' : filters.paymentMethod === 'BankWire' ? 'حوالة بنكية' : filters.paymentMethod
      filterLines.push(escapeCSVField(`طريقة الدفع: ${paymentArabic}`))
    }
    if (filters.minAmount) {
      filterLines.push(escapeCSVField(`أقل مبلغ: ${filters.minAmount} د.م`))
    }
    if (filters.maxAmount) {
      filterLines.push(escapeCSVField(`أعلى مبلغ: ${filters.maxAmount} د.م`))
    }
    if (search.trim()) {
      filterLines.push(escapeCSVField(`البحث: ${search.trim()}`))
    }
    
    console.log('Filter lines:', filterLines)
    
    const csvContent = [
      // Title and metadata section
      escapeCSVField('تقرير الإيرادات - نظام إدارة الجمعية'),
      '',
      escapeCSVField(`تاريخ التصدير: ${currentDate}`),
      escapeCSVField(`عدد السجلات: ${incomes.length}`),
      escapeCSVField(`إجمالي المبلغ: ${totalAmount.toFixed(2)} د.م`),
      '',
      // Add filter information if filters are applied
      ...(filterLines.length > 0 ? [
        escapeCSVField('الفلاتر المطبقة:'),
        ...filterLines,
        ''
      ] : []),
      // Data section
      escapeCSVField('البيانات:'),
      headerRow,
      ...dataRows
    ]
    
    return csvContent.join('\n')
  }

  const handlePrintReport = async () => {
    setIsExporting(true)
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1'
      const url = new URL(`${baseUrl}/incomes`)
      
      const params = new URLSearchParams()
      params.append('per_page', '10000')
      
      // Apply the same filters
      if (appliedFilters.fromDate) {
        params.append('from_date', appliedFilters.fromDate.toISOString().split('T')[0])
      }
      if (appliedFilters.toDate) {
        params.append('to_date', appliedFilters.toDate.toISOString().split('T')[0])
      }
      if (appliedFilters.subBudgetId) {
        params.append('sub_budget_id', appliedFilters.subBudgetId)
      }
      if (appliedFilters.paymentMethod) {
        params.append('payment_method', appliedFilters.paymentMethod)
      }
      if (appliedFilters.status) {
        params.append('status', appliedFilters.status)
      }
      if (appliedFilters.minAmount) {
        params.append('min_amount', appliedFilters.minAmount)
      }
      if (appliedFilters.maxAmount) {
        params.append('max_amount', appliedFilters.maxAmount)
      }
      if (appliedFilters.fiscalYearId) {
        params.append('fiscal_year_id', appliedFilters.fiscalYearId)
      }

      url.search = params.toString()
      
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error('Failed to fetch data for print')
      }
      
      const result = await response.json()
      let allIncomes = result.data || []

      // Apply client-side search filter
      if (searchTerm.trim()) {
        const searchLower = searchTerm.toLowerCase()
        allIncomes = allIncomes.filter((income: any) => (
          income.sub_budget.label.toLowerCase().includes(searchLower) ||
          income.income_category.label.toLowerCase().includes(searchLower) ||
          (income.donor && `${income.donor.first_name} ${income.donor.last_name}`.toLowerCase().includes(searchLower)) ||
          (income.kafil && `${income.kafil.first_name} ${income.kafil.last_name}`.toLowerCase().includes(searchLower)) ||
          (income.remarks && income.remarks.toLowerCase().includes(searchLower))
        ))
      }

      // Create HTML report and print
      generatePrintableReport(allIncomes, appliedFilters, searchTerm, getFilterLabel)
      
    } catch (error) {
      console.error('Error generating print report:', error)
      toast({
        title: "خطأ في إنشاء التقرير",
        description: "حدث خطأ أثناء إنشاء التقرير للطباعة",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  const generatePrintableReport = (incomes: any[], filters: FilterValues, search: string, getLabel: (type: string, value: string) => string) => {
    console.log('Print Report - Applied filters:', filters)
    console.log('Print Report - Search term:', search)
    
    const currentDate = format(new Date(), 'yyyy-MM-dd HH:mm')
    const totalAmount = incomes.reduce((sum, income) => sum + parseFloat(income.amount), 0)
    
    // Build filter lines for print report
    const filterElements = []
    if (filters.fromDate) {
      filterElements.push(`<div>من تاريخ: ${format(filters.fromDate, 'yyyy-MM-dd')}</div>`)
    }
    if (filters.toDate) {
      filterElements.push(`<div>إلى تاريخ: ${format(filters.toDate, 'yyyy-MM-dd')}</div>`)
    }
    if (filters.fiscalYearId) {
      filterElements.push(`<div>السنة المالية: ${getLabel('fiscalYear', filters.fiscalYearId)}</div>`)
    }
    if (filters.subBudgetId) {
      filterElements.push(`<div>الميزانية الفرعية: ${getLabel('subBudget', filters.subBudgetId)}</div>`)
    }
    if (filters.status) {
      const statusArabic = filters.status === 'Approved' ? 'معتمد' : filters.status === 'Draft' ? 'مسودة' : filters.status === 'Rejected' ? 'مرفوض' : filters.status
      filterElements.push(`<div>الحالة: ${statusArabic}</div>`)
    }
    if (filters.paymentMethod) {
      const paymentArabic = filters.paymentMethod === 'Cash' ? 'نقدي' : filters.paymentMethod === 'Cheque' ? 'شيك' : filters.paymentMethod === 'BankWire' ? 'حوالة بنكية' : filters.paymentMethod
      filterElements.push(`<div>طريقة الدفع: ${paymentArabic}</div>`)
    }
    if (filters.minAmount) {
      filterElements.push(`<div>أقل مبلغ: ${filters.minAmount} د.م</div>`)
    }
    if (filters.maxAmount) {
      filterElements.push(`<div>أعلى مبلغ: ${filters.maxAmount} د.م</div>`)
    }
    if (search.trim()) {
      filterElements.push(`<div>البحث: ${search.trim()}</div>`)
    }
    
    console.log('Print filter elements:', filterElements)
    
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const htmlContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="utf-8">
        <title>تقرير الإيرادات</title>
        <style>
          * { box-sizing: border-box; }
          body { 
            font-family: Arial, sans-serif; 
            margin: 20px; 
            color: #333;
            direction: rtl;
          }
          .header {
            text-align: center;
            border-bottom: 3px solid #3b82f6;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .header h1 {
            color: #1e40af;
            margin: 0;
            font-size: 28px;
          }
          .header .subtitle {
            color: #6b7280;
            margin: 5px 0;
          }
          .summary {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 30px;
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
          }
          .summary-item {
            text-align: center;
          }
          .summary-item .label {
            font-weight: bold;
            color: #374151;
            display: block;
            margin-bottom: 5px;
          }
          .summary-item .value {
            font-size: 18px;
            color: #059669;
            font-weight: bold;
          }
          .filters {
            background: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 6px;
            padding: 15px;
            margin-bottom: 20px;
          }
          .filters h3 {
            margin: 0 0 10px 0;
            color: #92400e;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
            font-size: 12px;
          }
          th, td {
            border: 1px solid #d1d5db;
            padding: 8px;
            text-align: center;
          }
          th {
            background: #3b82f6;
            color: white;
            font-weight: bold;
          }
          tr:nth-child(even) {
            background: #f9fafb;
          }
          .amount {
            font-weight: bold;
            color: #059669;
          }
          .status-approved { color: #059669; }
          .status-draft { color: #d97706; }
          .status-rejected { color: #dc2626; }
          @media print {
            body { margin: 10px; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>تقرير الإيرادات</h1>
          <div class="subtitle">نظام إدارة الجمعية</div>
          <div class="subtitle">تاريخ التقرير: ${currentDate}</div>
        </div>

        <div class="summary">
          <div class="summary-item">
            <span class="label">إجمالي السجلات</span>
            <span class="value">${incomes.length}</span>
          </div>
          <div class="summary-item">
            <span class="label">إجمالي المبلغ</span>
            <span class="value">${totalAmount.toFixed(2)} د.م</span>
          </div>
          <div class="summary-item">
            <span class="label">المعتمد</span>
            <span class="value">${incomes.filter(i => i.status === 'Approved').length}</span>
          </div>
          <div class="summary-item">
            <span class="label">المسودات</span>
            <span class="value">${incomes.filter(i => i.status === 'Draft').length}</span>
          </div>
        </div>

        ${filterElements.length > 0 ? `
        <div class="filters">
          <h3>الفلاتر المطبقة:</h3>
          ${filterElements.join('')}
        </div>` : ''}

        <table>
          <thead>
            <tr>
              <th>رقم</th>
              <th>التاريخ</th>
              <th>المتبرع/الكفيل</th>
              <th>الفئة</th>
              <th>المبلغ</th>
              <th>طريقة الدفع</th>
              <th>الحالة</th>
            </tr>
          </thead>
          <tbody>
            ${incomes.map((income, index) => {
              const donorKafil = income.donor 
                ? `${income.donor.first_name} ${income.donor.last_name}`
                : income.kafil 
                ? `${income.kafil.first_name} ${income.kafil.last_name}`
                : 'غير محدد'
              
              const paymentMethodArabic = {
                'Cash': 'نقدي',
                'Cheque': 'شيك',
                'BankWire': 'حوالة بنكية'
              }[income.payment_method] || income.payment_method

              const statusArabic = {
                'Draft': 'مسودة',
                'Approved': 'معتمد', 
                'Rejected': 'مرفوض'
              }[income.status] || income.status

              const statusClass = income.status === 'Approved' ? 'status-approved' : 
                                income.status === 'Draft' ? 'status-draft' : 'status-rejected'

              return `
                <tr>
                  <td>${index + 1}</td>
                  <td>${format(new Date(income.income_date), 'yyyy-MM-dd')}</td>
                  <td>${donorKafil}</td>
                  <td>${income.income_category.label}</td>
                  <td class="amount">${parseFloat(income.amount).toFixed(2)}</td>
                  <td>${paymentMethodArabic}</td>
                  <td class="${statusClass}">${statusArabic}</td>
                </tr>
              `
            }).join('')}
          </tbody>
        </table>

        <div style="margin-top: 30px; text-align: center; color: #6b7280; font-size: 12px;">
          تم إنشاء هذا التقرير في ${currentDate} - نظام إدارة الجمعية
        </div>

        <script>
          window.onload = function() {
            window.print();
            window.onafterprint = function() {
              window.close();
            }
          }
        </script>
      </body>
      </html>
    `

    printWindow.document.write(htmlContent)
    printWindow.document.close()
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
              <DropdownMenuItem onClick={() => {
                console.log('Export clicked - Applied filters:', appliedFilters)
                console.log('Export clicked - Search term:', searchTerm)
                handleExportCSV()
              }}>
                <Download className="h-4 w-4 ml-2" />
                تصدير CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                console.log('Print clicked - Applied filters:', appliedFilters)
                console.log('Print clicked - Search term:', searchTerm)
                handlePrintReport()
              }}>
                <FileText className="h-4 w-4 ml-2" />
                تقرير للطباعة
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
          <IncomesTable searchTerm={searchTerm} filters={appliedFilters} />
        </CardContent>
      </Card>

      <NewIncomeDialog open={showNewDialog} onOpenChange={setShowNewDialog} />
    </div>
  )
}
