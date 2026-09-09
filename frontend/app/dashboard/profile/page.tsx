"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { User, Mail, Phone, MapPin, Calendar, Edit, Save, X, Key, Loader2, Clock } from "lucide-react"
import { getRoleLabel } from "@/lib/roles"
import { ChangePasswordDialog } from "@/components/account/change-password-dialog"
import api, { ApiError } from "@/lib/api"

interface UserProfile {
  id: number
  name: string
  email: string
  role: string
  phone?: string | null
  address?: string | null
  is_active: boolean
  last_login_at?: string | null
  created_at?: string | null
}

type EditableFields = Pick<UserProfile, "name" | "email" | "phone" | "address">

/** dd/mm/yyyy in Latin digits, matching the rest of the app. */
function formatDate(value?: string | null): string {
  if (!value) return "غير محدد"
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? "غير محدد"
    : date.toLocaleDateString("ar-MA", {
        year: "numeric",
        month: "long",
        day: "numeric",
        numberingSystem: "latn",
      })
}

export default function ProfilePage() {
  const { toast } = useToast()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [passwordOpen, setPasswordOpen] = useState(false)
  const [form, setForm] = useState<EditableFields>({ name: "", email: "", phone: "", address: "" })
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})

  // Render from the cached profile first so the page never flashes empty,
  // then take the server's copy as the truth.
  useEffect(() => {
    const cached = localStorage.getItem("user")
    if (cached) {
      try {
        applyUser(JSON.parse(cached))
      } catch {
        /* a corrupt cache just means we wait for the request below */
      }
    }

    api
      .getMe()
      .then((response) => applyUser(response.data))
      .catch(() => {
        toast({
          title: "تعذر تحميل الملف الشخصي",
          description: "تحقق من الاتصال بالخادم",
          variant: "destructive",
        })
      })
      .finally(() => setLoading(false))
  }, [])

  const applyUser = (data: UserProfile) => {
    setUser(data)
    setForm({
      name: data.name ?? "",
      email: data.email ?? "",
      phone: data.phone ?? "",
      address: data.address ?? "",
    })
  }

  const handleSave = async () => {
    setSaving(true)
    setFieldErrors({})
    try {
      const response = await api.updateProfile({
        name: form.name,
        email: form.email,
        phone: form.phone || null,
        address: form.address || null,
      })
      applyUser(response.data)
      setIsEditing(false)
      toast({ title: "تم حفظ التغييرات بنجاح" })
      // The header renders the cached name; make it repaint immediately.
      window.dispatchEvent(new Event("amaso:user-updated"))
    } catch (error) {
      if (error instanceof ApiError && error.errors) {
        setFieldErrors(error.errors)
      }
      toast({
        title: "تعذر حفظ التغييرات",
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    if (user) applyUser(user)
    setFieldErrors({})
    setIsEditing(false)
  }

  if (loading && !user) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="ml-2 h-5 w-5 animate-spin" />
        جاري التحميل...
      </div>
    )
  }

  if (!user) {
    return <p className="py-16 text-center text-muted-foreground">تعذر تحميل الملف الشخصي</p>
  }

  const readOnlyRow = (icon: React.ReactNode, value?: string | null) => (
    <div className="flex items-center gap-2 rounded-md bg-muted p-2">
      {icon}
      <span>{value || "غير محدد"}</span>
    </div>
  )

  const editableField = (
    key: keyof EditableFields,
    label: string,
    icon: React.ReactNode,
    options: { type?: string; placeholder?: string } = {}
  ) => (
    <div className="space-y-2">
      <Label htmlFor={key}>{label}</Label>
      {isEditing ? (
        <>
          <Input
            id={key}
            type={options.type ?? "text"}
            value={form[key] ?? ""}
            placeholder={options.placeholder}
            onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
            aria-invalid={Boolean(fieldErrors[key])}
          />
          {fieldErrors[key] && <p className="text-sm text-destructive">{fieldErrors[key][0]}</p>}
        </>
      ) : (
        readOnlyRow(icon, form[key])
      )}
    </div>
  )

  return (
    <div className="container mx-auto max-w-4xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">الملف الشخصي</h1>
          <p className="text-muted-foreground">إدارة معلوماتك الشخصية وإعدادات الحساب</p>
        </div>
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)} className="gap-2">
            <Edit className="h-4 w-4" />
            تعديل الملف
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              حفظ
            </Button>
            <Button variant="outline" onClick={handleCancel} disabled={saving} className="gap-2">
              <X className="h-4 w-4" />
              إلغاء
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardHeader className="text-center">
            {/* The association's mark stands in for a photo - there are no
                per-user avatars, and a broken image placeholder looked worse
                than a deliberate one. */}
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border bg-white p-3">
              <Image
                src="/amaso-logo.png"
                alt=""
                width={72}
                height={72}
                className="h-full w-full object-contain"
              />
            </div>
            <CardTitle className="text-xl">{user.name}</CardTitle>
            <div className="mx-auto flex w-fit flex-wrap justify-center gap-2">
              <Badge variant="secondary">{getRoleLabel(user.role)}</Badge>
              {!user.is_active && <Badge variant="destructive">موقوف</Badge>}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>انضم في {formatDate(user.created_at)}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>آخر دخول: {formatDate(user.last_login_at)}</span>
            </div>
            <Separator />
            <div className="space-y-2">
              <h4 className="font-medium">الأمان</h4>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start gap-2"
                onClick={() => setPasswordOpen(true)}
              >
                <Key className="h-4 w-4" />
                تغيير كلمة المرور
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>المعلومات الشخصية</CardTitle>
            <CardDescription>
              البريد الإلكتروني هو ما تسجّل به الدخول. تغيير الصلاحية يتم من طرف مدير النظام.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              {editableField("name", "الاسم الكامل", <User className="h-4 w-4 text-muted-foreground" />)}
              {editableField("email", "البريد الإلكتروني", <Mail className="h-4 w-4 text-muted-foreground" />, {
                type: "email",
              })}
              {editableField("phone", "رقم الهاتف", <Phone className="h-4 w-4 text-muted-foreground" />, {
                placeholder: "أدخل رقم الهاتف",
              })}
              {editableField("address", "العنوان", <MapPin className="h-4 w-4 text-muted-foreground" />, {
                placeholder: "أدخل العنوان",
              })}
            </div>

            <div className="space-y-2">
              <Label>الصلاحية</Label>
              <div className="flex items-center gap-2 rounded-md bg-muted p-2 text-muted-foreground">
                <User className="h-4 w-4" />
                <span>{getRoleLabel(user.role)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <ChangePasswordDialog open={passwordOpen} onOpenChange={setPasswordOpen} />
    </div>
  )
}
