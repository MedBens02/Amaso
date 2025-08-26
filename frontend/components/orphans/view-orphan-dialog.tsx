"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { formatDateArabic } from "@/lib/date-utils"
import { Eye, User, Users, Calendar, MapPin, Phone, Mail, GraduationCap, Heart } from "lucide-react"

interface Orphan {
  id: number
  full_name: string
  first_name: string
  last_name: string
  age: number
  gender: string
  birth_date: string
  education_level: string
  health_status: string
  created_at: string
  updated_at: string
  widow: {
    id: number
    full_name: string
    phone: string
    email: string
    neighborhood: string
    address: string
  }
}

interface ViewOrphanDialogProps {
  orphan: Orphan | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ViewOrphanDialog({ orphan, open, onOpenChange }: ViewOrphanDialogProps) {
  if (!orphan) return null

  const birthDate = orphan.birth_date ? new Date(orphan.birth_date) : null
  const createdDate = orphan.created_at ? new Date(orphan.created_at) : null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            تفاصيل اليتيم - {orphan.full_name}
          </DialogTitle>
          <DialogDescription>
            عرض تفاصيل اليتيم والمعلومات المرتبطة به
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                المعلومات الشخصية
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">الاسم الكامل</div>
                  <div className="font-medium">{orphan.full_name}</div>
                </div>
                
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">العمر</div>
                  <div className="font-medium">{orphan.age} سنة</div>
                </div>
                
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">الجنس</div>
                  <Badge variant={orphan.gender === 'male' ? 'default' : 'secondary'}>
                    {orphan.gender === 'male' ? 'ذكر' : 'أنثى'}
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">تاريخ الميلاد</div>
                  <div className="font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {birthDate ? formatDateArabic(birthDate) : 'غير محدد'}
                  </div>
                </div>
                
                {orphan.education_level && (
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">المستوى التعليمي</div>
                    <div className="font-medium flex items-center gap-2">
                      <GraduationCap className="h-4 w-4" />
                      {orphan.education_level}
                    </div>
                  </div>
                )}
                
                {orphan.health_status && (
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">الحالة الصحية</div>
                    <div className="font-medium flex items-center gap-2">
                      <Heart className="h-4 w-4" />
                      {orphan.health_status}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Widow Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                معلومات الأم (الأرملة)
              </CardTitle>
              <CardDescription>
                معلومات الأرملة المسؤولة عن اليتيم
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">اسم الأم</div>
                  <div className="font-medium">{orphan.widow.full_name}</div>
                </div>
                
                {orphan.widow.phone && (
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">رقم الهاتف</div>
                    <div className="font-medium flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      <a href={`tel:${orphan.widow.phone}`} className="hover:underline">
                        {orphan.widow.phone}
                      </a>
                    </div>
                  </div>
                )}
                
                {orphan.widow.email && (
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">البريد الإلكتروني</div>
                    <div className="font-medium flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <a href={`mailto:${orphan.widow.email}`} className="hover:underline">
                        {orphan.widow.email}
                      </a>
                    </div>
                  </div>
                )}
                
                {orphan.widow.neighborhood && (
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">الحي</div>
                    <div className="font-medium flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      {orphan.widow.neighborhood}
                    </div>
                  </div>
                )}
                
                {orphan.widow.address && (
                  <div className="space-y-2 md:col-span-2">
                    <div className="text-sm text-muted-foreground">العنوان</div>
                    <div className="font-medium">{orphan.widow.address}</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* System Information */}
          <Card>
            <CardHeader>
              <CardTitle>معلومات النظام</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">تاريخ التسجيل</div>
                  <div className="font-medium">
                    {createdDate ? formatDateArabic(createdDate) : 'غير محدد'}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">رقم اليتيم</div>
                  <div className="font-medium">#{orphan.id}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}