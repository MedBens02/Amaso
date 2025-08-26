"use client"

import { useState } from "react"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"

interface OrphanFiltersProps {
  onFiltersChange: (filters: any) => void
  initialFilters?: any
}

export function OrphanFilters({ onFiltersChange, initialFilters = {} }: OrphanFiltersProps) {
  const [filters, setFilters] = useState({
    gender: initialFilters.gender || "all",
    education_level: initialFilters.education_level || "all",
    min_age: initialFilters.min_age || "",
    max_age: initialFilters.max_age || "",
  })

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    
    // Convert age range selections to min/max age values
    const processedFilters = { ...newFilters }
    
    // Remove empty values and convert "all" to undefined
    Object.keys(processedFilters).forEach(key => {
      if (processedFilters[key] === "all" || processedFilters[key] === "") {
        delete processedFilters[key]
      }
    })
    
    onFiltersChange(processedFilters)
  }

  const handleAgeRangeChange = (value: string) => {
    let newFilters = { ...filters }
    
    switch (value) {
      case "child":
        newFilters.min_age = "6"
        newFilters.max_age = "12"
        break
      case "teen":
        newFilters.min_age = "13" 
        newFilters.max_age = "18"
        break
      case "all":
      default:
        newFilters.min_age = ""
        newFilters.max_age = ""
        break
    }
    
    setFilters(newFilters)
    
    // Process and send filters
    const processedFilters = { ...newFilters }
    Object.keys(processedFilters).forEach(key => {
      if (processedFilters[key] === "all" || processedFilters[key] === "") {
        delete processedFilters[key]
      } else if (key === 'min_age' || key === 'max_age') {
        processedFilters[key] = parseInt(processedFilters[key])
      }
    })
    
    onFiltersChange(processedFilters)
  }

  const clearAllFilters = () => {
    const clearedFilters = {
      gender: "all",
      education_level: "all",
      min_age: "",
      max_age: "",
    }
    setFilters(clearedFilters)
    onFiltersChange({})
  }

  // Get current age range value for display
  const getCurrentAgeRange = () => {
    if (filters.min_age === "6" && filters.max_age === "12") return "child"
    if (filters.min_age === "13" && filters.max_age === "18") return "teen"
    return "all"
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">فلاتر البحث</h3>
        <Button variant="outline" size="sm" onClick={clearAllFilters}>
          مسح جميع الفلاتر
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="gender">الجنس</Label>
          <Select value={filters.gender} onValueChange={(value) => handleFilterChange('gender', value)}>
            <SelectTrigger>
              <SelectValue placeholder="اختر الجنس" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">الكل</SelectItem>
              <SelectItem value="male">ذكر</SelectItem>
              <SelectItem value="female">أنثى</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="education_level">المستوى التعليمي</Label>
          <Select value={filters.education_level} onValueChange={(value) => handleFilterChange('education_level', value)}>
            <SelectTrigger>
              <SelectValue placeholder="اختر المستوى التعليمي" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع المستويات</SelectItem>
              <SelectItem value="ابتدائي">ابتدائي</SelectItem>
              <SelectItem value="إعدادي">إعدادي</SelectItem>
              <SelectItem value="ثانوي">ثانوي</SelectItem>
              <SelectItem value="جامعي">جامعي</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="age-range">الفئة العمرية</Label>
          <Select value={getCurrentAgeRange()} onValueChange={handleAgeRangeChange}>
            <SelectTrigger>
              <SelectValue placeholder="اختر الفئة العمرية" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الأعمار</SelectItem>
              <SelectItem value="child">أطفال (6-12 سنة)</SelectItem>
              <SelectItem value="teen">مراهقون (13-18 سنة)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}