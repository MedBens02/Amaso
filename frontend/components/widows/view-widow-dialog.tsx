"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
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
import { KafalaFamilyBalance } from "./kafala-family-balance"
import { cn } from "@/lib/utils"
import { maritalStatusArabic } from "@/lib/export-utils"

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

/**
 * A labelled value: caption above, value flush beneath it.
 *
 * Two separate things used to break the column. Every field went through
 * <Label>, which renders an inline <label>: beside a block <p> that stacked,
 * but beside an inline <Badge> the two shared a line, so text fields and badge
 * fields disagreed about their own layout on the same screen. And wherever a
 * value carried an icon, the icon claimed the start edge and pushed the text
 * inward - so the values, the part actually worth reading, sat in a ragged
 * column while the icon-less ones sat flush under their labels.
 *
 * The icon now rides with the caption, where it marks the field instead of
 * displacing its value, and every value starts at the same edge. One straight
 * column of values per grid column, which is what makes a card scannable.
 */
function Field({
  label,
  icon,
  children,
  className,
}: {
  label: string
  icon?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("min-w-0 space-y-1", className)}>
      <div className="flex items-start gap-1.5 text-sm font-medium text-muted-foreground">
        {/* Sized here rather than at the call sites, so every caption row lines
            up whatever icon it was handed. */}
        {icon ? <span className="mt-[3px] shrink-0 [&>svg]:h-3.5 [&>svg]:w-3.5">{icon}</span> : null}
        <span className="min-w-0">{label}</span>
      </div>
      <div className="flex min-h-6 flex-wrap items-center gap-x-2 gap-y-1 font-medium">{children}</div>
    </div>
  )
}

/**
 * A left-to-right run - a phone number, a national ID, an email - kept out of
 * the bidi algorithm's hands. inline-block so it still starts at the RTL edge
 * rather than being pushed to the physical left by its own direction.
 */
function Ltr({ value, className }: { value?: string | null; className?: string }) {
  if (!value) return <span className="text-muted-foreground">غير محدد</span>
  return (
    <span dir="ltr" className={cn("inline-block", className)}>
      {value}
    </span>
  )
}

/** Amounts arrive from the API as decimal strings, so `+` concatenates. */
function toAmount(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number.parseFloat(String(value ?? ""))
  return Number.isFinite(parsed) ? parsed : 0
}

function sumAmounts<T>(rows: T[] | undefined, pick: (row: T) => unknown): number {
  return (rows ?? []).reduce<number>((total, row) => total + toAmount(pick(row)), 0)
}

/**
 * Money and dates are left-to-right runs sitting inside Arabic text. Left to
 * the bidi algorithm the parts get reordered against each other - a date
 * came out as "282025/7/" - so each one is isolated.
 */
function Money({ value, className }: { value: unknown; className?: string }) {
  return (
    <span dir="ltr" className={cn("inline-block tabular-nums", className)}>
      DH {toAmount(value).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
    </span>
  )
}

/**
 * The `ar-EG` formatter embeds U+200F marks between the day, month and year,
 * which is what reordered the date even inside an isolate. Building the
 * string here keeps it free of them.
 */
function DateText({ value }: { value?: string | null }) {
  if (!value) return <span className="text-muted-foreground">غير محدد</span>

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return <span className="text-muted-foreground">غير محدد</span>

  const day = String(date.getDate()).padStart(2, "0")
  const month = String(date.getMonth() + 1).padStart(2, "0")

  return (
    <span dir="ltr" className="inline-block tabular-nums">
      {`${day}/${month}/${date.getFullYear()}`}
    </span>
  )
}

export function ViewWidowDialog({ widow, open, onOpenChange }: ViewWidowDialogProps) {
  if (!widow) return null
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Users className="h-5 w-5 shrink-0" />
            <span className="truncate">تفاصيل الأرملة - {widow.full_name}</span>
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
                  <div className="grid gap-x-4 gap-y-5 sm:grid-cols-2 lg:grid-cols-4">
                    <Field label="الاسم الكامل" className="sm:col-span-2">
                      <span className="text-lg font-semibold">{widow.full_name}</span>
                    </Field>
                    <Field label="رقم البطاقة الوطنية" icon={<IdCard />} className="sm:col-span-2">
                      <Ltr value={widow.national_id} className="tabular-nums" />
                    </Field>

                    <Field label="العمر" icon={<Calendar />}>{Math.floor(widow.age)} سنة</Field>
                    <Field label="الحالة الاجتماعية">
                      {/* The column stores the English enum; the card is Arabic. */}
                      <Badge variant="outline">
                        {maritalStatusArabic[widow.marital_status] || widow.marital_status || "غير محدد"}
                      </Badge>
                    </Field>
                    <Field label="صلة القرابة بالأيتام">
                      <Badge variant="outline">{(widow as any).family_liaison || "أم"}</Badge>
                    </Field>
                    <Field label="المستوى التعليمي">
                      {widow.education_level ? (
                        <Badge variant="secondary">{widow.education_level}</Badge>
                      ) : (
                        <span className="text-muted-foreground">غير محدد</span>
                      )}
                    </Field>

                    <Field label="رقم الهاتف" icon={<Phone />} className="sm:col-span-2">
                      <div className="space-y-0.5">
                        <div>
                          <Ltr value={widow.phone} className="tabular-nums" />
                        </div>
                        {((widow as any).extra_phones || []).map((extra: any) => (
                          <div key={extra.id} className="text-sm text-muted-foreground">
                            <Ltr value={extra.phone} className="tabular-nums" />
                          </div>
                        ))}
                      </div>
                    </Field>
                    <Field label="البريد الإلكتروني" icon={<Mail />} className="sm:col-span-2">
                      <Ltr value={widow.email} className="break-all" />
                    </Field>

                    <Field label="العنوان" icon={<MapPin />} className="sm:col-span-2">
                      {widow.address || <span className="text-muted-foreground">غير محدد</span>}
                    </Field>
                    <Field label="الحي" icon={<MapPin />}>
                      {widow.neighborhood || <span className="text-muted-foreground">غير محدد</span>}
                    </Field>
                    <Field label="تاريخ الانتساب" icon={<Calendar />}>
                      <DateText value={widow.admission_date} />
                    </Field>
                  </div>

                  <Separator />

                  <Field label="الإعاقة" icon={<Activity />}>
                    {widow.disability_flag ? (
                      <Badge variant="destructive">{widow.disability_type || "إعاقة"}</Badge>
                    ) : (
                      <Badge variant="secondary">لا توجد</Badge>
                    )}
                  </Field>
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
                  <CardContent className="space-y-5">
                    <div className="grid gap-x-4 gap-y-5 sm:grid-cols-2">
                      <Field label="نوع السكن" icon={<Building2 />}>
                        {widow.widow_social?.housing_type?.label || (
                          <span className="text-muted-foreground">غير محدد</span>
                        )}
                      </Field>
                      <Field label="حالة السكن" icon={<Home />}>
                        <Badge variant="outline">
                          {widow.widow_social?.housing_status === 'owned' ? 'ملك' :
                           widow.widow_social?.housing_status === 'rented' ? 'إيجار' :
                           widow.widow_social?.housing_status === 'free' ? 'مجاني' : 'غير محدد'}
                        </Badge>
                      </Field>
                    </div>
                    <div className="grid grid-cols-3 gap-x-4 gap-y-5">
                      <Field label="المياه" icon={<Droplets className="text-blue-500" />}>
                        <Badge variant={widow.widow_social?.has_water ? "secondary" : "destructive"}>
                          {widow.widow_social?.has_water ? "متوفر" : "غير متوفر"}
                        </Badge>
                      </Field>
                      <Field label="الكهرباء" icon={<Zap className="text-yellow-500" />}>
                        <Badge variant={widow.widow_social?.has_electricity ? "secondary" : "destructive"}>
                          {widow.widow_social?.has_electricity ? "متوفر" : "غير متوفر"}
                        </Badge>
                      </Field>
                      {/* text-brown-500 is not a Tailwind colour, so the sofa was
                          drawing in the inherited text colour. */}
                      <Field label="الأثاث" icon={<Sofa className="text-amber-700 dark:text-amber-500" />}>
                        <span className="flex" title={`${widow.widow_social?.has_furniture || 0} من 5`}>
                          {Array.from({ length: 5 }, (_, i) => (
                            <Star
                              key={i}
                              className={cn(
                                "h-4 w-4",
                                i < (widow.widow_social?.has_furniture || 0)
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-muted-foreground/30",
                              )}
                            />
                          ))}
                        </span>
                      </Field>
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
                  <CardContent className="space-y-5">
                    <Field label="الوضع الاجتماعي" icon={<Users />}>
                      <Badge variant="outline">
                        {widow.widow_files?.social_situation === 'widow' ? 'أرملة' :
                         widow.widow_files?.social_situation === 'divorced' ? 'مطلقة' :
                         widow.widow_files?.social_situation === 'single' ? 'عزباء' :
                         widow.widow_files?.social_situation === 'remarried' ? 'متزوجة مرة أخرى' : 'غير محدد'}
                      </Badge>
                    </Field>
                    <Field label="الأمراض المزمنة" icon={<Activity />}>
                      <Badge variant={widow.widow_files?.has_chronic_disease ? "destructive" : "secondary"}>
                        {widow.widow_files?.has_chronic_disease ? "يوجد" : "لا يوجد"}
                      </Badge>
                    </Field>
                    <Field label="المؤونة" icon={<HandHeart />}>
                      <Badge variant={widow.widow_files?.has_maouna ? "secondary" : "outline"}>
                        {widow.widow_files?.has_maouna ? "نشطة" : "غير نشطة"}
                      </Badge>
                    </Field>
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
                        <div key={orphan.id} className="bg-blue-50 dark:bg-blue-950/40 p-4 rounded-lg">
                          <div className="flex justify-between items-start">
                            <div className="space-y-2">
                              <h4 className="font-medium text-lg">
                                {orphan.first_name} {orphan.last_name}
                              </h4>
                              <div className="grid grid-cols-3 gap-x-4 gap-y-3 text-sm">
                                <Field label="العمر" icon={<Calendar />}>{Math.floor(orphan.age)} سنة</Field>
                                <Field label="الجنس" icon={<Users />}>
                                  {orphan.gender === 'male' ? 'ذكر' : 'أنثى'}
                                </Field>
                                <Field label="المستوى التعليمي" icon={<GraduationCap />}>
                                  {orphan.education_level || (
                                    <span className="text-muted-foreground">غير محدد</span>
                                  )}
                                </Field>
                              </div>
                              {orphan.health_status && (
                                <Field label="الحالة الصحية" icon={<Activity />} className="text-sm">
                                  {orphan.health_status}
                                </Field>
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
              <KafalaFamilyBalance widowId={widow.id} />
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
                        <div key={sponsorship.id} className="bg-green-50 dark:bg-green-950/40 p-4 rounded-lg">
                          <div className="flex justify-between items-start">
                            <div className="space-y-2">
                              <h4 className="font-medium text-lg">
                                {sponsorship.kafil ? 
                                  `${sponsorship.kafil.first_name} ${sponsorship.kafil.last_name}` : 
                                  "غير محدد"
                                }
                              </h4>
                              <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                                {sponsorship.kafil?.phone && (
                                  <Field label="رقم الهاتف" icon={<Phone />}>
                                    <Ltr value={sponsorship.kafil.phone} className="tabular-nums" />
                                  </Field>
                                )}
                                {sponsorship.kafil?.monthly_pledge && (
                                  <Field label="التعهد الشهري" icon={<DollarSign />}>
                                    <Money value={sponsorship.kafil.monthly_pledge} />
                                  </Field>
                                )}
                              </div>
                              {sponsorship.kafil?.donor && (
                                <Field label="المتبرع الأساسي" icon={<HandHeart />} className="text-sm">
                                  {sponsorship.kafil.donor.first_name} {sponsorship.kafil.donor.last_name}
                                </Field>
                              )}
                            </div>
                            <div className="text-right">
                              <Badge variant="secondary" className="text-lg">
                                <Money value={sponsorship.amount} />
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      <div className="bg-green-100 dark:bg-green-950/50 p-4 rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">إجمالي الكفالة الشهرية:</span>
                          <span className="text-xl font-bold text-green-600">
                            <Money value={widow.total_sponsorship_amount} />
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
                          <div key={income.id} className="bg-green-50 dark:bg-green-950/40 p-3 rounded-lg">
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
                                <Money value={income.amount} />
                              </Badge>
                            </div>
                          </div>
                        ))}
                        <div className="border-t pt-2 mt-2">
                          <div className="flex justify-between font-medium">
                            <span>إجمالي الدخل:</span>
                            <span className="text-green-600">
                              <Money value={sumAmounts(widow.social_income, (row) => row.amount)} />
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
                          <div key={expense.id} className="bg-red-50 dark:bg-red-950/40 p-3 rounded-lg">
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
                                <Money value={expense.amount} />
                              </Badge>
                            </div>
                          </div>
                        ))}
                        <div className="border-t pt-2 mt-2">
                          <div className="flex justify-between font-medium">
                            <span>إجمالي المصاريف:</span>
                            <span className="text-red-600">
                              <Money value={sumAmounts(widow.social_expenses, (row) => row.amount)} />
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
                        <div key={maouna.id} className="bg-purple-50 dark:bg-purple-950/40 p-4 rounded-lg">
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
                                      <span className="text-sm font-medium text-muted-foreground">المجال:</span>
                                      <Badge variant="outline" className="text-xs">
                                        {maouna.partner.field.label}
                                      </Badge>
                                    </div>
                                  )}
                                  {maouna.partner?.subfield && (
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm font-medium text-muted-foreground">التخصص:</span>
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
                                <Money value={maouna.amount} />
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
          <div className="border-t pt-4 text-sm text-muted-foreground bg-muted p-4 rounded-lg">
            <div className="flex justify-between">
              <span className="flex items-center gap-1">تاريخ التسجيل: <DateText value={widow.created_at} /></span>
              {widow.updated_at !== widow.created_at && (
                <span className="flex items-center gap-1">آخر تحديث: <DateText value={widow.updated_at} /></span>
              )}
            </div>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}