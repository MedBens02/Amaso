"use client"

import { useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { useToast } from "@/hooks/use-toast"
import { CalendarIcon, FolderOpen } from "lucide-react"
import { format } from "date-fns"
import { ar } from "date-fns/locale"
import { cn } from "@/lib/utils"

const budgetedProjectSchema = z
  .object({
    name: z.string().min(1, "اسم المشروع مطلوب"),
    description: z.string().min(1, "وصف المشروع مطلوب"),
    category: z.string().min(1, "فئة المشروع مطلوبة"),
    donor: z.string().min(1, "المتبرع مطلوب"),
    totalBudget: z.number().positive("الميزانية الإجمالية يجب أن تكون موجبة"),
    startDate: z.date({ required_error: "تاريخ البداية مطلوب" }),
    endDate: z.date({ required_error: "تاريخ النهاية مطلوب" }),
    notes: z.string().optional(),
  })
  .refine((data) => data.endDate > data.startDate, {
    message: "تاريخ النهاية يجب أن يكون بعد تاريخ البداية",
    path: ["endDate"],
  })

type BudgetedProjectFormData = z.infer<typeof budgetedProjectSchema>

interface NewBudgetedProjectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialData?: Partial<BudgetedProjectFormData>
  onSuccess?: () => void
}

export function NewBudgetedProjectDialog({
  open,
  onOpenChange,
  initialData,
  onSuccess,
}: NewBudgetedProjectDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const form = useForm<BudgetedProjectFormData>({
    resolver: zodResolver(budgetedProjectSchema),
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description || "",
      category: initialData?.category || "",
      donor: initialData?.donor || "",
      totalBudget: initialData?.totalBudget || 0,
      startDate: initialData?.startDate || undefined,
      endDate: initialData?.endDate || undefined,
      notes: initialData?.notes || "",
    },
  })

  const onSubmit = async (data: BudgetedProjectFormData) => {
    setIsSubmitting(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))

      console.log("Submitting budgeted project data:", data)

      toast({
        title: "تم الحفظ بنجاح",
        description: `تم إضافة المشروع "${data.name}" بميزانية ₪ ${data.totalBudget.toLocaleString()}`,
      })

      form.reset()
      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      toast({
        title: "خطأ في الحفظ",
        description: "حدث خطأ أثناء حفظ البيانات",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            {initialData ? "تعديل المشروع الممول" : "إضافة مشروع ممول جديد"}
          </DialogTitle>
          <DialogDescription>أدخل تفاصيل المشروع والميزانية المخصصة له</DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>اسم المشروع *</Label>
              <Input {...form.register("name")} placeholder="أدخل اسم المشروع" />
              {form.formState.errors.name && (
                <p className="text-sm text-red-600">{form.formState.errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>فئة المشروع *</Label>
              <Controller
                name="category"
                control={form.control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الفئة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="كفالات">كفالات</SelectItem>
                      <SelectItem value="تعليم">تعليم</SelectItem>
                      <SelectItem value="صحة">صحة</SelectItem>
                      <SelectItem value="طوارئ">طوارئ</SelectItem>
                      <SelectItem value="بنية تحتية">بنية تحتية</SelectItem>
                      <SelectItem value="تنمية مجتمعية">تنمية مجتمعية</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {form.formState.errors.category && (
                <p className="text-sm text-red-600">{form.formState.errors.category.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>وصف المشروع *</Label>
            <Textarea {...form.register("description")} placeholder="أدخل وصف تفصيلي للمشروع" rows={3} />
            {form.formState.errors.description && (
              <p className="text-sm text-red-600">{form.formState.errors.description.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>المتبرع/الممول *</Label>
              <Input {...form.register("donor")} placeholder="اسم المتبرع أو الجهة الممولة" />
              {form.formState.errors.donor && (
                <p className="text-sm text-red-600">{form.formState.errors.donor.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>الميزانية الإجمالية (₪) *</Label>
              <Input
                type="number"
                {...form.register("totalBudget", { valueAsNumber: true })}
                placeholder="أدخل الميزانية الإجمالية"
              />
              {form.formState.errors.totalBudget && (
                <p className="text-sm text-red-600">{form.formState.errors.totalBudget.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>تاريخ البداية *</Label>
              <Controller
                name="startDate"
                control={form.control}
                render={({ field }) => (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !field.value && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value ? format(field.value, "PPP", { locale: ar }) : "اختر تاريخ البداية"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                    </PopoverContent>
                  </Popover>
                )}
              />
              {form.formState.errors.startDate && (
                <p className="text-sm text-red-600">{form.formState.errors.startDate.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>تاريخ النهاية *</Label>
              <Controller
                name="endDate"
                control={form.control}
                render={({ field }) => (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !field.value && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value ? format(field.value, "PPP", { locale: ar }) : "اختر تاريخ النهاية"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                    </PopoverContent>
                  </Popover>
                )}
              />
              {form.formState.errors.endDate && (
                <p className="text-sm text-red-600">{form.formState.errors.endDate.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>ملاحظات</Label>
            <Textarea {...form.register("notes")} placeholder="أي ملاحظات إضافية حول المشروع" rows={3} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              إلغاء
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "جاري الحفظ..." : initialData ? "تحديث المشروع" : "حفظ المشروع"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
