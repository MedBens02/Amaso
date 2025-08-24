"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { useToast } from "@/hooks/use-toast"
import { User, Phone, Mail, MapPin, HandCoins, UserMinus } from "lucide-react"
import api from "@/lib/api"

const kafilSchema = z.object({
  firstName: z.string().min(1, "الاسم الأول مطلوب"),
  lastName: z.string().min(1, "اسم العائلة مطلوب"),
  phone: z.string().optional(),
  email: z.string().email("بريد إلكتروني غير صحيح").optional().or(z.literal("")),
  address: z.string().optional(),
  monthlyPledge: z.number().positive("التعهد الشهري يجب أن يكون موجباً"),
})

type KafilFormData = z.infer<typeof kafilSchema>

interface EditKafilSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
  kafilId?: number
}

interface Kafil {
  id: number
  first_name: string
  last_name: string
  phone?: string
  email?: string
  address?: string
  donor_id: number
  monthly_pledge: number
}

export function EditKafilSheet({ open, onOpenChange, onSuccess, kafilId }: EditKafilSheetProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  const form = useForm<KafilFormData>({
    resolver: zodResolver(kafilSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phone: "",
      email: "",
      address: "",
      monthlyPledge: 0,
    },
  })


  useEffect(() => {
    if (open && kafilId) {
      fetchData()
    }
  }, [open, kafilId])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const kafilResponse = await api.getKafil(kafilId!)
      const kafil: Kafil = kafilResponse.data
      
      // Populate form
      form.reset({
        firstName: kafil.first_name,
        lastName: kafil.last_name,
        phone: kafil.phone || "",
        email: kafil.email || "",
        address: kafil.address || "",
        monthlyPledge: kafil.monthly_pledge,
      })
    } catch (error: any) {
      toast({
        title: "خطأ في تحميل البيانات",
        description: error.message || "فشل في تحميل بيانات الكفيل",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }


  const handleRemoveKafilStatus = async () => {
    if (!kafilId) return
    
    setIsSubmitting(true)
    try {
      // Remove kafil status (this will update the donor's is_kafil to false)
      await api.removeKafilStatus(kafilId)
      
      toast({
        title: "تم الحفظ بنجاح",
        description: "تم إلغاء حالة الكفيل وتحويله إلى متبرع عادي",
      })

      onOpenChange(false)
      onSuccess?.()
    } catch (error: any) {
      toast({
        title: "خطأ في الحفظ",
        description: error.message || "حدث خطأ أثناء إلغاء حالة الكفيل",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const onSubmit = async (data: KafilFormData) => {
    setIsSubmitting(true)
    try {
      // Update kafil basic info
      await api.updateKafil(kafilId!, {
        first_name: data.firstName,
        last_name: data.lastName,
        phone: data.phone || undefined,
        email: data.email || undefined,
        address: data.address || undefined,
        monthly_pledge: data.monthlyPledge,
      })

      toast({
        title: "تم الحفظ بنجاح",
        description: "تم تحديث بيانات الكفيل بنجاح",
      })

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

  if (isLoading) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-[600px] sm:w-[800px]">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <HandCoins className="h-5 w-5" />
              تعديل بيانات الكفيل
            </SheetTitle>
          </SheetHeader>
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p>جاري تحميل البيانات...</p>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[600px] sm:w-[800px] max-h-[100vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <HandCoins className="h-5 w-5" />
            تعديل بيانات الكفيل
          </SheetTitle>
          <SheetDescription>تعديل معلومات الكفيل</SheetDescription>
        </SheetHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">معلومات الكفيل</h3>
            
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  رقم الهاتف
                </Label>
                <Input id="phone" {...form.register("phone")} placeholder="أدخل رقم الهاتف" />
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="address" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                العنوان
              </Label>
              <Textarea id="address" {...form.register("address")} placeholder="أدخل العنوان" rows={3} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="monthlyPledge">التعهد الشهري (₪) *</Label>
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
          </div>


          <SheetFooter className="flex justify-between">
            <Button 
              type="button" 
              variant="destructive" 
              onClick={handleRemoveKafilStatus} 
              disabled={isSubmitting}
              className="flex items-center gap-2"
            >
              <UserMinus className="h-4 w-4" />
              إلغاء حالة الكفيل
            </Button>
            
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                إلغاء
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "جاري الحفظ..." : "حفظ التغييرات"}
              </Button>
            </div>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}