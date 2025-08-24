"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { User, Phone, Mail, MapPin, HandCoins } from "lucide-react"
import api from "@/lib/api"

interface Donor {
  id: number
  first_name: string
  last_name: string
  phone: string
  email: string
  address?: string
  is_kafil: boolean
  total_given: number
  created_at: string
  updated_at: string
}

interface EditDonorDialogProps {
  donor: Donor | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function EditDonorDialog({ donor, open, onOpenChange, onSuccess }: EditDonorDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    email: "",
    address: "",
  })
  const { toast } = useToast()

  useEffect(() => {
    if (donor && open) {
      setFormData({
        first_name: donor.first_name || "",
        last_name: donor.last_name || "",
        phone: donor.phone || "",
        email: donor.email || "",
        address: donor.address || "",
      })
    }
  }, [donor, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!donor) return

    setIsSubmitting(true)
    try {
      const updateData = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone || undefined,
        email: formData.email || undefined,
        address: formData.address || undefined,
      }

      await api.updateDonor(donor.id, updateData)

      toast({
        title: "تم التحديث بنجاح",
        description: "تم تحديث بيانات المتبرع بنجاح",
      })

      onSuccess()
    } catch (error: any) {
      toast({
        title: "خطأ في التحديث",
        description: error.message || "حدث خطأ أثناء تحديث البيانات",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleConvertToKafil = () => {
    // Close this dialog and let the parent component handle the conversion
    // by redirecting to the add kafil flow with this donor's information
    onOpenChange(false)
    
    // We'll emit a custom event to notify the parent to start the kafil conversion
    window.dispatchEvent(new CustomEvent('convertToKafil', { 
      detail: { donorId: donor?.id, donor } 
    }))
    
    toast({
      title: "تحويل إلى كفيل",
      description: "سيتم فتح نموذج إضافة الكفالات",
    })
  }

  if (!donor) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            تعديل بيانات المتبرع
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic Information */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  الاسم الأول *
                </Label>
                <Input
                  id="firstName"
                  value={formData.first_name}
                  onChange={(e) => handleInputChange("first_name", e.target.value)}
                  placeholder="أدخل الاسم الأول"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="lastName">اسم العائلة *</Label>
                <Input
                  id="lastName"
                  value={formData.last_name}
                  onChange={(e) => handleInputChange("last_name", e.target.value)}
                  placeholder="أدخل اسم العائلة"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                رقم الهاتف
              </Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                placeholder="أدخل رقم الهاتف"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                البريد الإلكتروني
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="أدخل البريد الإلكتروني"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                العنوان
              </Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                placeholder="أدخل العنوان"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="flex justify-between">
            <Button 
              type="button" 
              variant="secondary" 
              onClick={handleConvertToKafil} 
              disabled={isSubmitting}
              className="flex items-center gap-2"
            >
              <HandCoins className="h-4 w-4" />
              تحويل إلى كفيل
            </Button>
            
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                إلغاء
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "جاري الحفظ..." : "حفظ التغييرات"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}