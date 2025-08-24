"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Phone, Mail, MapPin, Users, Heart, GraduationCap, Calendar, IdCard } from "lucide-react"

interface Widow {
  id: number
  first_name: string
  last_name: string
  full_name: string
  phone: string
  email: string
  address?: string
  neighborhood?: string
  admission_date: string
  national_id: string
  birth_date: string
  age: number
  marital_status: string
  education_level?: string
  disability_flag: boolean
  disability_type?: string
  created_at: string
  updated_at: string
  orphans?: Array<{
    id: number
    first_name: string
    last_name: string
    birth_date: string
    age: number
  }>
  sponsorships?: Array<{
    id: number
    amount: number
    kafil?: {
      id: number
      first_name: string
      last_name: string
      phone: string
      monthly_pledge: number
      donor?: {
        id: number
        first_name: string
        last_name: string
      }
    }
  }>
  orphans_count?: number
  sponsorships_count?: number
  total_sponsorship_amount?: number
}

interface ViewWidowDialogProps {
  widow: Widow | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ViewWidowDialog({ widow, open, onOpenChange }: ViewWidowDialogProps) {
  if (!widow) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            تفاصيل الأرملة
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">الاسم الكامل</Label>
              <p className="text-lg font-semibold">
                {widow.full_name}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">رقم الهوية</Label>
                <p className="flex items-center gap-2">
                  <IdCard className="h-4 w-4 text-muted-foreground" />
                  {widow.national_id}
                </p>
              </div>

              <div>
                <Label className="text-sm font-medium text-muted-foreground">العمر</Label>
                <p className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  {Math.floor(widow.age)} سنة
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">رقم الهاتف</Label>
                <p className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  {widow.phone || "غير محدد"}
                </p>
              </div>

              <div>
                <Label className="text-sm font-medium text-muted-foreground">البريد الإلكتروني</Label>
                <p className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  {widow.email || "غير محدد"}
                </p>
              </div>
            </div>

            {widow.address && (
              <div>
                <Label className="text-sm font-medium text-muted-foreground">العنوان</Label>
                <p className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  {widow.address}
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">الحي</Label>
                <p>{widow.neighborhood || "غير محدد"}</p>
              </div>

              <div>
                <Label className="text-sm font-medium text-muted-foreground">الحالة الاجتماعية</Label>
                <Badge variant="outline">{widow.marital_status}</Badge>
              </div>
            </div>
          </div>

          {/* Administrative Info */}
          <div className="border-t pt-4 space-y-4">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">تاريخ الانتساب</Label>
              <p>{new Date(widow.admission_date).toLocaleDateString('ar-EG')}</p>
            </div>
          </div>

          {/* Education and Health Info */}
          <div className="border-t pt-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">المستوى التعليمي</Label>
                <div className="flex items-center gap-2 mt-1">
                  <GraduationCap className="h-4 w-4 text-muted-foreground" />
                  {widow.education_level ? (
                    <Badge variant="secondary">{widow.education_level}</Badge>
                  ) : (
                    <span className="text-muted-foreground">غير محدد</span>
                  )}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-muted-foreground">الإعاقة</Label>
                <div className="flex items-center gap-2 mt-1">
                  {widow.disability_flag ? (
                    <Badge variant="destructive">
                      {widow.disability_type || "إعاقة"}
                    </Badge>
                  ) : (
                    <Badge variant="secondary">لا توجد</Badge>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Orphans Info */}
          {widow.orphans && widow.orphans.length > 0 && (
            <div className="border-t pt-4 space-y-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                <Label className="font-medium text-blue-900">الأيتام ({widow.orphans.length})</Label>
              </div>
              
              <div className="grid gap-3">
                {widow.orphans.map((orphan) => (
                  <div key={orphan.id} className="bg-blue-50 p-3 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">
                        {orphan.first_name} {orphan.last_name}
                      </span>
                      <Badge variant="outline">
                        {Math.floor(orphan.age)} سنة
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sponsorship Info */}
          {widow.sponsorships && widow.sponsorships.length > 0 && (
            <div className="border-t pt-4 space-y-4">
              <div className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-green-600" />
                <Label className="font-medium text-green-900">الكفالات ({widow.sponsorships.length})</Label>
              </div>
              
              <div className="grid gap-3">
                {widow.sponsorships.map((sponsorship) => (
                  <div key={sponsorship.id} className="bg-green-50 p-3 rounded-lg">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="font-medium">
                          {sponsorship.kafil ? 
                            `${sponsorship.kafil.first_name} ${sponsorship.kafil.last_name}` : 
                            "غير محدد"
                          }
                        </span>
                        {sponsorship.kafil?.phone && (
                          <p className="text-sm text-muted-foreground">
                            {sponsorship.kafil.phone}
                          </p>
                        )}
                      </div>
                      <Badge variant="secondary">
                        ₪ {sponsorship.amount}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-green-100 p-3 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-medium">إجمالي المبلغ الشهري:</span>
                  <span className="text-lg font-bold text-green-600">
                    ₪ {widow.total_sponsorship_amount || 0}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Registration Info */}
          <div className="border-t pt-4 text-sm text-muted-foreground">
            <div className="flex justify-between">
              <span>تاريخ التسجيل:</span>
              <span>{new Date(widow.created_at).toLocaleDateString('ar-EG')}</span>
            </div>
            {widow.updated_at !== widow.created_at && (
              <div className="flex justify-between mt-1">
                <span>آخر تحديث:</span>
                <span>{new Date(widow.updated_at).toLocaleDateString('ar-EG')}</span>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}