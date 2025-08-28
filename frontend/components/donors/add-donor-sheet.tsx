"use client"

import { useState, useEffect } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { useToast } from "@/hooks/use-toast"
import { User, Phone, Mail, MapPin, HandCoins } from "lucide-react"
import api from "@/lib/api"

const donorSchema = z.object({
  firstName: z.string().min(1, "الاسم الأول مطلوب"),
  lastName: z.string().min(1, "اسم العائلة مطلوب"),
  phone: z.string().min(1, "رقم الهاتف مطلوب"),
  email: z.string().email("بريد إلكتروني غير صحيح").optional().or(z.literal("")),
  address: z.string().optional(),
  isKafil: z.boolean().default(false),
  monthlyPledge: z.number().positive("التعهد الشهري يجب أن يكون موجباً").optional(),
})

type DonorFormData = z.infer<typeof donorSchema>

interface AddDonorSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
  convertDonorData?: any
}

export function AddDonorSheet({ open, onOpenChange, onSuccess, convertDonorData }: AddDonorSheetProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const form = useForm<DonorFormData>({
    resolver: zodResolver(donorSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phone: "",
      email: "",
      address: "",
      isKafil: false,
    },
  })

  const isKafil = form.watch("isKafil")

  useEffect(() => {
    if (open) {
      // If converting a donor to kafil, pre-fill the form
      if (convertDonorData) {
        form.reset({
          firstName: convertDonorData.first_name || "",
          lastName: convertDonorData.last_name || "",
          phone: convertDonorData.phone || "",
          email: convertDonorData.email || "",
          address: convertDonorData.address || "",
          isKafil: true, // Set to kafil since we're converting
        })
      }
    }
  }, [open, convertDonorData, form])


  const onSubmit = async (data: DonorFormData) => {
    setIsSubmitting(true)
    try {
      if (convertDonorData) {
        // Converting existing donor to kafil
        await api.updateDonor(convertDonorData.id, {
          first_name: data.firstName,
          last_name: data.lastName,
          phone: data.phone,
          email: data.email || undefined,
          address: data.address || undefined,
          is_kafil: data.isKafil,
          monthly_pledge: data.monthlyPledge,
        })
      } else {
        // Create new donor
        await api.createDonor({
          first_name: data.firstName,
          last_name: data.lastName,
          phone: data.phone,
          email: data.email || undefined,
          address: data.address || undefined,
          is_kafil: data.isKafil,
          monthly_pledge: data.monthlyPledge,
        })
      }

      toast({
        title: "تم الحفظ بنجاح",
        description: convertDonorData 
          ? "تم تحويل المتبرع إلى كفيل بنجاح" 
          : "تم إضافة المتبرع الجديد بنجاح",
      })

      form.reset()
      onOpenChange(false)
      onSuccess?.()
    } catch (error: any) {
      toast({
        title: "خطأ في الحفظ",
        description: error.message || "حدث خطأ أثناء حفظ البيانات",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[540px] max-h-[100vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {convertDonorData ? "تحويل متبرع إلى كفيل" : "إضافة متبرع جديد"}
          </SheetTitle>
          <SheetDescription>
            {convertDonorData 
              ? "حدد التعهد الشهري لتحويل هذا المتبرع إلى كفيل"
              : "أدخل معلومات المتبرع أو الكفيل الجديد"
            }
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                الاسم الأول *
              </Label>
              <Input id="firstName" {...form.register("firstName")} placeholder="أدخل الاسم الأول" />
              {form.formState.errors.firstName && (
                <p className="text-sm text-red-600">{form.formState.errors.firstName.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">اسم العائلة *</Label>
              <Input id="lastName" {...form.register("lastName")} placeholder="أدخل اسم العائلة" />
              {form.formState.errors.lastName && (
                <p className="text-sm text-red-600">{form.formState.errors.lastName.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              رقم الهاتف *
            </Label>
            <Input id="phone" {...form.register("phone")} placeholder="أدخل رقم الهاتف" />
            {form.formState.errors.phone && (
              <p className="text-sm text-red-600">{form.formState.errors.phone.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              البريد الإلكتروني
            </Label>
            <Input id="email" type="email" {...form.register("email")} placeholder="أدخل البريد الإلكتروني" />
            {form.formState.errors.email && (
              <p className="text-sm text-red-600">{form.formState.errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="address" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              العنوان
            </Label>
            <Textarea id="address" {...form.register("address")} placeholder="أدخل العنوان" rows={3} />
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-2 space-x-reverse">
              <Controller
                name="isKafil"
                control={form.control}
                render={({ field }) => <Checkbox id="isKafil" checked={field.value} onCheckedChange={field.onChange} />}
              />
              <Label htmlFor="isKafil" className="flex items-center gap-2">
                <HandCoins className="h-4 w-4" />
                كفيل (يقدم كفالة شهرية)
              </Label>
            </div>

            {isKafil && (
              <div className="space-y-2 mr-6">
                <Label htmlFor="monthlyPledge">التعهد الشهري (DH) *</Label>
                <Input
                  id="monthlyPledge"
                  type="number"
                  step="0.01"
                  min="0"
                  {...form.register("monthlyPledge", { valueAsNumber: true })}
                  placeholder="أدخل مبلغ التعهد الشهري"
                />
                {form.formState.errors.monthlyPledge && (
                  <p className="text-sm text-red-600">{form.formState.errors.monthlyPledge.message}</p>
                )}
              </div>
            )}
          </div>

          <SheetFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              إلغاء
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "جاري الحفظ..." : "حفظ البيانات"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}