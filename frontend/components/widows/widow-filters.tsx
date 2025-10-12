"use client"

import { useState, useEffect } from "react"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import api from "@/lib/api"

interface ReferenceData {
  skills: Array<{ id: number; label: string }>
  illnesses: Array<{ id: number; label: string }>
  aid_types: Array<{ id: number; label: string }>
  partners: Array<{ id: number; name: string }>
}

interface WidowFiltersProps {
  onFiltersChange: (filters: any) => void
  initialFilters?: any
}

export function WidowFilters({ onFiltersChange, initialFilters = {} }: WidowFiltersProps) {
  const [referenceData, setReferenceData] = useState<ReferenceData>({
    skills: [],
    illnesses: [],
    aid_types: [],
    partners: [],
  })

  const [filters, setFilters] = useState({
    has_disability: initialFilters.has_disability || "all",
    education_level: initialFilters.education_level || "all",
    illness_id: initialFilters.illness_id || "all",
    aid_type_id: initialFilters.aid_type_id || "all",
    skill_id: initialFilters.skill_id || "all",
    has_kafil: initialFilters.has_kafil || "all",
    has_chronic_illness: initialFilters.has_chronic_illness || "all",
    has_active_maouna: initialFilters.has_active_maouna || "all",
    maouna_partner_id: initialFilters.maouna_partner_id || "all",
  })

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchReferenceData = async () => {
      try {
        setLoading(true)
        const response = await api.getWidowsReferenceData()
        setReferenceData(response.data)
      } catch (error) {
        console.error('Failed to fetch reference data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchReferenceData()
  }, [])

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const clearAllFilters = () => {
    const clearedFilters = {
      has_disability: "all",
      education_level: "all",
      illness_id: "all",
      aid_type_id: "all",
      skill_id: "all",
      has_kafil: "all",
      has_chronic_illness: "all",
      has_active_maouna: "all",
      maouna_partner_id: "all",
    }
    setFilters(clearedFilters)
    onFiltersChange(clearedFilters)
  }

  if (loading) {
    return <div className="text-center py-4">جاري تحميل الفلاتر...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">فلاتر البحث</h3>
        <Button variant="outline" size="sm" onClick={clearAllFilters}>
          مسح جميع الفلاتر
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {/* Disability Filter */}
        <div className="space-y-2">
          <Label>حالة الإعاقة</Label>
          <Select value={filters.has_disability} onValueChange={(value) => handleFilterChange('has_disability', value)}>
            <SelectTrigger>
              <SelectValue placeholder="اختر حالة الإعاقة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الحالات</SelectItem>
              <SelectItem value="true">لديه إعاقة</SelectItem>
              <SelectItem value="false">بدون إعاقة</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Education Level Filter */}
        <div className="space-y-2">
          <Label>المستوى التعليمي</Label>
          <Select value={filters.education_level} onValueChange={(value) => handleFilterChange('education_level', value)}>
            <SelectTrigger>
              <SelectValue placeholder="اختر المستوى التعليمي" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع المستويات</SelectItem>
              <SelectItem value="ابتدائي">ابتدائي</SelectItem>
              <SelectItem value="إعدادي">إعدادي</SelectItem>
              <SelectItem value="ثانوي">ثانوي</SelectItem>
              <SelectItem value="جامعية">جامعية</SelectItem>
              <SelectItem value="دراسات عليا">دراسات عليا</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Kafil Status Filter */}
        <div className="space-y-2">
          <Label>حالة الكفيل</Label>
          <Select value={filters.has_kafil} onValueChange={(value) => handleFilterChange('has_kafil', value)}>
            <SelectTrigger>
              <SelectValue placeholder="اختر حالة الكفيل" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الحالات</SelectItem>
              <SelectItem value="true">لديه كفيل</SelectItem>
              <SelectItem value="false">بدون كفيل</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Chronic Illness Filter */}
        <div className="space-y-2">
          <Label>الأمراض المزمنة</Label>
          <Select value={filters.has_chronic_illness} onValueChange={(value) => handleFilterChange('has_chronic_illness', value)}>
            <SelectTrigger>
              <SelectValue placeholder="اختر حالة الأمراض المزمنة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الحالات</SelectItem>
              <SelectItem value="true">يوجد أمراض مزمنة</SelectItem>
              <SelectItem value="false">لا توجد أمراض مزمنة</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Active Maouna Filter */}
        <div className="space-y-2">
          <Label>المؤونة النشطة</Label>
          <Select value={filters.has_active_maouna} onValueChange={(value) => handleFilterChange('has_active_maouna', value)}>
            <SelectTrigger>
              <SelectValue placeholder="اختر حالة المؤونة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الحالات</SelectItem>
              <SelectItem value="true">معونة نشطة</SelectItem>
              <SelectItem value="false">بدون معونة نشطة</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Maouna Partner Filter */}
        <div className="space-y-2">
          <Label>شريك المؤونة</Label>
          <Select value={filters.maouna_partner_id} onValueChange={(value) => handleFilterChange('maouna_partner_id', value)}>
            <SelectTrigger>
              <SelectValue placeholder="اختر شريك المؤونة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الشركاء</SelectItem>
              {referenceData.partners.map((partner) => (
                <SelectItem key={partner.id} value={partner.id.toString()}>
                  {partner.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Illness Filter */}
        <div className="space-y-2">
          <Label>نوع المرض</Label>
          <Select value={filters.illness_id} onValueChange={(value) => handleFilterChange('illness_id', value)}>
            <SelectTrigger>
              <SelectValue placeholder="اختر نوع المرض" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الأمراض</SelectItem>
              {referenceData.illnesses.map((illness) => (
                <SelectItem key={illness.id} value={illness.id.toString()}>
                  {illness.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Aid Type Filter */}
        <div className="space-y-2">
          <Label>نوع المساعدة</Label>
          <Select value={filters.aid_type_id} onValueChange={(value) => handleFilterChange('aid_type_id', value)}>
            <SelectTrigger>
              <SelectValue placeholder="اختر نوع المساعدة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع أنواع المساعدة</SelectItem>
              {referenceData.aid_types.map((aid) => (
                <SelectItem key={aid.id} value={aid.id.toString()}>
                  {aid.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Skill Filter */}
        <div className="space-y-2">
          <Label>المهارة</Label>
          <Select value={filters.skill_id} onValueChange={(value) => handleFilterChange('skill_id', value)}>
            <SelectTrigger>
              <SelectValue placeholder="اختر المهارة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع المهارات</SelectItem>
              {referenceData.skills.map((skill) => (
                <SelectItem key={skill.id} value={skill.id.toString()}>
                  {skill.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}