"use client"

import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { X, RefreshCw } from "lucide-react"
import { useState, useEffect } from "react"
import api from "@/lib/api"
import { toDateInputValue, fromDateInputValue } from "@/lib/date-utils"

export interface FilterValues {
  fromDate?: Date
  toDate?: Date
  budgetId?: string
  expenseCategoryId?: string
  partnerId?: string
  paymentMethod?: string
  status?: string
  minAmount?: string
  maxAmount?: string
  fiscalYearId?: string
}

interface ExpenseFiltersProps {
  filters: FilterValues
  onFiltersChange: (filters: FilterValues) => void
  onApply: () => void
  onClear: () => void
}

export function ExpenseFilters({ filters, onFiltersChange, onApply, onClear }: ExpenseFiltersProps) {
  const [budgets, setBudgets] = useState<any[]>([])
  const [expenseCategories, setExpenseCategories] = useState<any[]>([])
  const [partners, setPartners] = useState<any[]>([])
  const [fiscalYears, setFiscalYears] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadFilterData()
  }, [])

  const loadFilterData = async () => {
    setLoading(true)
    try {
      const [budgetsRes, categoriesRes, partnersRes, fiscalYearsRes] = await Promise.all([
        api.getBudgets(),
        api.getExpenseCategories(),
        api.getPartners(),
        api.getFiscalYears()
      ])
      setBudgets(budgetsRes.data || [])
      setExpenseCategories(categoriesRes.data || [])
      setPartners(partnersRes.data || [])
      setFiscalYears(fiscalYearsRes.data || [])
    } catch (error) {
      console.error('Error loading filter data:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateFilter = (key: keyof FilterValues, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    })
  }

  const hasActiveFilters = Object.values(filters).some(value => {
    if (value === undefined || value === null || value === '') return false
    return true
  })

  return (
    <div className="space-y-6">
      {/* Date Range */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="expense-from-date">من تاريخ</Label>
          <Input
            id="expense-from-date"
            type="date"
            value={toDateInputValue(filters.fromDate)}
            onChange={(e) => updateFilter('fromDate', fromDateInputValue(e.target.value))}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="expense-to-date">إلى تاريخ</Label>
          <Input
            id="expense-to-date"
            type="date"
            value={toDateInputValue(filters.toDate)}
            onChange={(e) => updateFilter('toDate', fromDateInputValue(e.target.value))}
          />
        </div>
      </div>

      {/* Dropdowns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="space-y-2">
          <Label>السنة المالية</Label>
          <Select value={filters.fiscalYearId || "all"} onValueChange={(value) => updateFilter('fiscalYearId', value === 'all' ? undefined : value)}>
            <SelectTrigger>
              <SelectValue placeholder="اختر السنة المالية" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع السنوات المالية</SelectItem>
              {fiscalYears.map(fy => (
                <SelectItem key={fy.id} value={fy.id.toString()}>{fy.year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>الميزانية</Label>
          <Select value={filters.budgetId || "all"} onValueChange={(value) => updateFilter('budgetId', value === 'all' ? undefined : value)}>
            <SelectTrigger>
              <SelectValue placeholder="اختر الميزانية" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الميزانيات</SelectItem>
              {budgets.map(sb => (
                <SelectItem key={sb.id} value={sb.id.toString()}>{sb.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>فئة المصروف</Label>
          <Select value={filters.expenseCategoryId || "all"} onValueChange={(value) => updateFilter('expenseCategoryId', value === 'all' ? undefined : value)}>
            <SelectTrigger>
              <SelectValue placeholder="اختر فئة المصروف" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع فئات المصروف</SelectItem>
              {expenseCategories.map(category => (
                <SelectItem key={category.id} value={category.id.toString()}>{category.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>الشريك</Label>
          <Select value={filters.partnerId || "all"} onValueChange={(value) => updateFilter('partnerId', value === 'all' ? undefined : value)}>
            <SelectTrigger>
              <SelectValue placeholder="اختر الشريك" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الشركاء</SelectItem>
              {partners.map(partner => (
                <SelectItem key={partner.id} value={partner.id.toString()}>{partner.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Additional Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>طريقة الدفع</Label>
          <Select value={filters.paymentMethod || "all"} onValueChange={(value) => updateFilter('paymentMethod', value === 'all' ? undefined : value)}>
            <SelectTrigger>
              <SelectValue placeholder="اختر طريقة الدفع" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع طرق الدفع</SelectItem>
              <SelectItem value="Cash">نقدي</SelectItem>
              <SelectItem value="Cheque">شيك</SelectItem>
              <SelectItem value="BankWire">حوالة بنكية</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>الحالة</Label>
          <Select value={filters.status || "all"} onValueChange={(value) => updateFilter('status', value === 'all' ? undefined : value)}>
            <SelectTrigger>
              <SelectValue placeholder="اختر الحالة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الحالات</SelectItem>
              <SelectItem value="Draft">مسودة</SelectItem>
              <SelectItem value="Approved">معتمد</SelectItem>
              <SelectItem value="Rejected">مرفوض</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>نطاق المبلغ</Label>
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="number"
              placeholder="الحد الأدنى"
              value={filters.minAmount || ''}
              onChange={(e) => updateFilter('minAmount', e.target.value || undefined)}
            />
            <Input
              type="number"
              placeholder="الحد الأعلى"
              value={filters.maxAmount || ''}
              onChange={(e) => updateFilter('maxAmount', e.target.value || undefined)}
            />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-center pt-4 border-t">
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 dark:bg-blue-950/40 px-3 py-1 rounded-full">
              <span>{Object.values(filters).filter(v => v !== undefined && v !== null && v !== '').length} فلتر نشط</span>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onClear} disabled={!hasActiveFilters}>
            <X className="h-4 w-4 ml-2" />
            مسح الكل
          </Button>
          <Button onClick={onApply}>
            <RefreshCw className="h-4 w-4 ml-2" />
            تطبيق الفلاتر
          </Button>
        </div>
      </div>
    </div>
  )
}
