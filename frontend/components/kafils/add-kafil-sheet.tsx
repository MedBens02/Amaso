"use client"

import { toNumber } from "@/lib/utils"

import { useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { useToast } from "@/hooks/use-toast"
import { User, Phone, Mail, MapPin, HandCoins, Search, Plus, Trash2 } from "lucide-react"
import api from "@/lib/api"
import { AsyncSelectRS, type AsyncOption } from "@/components/common/AsyncSelectRS"

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

  /**
   * Both lists can run past a couple hundred rows in real use - donors as
   * the association grows, widows already do (142 in the real roster this
   * was built against). A plain Select capped what a name could be found
   * in, and the search box someone tried to add inside its popup never
   * actually took keystrokes - Radix's own listbox owns them. This searches
   * the server instead of a page fetched once when the sheet opened.
   */
  const loadDonorOptions = async (query: string): Promise<AsyncOption<Donor>[]> => {
    const response = await api.getDonors({ search: query || undefined, per_page: 50 })
    return response.data.map((donor: Donor) => ({ value: String(donor.id), label: donor.full_name, data: donor }))
  }

  const loadWidowOptions = async (query: string): Promise<AsyncOption<Widow>[]> => {
    const response = await api.getWidows({ search: query || undefined, per_page: 50 })
    return response.data.map((widow: Widow) => ({ value: String(widow.id), label: widow.full_name, data: widow }))
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
  const totalSponsorships = sponsoredWidows.reduce((sum, s) => sum + toNumber(s.amount), 0)
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
                    <AsyncSelectRS
                      loadOptions={loadDonorOptions}
                      value={field.value || undefined}
                      onChange={(value) => field.onChange(value ?? "")}
                      placeholder="اكتب اسم المتبرع للبحث..."
                    />
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
            <div className="bg-blue-50 dark:bg-blue-950/40 p-4 rounded-lg">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">التعهد الشهري:</span>
                  <span className="font-medium text-blue-900 dark:text-blue-400 mr-2">DH {monthlyPledge || 0}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">مجموع الكفالات:</span>
                  <span className="font-medium text-green-600 mr-2">DH {totalSponsorships}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">المبلغ المتبقي:</span>
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
                    <AsyncSelectRS
                      className="flex-1"
                      loadOptions={loadWidowOptions}
                      value={sponsorship.widowId || undefined}
                      onChange={(value) => updateSponsoredWidow(index, "widowId", value ?? "")}
                      placeholder="اكتب اسم الأرملة للبحث..."
                      formatOptionLabel={(option: AsyncOption<Widow>) => (
                        <div className="flex flex-col items-start">
                          <span className="font-medium">{option.label}</span>
                          {option.data?.national_id && (
                            <span className="text-sm text-muted-foreground">
                              رقم البطاقة الوطنية: {option.data.national_id}
                            </span>
                          )}
                          {option.data?.neighborhood && (
                            <span className="text-sm text-muted-foreground">
                              الحي: {option.data.neighborhood}
                            </span>
                          )}
                        </div>
                      )}
                    />
                    <Input
                      type="number"
                      placeholder="المبلغ"
                      value={sponsorship.amount}
                      onChange={(e) => updateSponsoredWidow(index, "amount", Number(e.target.value))}
                      className="w-24"
                      step="0.01"
                      min="0"
                    />
                    <span className="text-sm text-muted-foreground">DH</span>
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