"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Phone, Mail, MapPin, HandCoins, Users } from "lucide-react"

interface Donor {
  id: number
  first_name: string
  last_name: string
  phone: string
  email: string
  address?: string
  is_kafil: boolean
  total_given: number
  kafil?: {
    id: number
    monthly_pledge: number
    sponsorships: Array<{
      id: number
      widow: {
        id: number
        first_name: string
        last_name: string
        full_name: string
      }
    }>
  }
  created_at: string
  updated_at: string
}

interface ViewDonorDialogProps {
  donor: Donor | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ViewDonorDialog({ donor, open, onOpenChange }: ViewDonorDialogProps) {
  if (!donor) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            تفاصيل المتبرع
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">الاسم الكامل</Label>
              <p className="text-lg font-semibold">
                {donor.first_name} {donor.last_name}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">رقم الهاتف</Label>
                <p className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  {donor.phone || "غير محدد"}
                </p>
              </div>

              <div>
                <Label className="text-sm font-medium text-muted-foreground">البريد الإلكتروني</Label>
                <p className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  {donor.email || "غير محدد"}
                </p>
              </div>
            </div>

            {donor.address && (
              <div>
                <Label className="text-sm font-medium text-muted-foreground">العنوان</Label>
                <p className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  {donor.address}
                </p>
              </div>
            )}
          </div>

          {/* Financial Info */}
          <div className="border-t pt-4 space-y-4">
            <div className="flex items-center gap-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">نوع المتبرع</Label>
                <div className="flex items-center gap-2 mt-1">
                  {donor.is_kafil ? (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <HandCoins className="h-4 w-4" />
                      كفيل
                    </Badge>
                  ) : (
                    <Badge variant="outline">متبرع</Badge>
                  )}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-muted-foreground">إجمالي التبرعات</Label>
                <p className="text-xl font-bold text-green-600">
                  DH {donor.total_given?.toLocaleString() || '0'}
                </p>
              </div>
            </div>

            {donor.is_kafil && donor.kafil && (
              <div className="bg-blue-50 p-4 rounded-lg space-y-3">
                <div className="flex items-center gap-2">
                  <HandCoins className="h-5 w-5 text-blue-600" />
                  <Label className="font-medium text-blue-900">معلومات الكفالة</Label>
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">التعهد الشهري</Label>
                  <p className="text-lg font-semibold text-blue-600">
                    DH {donor.kafil.monthly_pledge || '0'}
                  </p>
                </div>

                {donor.kafil.sponsorships && donor.kafil.sponsorships.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">الأرامل المكفولة</Label>
                    <div className="mt-2 space-y-2">
                      {donor.kafil.sponsorships.map((sponsorship) => (
                        <div key={sponsorship.id} className="flex items-center justify-between bg-white p-2 rounded border">
                          <span className="font-medium">{sponsorship.widow.full_name}</span>
                          <Badge variant="outline">كفالة شهرية</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {(!donor.kafil.sponsorships || donor.kafil.sponsorships.length === 0) && (
                  <p className="text-sm text-muted-foreground italic">لا توجد أرامل مكفولة حالياً</p>
                )}
              </div>
            )}
          </div>

          {/* Registration Info */}
          <div className="border-t pt-4 text-sm text-muted-foreground">
            <div className="flex justify-between">
              <span>تاريخ التسجيل:</span>
              <span>{new Date(donor.created_at).toLocaleDateString('ar-EG', { numberingSystem: 'latn' })}</span>
            </div>
            {donor.updated_at !== donor.created_at && (
              <div className="flex justify-between mt-1">
                <span>آخر تحديث:</span>
                <span>{new Date(donor.updated_at).toLocaleDateString('ar-EG', { numberingSystem: 'latn' })}</span>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}