"use client"

import { useState, useEffect } from "react"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Switch } from "@/components/ui/switch"
import { Filter, X } from "lucide-react"
import { toDateInputValue, fromDateInputValue } from "@/lib/date-utils"

/**
 * Filter option types supported by the component
 */
export type FilterOptionType =
  | 'date-range'
  | 'select'
  | 'number-range'
  | 'toggle'
  | 'search'
  | 'multi-select'

/**
 * Configuration for a single filter field
 */
export interface FilterOption {
  type: FilterOptionType
  label: string
  field: string
  placeholder?: string
  options?: Array<{ label: string; value: string }>
  optionsLoader?: () => Promise<Array<{ label: string; value: string }>>
  // For date-range
  fromField?: string
  toField?: string
  // For number-range
  minField?: string
  maxField?: string
}

/**
 * Props for ReportFilters component
 */
export interface ReportFiltersProps {
  filterOptions: FilterOption[]
  values: Record<string, any>
  onValuesChange: (values: Record<string, any>) => void
  onApply: () => void
  onClear: () => void
  showApplyButton?: boolean
  accordionDefaultOpen?: boolean
}

/**
 * Reusable Report Filters Component
 * Provides a flexible, accordion-based filter UI that adapts to different entity types
 */
export function ReportFilters({
  filterOptions,
  values,
  onValuesChange,
  onApply,
  onClear,
  showApplyButton = true,
  accordionDefaultOpen = true
}: ReportFiltersProps) {
  const [loadedOptions, setLoadedOptions] = useState<Record<string, Array<{ label: string; value: string }>>>({})
  const [loading, setLoading] = useState<Record<string, boolean>>({})

  // Load dynamic options
  useEffect(() => {
    const loadOptions = async () => {
      for (const option of filterOptions) {
        if (option.optionsLoader && !loadedOptions[option.field]) {
          setLoading(prev => ({ ...prev, [option.field]: true }))
          try {
            const options = await option.optionsLoader()
            setLoadedOptions(prev => ({ ...prev, [option.field]: options }))
          } catch (error) {
            console.error(`Failed to load options for ${option.field}:`, error)
          } finally {
            setLoading(prev => ({ ...prev, [option.field]: false }))
          }
        }
      }
    }

    loadOptions()
  }, [filterOptions])

  const handleValueChange = (field: string, value: any) => {
    onValuesChange({
      ...values,
      [field]: value
    })
  }

  const hasActiveFilters = Object.values(values).some(
    value => value !== undefined && value !== null && value !== '' && value !== 'all'
  )

  const renderFilter = (option: FilterOption) => {
    switch (option.type) {
      case 'date-range':
        const fromField = option.fromField || 'fromDate'
        const toField = option.toField || 'toDate'

        return (
          <div key={option.field} className="space-y-2">
            <Label className="text-sm font-medium">{option.label}</Label>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">من تاريخ</Label>
                <Input
                  type="date"
                  value={toDateInputValue(values[fromField])}
                  onChange={(e) => handleValueChange(fromField, fromDateInputValue(e.target.value))}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">إلى تاريخ</Label>
                <Input
                  type="date"
                  value={toDateInputValue(values[toField])}
                  onChange={(e) => handleValueChange(toField, fromDateInputValue(e.target.value))}
                />
              </div>
            </div>
          </div>
        )

      case 'select':
        const selectOptions = option.options || loadedOptions[option.field] || []
        const isLoading = loading[option.field]

        return (
          <div key={option.field} className="space-y-2">
            <Label className="text-sm font-medium">{option.label}</Label>
            <Select
              value={values[option.field] || 'all'}
              onValueChange={(value) => handleValueChange(option.field, value === 'all' ? undefined : value)}
              disabled={isLoading}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={isLoading ? "جاري التحميل..." : (option.placeholder || "اختر")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">الكل</SelectItem>
                {selectOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )

      case 'number-range':
        const minField = option.minField || 'minAmount'
        const maxField = option.maxField || 'maxAmount'

        return (
          <div key={option.field} className="space-y-2">
            <Label className="text-sm font-medium">{option.label}</Label>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">الحد الأدنى</Label>
                <Input
                  type="number"
                  value={values[minField] || ''}
                  onChange={(e) => handleValueChange(minField, e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">الحد الأقصى</Label>
                <Input
                  type="number"
                  value={values[maxField] || ''}
                  onChange={(e) => handleValueChange(maxField, e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>
          </div>
        )

      case 'search':
        return (
          <div key={option.field} className="space-y-2">
            <Label className="text-sm font-medium">{option.label}</Label>
            <Input
              type="text"
              value={values[option.field] || ''}
              onChange={(e) => handleValueChange(option.field, e.target.value)}
              placeholder={option.placeholder || "ابحث..."}
            />
          </div>
        )

      case 'toggle':
        return (
          <div key={option.field} className="flex items-center justify-between space-x-2 space-x-reverse">
            <Label className="text-sm font-medium">{option.label}</Label>
            <Switch
              checked={values[option.field] || false}
              onCheckedChange={(checked) => handleValueChange(option.field, checked)}
            />
          </div>
        )

      default:
        return null
    }
  }

  return (
    <Accordion
      type="single"
      collapsible
      className="w-full"
      defaultValue={accordionDefaultOpen ? "filters" : undefined}
    >
      <AccordionItem value="filters">
        <AccordionTrigger className="hover:no-underline">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <span>خيارات التصفية</span>
            {hasActiveFilters && (
              <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                نشط
              </span>
            )}
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-4 pt-4">
            {/* Render all filter fields */}
            {filterOptions.map(renderFilter)}

            {/* Action buttons */}
            {showApplyButton && (
              <div className="flex gap-2 pt-4 border-t">
                <Button onClick={onApply} className="flex-1">
                  تطبيق التصفية
                </Button>
                <Button
                  variant="outline"
                  onClick={onClear}
                  disabled={!hasActiveFilters}
                >
                  <X className="ml-2 h-4 w-4" />
                  مسح الكل
                </Button>
              </div>
            )}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}

/**
 * Hook to manage filter state
 * Provides a convenient way to manage filters with apply/clear functionality
 */
export function useReportFilters(initialFilters: Record<string, any> = {}) {
  const [filters, setFilters] = useState(initialFilters)
  const [appliedFilters, setAppliedFilters] = useState(initialFilters)

  const handleApply = () => {
    setAppliedFilters(filters)
  }

  const handleClear = () => {
    setFilters({})
    setAppliedFilters({})
  }

  const handleFiltersChange = (newFilters: Record<string, any>) => {
    setFilters(newFilters)
  }

  return {
    filters,
    appliedFilters,
    setFilters,
    setAppliedFilters,
    handleApply,
    handleClear,
    handleFiltersChange
  }
}
