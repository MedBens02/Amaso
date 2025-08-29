"use client"

import React, { useState, useEffect } from "react"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

interface SubBudget {
  id: number
  label: string
}

interface AccountingReferenceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  type: 'sub-budget' | 'income-category' | 'expense-category'
  item?: any
  onSuccess: () => void
}

const getTitle = (type: string) => {
  const titles = {
    'sub-budget': 'الميزانية الفرعية',
    'income-category': 'فئة الإيراد',
    'expense-category': 'فئة المصروف'
  }
  return titles[type as keyof typeof titles] || 'العنصر'
}

const getSchema = (type: string) => {
  if (type === 'sub-budget') {
    return z.object({
      label: z.string().min(1, "اسم الميزانية الفرعية مطلوب"),
    })
  }

  if (type === 'income-category' || type === 'expense-category') {
    return z.object({
      label: z.string().min(1, "اسم الفئة مطلوب"),
      sub_budget_id: z.number().min(1, "يجب اختيار الميزانية الفرعية"),
    })
  }

  // Default schema
  return z.object({
    label: z.string().min(1, "الاسم مطلوب"),
  })
}

export function AccountingReferenceDialog({ open, onOpenChange, type, item, onSuccess }: AccountingReferenceDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [subBudgets, setSubBudgets] = useState<SubBudget[]>([])
  const { toast } = useToast()
  const title = getTitle(type)
  const isEdit = !!item

  const form = useForm({
    resolver: zodResolver(getSchema(type)),
    defaultValues: {
      label: item?.label || "",
      sub_budget_id: item?.sub_budget_id || 0,
    },
  })

  // Load sub-budgets for categories
  useEffect(() => {
    if (type === 'income-category' || type === 'expense-category') {
      loadSubBudgets()
    }
  }, [type])

  const loadSubBudgets = async () => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1'
      const response = await fetch(`${baseUrl}/sub-budgets`)
      
      if (response.ok) {
        const result = await response.json()
        setSubBudgets(result.data || [])
      }
    } catch (error) {
      console.error('Error loading sub-budgets:', error)
    }
  }

  // Reset form when item changes
  React.useEffect(() => {
    if (item) {
      form.reset({
        label: item.label || "",
        sub_budget_id: item.sub_budget_id || 0,
      })
    } else {
      form.reset({
        label: "",
        sub_budget_id: 0,
      })
    }
  }, [item, form])

  const onSubmit = async (data: any) => {
    setIsSubmitting(true)
    try {
      const apiUrls = {
        'sub-budget': 'references/sub-budgets',
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
              {type === 'sub-budget' ? 'اسم الميزانية الفرعية' : 'اسم الفئة'} *
            </Label>
            <Input
              id="label"
              {...form.register('label')}
              placeholder={
                type === 'sub-budget' 
                  ? "مثال: الرعاية الصحية، التعليم والتدريب"
                  : "مثال: تبرعات للرعاية الصحية، أدوية ومستلزمات طبية"
              }
            />
            {form.formState.errors.label && (
              <p className="text-sm text-red-600">{form.formState.errors.label.message}</p>
            )}
          </div>

          {(type === 'income-category' || type === 'expense-category') && (
            <div className="space-y-2">
              <Label htmlFor="sub_budget_id">الميزانية الفرعية *</Label>
              <Controller
                control={form.control}
                name="sub_budget_id"
                render={({ field }) => (
                  <Select value={field.value?.toString()} onValueChange={(value) => field.onChange(parseInt(value))}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الميزانية الفرعية" />
                    </SelectTrigger>
                    <SelectContent>
                      {subBudgets.map((subBudget) => (
                        <SelectItem key={subBudget.id} value={subBudget.id.toString()}>
                          {subBudget.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {form.formState.errors.sub_budget_id && (
                <p className="text-sm text-red-600">{form.formState.errors.sub_budget_id.message}</p>
              )}
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