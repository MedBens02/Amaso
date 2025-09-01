"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Search, Filter, Download, Wallet, ChevronDown, FileText } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ExpensesTable } from "@/components/expenses/expenses-table"
import { NewExpenseDialog } from "@/components/forms/NewExpenseForm"
import { ExpenseFilters, FilterValues } from "@/components/expenses/expense-filters"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"

export default function ExpensesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  const [showNewDialog, setShowNewDialog] = useState(false)
  const [filters, setFilters] = useState<FilterValues>({})
  const [appliedFilters, setAppliedFilters] = useState<FilterValues>({})
  const [isExporting, setIsExporting] = useState(false)
  const { toast } = useToast()
  const [subBudgets, setSubBudgets] = useState<any[]>([])
  const [expenseCategories, setExpenseCategories] = useState<any[]>([])
  const [partners, setPartners] = useState<any[]>([])
  const [fiscalYears, setFiscalYears] = useState<any[]>([])

  // Load reference data for filter labels
  useEffect(() => {
    const loadReferenceData = async () => {
      try {
        const [subBudgetsRes, categoriesRes, partnersRes, fiscalYearsRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1'}/references/sub-budgets`).then(r => r.json()),
          fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1'}/references/expense-categories`).then(r => r.json()),
          fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1'}/references/partners`).then(r => r.json()),
          fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1'}/fiscal-years`).then(r => r.json())
        ])
        setSubBudgets(subBudgetsRes.data || [])
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
      case 'subBudget':
        const subBudget = subBudgets.find(sb => sb.id.toString() === value)
        return subBudget ? subBudget.label : value
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

  const handleExportCSV = async () => {
    setIsExporting(true)
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1'
      const url = new URL(`${baseUrl}/expenses`)
      
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
      if (appliedFilters.expenseCategoryId) {
        params.append('expense_category_id', appliedFilters.expenseCategoryId)
      }
      if (appliedFilters.partnerId) {
        params.append('partner_id', appliedFilters.partnerId)
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
        throw new Error(`Failed to fetch data for export: ${response.status} ${response.statusText}`)
      }
      
      const responseText = await response.text()
      let result
      try {
        result = JSON.parse(responseText)
      } catch (jsonError) {
        console.error('Export JSON parsing error:', jsonError)
        console.error('Export response text:', responseText)
        throw new Error('Server returned invalid JSON response for export')
      }
      let allExpenses = result.data || []

      // Apply client-side search filter (same as in table)
      if (searchTerm.trim()) {
        const searchLower = searchTerm.toLowerCase()
        allExpenses = allExpenses.filter((expense: any) => (
          (expense.details && expense.details.toLowerCase().includes(searchLower)) ||
          (expense.remarks && expense.remarks.toLowerCase().includes(searchLower)) ||
          (expense.sub_budget && expense.sub_budget.label && expense.sub_budget.label.toLowerCase().includes(searchLower)) ||
          (expense.expense_category && expense.expense_category.label && expense.expense_category.label.toLowerCase().includes(searchLower)) ||
          (expense.partner && expense.partner.name && expense.partner.name.toLowerCase().includes(searchLower))
        ))
      }

      // Convert to CSV
      const csvContent = convertExpensesToCSV(allExpenses, appliedFilters, searchTerm, getFilterLabel)
      
      // Create and download file
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url_obj = URL.createObjectURL(blob)
      link.setAttribute('href', url_obj)
      
      const currentDate = format(new Date(), 'yyyy-MM-dd')
      link.setAttribute('download', `expenses_export_${currentDate}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: "تم التصدير بنجاح",
        description: `تم تصدير ${allExpenses.length} مصروف إلى ملف CSV`,
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
      'الميزانية الفرعية',
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
          'subBudgetId': 'الميزانية الفرعية',
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
        escapeCSVField(expense.sub_budget?.label || ''),
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

  const handlePrintReport = async () => {
    setIsExporting(true)
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1'
      const url = new URL(`${baseUrl}/expenses`)
      
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
      if (appliedFilters.expenseCategoryId) {
        params.append('expense_category_id', appliedFilters.expenseCategoryId)
      }
      if (appliedFilters.partnerId) {
        params.append('partner_id', appliedFilters.partnerId)
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
        const errorText = await response.text()
        console.error('Print report fetch error:', response.status, errorText)
        throw new Error(`Failed to fetch data for print: ${response.status}`)
      }
      
      const responseText = await response.text()
      let result
      try {
        result = JSON.parse(responseText)
      } catch (parseError) {
        console.error('JSON parse error:', parseError)
        console.error('Response text:', responseText.substring(0, 500))
        throw new Error('Server returned invalid JSON response')
      }
      let allExpenses = result.data || []

      // Apply client-side search filter
      if (searchTerm.trim()) {
        const searchLower = searchTerm.toLowerCase()
        allExpenses = allExpenses.filter((expense: any) => (
          expense.details?.toLowerCase().includes(searchLower) ||
          expense.remarks?.toLowerCase().includes(searchLower) ||
          expense.partner?.name?.toLowerCase().includes(searchLower) ||
          expense.sub_budget?.label?.toLowerCase().includes(searchLower) ||
          expense.expense_category?.label?.toLowerCase().includes(searchLower)
        ))
      }

      // Create HTML report and print
      generatePrintableReport(allExpenses, appliedFilters, searchTerm, { subBudgets, expenseCategories, partners, fiscalYears })
      
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

  const generatePrintableReport = (expenses: any[], filters: FilterValues, search: string, referenceData: { subBudgets: any[], expenseCategories: any[], partners: any[], fiscalYears: any[] }) => {
    const currentDate = format(new Date(), 'yyyy-MM-dd HH:mm')
    const totalAmount = expenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0)
    
    // Build filter lines for print report
    const filterElements = []
    if (filters.fromDate) {
      filterElements.push(`<div>من تاريخ: ${format(filters.fromDate, 'yyyy-MM-dd')}</div>`)
    }
    if (filters.toDate) {
      filterElements.push(`<div>إلى تاريخ: ${format(filters.toDate, 'yyyy-MM-dd')}</div>`)
    }
    if (filters.fiscalYearId) {
      const fiscalYear = referenceData.fiscalYears.find(fy => fy.id.toString() === filters.fiscalYearId)
      filterElements.push(`<div>السنة المالية: ${fiscalYear ? fiscalYear.year : filters.fiscalYearId}</div>`)
    }
    if (filters.subBudgetId) {
      const subBudget = referenceData.subBudgets.find(sb => sb.id.toString() === filters.subBudgetId)
      filterElements.push(`<div>الميزانية الفرعية: ${subBudget ? subBudget.label : filters.subBudgetId}</div>`)
    }
    if (filters.expenseCategoryId) {
      const expenseCategory = referenceData.expenseCategories.find(ec => ec.id.toString() === filters.expenseCategoryId)
      filterElements.push(`<div>فئة المصروف: ${expenseCategory ? expenseCategory.label : filters.expenseCategoryId}</div>`)
    }
    if (filters.partnerId) {
      const partner = referenceData.partners.find(p => p.id.toString() === filters.partnerId)
      filterElements.push(`<div>الشريك: ${partner ? partner.name : filters.partnerId}</div>`)
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
    
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const htmlContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="utf-8">
        <title>تقرير المصروفات</title>
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
            border-bottom: 3px solid #dc2626;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .header h1 {
            color: #b91c1c;
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
            color: #dc2626;
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
            font-size: 11px;
          }
          th, td {
            border: 1px solid #d1d5db;
            padding: 6px;
            text-align: center;
          }
          th {
            background: #dc2626;
            color: white;
            font-weight: bold;
          }
          tr:nth-child(even) {
            background: #f9fafb;
          }
          .amount {
            font-weight: bold;
            color: #dc2626;
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
          <h1>تقرير المصروفات</h1>
          <div class="subtitle">نظام إدارة الجمعية</div>
          <div class="subtitle">تاريخ التقرير: ${currentDate}</div>
        </div>

        <div class="summary">
          <div class="summary-item">
            <span class="label">إجمالي السجلات</span>
            <span class="value">${expenses.length}</span>
          </div>
          <div class="summary-item">
            <span class="label">إجمالي المبلغ</span>
            <span class="value">${totalAmount.toFixed(2)} د.م</span>
          </div>
          <div class="summary-item">
            <span class="label">المعتمد</span>
            <span class="value">${expenses.filter(e => e.status === 'Approved').length}</span>
          </div>
          <div class="summary-item">
            <span class="label">المسودات</span>
            <span class="value">${expenses.filter(e => e.status === 'Draft').length}</span>
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
              <th>الشريك</th>
              <th>التفاصيل</th>
              <th>الفئة</th>
              <th>المبلغ</th>
              <th>طريقة الدفع</th>
              <th>المستفيدين</th>
              <th>الحالة</th>
            </tr>
          </thead>
          <tbody>
            ${expenses.map((expense, index) => {
              const paymentMethodArabic = {
                'Cash': 'نقدي',
                'Cheque': 'شيك',
                'BankWire': 'حوالة بنكية'
              }[expense.payment_method] || expense.payment_method

              const statusArabic = {
                'Draft': 'مسودة',
                'Approved': 'معتمد', 
                'Rejected': 'مرفوض'
              }[expense.status] || expense.status

              const statusClass = expense.status === 'Approved' ? 'status-approved' : 
                                expense.status === 'Draft' ? 'status-draft' : 'status-rejected'

              const beneficiariesCount = expense.beneficiaries ? expense.beneficiaries.length : 0

              return `
                <tr>
                  <td>${index + 1}</td>
                  <td>${format(new Date(expense.expense_date), 'yyyy-MM-dd')}</td>
                  <td>${expense.partner?.name || 'لا يوجد'}</td>
                  <td>${expense.details || ''}</td>
                  <td>${expense.expense_category?.label || ''}</td>
                  <td class="amount">${parseFloat(expense.amount).toFixed(2)}</td>
                  <td>${paymentMethodArabic}</td>
                  <td>${beneficiariesCount}</td>
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
              <DropdownMenuItem onClick={handleExportCSV} disabled={isExporting}>
                <Download className="h-4 w-4 ml-2" />
                تصدير CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handlePrintReport} disabled={isExporting}>
                <FileText className="h-4 w-4 ml-2" />
                تقرير للطباعة
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
