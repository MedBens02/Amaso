"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { User, Phone, Mail, MapPin, IdCard, Calendar, GraduationCap } from "lucide-react"
import api from "@/lib/api"

interface Widow {
  id: number
  first_name: string
  last_name: string
  full_name: string
  phone: string
  email: string
  address?: string
  neighborhood?: string
  admission_date: string
  national_id: string
  birth_date: string
  age: number
  marital_status: string
  education_level?: string
  disability_flag: boolean
  disability_type?: string
  created_at: string
  updated_at: string
}

interface EditWidowDialogProps {
  widow: Widow | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function EditWidowDialog({ widow, open, onOpenChange, onSuccess }: EditWidowDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    email: "",
    address: "",
    neighborhood: "",
    admission_date: "",
    national_id: "",
    birth_date: "",
    marital_status: "",
    education_level: "",
    disability_flag: false,
    disability_type: "",
  })
  const { toast } = useToast()

  useEffect(() => {
    if (widow && open) {
      setFormData({
        first_name: widow.first_name || "",
        last_name: widow.last_name || "",
        phone: widow.phone || "",
        email: widow.email || "",
        address: widow.address || "",
        neighborhood: widow.neighborhood || "",
        admission_date: widow.admission_date || "",
        national_id: widow.national_id || "",
        birth_date: widow.birth_date || "",
        marital_status: widow.marital_status || "",
        education_level: widow.education_level || "",
        disability_flag: widow.disability_flag || false,
        disability_type: widow.disability_type || "",
      })
    }
  }, [widow, open])


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!widow) return

    setIsSubmitting(true)
    try {
      const updateData = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone || undefined,
        email: formData.email || undefined,
        address: formData.address || undefined,
        neighborhood: formData.neighborhood || undefined,
        admission_date: formData.admission_date,
        national_id: formData.national_id,
        birth_date: formData.birth_date,
        marital_status: formData.marital_status as 'Widowed' | 'Divorced' | 'Single',
        education_level: formData.education_level || undefined,
        disability_flag: formData.disability_flag,
        disability_type: formData.disability_flag ? formData.disability_type : undefined,
      }

      await api.updateWidow(widow.id, updateData)

      toast({
        title: "تم التحديث بنجاح",
        description: "تم تحديث بيانات الأرملة بنجاح",
      })

      onSuccess()
    } catch (error: any) {
      toast({
        title: "خطأ في التحديث",
        description: error.message || "حدث خطأ أثناء تحديث البيانات",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  if (!widow) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            تعديل بيانات الأرملة
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">المعلومات الأساسية</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  الاسم الأول *
                </Label>
                <Input
                  id="firstName"
                  value={formData.first_name}
                  onChange={(e) => handleInputChange("first_name", e.target.value)}
                  placeholder="أدخل الاسم الأول"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="lastName">اسم العائلة *</Label>
                <Input
                  id="lastName"
                  value={formData.last_name}
                  onChange={(e) => handleInputChange("last_name", e.target.value)}
                  placeholder="أدخل اسم العائلة"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nationalId" className="flex items-center gap-2">
                  <IdCard className="h-4 w-4" />
                  رقم الهوية *
                </Label>
                <Input
                  id="nationalId"
                  value={formData.national_id}
                  onChange={(e) => handleInputChange("national_id", e.target.value)}
                  placeholder="أدخل رقم الهوية"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="birthDate" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  تاريخ الميلاد *
                </Label>
                <Input
                  id="birthDate"
                  type="date"
                  value={formData.birth_date}
                  onChange={(e) => handleInputChange("birth_date", e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  رقم الهاتف
                </Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  placeholder="أدخل رقم الهاتف"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  البريد الإلكتروني
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="أدخل البريد الإلكتروني"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                العنوان
              </Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                placeholder="أدخل العنوان"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="neighborhood">الحي</Label>
                <Input
                  id="neighborhood"
                  value={formData.neighborhood}
                  onChange={(e) => handleInputChange("neighborhood", e.target.value)}
                  placeholder="أدخل الحي"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maritalStatus">الحالة الاجتماعية *</Label>
                <Select value={formData.marital_status} onValueChange={(value) => handleInputChange("marital_status", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الحالة الاجتماعية" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Widowed">أرملة</SelectItem>
                    <SelectItem value="Divorced">مطلقة</SelectItem>
                    <SelectItem value="Single">عزباء</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Administrative Info */}
          <div className="border-t pt-4 space-y-4">
            <h3 className="text-lg font-medium">المعلومات الإدارية</h3>
            
            <div className="space-y-2">
              <Label htmlFor="admissionDate">تاريخ الانتساب *</Label>
              <Input
                id="admissionDate"
                type="date"
                value={formData.admission_date}
                onChange={(e) => handleInputChange("admission_date", e.target.value)}
                required
              />
            </div>
          </div>

          {/* Education and Health Info */}
          <div className="border-t pt-4 space-y-4">
            <h3 className="text-lg font-medium">التعليم والصحة</h3>
            
            <div className="space-y-2">
              <Label htmlFor="educationLevel" className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4" />
                المستوى التعليمي
              </Label>
              <Select value={formData.education_level} onValueChange={(value) => handleInputChange("education_level", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر المستوى التعليمي" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="غير محدد">غير محدد</SelectItem>
                  <SelectItem value="ابتدائية">ابتدائية</SelectItem>
                  <SelectItem value="إعدادية">إعدادية</SelectItem>
                  <SelectItem value="ثانوية عامة">ثانوية عامة</SelectItem>
                  <SelectItem value="دبلوم">دبلوم</SelectItem>
                  <SelectItem value="جامعية">جامعية</SelectItem>
                  <SelectItem value="ماجستير">ماجستير</SelectItem>
                  <SelectItem value="دكتوراه">دكتوراه</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2 space-x-reverse">
                <Checkbox 
                  id="disabilityFlag"
                  checked={formData.disability_flag}
                  onCheckedChange={(checked) => handleInputChange("disability_flag", checked as boolean)}
                />
                <Label htmlFor="disabilityFlag">لديها إعاقة</Label>
              </div>

              {formData.disability_flag && (
                <div className="space-y-2 mr-6">
                  <Label htmlFor="disabilityType">نوع الإعاقة</Label>
                  <Input
                    id="disabilityType"
                    value={formData.disability_type}
                    onChange={(e) => handleInputChange("disability_type", e.target.value)}
                    placeholder="أدخل نوع الإعاقة"
                  />
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              إلغاء
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "جاري الحفظ..." : "حفظ التغييرات"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}