"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { Calendar, Calculator } from "lucide-react"

const fiscalYearSchema = z.object({
  year: z.string().min(4, "السنة يجب أن تكون 4 أرقام").max(4, "السنة يجب أن تكون 4 أرقام"),
  carryOverAmount: z.number().min(0, "المبلغ المرحل لا يمكن أن يكون سالباً"),
})

type FiscalYearFormData = z.infer<typeof fiscalYearSchema>

interface StartNewFiscalYearDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function StartNewFiscalYearDialog({ open, onOpenChange }: StartNewFiscalYearDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  // Calculate suggested next year and carry-over
  const currentYear = new Date().getFullYear()
  const suggestedYear = (currentYear + 1).toString()
  const calculatedCarryOver = 215000 // This would come from API: sum of remaining from previous year

  const form = useForm<FiscalYearFormData>({
    resolver: zodResolver(fiscalYearSchema),
    defaultValues: {
      year: suggestedYear,
      carryOverAmount: calculatedCarryOver,
    },
  })

  const onSubmit = async (data: FiscalYearFormData) => {
    setIsSubmitting(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      console.log("Starting new fiscal year:", data)

      toast({
        title: "تم إنشاء السنة المالية",
        description: `تم بدء السنة المالية ${data.year} بنجاح`,
      })

      form.reset()
      onOpenChange(false)
    } catch (error) {
      toast({
        title: "خطأ في الإنشاء",
        description: "حدث خطأ أثناء إنشاء السنة المالية",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            بدء سنة مالية جديدة
          </DialogTitle>
          <DialogDescription>إنشاء سنة مالية جديدة مع حساب المبلغ المرحل من السنة السابقة</DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="year">السنة المالية *</Label>
            <Input id="year" {...form.register("year")} placeholder="2025" />
            {form.formState.errors.year && <p className="text-sm text-red-600">{form.formState.errors.year.message}</p>}
            <p className="text-xs text-gray-500">السنة المقترحة تلقائياً: {suggestedYear}</p>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              المبلغ المرحل من السنة السابقة
            </Label>
            <Input
              type="number"
              {...form.register("carryOverAmount", { valueAsNumber: true })}
              placeholder="0"
              readOnly
              className="bg-gray-50"
            />
            <p className="text-xs text-gray-500">هذا المبلغ محسوب تلقائياً من مجموع المتبقي من السنة المالية السابقة</p>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">ملخص السنة المالية الجديدة:</h4>
            <div className="space-y-1 text-sm text-blue-800">
              <div className="flex justify-between">
                <span>السنة:</span>
                <span>{form.watch("year") || suggestedYear}</span>
              </div>
              <div className="flex justify-between">
                <span>المبلغ المرحل:</span>
                <span>₪ {(form.watch("carryOverAmount") || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>تاريخ البداية:</span>
                <span>01/01/{form.watch("year") || suggestedYear}</span>
              </div>
              <div className="flex justify-between">
                <span>تاريخ النهاية:</span>
                <span>31/12/{form.watch("year") || suggestedYear}</span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              إلغاء
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "جاري الإنشاء..." : "بدء السنة المالية"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
