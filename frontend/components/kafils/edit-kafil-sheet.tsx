"use client"

import { useState, useEffect } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { User, Phone, Mail, MapPin, HandCoins, Plus, Trash2, UserMinus } from "lucide-react"
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

interface Widow {
  id: number
  first_name: string
  last_name: string
  full_name: string
  national_id?: string
  neighborhood?: string
}

interface Sponsorship {
  id: number
  widow_id: number
  amount: number
  widow?: Widow
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
  sponsorships: Sponsorship[]
}

export function EditKafilSheet({ open, onOpenChange, onSuccess, kafilId }: EditKafilSheetProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [widows, setWidows] = useState<Widow[]>([])
  const [sponsoredWidows, setSponsoredWidows] = useState<Array<{ widowId: string; amount: number; sponsorshipId?: number; originalAmount?: number }>>([])
  const [originalSponsorships, setOriginalSponsorships] = useState<Array<{ id: number; widow_id: number; amount: number }>>([])
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

  const monthlyPledge = form.watch("monthlyPledge")
  const totalSponsorships = sponsoredWidows.reduce((sum, s) => sum + (s.amount || 0), 0)
  const remainingAmount = monthlyPledge - totalSponsorships

  useEffect(() => {
    if (open && kafilId) {
      fetchData()
    }
  }, [open, kafilId])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const [kafilResponse, widowsResponse] = await Promise.all([
        api.getKafil(kafilId!),
        api.getWidows()
      ])

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

      // Store original sponsorships for comparison
      setOriginalSponsorships(kafil.sponsorships.map(s => ({
        id: s.id,
        widow_id: s.widow_id,
        amount: s.amount
      })))

      // Set sponsored widows
      setSponsoredWidows(kafil.sponsorships.map(s => ({
        widowId: s.widow_id.toString(),
        amount: s.amount,
        sponsorshipId: s.id,
        originalAmount: s.amount
      })))

      setWidows(widowsResponse.data)
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

  const fetchWidows = async () => {
    try {
      const response = await api.getWidows()
      setWidows(response.data)
    } catch (error: any) {
      toast({
        title: "خطأ في تحميل الأرامل",
        description: error.message || "فشل في تحميل قائمة الأرامل",
        variant: "destructive",
      })
    }
  }

  const addSponsoredWidow = () => {
    setSponsoredWidows([...sponsoredWidows, { widowId: "", amount: 0 }])
  }

  const removeSponsoredWidow = async (index: number) => {
    const sponsorship = sponsoredWidows[index]
    
    // If this is an existing sponsorship, remove it from backend
    if (sponsorship.sponsorshipId) {
      try {
        await api.removeSponsorship(kafilId!, sponsorship.sponsorshipId)
      } catch (error: any) {
        toast({
          title: "خطأ في حذف الكفالة",
          description: error.message || "فشل في حذف الكفالة",
          variant: "destructive",
        })
        return
      }
    }
    
    setSponsoredWidows(sponsoredWidows.filter((_, i) => i !== index))
  }

  const updateSponsoredWidow = (index: number, field: "widowId" | "amount", value: string | number) => {
    const updated = [...sponsoredWidows]
    updated[index] = { ...updated[index], [field]: value }
    setSponsoredWidows(updated)
  }

  const handleRemoveKafilStatus = async () => {
    if (!kafilId) return
    
    setIsSubmitting(true)
    try {
      // Remove all sponsorships first
      for (const sponsorship of sponsoredWidows) {
        if (sponsorship.sponsorshipId) {
          await api.removeSponsorship(kafilId, sponsorship.sponsorshipId)
        }
      }
      
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
      // Validate sponsorships
      if (sponsoredWidows.length === 0 || sponsoredWidows.some(s => !s.widowId || s.amount <= 0)) {
        toast({
          title: "خطأ في البيانات",
          description: "يجب إضافة كفالة واحدة على الأقل مع مبلغ صحيح",
          variant: "destructive",
        })
        return
      }

      if (totalSponsorships > data.monthlyPledge) {
        toast({
          title: "خطأ في البيانات", 
          description: "إجمالي مبالغ الكفالات يتجاوز التعهد الشهري",
          variant: "destructive",
        })
        return
      }

      // Update kafil basic info
      await api.updateKafil(kafilId!, {
        first_name: data.firstName,
        last_name: data.lastName,
        phone: data.phone || undefined,
        email: data.email || undefined,
        address: data.address || undefined,
        monthly_pledge: data.monthlyPledge,
      })

      // Handle sponsorship changes
      for (const sponsorship of sponsoredWidows) {
        if (!sponsorship.sponsorshipId) {
          // Add new sponsorship
          await api.addSponsorship(kafilId!, {
            widow_id: parseInt(sponsorship.widowId),
            amount: sponsorship.amount
          })
        } else {
          // Check if existing sponsorship was modified
          const original = originalSponsorships.find(o => o.id === sponsorship.sponsorshipId)
          if (original && (
            original.widow_id !== parseInt(sponsorship.widowId) || 
            original.amount !== sponsorship.amount
          )) {
            // Update existing sponsorship
            await api.updateSponsorship(kafilId!, sponsorship.sponsorshipId, {
              widow_id: parseInt(sponsorship.widowId),
              amount: sponsorship.amount
            })
          }
        }
      }

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
          <SheetDescription>تعديل معلومات الكفيل والكفالات</SheetDescription>
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

          {/* Sponsorships Section */}
          <div className="border-t pt-4 space-y-4">
            <h3 className="text-lg font-medium">الكفالات</h3>

            {/* Summary */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">التعهد الشهري:</span>
                  <span className="font-medium text-blue-900 mr-2">₪ {monthlyPledge || 0}</span>
                </div>
                <div>
                  <span className="text-gray-600">مجموع الكفالات:</span>
                  <span className="font-medium text-green-600 mr-2">₪ {totalSponsorships}</span>
                </div>
                <div>
                  <span className="text-gray-600">المبلغ المتبقي:</span>
                  <span className={`font-medium mr-2 ${remainingAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ₪ {remainingAmount}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>الأرامل المكفولات</Label>
              <div className="space-y-3">
                {sponsoredWidows.map((sponsorship, index) => (
                  <div key={index} className="flex items-center gap-2 p-3 border rounded-lg">
                    <Select
                      value={sponsorship.widowId}
                      onValueChange={(value) => updateSponsoredWidow(index, "widowId", value)}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="اختر الأرملة" />
                      </SelectTrigger>
                      <SelectContent>
                        {widows.map((widow) => (
                          <SelectItem key={widow.id} value={widow.id.toString()}>
                            {widow.full_name}
                          </SelectItem>
                        ))}
                        {widows.length === 0 && (
                          <div className="p-2 text-sm text-muted-foreground text-center">
                            لا توجد أرامل متاحة
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      placeholder="المبلغ"
                      value={sponsorship.amount}
                      onChange={(e) => updateSponsoredWidow(index, "amount", Number(e.target.value))}
                      className="w-24"
                      step="0.01"
                      min="0"
                    />
                    <span className="text-sm text-gray-500">₪</span>
                    {sponsorship.sponsorshipId && (
                      <span className="text-xs text-blue-600 px-2 py-1 bg-blue-100 rounded">
                        {sponsorship.amount !== sponsorship.originalAmount ? 'معدّل' : 'موجود'}
                      </span>
                    )}
                    {!sponsorship.sponsorshipId && (
                      <span className="text-xs text-green-600 px-2 py-1 bg-green-100 rounded">
                        جديد
                      </span>
                    )}
                    {sponsoredWidows.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSponsoredWidow(index)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={addSponsoredWidow}
                  className="w-full bg-transparent"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  إضافة أرملة
                </Button>
              </div>
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