"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Settings, Building, ShieldAlert, Users, Loader2, Save, Key } from "lucide-react"
import { isCurrentUserAdmin } from "@/lib/roles"
import { ChangePasswordDialog } from "@/components/account/change-password-dialog"
import api, { ApiError } from "@/lib/api"

interface OrganizationSettings {
  name: string
  address: string | null
  phone: string | null
  email: string | null
}

const EMPTY: OrganizationSettings = { name: "", address: "", phone: "", email: "" }

export default function SettingsPage() {
  const { toast } = useToast()
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<OrganizationSettings>(EMPTY)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})
  const [passwordOpen, setPasswordOpen] = useState(false)

  useEffect(() => {
    setIsAdmin(isCurrentUserAdmin())

    api
      .getOrganizationSettings()
      .then((response) =>
        setForm({
          name: response.data.name ?? "",
          address: response.data.address ?? "",
          phone: response.data.phone ?? "",
          email: response.data.email ?? "",
        })
      )
      .catch(() =>
        toast({
          title: "تعذر تحميل الإعدادات",
          description: "تحقق من الاتصال بالخادم",
          variant: "destructive",
        })
      )
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setFieldErrors({})
    try {
      const response = await api.updateOrganizationSettings({
        name: form.name,
        address: form.address || null,
        phone: form.phone || null,
        email: form.email || null,
      })
      setForm({
        name: response.data.name ?? "",
        address: response.data.address ?? "",
        phone: response.data.phone ?? "",
        email: response.data.email ?? "",
      })
      toast({
        title: "تم حفظ معلومات الجمعية",
        description: "ستظهر هذه المعلومات على التقارير المطبوعة",
      })
    } catch (error) {
      if (error instanceof ApiError && error.errors) setFieldErrors(error.errors)
      toast({
        title: "تعذر حفظ الإعدادات",
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const field = (
    key: keyof OrganizationSettings,
    label: string,
    options: { type?: string; multiline?: boolean; placeholder?: string; dir?: "rtl" | "ltr" } = {}
  ) => {
    const Control = options.multiline ? Textarea : Input
    return (
      <div className="space-y-2">
        <Label htmlFor={`org-${key}`}>{label}</Label>
        <Control
          id={`org-${key}`}
          type={options.multiline ? undefined : options.type ?? "text"}
          dir={options.dir}
          value={form[key] ?? ""}
          placeholder={options.placeholder}
          disabled={!isAdmin || loading}
          onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
            setForm((prev) => ({ ...prev, [key]: e.target.value }))
          }
          aria-invalid={Boolean(fieldErrors[key])}
        />
        {fieldErrors[key] && <p className="text-sm text-destructive">{fieldErrors[key][0]}</p>}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-3xl font-bold text-foreground">
          <Settings className="h-8 w-8" />
          الإعدادات
        </h1>
        <p className="mt-2 text-muted-foreground">إعدادات النظام والجمعية</p>
      </div>

      {isAdmin === false && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-medium">للاطّلاع فقط</p>
            <p className="text-sm">تعديل معلومات الجمعية متاح لمدير النظام وحده.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              معلومات الجمعية
            </CardTitle>
            <CardDescription>
              تُطبع هذه المعلومات على ترويسة كل تقرير يصدره النظام.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center gap-2 py-8 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                جاري التحميل...
              </div>
            ) : (
              <form onSubmit={handleSave} className="space-y-4">
                {field("name", "اسم الجمعية")}
                {field("address", "العنوان", { multiline: true, placeholder: "المدينة، الحي، الشارع" })}
                {field("phone", "رقم الهاتف", { dir: "ltr", placeholder: "0535123456" })}
                {field("email", "البريد الإلكتروني", { type: "email", dir: "ltr", placeholder: "contact@example.org" })}

                {isAdmin && (
                  <Button type="submit" disabled={saving} className="gap-2">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    حفظ التغييرات
                  </Button>
                )}
              </form>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                حسابك
              </CardTitle>
              <CardDescription>كلمة المرور الخاصة بك وبياناتك الشخصية.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start gap-2" onClick={() => setPasswordOpen(true)}>
                <Key className="h-4 w-4" />
                تغيير كلمة المرور
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2" asChild>
                <Link href="/dashboard/profile">
                  <Settings className="h-4 w-4" />
                  تعديل الملف الشخصي
                </Link>
              </Button>
            </CardContent>
          </Card>

          {isAdmin && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  الحسابات
                </CardTitle>
                <CardDescription>
                  إنشاء حسابات جديدة، تغيير الصلاحيات، إيقاف الحسابات أو إعادة تعيين كلمات المرور.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="gap-2" asChild>
                  <Link href="/dashboard/users">
                    <Users className="h-4 w-4" />
                    إدارة الحسابات
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <ChangePasswordDialog open={passwordOpen} onOpenChange={setPasswordOpen} />
    </div>
  )
}
