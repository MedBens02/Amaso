"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { User, Phone, Mail, MapPin, HandCoins, Edit, Eye } from "lucide-react"
import api from "@/lib/api"

interface ViewKafilDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit?: (kafilId: number) => void
  kafilId?: number
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
  full_name: string
  phone?: string
  email?: string
  address?: string
  donor_id: number
  monthly_pledge: number
  total_sponsorship_amount: number
  remaining_pledge_amount: number
  sponsorship_utilization: number
  sponsorships: Sponsorship[]
  donor?: Donor
}

export function ViewKafilDialog({ open, onOpenChange, onEdit, kafilId }: ViewKafilDialogProps) {
  const [kafil, setKafil] = useState<Kafil | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    if (open && kafilId) {
      fetchKafilData()
    }
  }, [open, kafilId])

  const fetchKafilData = async () => {
    setIsLoading(true)
    try {
      const response = await api.getKafil(kafilId!)
      setKafil(response.data)
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

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HandCoins className="h-5 w-5" />
              عرض بيانات الكفيل
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p>جاري تحميل البيانات...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (!kafil) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HandCoins className="h-5 w-5" />
            عرض بيانات الكفيل - {kafil.full_name}
          </DialogTitle>
          <DialogDescription>تفاصيل الكفيل والكفالات المرتبطة به</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">معلومات الكفيل</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <User className="h-4 w-4" />
                  الاسم الكامل
                </div>
                <p className="font-medium">{kafil.full_name}</p>
              </div>
              
              {kafil.phone && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="h-4 w-4" />
                    رقم الهاتف
                  </div>
                  <p className="font-medium">{kafil.phone}</p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {kafil.email && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="h-4 w-4" />
                    البريد الإلكتروني
                  </div>
                  <p className="font-medium">{kafil.email}</p>
                </div>
              )}
              
              {kafil.donor && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <HandCoins className="h-4 w-4" />
                    المتبرع المرتبط
                  </div>
                  <p className="font-medium">{kafil.donor.full_name}</p>
                </div>
              )}
            </div>

            {kafil.address && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="h-4 w-4" />
                  العنوان
                </div>
                <p className="font-medium">{kafil.address}</p>
              </div>
            )}
          </div>

          {/* Financial Summary */}
          <div className="border-t pt-4 space-y-4">
            <h3 className="text-lg font-medium text-gray-900">الملخص المالي</h3>
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-600">التعهد الشهري</div>
                  <div className="font-medium text-blue-900">DH {kafil.monthly_pledge}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">إجمالي الكفالات</div>
                  <div className="font-medium text-green-600">DH {kafil.total_sponsorship_amount}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">المبلغ المتبقي</div>
                  <div className={`font-medium ${kafil.remaining_pledge_amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    DH {kafil.remaining_pledge_amount}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">نسبة الاستخدام</div>
                  <div className="font-medium text-purple-600">{kafil.sponsorship_utilization.toFixed(1)}%</div>
                </div>
              </div>
            </div>
          </div>

          {/* Sponsorships */}
          <div className="border-t pt-4 space-y-4">
            <h3 className="text-lg font-medium text-gray-900">الكفالات ({kafil.sponsorships.length})</h3>
            {kafil.sponsorships.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                لا توجد كفالات مرتبطة بهذا الكفيل
              </div>
            ) : (
              <div className="space-y-3">
                {kafil.sponsorships.map((sponsorship) => (
                  <div key={sponsorship.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        {sponsorship.widow?.full_name || `أرملة رقم ${sponsorship.widow_id}`}
                      </div>
                      {sponsorship.widow?.national_id && (
                        <div className="text-sm text-gray-600">
                          رقم البطاقة الوطنية: {sponsorship.widow.national_id}
                        </div>
                      )}
                      {sponsorship.widow?.neighborhood && (
                        <div className="text-sm text-gray-600">
                          الحي: {sponsorship.widow.neighborhood}
                        </div>
                      )}
                    </div>
                    <div className="text-left">
                      <div className="font-bold text-green-600">DH {sponsorship.amount}</div>
                      <Badge variant="secondary" className="text-xs">
                        كفالة رقم {sponsorship.id}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <Eye className="h-4 w-4 mr-2" />
            إغلاق
          </Button>
          {onEdit && (
            <Button onClick={() => { onEdit(kafil.id); onOpenChange(false) }}>
              <Edit className="h-4 w-4 mr-2" />
              تعديل
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}