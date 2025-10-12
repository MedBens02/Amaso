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
import { User, Phone, Mail, MapPin, HandCoins, Search, Plus, Trash2 } from "lucide-react"
import api from "@/lib/api"

const kafilSchema = z.object({
  firstName: z.string().min(1, "الاسم الأول مطلوب"),
  lastName: z.string().min(1, "اسم العائلة مطلوب"),
  phone: z.string().optional(),
  email: z.string().email("بريد إلكتروني غير صحيح").optional().or(z.literal("")),
  address: z.string().optional(),
  donorId: z.string().min(1, "يجب اختيار متبرع"),
  monthlyPledge: z.number().positive("التعهد الشهري يجب أن يكون موجباً"),
})

type KafilFormData = z.infer<typeof kafilSchema>

interface AddKafilSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

interface Donor {
  id: number
  first_name: string
  last_name: string
  full_name: string
}

interface Widow {
  id: number
  first_name: string
  last_name: string
  full_name: string
  national_id?: string
  neighborhood?: string
}

export function AddKafilSheet({ open, onOpenChange, onSuccess }: AddKafilSheetProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [donors, setDonors] = useState<Donor[]>([])
  const [widows, setWidows] = useState<Widow[]>([])
  const [widowSearch, setWidowSearch] = useState("")
  const [sponsoredWidows, setSponsoredWidows] = useState<Array<{ widowId: string; amount: number }>>([{ widowId: "", amount: 0 }])
  const { toast } = useToast()

  const form = useForm<KafilFormData>({
    resolver: zodResolver(kafilSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phone: "",
      email: "",
      address: "",
      donorId: "",
      monthlyPledge: 0,
    },
  })


  useEffect(() => {
    if (open) {
      fetchDonors()
      fetchWidows()
    }
  }, [open])

  const fetchDonors = async () => {
    try {
      const response = await api.getDonors()
      setDonors(response.data)
    } catch (error: any) {
      toast({
        title: "خطأ في تحميل المتبرعين",
        description: error.message || "فشل في تحميل قائمة المتبرعين",
        variant: "destructive",
      })
    }
  }

  const fetchWidows = async (search?: string) => {
    try {
      const response = await api.getWidows({ search })
      setWidows(response.data)
    } catch (error: any) {
      toast({
        title: "خطأ في تحميل الأرامل",
        description: error.message || "فشل في تحميل قائمة الأرامل",
        variant: "destructive",
      })
    }
  }

  const handleWidowSearch = (search: string) => {
    setWidowSearch(search)
    if (search.length >= 2 || search.length === 0) {
      fetchWidows(search)
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

  const monthlyPledge = form.watch("monthlyPledge")
  const totalSponsorships = sponsoredWidows.reduce((sum, s) => sum + (s.amount || 0), 0)
  const remainingAmount = monthlyPledge - totalSponsorships

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

      await api.createKafil({
        first_name: data.firstName,
        last_name: data.lastName,
        phone: data.phone || undefined,
        email: data.email || undefined,
        address: data.address || undefined,
        donor_id: parseInt(data.donorId),
        monthly_pledge: data.monthlyPledge,
        sponsorships: sponsoredWidows.map(s => ({
          widow_id: parseInt(s.widowId),
          amount: s.amount
        }))
      })

      toast({
        title: "تم الحفظ بنجاح",
        description: "تم إضافة الكفيل والكفالات بنجاح",
      })

      form.reset()
      setWidowSearch("")
      setSponsoredWidows([{ widowId: "", amount: 0 }])
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
      <SheetContent className="w-[600px] sm:w-[800px] max-h-[100vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <HandCoins className="h-5 w-5" />
            إضافة كفيل جديد
          </SheetTitle>
          <SheetDescription>أدخل معلومات الكفيل والكفالات</SheetDescription>
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="donorId">المتبرع المرتبط *</Label>
                <Controller
                  name="donorId"
                  control={form.control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر المتبرع" />
                      </SelectTrigger>
                      <SelectContent>
                        {donors.map((donor) => (
                          <SelectItem key={donor.id} value={donor.id.toString()}>
                            {donor.full_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {form.formState.errors.donorId && (
                  <p className="text-sm text-red-600">{form.formState.errors.donorId.message}</p>
                )}
              </div>

              <div className="space-y-2">
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
                  <span className="font-medium text-blue-900 mr-2">DH {monthlyPledge || 0}</span>
                </div>
                <div>
                  <span className="text-gray-600">مجموع الكفالات:</span>
                  <span className="font-medium text-green-600 mr-2">DH {totalSponsorships}</span>
                </div>
                <div>
                  <span className="text-gray-600">المبلغ المتبقي:</span>
                  <span className={`font-medium mr-2 ${remainingAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    DH {remainingAmount}
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
                        <div className="p-2">
                          <Input
                            placeholder="البحث في أسماء الأرامل..."
                            value={widowSearch}
                            onChange={(e) => handleWidowSearch(e.target.value)}
                            className="mb-2"
                          />
                        </div>
                        {widows.map((widow) => (
                          <SelectItem key={widow.id} value={widow.id.toString()}>
                            <div className="flex flex-col items-start">
                              <span className="font-medium">{widow.full_name}</span>
                              {widow.national_id && (
                                <span className="text-sm text-muted-foreground">
                                  رقم البطاقة الوطنية: {widow.national_id}
                                </span>
                              )}
                              {widow.neighborhood && (
                                <span className="text-sm text-muted-foreground">
                                  الحي: {widow.neighborhood}
                                </span>
                              )}
                            </div>
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
                    <span className="text-sm text-gray-500">DH</span>
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