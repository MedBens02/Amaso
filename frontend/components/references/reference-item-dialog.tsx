"use client"

import React, { useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

interface ReferenceItemDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  type: 'illness' | 'skill' | 'aid-type' | 'income-category' | 'expense-category' | 'partner' | 'education-level' | 'partner-field' | 'partner-subfield'
  item?: any
  onSuccess: () => void
  extraProps?: any
}

const getTitle = (type: string) => {
  const titles = {
    'illness': 'المرض',
    'skill': 'المهارة',
    'aid-type': 'نوع المساعدة',
    'income-category': 'فئة الدخل',
    'expense-category': 'فئة المصروف',
    'partner': 'الشريك',
    'education-level': 'المرحلة التعليمية',
    'partner-field': 'مجال الشريك',
    'partner-subfield': 'تخصص الشريك'
  }
  return titles[type as keyof typeof titles] || 'العنصر'
}

const getSchema = (type: string) => {
  if (type === 'illness') {
    return z.object({
      label: z.string().min(1, "تسمية المرض مطلوبة"),
      is_chronic: z.boolean().default(false),
    })
  }

  if (type === 'education-level') {
    return z.object({
      name_ar: z.string().min(1, "الاسم العربي مطلوب"),
      name_en: z.string().optional(),
      sort_order: z.number().min(0).default(0),
      is_active: z.boolean().default(true),
    })
  }

  if (type === 'skill' || type === 'aid-type') {
    return z.object({
      label: z.string().min(1, "التسمية مطلوبة"),
    })
  }

  if (type === 'partner-field') {
    return z.object({
      label: z.string().min(1, "اسم المجال مطلوب"),
    })
  }

  if (type === 'partner-subfield') {
    return z.object({
      field_id: z.number().min(1, "يجب اختيار المجال"),
      label: z.string().min(1, "اسم التخصص مطلوب"),
    })
  }

  if (type === 'partner') {
    return z.object({
      name: z.string().min(1, "اسم الشريك مطلوب"),
      phone: z.string().optional(),
      email: z.string().email("يجب إدخال بريد إلكتروني صحيح").optional().or(z.literal("")),
      address: z.string().optional(),
      field_id: z.number().optional(),
      subfield_id: z.number().optional(),
    })
  }

  if (type === 'income-category' || type === 'expense-category') {
    return z.object({
      name: z.string().min(1, "الاسم مطلوب"),
    })
  }

  // Default schema
  return z.object({
    name: z.string().min(1, "الاسم مطلوب"),
  })
}

export function ReferenceItemDialog({ open, onOpenChange, type, item, onSuccess, extraProps }: ReferenceItemDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  const title = getTitle(type)
  const isEdit = !!item

  const form = useForm({
    resolver: zodResolver(getSchema(type)),
    defaultValues: {
      name: item?.name || "",
      name_ar: item?.name_ar || "",
      name_en: item?.name_en || "",
      label: item?.label || "",
      phone: item?.phone || "",
      email: item?.email || "",
      address: item?.address || "",
      field_id: item?.field_id || 0,
      subfield_id: item?.subfield_id || 0,
      sort_order: item?.sort_order || 0,
      is_active: item?.is_active ?? true,
      is_chronic: item?.is_chronic ?? false,
    },
  })

  // Reset form when item changes
  React.useEffect(() => {
    if (item) {
      form.reset({
        name: item.name || "",
        name_ar: item.name_ar || "",
        name_en: item.name_en || "",
        label: item.label || "",
        phone: item.phone || "",
        email: item.email || "",
        address: item.address || "",
        field_id: item.field_id || 0,
        subfield_id: item.subfield_id || 0,
        sort_order: item.sort_order || 0,
        is_active: item.is_active ?? true,
        is_chronic: item.is_chronic ?? false,
      })
    } else {
      form.reset({
        name: "",
        name_ar: "",
        name_en: "",
        label: "",
        phone: "",
        email: "",
        address: "",
        field_id: 0,
        subfield_id: 0,
        sort_order: 0,
        is_active: true,
        is_chronic: false,
      })
    }
  }, [item, form])

  const onSubmit = async (data: any) => {
    console.log('=== FORM SUBMISSION STARTED ===')
    console.log('Form data received:', data)
    console.log('Type:', type)
    console.log('Is edit:', isEdit)
    console.log('Form validation state:', form.formState)
    console.log('Form errors:', form.formState.errors)
    
    setIsSubmitting(true)
    try {
      console.log('Submitting reference item:', { type, data, isEdit })
      
      const apiUrls = {
        'illness': 'references/illnesses',
        'skill': 'references/skills',
        'aid-type': 'references/aid-types',
        'income-category': 'references/widow-income-categories',
        'expense-category': 'references/widow-expense-categories',
        'partner': 'references/partners',
        'education-level': 'references/education-levels',
        'partner-field': 'references/partner-fields',
        'partner-subfield': 'references/partner-subfields'
      }
      
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1'
      const url = `${baseUrl}/${apiUrls[type]}`
      
      console.log('API URL:', url)
      console.log('Request data:', JSON.stringify(data, null, 2))
      
      let response
      
      if (isEdit && item) {
        // Update existing item
        response = await fetch(`${url}/${item.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify(data),
        })
      } else {
        // Create new item
        response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify(data),
        })
      }
      
      console.log('Response status:', response.status)
      console.log('Response ok:', response.ok)
      
      if (!response.ok) {
        const errorData = await response.json()
        console.log('Error response:', errorData)
        throw new Error(errorData.message || `HTTP ${response.status}`)
      }
      
      const result = await response.json()
      console.log('Success response:', result)
      
      toast({
        title: isEdit ? "تم التحديث بنجاح" : "تم الإضافة بنجاح",
        description: result.message || `تم ${isEdit ? 'تحديث' : 'إضافة'} ${title} بنجاح`,
      })
      
      onSuccess()
      onOpenChange(false)
      form.reset()
    } catch (error) {
      console.error('Error saving reference item:', error)
      toast({
        title: "خطأ",
        description: error instanceof Error ? error.message : `حدث خطأ في ${isEdit ? 'تحديث' : 'إضافة'} ${title}`,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'تعديل' : 'إضافة'} {title}</DialogTitle>
          <DialogDescription>
            {isEdit ? `تعديل بيانات ${title}` : `إضافة ${title} جديد للنظام`}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {type === 'education-level' ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="name_ar">الاسم العربي *</Label>
                <Input
                  id="name_ar"
                  {...form.register('name_ar')}
                  placeholder="مثال: الصف الأول الابتدائي"
                />
                {form.formState.errors.name_ar && (
                  <p className="text-sm text-red-600">{form.formState.errors.name_ar.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="name_en">الاسم الإنجليزي</Label>
                <Input
                  id="name_en"
                  {...form.register('name_en')}
                  placeholder="مثال: First Grade"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sort_order">ترتيب العرض (0 = آخر العناصر)</Label>
                <Input
                  id="sort_order"
                  type="number"
                  {...form.register('sort_order', { valueAsNumber: true })}
                  placeholder="0"
                  disabled
                  className="bg-gray-100"
                />
                <p className="text-sm text-gray-600">
                  سيتم تعيين الترتيب 0 افتراضياً، استخدم زر "إعادة ترتيب" لتنظيم العناصر
                </p>
              </div>
            </>
          ) : type === 'illness' ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="label">تسمية المرض *</Label>
                <Input
                  id="label"
                  {...form.register('label')}
                  placeholder="مثال: السكري"
                />
                {form.formState.errors.label && (
                  <p className="text-sm text-red-600">{form.formState.errors.label.message}</p>
                )}
              </div>

              <div className="flex items-center space-x-2 space-x-reverse">
                <Controller
                  control={form.control}
                  name="is_chronic"
                  render={({ field }) => (
                    <Switch
                      id="is_chronic"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
                <Label htmlFor="is_chronic">مرض مزمن</Label>
              </div>
            </>
          ) : type === 'partner-field' ? (
            <div className="space-y-2">
              <Label htmlFor="label">اسم المجال *</Label>
              <Input
                id="label"
                {...form.register('label')}
                placeholder="مثال: الصحة، التعليم، النقل"
              />
              {form.formState.errors.label && (
                <p className="text-sm text-red-600">{form.formState.errors.label.message}</p>
              )}
            </div>
          ) : type === 'partner-subfield' ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="field_id">المجال *</Label>
                <Controller
                  control={form.control}
                  name="field_id"
                  render={({ field }) => (
                    <Select value={field.value?.toString()} onValueChange={(value) => field.onChange(parseInt(value))}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر المجال" />
                      </SelectTrigger>
                      <SelectContent>
                        {extraProps?.fields?.map((fieldOption: any) => (
                          <SelectItem key={fieldOption.id} value={fieldOption.id.toString()}>
                            {fieldOption.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {form.formState.errors.field_id && (
                  <p className="text-sm text-red-600">{form.formState.errors.field_id.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="label">اسم التخصص *</Label>
                <Input
                  id="label"
                  {...form.register('label')}
                  placeholder="مثال: صيدليات، مستشفيات، عيادات"
                />
                {form.formState.errors.label && (
                  <p className="text-sm text-red-600">{form.formState.errors.label.message}</p>
                )}
              </div>
            </>
          ) : type === 'partner' ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="name">اسم الشريك *</Label>
                <Input
                  id="name"
                  {...form.register('name')}
                  placeholder="مثال: صيدلية النهضة، مستشفى الأمل"
                />
                {form.formState.errors.name && (
                  <p className="text-sm text-red-600">{form.formState.errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">رقم الهاتف</Label>
                <Input
                  id="phone"
                  {...form.register('phone')}
                  placeholder="مثال: +970-123-456789"
                  type="tel"
                />
                {form.formState.errors.phone && (
                  <p className="text-sm text-red-600">{form.formState.errors.phone.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">البريد الإلكتروني</Label>
                <Input
                  id="email"
                  {...form.register('email')}
                  placeholder="مثال: info@partner.com"
                  type="email"
                />
                {form.formState.errors.email && (
                  <p className="text-sm text-red-600">{form.formState.errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">العنوان</Label>
                <Input
                  id="address"
                  {...form.register('address')}
                  placeholder="مثال: شارع الجامعة، غزة، فلسطين"
                />
                {form.formState.errors.address && (
                  <p className="text-sm text-red-600">{form.formState.errors.address.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="field_id">المجال (اختياري)</Label>
                <Controller
                  control={form.control}
                  name="field_id"
                  render={({ field }) => (
                    <Select 
                      value={field.value?.toString() || ""} 
                      onValueChange={(value) => {
                        const fieldId = value ? parseInt(value) : 0
                        field.onChange(fieldId)
                        // Reset subfield when field changes
                        form.setValue('subfield_id', 0)
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="اختر المجال (اختياري)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">بدون مجال</SelectItem>
                        {extraProps?.fields?.map((fieldOption: any) => (
                          <SelectItem key={fieldOption.id} value={fieldOption.id.toString()}>
                            {fieldOption.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subfield_id">التخصص (اختياري)</Label>
                <Controller
                  control={form.control}
                  name="subfield_id"
                  render={({ field }) => {
                    const selectedFieldId = form.watch('field_id')
                    const availableSubfields = extraProps?.subfields?.filter(
                      (subfield: any) => subfield.field_id === selectedFieldId
                    ) || []

                    return (
                      <Select 
                        value={field.value?.toString() || ""} 
                        onValueChange={(value) => field.onChange(value ? parseInt(value) : 0)}
                        disabled={!selectedFieldId || selectedFieldId === 0}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={
                            !selectedFieldId || selectedFieldId === 0 
                              ? "اختر المجال أولاً" 
                              : "اختر التخصص (اختياري)"
                          } />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">بدون تخصص</SelectItem>
                          {availableSubfields.map((subfield: any) => (
                            <SelectItem key={subfield.id} value={subfield.id.toString()}>
                              {subfield.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )
                  }}
                />
                {(!form.watch('field_id') || form.watch('field_id') === 0) && (
                  <p className="text-sm text-gray-500">
                    اختر المجال أولاً لتتمكن من اختيار التخصص
                  </p>
                )}
              </div>
            </>
          ) : (
            <div className="space-y-2">
              <Label htmlFor={type === 'skill' || type === 'aid-type' || type === 'illness' ? 'label' : 'name'}>
                {type === 'skill' ? 'اسم المهارة' :
                 type === 'aid-type' ? 'نوع المساعدة' :
                 type === 'illness' ? 'المرض' :
                 type === 'income-category' ? 'اسم فئة الدخل' :
                 type === 'expense-category' ? 'اسم فئة المصروف' :
                 'الاسم'} *
              </Label>
              <Input
                id={type === 'skill' || type === 'aid-type' || type === 'illness' ? 'label' : 'name'}
                {...form.register(type === 'skill' || type === 'aid-type' || type === 'illness' ? 'label' : 'name')}
                placeholder={type === 'income-category' ? 'مثال: راتب، مساعدات خارجية' : type === 'expense-category' ? 'مثال: رواتب، مصاريف إدارية' : 'ادخل الاسم'}
              />
              {form.formState.errors.name && (
                <p className="text-sm text-red-600">{form.formState.errors.name.message}</p>
              )}
              {form.formState.errors.label && (
                <p className="text-sm text-red-600">{form.formState.errors.label.message}</p>
              )}
            </div>
          )}

          {(type === 'education-level' || type === 'aid-type') && (
            <div className="flex items-center space-x-2 space-x-reverse">
              <Controller
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <Switch
                    id="is_active"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
              <Label htmlFor="is_active">نشط</Label>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              إلغاء
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'جاري الحفظ...' : isEdit ? 'تحديث' : 'إضافة'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}