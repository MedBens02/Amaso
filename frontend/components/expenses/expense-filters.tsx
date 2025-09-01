"use client"

import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon, X, RefreshCw } from "lucide-react"
import { format } from "date-fns"
import { ar } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"
import api from "@/lib/api"
import { formatDateArabic } from "@/lib/date-utils"

export interface FilterValues {
  fromDate?: Date
  toDate?: Date
  subBudgetId?: string
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

const DatePicker = ({
  value,
  onChange,
  placeholder,
}: {
  value?: Date
  onChange: (date: Date | undefined) => void
  placeholder: string
}) => {
  const [open, setOpen] = useState(false)
  const [currentMonth, setCurrentMonth] = useState<Date>(value || new Date())
  
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
  }
  
  const handleSelect = (date: Date | undefined) => {
    onChange(date)
    setOpen(false)
  }
  
  const handleMonthChange = (newMonth: Date) => {
    setCurrentMonth(newMonth)
  }
  
  const years = Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i)
  const months = [
    "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
    "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
  ]
  
  return (
    <Popover open={open} onOpenChange={handleOpenChange} modal={true}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn("w-full justify-start text-left font-normal", !value && "text-muted-foreground")}
          type="button"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setOpen(!open)
          }}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? formatDateArabic(value, "PPP") : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-auto p-0" 
        align="start" 
        sideOffset={4}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="p-3 border-b">
          <div className="flex gap-2 mb-3">
            <Select
              value={currentMonth.getFullYear().toString()}
              onValueChange={(year) => {
                const newDate = new Date(currentMonth)
                newDate.setFullYear(parseInt(year))
                setCurrentMonth(newDate)
              }}
            >
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select
              value={currentMonth.getMonth().toString()}
              onValueChange={(month) => {
                const newDate = new Date(currentMonth)
                newDate.setMonth(parseInt(month))
                setCurrentMonth(newDate)
              }}
            >
              <SelectTrigger className="flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {months.map((month, index) => (
                  <SelectItem key={index} value={index.toString()}>
                    {month}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <Calendar
          mode="single"
          selected={value}
          onSelect={handleSelect}
          disabled={(date) => date > new Date()}
          month={currentMonth}
          onMonthChange={handleMonthChange}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}

export function ExpenseFilters({ filters, onFiltersChange, onApply, onClear }: ExpenseFiltersProps) {
  const [subBudgets, setSubBudgets] = useState<any[]>([])
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
      const [subBudgetsRes, categoriesRes, partnersRes, fiscalYearsRes] = await Promise.all([
        api.getSubBudgets(),
        api.getExpenseCategories(),
        api.getPartners(),
        api.getFiscalYears()
      ])
      setSubBudgets(subBudgetsRes.data || [])
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
          <Label>من تاريخ</Label>
          <DatePicker
            value={filters.fromDate}
            onChange={(date) => updateFilter('fromDate', date)}
            placeholder="اختر تاريخ البداية"
          />
        </div>

        <div className="space-y-2">
          <Label>إلى تاريخ</Label>
          <DatePicker
            value={filters.toDate}
            onChange={(date) => updateFilter('toDate', date)}
            placeholder="اختر تاريخ النهاية"
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
          <Label>الميزانية الفرعية</Label>
          <Select value={filters.subBudgetId || "all"} onValueChange={(value) => updateFilter('subBudgetId', value === 'all' ? undefined : value)}>
            <SelectTrigger>
              <SelectValue placeholder="اختر الميزانية الفرعية" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الميزانيات الفرعية</SelectItem>
              {subBudgets.map(sb => (
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
            <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
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
