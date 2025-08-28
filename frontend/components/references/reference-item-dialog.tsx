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
import { useToast } from "@/hooks/use-toast"

interface ReferenceItemDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  type: 'illness' | 'skill' | 'aid-type' | 'income-category' | 'expense-category' | 'partner' | 'education-level'
  item?: any
  onSuccess: () => void
}

const getTitle = (type: string) => {
  const titles = {
    'illness': 'المرض',
    'skill': 'المهارة',
    'aid-type': 'نوع المساعدة',
    'income-category': 'فئة الدخل',
    'expense-category': 'فئة المصروف',
    'partner': 'الشريك',
    'education-level': 'المرحلة التعليمية'
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

  if (type === 'partner' || type === 'income-category' || type === 'expense-category') {
    return z.object({
      name: z.string().min(1, "الاسم مطلوب"),
    })
  }

  // Default schema
  return z.object({
    name: z.string().min(1, "الاسم مطلوب"),
  })
}

export function ReferenceItemDialog({ open, onOpenChange, type, item, onSuccess }: ReferenceItemDialogProps) {
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
        'income-category': 'references/income-categories',
        'expense-category': 'references/expense-categories',
        'partner': 'references/partners',
        'education-level': 'references/education-levels'
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
          ) : (
            <div className="space-y-2">
              <Label htmlFor={type === 'skill' || type === 'aid-type' || type === 'illness' ? 'label' : 'name'}>
                {type === 'skill' ? 'اسم المهارة' :
                 type === 'aid-type' ? 'نوع المساعدة' :
                 type === 'illness' ? 'المرض' :
                 type === 'partner' ? 'اسم الشريك' :
                 'الاسم'} *
              </Label>
              <Input
                id={type === 'skill' || type === 'aid-type' || type === 'illness' ? 'label' : 'name'}
                {...form.register(type === 'skill' || type === 'aid-type' || type === 'illness' ? 'label' : 'name')}
                placeholder="ادخل الاسم"
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