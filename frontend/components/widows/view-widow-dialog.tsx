"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { 
  Phone, Mail, MapPin, Users, Heart, GraduationCap, Calendar, IdCard, 
  Home, DollarSign, HandHeart, Briefcase, Activity, FileText,
  Star, Building2, Droplets, Zap, Sofa, ShoppingCart, TrendingUp, TrendingDown, Printer
} from "lucide-react"
import { PrintWidowPDF } from "./print-widow-pdf"

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
  
  // Related data
  orphans?: Array<{
    id: number
    first_name: string
    last_name: string
    birth_date: string
    age: number
    gender: string
    education_level?: string
    health_status?: string
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
  
  // Widow Files
  widow_files?: {
    social_situation: string
    has_chronic_disease: boolean
    has_maouna: boolean
  }
  
  // Social Information
  widow_social?: {
    housing_type?: {
      id: number
      label: string
    }
    housing_status: string
    has_water: boolean
    has_electricity: boolean
    has_furniture: number
  }
  
  // Skills, Illnesses, Aid Types
  skills?: Array<{
    id: number
    label: string
  }>
  
  illnesses?: Array<{
    id: number
    label: string
    is_chronic: boolean
  }>
  
  aid_types?: Array<{
    id: number
    label: string
  }>
  
  // Income and Expenses
  social_income?: Array<{
    id: number
    amount: number
    remarks?: string
    category?: {
      id: number
      name: string
    }
  }>
  
  social_expenses?: Array<{
    id: number
    amount: number
    remarks?: string
    category?: {
      id: number
      name: string
    }
  }>
  
  // Maouna
  active_maouna?: Array<{
    id: number
    amount: number
    is_active: boolean
    partner?: {
      id: number
      name: string
      field?: {
        id: number
        label: string
      }
      subfield?: {
        id: number
        label: string
      }
    }
  }>
  
  // Counts and totals
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
  
  // Debug: log the widow data to see what we're getting
  console.log("ViewWidowDialog widow data:", widow)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              تفاصيل الأرملة - {widow.full_name}
            </div>
            <PrintWidowPDF widow={widow} variant="icon" />
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="personal" className="w-full h-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="personal">المعلومات الشخصية</TabsTrigger>
            <TabsTrigger value="social">المعلومات الاجتماعية</TabsTrigger>
            <TabsTrigger value="orphans">الأيتام</TabsTrigger>
            <TabsTrigger value="sponsorships">الكفالات</TabsTrigger>
            <TabsTrigger value="financial">الوضع المالي</TabsTrigger>
            <TabsTrigger value="health">الصحة والمساعدات</TabsTrigger>
          </TabsList>

          <div className="mt-4 max-h-[70vh] overflow-y-auto">
            {/* Personal Information Tab */}
            <TabsContent value="personal" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <IdCard className="h-5 w-5" />
                    المعلومات الأساسية
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">الاسم الكامل</Label>
                      <p className="text-lg font-semibold">{widow.full_name}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">رقم البطاقة الوطنية</Label>
                      <p className="flex items-center gap-2">
                        <IdCard className="h-4 w-4 text-muted-foreground" />
                        {widow.national_id}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">العمر</Label>
                      <p className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {Math.floor(widow.age)} سنة
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">الحالة الاجتماعية</Label>
                      <Badge variant="outline">{widow.marital_status}</Badge>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">المستوى التعليمي</Label>
                      {widow.education_level ? (
                        <Badge variant="secondary">{widow.education_level}</Badge>
                      ) : (
                        <span className="text-muted-foreground">غير محدد</span>
                      )}
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

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">العنوان</Label>
                      <p className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        {widow.address || "غير محدد"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">الحي</Label>
                      <p>{widow.neighborhood || "غير محدد"}</p>
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

                  <Separator />
                  
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">تاريخ الانتساب</Label>
                    <p>{new Date(widow.admission_date).toLocaleDateString('ar-EG', { numberingSystem: 'latn' })}</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Social Information Tab */}
            <TabsContent value="social" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Housing Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Home className="h-5 w-5" />
                      معلومات السكن
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">نوع السكن</Label>
                      <p className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        {widow.widow_social?.housing_type?.label || "غير محدد"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">حالة السكن</Label>
                      <Badge variant="outline">
                        {widow.widow_social?.housing_status === 'owned' ? 'ملك' : 
                         widow.widow_social?.housing_status === 'rented' ? 'إيجار' : 
                         widow.widow_social?.housing_status === 'free' ? 'مجاني' : 'غير محدد'}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">المياه</Label>
                        <div className="flex items-center gap-1">
                          <Droplets className="h-4 w-4 text-blue-500" />
                          <Badge variant={widow.widow_social?.has_water ? "secondary" : "destructive"}>
                            {widow.widow_social?.has_water ? "متوفر" : "غير متوفر"}
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">الكهرباء</Label>
                        <div className="flex items-center gap-1">
                          <Zap className="h-4 w-4 text-yellow-500" />
                          <Badge variant={widow.widow_social?.has_electricity ? "secondary" : "destructive"}>
                            {widow.widow_social?.has_electricity ? "متوفر" : "غير متوفر"}
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">الأثاث</Label>
                        <div className="flex items-center gap-1">
                          <Sofa className="h-4 w-4 text-brown-500" />
                          <div className="flex">
                            {Array.from({length: 5}, (_, i) => (
                              <Star 
                                key={i} 
                                className={`h-4 w-4 ${
                                  i < (widow.widow_social?.has_furniture || 0) 
                                    ? 'fill-yellow-400 text-yellow-400' 
                                    : 'text-gray-300'
                                }`} 
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Additional Social Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      الحالة الاجتماعية
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">الوضع الاجتماعي</Label>
                      <Badge variant="outline">
                        {widow.widow_files?.social_situation === 'widow' ? 'أرملة' :
                         widow.widow_files?.social_situation === 'divorced' ? 'مطلقة' :
                         widow.widow_files?.social_situation === 'single' ? 'عزباء' :
                         widow.widow_files?.social_situation === 'remarried' ? 'متزوجة مرة أخرى' : 'غير محدد'}
                      </Badge>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">الأمراض المزمنة</Label>
                      <Badge variant={widow.widow_files?.has_chronic_disease ? "destructive" : "secondary"}>
                        {widow.widow_files?.has_chronic_disease ? "يوجد" : "لا يوجد"}
                      </Badge>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">المؤونة</Label>
                      <Badge variant={widow.widow_files?.has_maouna ? "secondary" : "outline"}>
                        {widow.widow_files?.has_maouna ? "نشطة" : "غير نشطة"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Continue with remaining tabs... */}
            <TabsContent value="orphans" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    الأيتام ({widow.orphans?.length || 0})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {widow.orphans && widow.orphans.length > 0 ? (
                    <div className="grid gap-4">
                      {widow.orphans.map((orphan) => (
                        <div key={orphan.id} className="bg-blue-50 p-4 rounded-lg">
                          <div className="flex justify-between items-start">
                            <div className="space-y-2">
                              <h4 className="font-medium text-lg">
                                {orphan.first_name} {orphan.last_name}
                              </h4>
                              <div className="grid grid-cols-3 gap-4 text-sm">
                                <div>
                                  <Label className="text-muted-foreground">العمر</Label>
                                  <p>{Math.floor(orphan.age)} سنة</p>
                                </div>
                                <div>
                                  <Label className="text-muted-foreground">الجنس</Label>
                                  <p>{orphan.gender === 'male' ? 'ذكر' : 'أنثى'}</p>
                                </div>
                                <div>
                                  <Label className="text-muted-foreground">المستوى التعليمي</Label>
                                  <p>{orphan.education_level || 'غير محدد'}</p>
                                </div>
                              </div>
                              {orphan.health_status && (
                                <div>
                                  <Label className="text-muted-foreground text-sm">الحالة الصحية</Label>
                                  <p className="text-sm">{orphan.health_status}</p>
                                </div>
                              )}
                            </div>
                            <Badge variant="outline">
                              {Math.floor(orphan.age)} سنة
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">لا توجد أيتام مسجلة</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Sponsorships Tab */}
            <TabsContent value="sponsorships" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="h-5 w-5" />
                    الكفالات ({widow.sponsorships?.length || 0})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {widow.sponsorships && widow.sponsorships.length > 0 ? (
                    <div className="space-y-4">
                      {widow.sponsorships.map((sponsorship) => (
                        <div key={sponsorship.id} className="bg-green-50 p-4 rounded-lg">
                          <div className="flex justify-between items-start">
                            <div className="space-y-2">
                              <h4 className="font-medium text-lg">
                                {sponsorship.kafil ? 
                                  `${sponsorship.kafil.first_name} ${sponsorship.kafil.last_name}` : 
                                  "غير محدد"
                                }
                              </h4>
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                {sponsorship.kafil?.phone && (
                                  <div>
                                    <Label className="text-muted-foreground">رقم الهاتف</Label>
                                    <p className="flex items-center gap-1">
                                      <Phone className="h-3 w-3" />
                                      {sponsorship.kafil.phone}
                                    </p>
                                  </div>
                                )}
                                {sponsorship.kafil?.monthly_pledge && (
                                  <div>
                                    <Label className="text-muted-foreground">التعهد الشهري</Label>
                                    <p>DH {sponsorship.kafil.monthly_pledge}</p>
                                  </div>
                                )}
                              </div>
                              {sponsorship.kafil?.donor && (
                                <div>
                                  <Label className="text-muted-foreground text-sm">المتبرع الأساسي</Label>
                                  <p className="text-sm">
                                    {sponsorship.kafil.donor.first_name} {sponsorship.kafil.donor.last_name}
                                  </p>
                                </div>
                              )}
                            </div>
                            <div className="text-right">
                              <Badge variant="secondary" className="text-lg">
                                DH {sponsorship.amount}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      <div className="bg-green-100 p-4 rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">إجمالي الكفالة الشهرية:</span>
                          <span className="text-xl font-bold text-green-600">
                            DH {widow.total_sponsorship_amount || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">لا توجد كفالات مسجلة</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Financial Status Tab */}
            <TabsContent value="financial" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Income */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                      مصادر الدخل
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {widow.social_income && widow.social_income.length > 0 ? (
                      <div className="space-y-3">
                        {widow.social_income.map((income) => (
                          <div key={income.id} className="bg-green-50 p-3 rounded-lg">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium">
                                  {income.category?.name || "غير مصنف"}
                                </p>
                                {income.remarks && (
                                  <p className="text-sm text-muted-foreground">
                                    {income.remarks}
                                  </p>
                                )}
                              </div>
                              <Badge variant="secondary">
                                DH {income.amount}
                              </Badge>
                            </div>
                          </div>
                        ))}
                        <div className="border-t pt-2 mt-2">
                          <div className="flex justify-between font-medium">
                            <span>إجمالي الدخل:</span>
                            <span className="text-green-600">
                              DH {widow.social_income.reduce((sum, income) => sum + income.amount, 0)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-center text-muted-foreground py-8">لا توجد مصادر دخل مسجلة</p>
                    )}
                  </CardContent>
                </Card>

                {/* Expenses */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingDown className="h-5 w-5 text-red-600" />
                      المصاريف
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {widow.social_expenses && widow.social_expenses.length > 0 ? (
                      <div className="space-y-3">
                        {widow.social_expenses.map((expense) => (
                          <div key={expense.id} className="bg-red-50 p-3 rounded-lg">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium">
                                  {expense.category?.name || "غير مصنف"}
                                </p>
                                {expense.remarks && (
                                  <p className="text-sm text-muted-foreground">
                                    {expense.remarks}
                                  </p>
                                )}
                              </div>
                              <Badge variant="destructive">
                                DH {expense.amount}
                              </Badge>
                            </div>
                          </div>
                        ))}
                        <div className="border-t pt-2 mt-2">
                          <div className="flex justify-between font-medium">
                            <span>إجمالي المصاريف:</span>
                            <span className="text-red-600">
                              DH {widow.social_expenses.reduce((sum, expense) => sum + expense.amount, 0)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-center text-muted-foreground py-8">لا توجد مصاريف مسجلة</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Maouna */}
              {widow.widow_files?.has_maouna && widow.active_maouna && widow.active_maouna.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <HandHeart className="h-5 w-5 text-purple-600" />
                      المؤونة
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {widow.active_maouna.map((maouna) => (
                        <div key={maouna.id} className="bg-purple-50 p-4 rounded-lg">
                          <div className="flex justify-between items-start">
                            <div className="space-y-2">
                              <div>
                                <p className="font-medium text-lg">
                                  {maouna.partner?.name || "غير محدد"}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant={maouna.is_active ? "secondary" : "outline"}>
                                    {maouna.is_active ? "نشطة" : "غير نشطة"}
                                  </Badge>
                                </div>
                              </div>
                              
                              {/* Partner Field and Subfield Details */}
                              {(maouna.partner?.field || maouna.partner?.subfield) && (
                                <div className="space-y-1">
                                  {maouna.partner?.field && (
                                    <div className="flex items-center gap-2">
                                      <Label className="text-sm font-medium text-muted-foreground">المجال:</Label>
                                      <Badge variant="outline" className="text-xs">
                                        {maouna.partner.field.label}
                                      </Badge>
                                    </div>
                                  )}
                                  {maouna.partner?.subfield && (
                                    <div className="flex items-center gap-2">
                                      <Label className="text-sm font-medium text-muted-foreground">التخصص:</Label>
                                      <Badge variant="secondary" className="text-xs">
                                        {maouna.partner.subfield.label}
                                      </Badge>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* No field/subfield indication */}
                              {(!maouna.partner?.field && !maouna.partner?.subfield) && (
                                <div className="text-sm text-muted-foreground">
                                  <Badge variant="outline" className="text-xs">
                                    غير مصنف
                                  </Badge>
                                </div>
                              )}
                            </div>
                            
                            <div className="text-right">
                              <Badge variant="secondary" className="text-lg">
                                DH {maouna.amount}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Health and Aid Tab */}
            <TabsContent value="health" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Skills */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Briefcase className="h-5 w-5 text-blue-600" />
                      المهارات
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {widow.skills && widow.skills.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {widow.skills.map((skill) => (
                          <Badge key={skill.id} variant="outline">
                            {skill.label}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-muted-foreground py-4">لا توجد مهارات مسجلة</p>
                    )}
                  </CardContent>
                </Card>

                {/* Illnesses */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5 text-red-600" />
                      الأمراض
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {widow.illnesses && widow.illnesses.length > 0 ? (
                      <div className="space-y-2">
                        {widow.illnesses.map((illness) => (
                          <div key={illness.id} className="flex justify-between items-center">
                            <span className="text-sm">{illness.label}</span>
                            {illness.is_chronic && (
                              <Badge variant="destructive" className="text-xs">
                                مزمن
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-muted-foreground py-4">لا توجد أمراض مسجلة</p>
                    )}
                  </CardContent>
                </Card>

                {/* Aid Types */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <HandHeart className="h-5 w-5 text-green-600" />
                      أنواع المساعدات
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {widow.aid_types && widow.aid_types.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {widow.aid_types.map((aid) => (
                          <Badge key={aid.id} variant="secondary">
                            {aid.label}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-muted-foreground py-4">لا توجد مساعدات مسجلة</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </div>

          {/* Footer with registration info */}
          <div className="border-t pt-4 text-sm text-muted-foreground bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between">
              <span>تاريخ التسجيل: {new Date(widow.created_at).toLocaleDateString('ar-EG', { numberingSystem: 'latn' })}</span>
              {widow.updated_at !== widow.created_at && (
                <span>آخر تحديث: {new Date(widow.updated_at).toLocaleDateString('ar-EG', { numberingSystem: 'latn' })}</span>
              )}
            </div>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}