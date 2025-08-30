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

export interface FilterValues {
  fromDate?: Date
  toDate?: Date
  subBudgetId?: string
  paymentMethod?: string
  status?: string
  minAmount?: string
  maxAmount?: string
  fiscalYearId?: string
}

interface IncomeFiltersProps {
  filters: FilterValues
  onFiltersChange: (filters: FilterValues) => void
  onApply: () => void
  onClear: () => void
}

export function IncomeFilters({ filters, onFiltersChange, onApply, onClear }: IncomeFiltersProps) {
  const [subBudgets, setSubBudgets] = useState<any[]>([])
  const [fiscalYears, setFiscalYears] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadFilterData()
  }, [])

  const loadFilterData = async () => {
    setLoading(true)
    try {
      const [subBudgetsRes, fiscalYearsRes] = await Promise.all([
        api.getSubBudgets(),
        api.getFiscalYears()
      ])
      setSubBudgets(subBudgetsRes.data || [])
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
          <Popover modal={true}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn("w-full justify-start text-left font-normal", !filters.fromDate && "text-muted-foreground")}
                type="button"
              >
                <CalendarIcon className="ml-2 h-4 w-4" />
                {filters.fromDate ? format(filters.fromDate, "dd/MM/yyyy", { locale: ar }) : "اختر التاريخ"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar 
                mode="single" 
                selected={filters.fromDate} 
                onSelect={(date) => updateFilter('fromDate', date)}
                initialFocus 
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label>إلى تاريخ</Label>
          <Popover modal={true}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn("w-full justify-start text-left font-normal", !filters.toDate && "text-muted-foreground")}
                type="button"
              >
                <CalendarIcon className="ml-2 h-4 w-4" />
                {filters.toDate ? format(filters.toDate, "dd/MM/yyyy", { locale: ar }) : "اختر التاريخ"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar 
                mode="single" 
                selected={filters.toDate} 
                onSelect={(date) => updateFilter('toDate', date)}
                initialFocus 
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Categories and Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>السنة المالية</Label>
          <Select 
            value={filters.fiscalYearId || "all"} 
            onValueChange={(value) => updateFilter('fiscalYearId', value === "all" ? undefined : value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="اختر السنة المالية" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع السنوات</SelectItem>
              {fiscalYears.map((year) => (
                <SelectItem key={year.id} value={year.id.toString()}>
                  {year.year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>الميزانية الفرعية</Label>
          <Select 
            value={filters.subBudgetId || "all"} 
            onValueChange={(value) => updateFilter('subBudgetId', value === "all" ? undefined : value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="اختر الميزانية" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الميزانيات</SelectItem>
              {subBudgets.map((budget) => (
                <SelectItem key={budget.id} value={budget.id.toString()}>
                  {budget.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>حالة الاعتماد</Label>
          <Select 
            value={filters.status || "all"} 
            onValueChange={(value) => updateFilter('status', value === "all" ? undefined : value)}
          >
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
      </div>

      {/* Payment Method */}
      <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
        <div className="space-y-2">
          <Label>طريقة الدفع</Label>
          <Select 
            value={filters.paymentMethod || "all"} 
            onValueChange={(value) => updateFilter('paymentMethod', value === "all" ? undefined : value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="اختر طريقة الدفع" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الطرق</SelectItem>
              <SelectItem value="Cash">نقدي</SelectItem>
              <SelectItem value="Cheque">شيك</SelectItem>
              <SelectItem value="BankWire">حوالة بنكية</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Amount Range */}
      <div className="space-y-2">
        <Label>نطاق المبلغ (د.م)</Label>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">أقل مبلغ</Label>
            <Input
              type="number"
              placeholder="0"
              value={filters.minAmount || ""}
              onChange={(e) => updateFilter('minAmount', e.target.value || undefined)}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">أعلى مبلغ</Label>
            <Input
              type="number"
              placeholder="لا حد أقصى"
              value={filters.maxAmount || ""}
              onChange={(e) => updateFilter('maxAmount', e.target.value || undefined)}
            />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t">
        <Button onClick={onApply} className="flex-1">
          <RefreshCw className="h-4 w-4 ml-2" />
          تطبيق الفلاتر
        </Button>
        {hasActiveFilters && (
          <Button variant="outline" onClick={onClear} className="flex-1">
            <X className="h-4 w-4 ml-2" />
            مسح جميع الفلاتر
          </Button>
        )}
      </div>

      {hasActiveFilters && (
        <div className="text-sm text-muted-foreground">
          يتم تطبيق {Object.values(filters).filter(v => v !== undefined && v !== null && v !== '').length} فلتر(ات)
        </div>
      )}
    </div>
  )
}
