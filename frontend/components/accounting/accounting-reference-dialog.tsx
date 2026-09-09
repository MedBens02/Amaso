"use client"

import React, { useState, useEffect } from "react"
import { useForm, Controller, type Resolver } from "react-hook-form"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

interface Category {
  id: number
  label: string
  parent_id?: number | null
  parent?: { id: number; label: string } | null
}

interface AccountingReferenceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  type: 'budget' | 'income-category' | 'expense-category'
  item?: any
  onSuccess: () => void
}

const getTitle = (type: string) => {
  const titles = {
    'budget': 'الميزانية',
    'income-category': 'فئة الإيراد',
    'expense-category': 'فئة المصروف'
  }
  return titles[type as keyof typeof titles] || 'العنصر'
}

interface ReferenceFormValues {
  label: string
  parent_id?: number | null
}

const getSchema = (type: string) => {
  if (type === 'budget') {
    return z.object({
      label: z.string().min(1, "اسم الميزانية مطلوب"),
    })
  }

  if (type === 'income-category' || type === 'expense-category') {
    // Categories classify, budgets hold the money - a category has no budget,
    // only an optional parent category it nests under.
    return z.object({
      label: z.string().min(1, "اسم الفئة مطلوب"),
      parent_id: z.number().nullable().optional(),
    })
  }

  // Default schema
  return z.object({
    label: z.string().min(1, "الاسم مطلوب"),
  })
}

export function AccountingReferenceDialog({ open, onOpenChange, type, item, onSuccess }: AccountingReferenceDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [parentOptions, setParentOptions] = useState<Category[]>([])
  const { toast } = useToast()
  const title = getTitle(type)
  const isEdit = !!item

  const form = useForm<ReferenceFormValues>({
    resolver: zodResolver(getSchema(type)) as Resolver<ReferenceFormValues>,
    defaultValues: {
      label: item?.label || "",
      parent_id: item?.parent_id ?? null,
    },
  })

  // Load the sibling categories that could serve as a parent
  useEffect(() => {
    if (type === 'income-category' || type === 'expense-category') {
      loadParentOptions()
    }
  }, [type])

  const loadParentOptions = async () => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1'
      const endpoint = type === 'income-category' ? 'income-categories' : 'expense-categories'
      const response = await fetch(`${baseUrl}/${endpoint}`, { headers: { Accept: 'application/json' } })

      if (response.ok) {
        const result = await response.json()
        setParentOptions(result.data || [])
      }
    } catch (error) {
      console.error('Error loading parent categories:', error)
    }
  }

  // Reset form when item changes
  React.useEffect(() => {
    if (item) {
      form.reset({
        label: item.label || "",
        parent_id: item.parent_id ?? null,
      })
    } else {
      form.reset({
        label: "",
        parent_id: null,
      })
    }
  }, [item, form])

  const onSubmit = async (data: any) => {
    console.log('=== ACCOUNTING DIALOG FORM SUBMISSION ===')
    console.log('Type:', type)
    console.log('Form data:', data)
    console.log('Form errors:', form.formState.errors)
    
    setIsSubmitting(true)
    try {
      const apiUrls = {
        'budget': 'references/budgets',
        'income-category': 'references/income-categories',
        'expense-category': 'references/expense-categories'
      }
      
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1'
      const url = `${baseUrl}/${apiUrls[type]}`
      
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
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `HTTP ${response.status}`)
      }
      
      const result = await response.json()
      
      toast({
        title: isEdit ? "تم التحديث بنجاح" : "تم الإضافة بنجاح",
        description: result.message || `تم ${isEdit ? 'تحديث' : 'إضافة'} ${title} بنجاح`,
      })
      
      onSuccess()
      onOpenChange(false)
      form.reset()
    } catch (error) {
      console.error('Error saving accounting reference item:', error)
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
          <div className="space-y-2">
            <Label htmlFor="label">
              {type === 'budget' ? 'اسم الميزانية' : 'اسم الفئة'} *
            </Label>
            <Input
              id="label"
              {...form.register('label')}
              placeholder={
                type === 'budget' 
                  ? "مثال: صندوق العمليات الجراحية، قافلة طبية 2026"
                  : "مثال: تبرعات للرعاية الصحية، أدوية ومستلزمات طبية"
              }
            />
            {form.formState.errors.label && (
              <p className="text-sm text-red-600">{form.formState.errors.label.message}</p>
            )}
          </div>

          {(type === 'income-category' || type === 'expense-category') && (
            <div className="space-y-2">
              <Label htmlFor="parent_id">الفئة الأم</Label>
              <Controller
                control={form.control}
                name="parent_id"
                render={({ field }) => (
                  <Select
                    value={field.value ? field.value.toString() : "none"}
                    onValueChange={(value) => field.onChange(value === "none" ? null : parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="بدون فئة أم (فئة رئيسية)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">بدون فئة أم (فئة رئيسية)</SelectItem>
                      {parentOptions
                        // A category cannot be its own parent, and one level of
                        // nesting is what the pickers render.
                        .filter((option) => option.id !== item?.id && !(option.parent_id ?? option.parent?.id))
                        .map((option) => (
                          <SelectItem key={option.id} value={option.id.toString()}>
                            {option.label}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <p className="text-xs text-gray-500">
                اختياري — يُستخدم لتجميع الفئات المتقاربة فقط، ولا علاقة له بالميزانية.
              </p>
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