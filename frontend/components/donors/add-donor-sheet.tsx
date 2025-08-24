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
import { User, Phone, Mail, MapPin, HandCoins, Plus, Trash2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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

interface Widow {
  id: number
  first_name: string
  last_name: string
  full_name: string
  national_id?: string
  neighborhood?: string
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

  const [widows, setWidows] = useState<Widow[]>([])
  const [sponsoredWidows, setSponsoredWidows] = useState<Array<{ widowId: string; amount: number }>>([])

  const isKafil = form.watch("isKafil")
  const monthlyPledge = form.watch("monthlyPledge") || 0
  const totalSponsorships = sponsoredWidows.reduce((sum, s) => sum + (s.amount || 0), 0)
  const remainingAmount = monthlyPledge - totalSponsorships

  useEffect(() => {
    if (open) {
      fetchWidows()
      
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

  const removeSponsoredWidow = (index: number) => {
    setSponsoredWidows(sponsoredWidows.filter((_, i) => i !== index))
  }

  const updateSponsoredWidow = (index: number, field: "widowId" | "amount", value: string | number) => {
    const updated = [...sponsoredWidows]
    updated[index] = { ...updated[index], [field]: value }
    setSponsoredWidows(updated)
  }

  const onSubmit = async (data: DonorFormData) => {
    setIsSubmitting(true)
    try {
      if (data.isKafil && sponsoredWidows.length > 0) {
        // Validate sponsorships
        if (sponsoredWidows.some(s => !s.widowId || s.amount <= 0)) {
          toast({
            title: "خطأ في البيانات",
            description: "يجب تحديد أرملة ومبلغ صحيح لكل كفالة",
            variant: "destructive",
          })
          return
        }

        if (totalSponsorships > monthlyPledge) {
          toast({
            title: "خطأ في البيانات", 
            description: "إجمالي مبالغ الكفالات يتجاوز التعهد الشهري",
            variant: "destructive",
          })
          return
        }

        let donorId: number
        
        if (convertDonorData) {
          // Converting existing donor to kafil
          donorId = convertDonorData.id
          
          // Update the existing donor first
          await api.updateDonor(donorId, {
            first_name: data.firstName,
            last_name: data.lastName,
            phone: data.phone,
            email: data.email || undefined,
            address: data.address || undefined,
            is_kafil: false, // Don't auto-create kafil
          })
        } else {
          // Create new donor first (without is_kafil flag to avoid auto-kafil creation)
          const donorResponse = await api.createDonor({
            first_name: data.firstName,
            last_name: data.lastName,
            phone: data.phone,
            email: data.email || undefined,
            address: data.address || undefined,
            is_kafil: false, // Don't auto-create kafil
          })
          donorId = donorResponse.data.id
        }

        // Create kafil with sponsorships manually
        await api.createKafil({
          first_name: data.firstName,
          last_name: data.lastName,
          phone: data.phone,
          email: data.email || undefined,
          address: data.address || undefined,
          donor_id: donorId,
          monthly_pledge: data.monthlyPledge!,
          sponsorships: sponsoredWidows.map(s => ({
            widow_id: parseInt(s.widowId),
            amount: s.amount
          }))
        })

        // Now update the donor to mark as kafil (after kafil is successfully created)
        await api.updateDonor(donorId, {
          first_name: data.firstName,
          last_name: data.lastName,
          phone: data.phone,
          email: data.email || undefined,
          address: data.address || undefined,
          is_kafil: true,
          monthly_pledge: data.monthlyPledge,
        })
      } else {
        // Create regular donor (kafil checkbox checked but no sponsorships, or not kafil)
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
      setSponsoredWidows([])
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
              ? "أضف كفالات شهرية لتحويل هذا المتبرع إلى كفيل"
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
              <div className="space-y-4 mr-6">
                <div className="space-y-2">
                  <Label htmlFor="monthlyPledge">إجمالي التعهد الشهري (₪) *</Label>
                  <Input
                    id="monthlyPledge"
                    type="number"
                    step="0.01"
                    min="0"
                    {...form.register("monthlyPledge", { valueAsNumber: true })}
                    placeholder="أدخل إجمالي مبلغ التعهد الشهري"
                  />
                  {form.formState.errors.monthlyPledge && (
                    <p className="text-sm text-red-600">{form.formState.errors.monthlyPledge.message}</p>
                  )}
                </div>

                {/* Summary */}
                {monthlyPledge > 0 && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">التعهد الشهري:</span>
                        <span className="font-medium text-blue-900 mr-2">₪ {monthlyPledge}</span>
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
                )}

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