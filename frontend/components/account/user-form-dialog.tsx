"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { ROLE_LABELS } from "@/lib/roles"
import api, { ApiError } from "@/lib/api"
import { Loader2 } from "lucide-react"
import type { ManagedUser } from "./types"

const MIN_PASSWORD = 8

interface FormState {
  name: string
  email: string
  role: string
  phone: string
  address: string
  password: string
  password_confirmation: string
}

const EMPTY: FormState = {
  name: "",
  email: "",
  role: "social_worker",
  phone: "",
  address: "",
  password: "",
  password_confirmation: "",
}

/**
 * Create or edit an account.
 *
 * Editing deliberately has no password fields - an admin who wants to set
 * someone's password uses the reset action, which also revokes that user's
 * sessions. Bundling the two would make it easy to change a password by
 * accident while fixing a typo in a name.
 */
export function UserFormDialog({
  open,
  onOpenChange,
  user,
  onSaved,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: ManagedUser | null
  onSaved: () => void
}) {
  const { toast } = useToast()
  const [form, setForm] = useState<FormState>(EMPTY)
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [saving, setSaving] = useState(false)
  const isEdit = Boolean(user)

  useEffect(() => {
    if (!open) return
    setErrors({})
    setForm(
      user
        ? {
            ...EMPTY,
            name: user.name,
            email: user.email,
            role: user.role,
            phone: user.phone ?? "",
            address: user.address ?? "",
          }
        : EMPTY
    )
  }, [open, user])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setErrors({})

    if (!isEdit) {
      if (form.password.length < MIN_PASSWORD) {
        setErrors({ password: [`كلمة المرور يجب أن تتكون من ${MIN_PASSWORD} أحرف على الأقل`] })
        return
      }
      if (form.password !== form.password_confirmation) {
        setErrors({ password_confirmation: ["تأكيد كلمة المرور غير مطابق"] })
        return
      }
    }

    setSaving(true)
    try {
      const shared = {
        name: form.name,
        email: form.email,
        role: form.role,
        phone: form.phone || null,
        address: form.address || null,
      }

      if (isEdit && user) {
        await api.updateUser(user.id, shared)
        toast({ title: "تم تحديث الحساب بنجاح" })
      } else {
        await api.createUser({
          ...shared,
          password: form.password,
          password_confirmation: form.password_confirmation,
        })
        toast({ title: "تم إنشاء الحساب بنجاح" })
      }

      onSaved()
      onOpenChange(false)
    } catch (error) {
      if (error instanceof ApiError && error.errors) setErrors(error.errors)
      toast({
        title: isEdit ? "تعذر تحديث الحساب" : "تعذر إنشاء الحساب",
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const field = (
    key: keyof FormState,
    label: string,
    options: { type?: string; dir?: "ltr" | "rtl"; placeholder?: string; autoComplete?: string } = {}
  ) => (
    <div className="space-y-2">
      <Label htmlFor={`user-${key}`}>{label}</Label>
      <Input
        id={`user-${key}`}
        type={options.type ?? "text"}
        dir={options.dir}
        placeholder={options.placeholder}
        autoComplete={options.autoComplete}
        value={form[key]}
        onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
        aria-invalid={Boolean(errors[key])}
      />
      {errors[key] && <p className="text-sm text-destructive">{errors[key][0]}</p>}
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEdit ? "تعديل الحساب" : "حساب جديد"}</DialogTitle>
            <DialogDescription>
              {isEdit
                ? "لتغيير كلمة المرور استعمل «إعادة تعيين كلمة المرور» من قائمة الحساب."
                : "سيتمكن صاحب الحساب من الدخول فوراً بالبريد وكلمة المرور المحددين."}
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[60vh] space-y-4 overflow-y-auto py-4">
            {field("name", "الاسم الكامل")}
            {field("email", "البريد الإلكتروني", { type: "email", dir: "ltr", autoComplete: "off" })}

            <div className="space-y-2">
              <Label htmlFor="user-role">الصلاحية</Label>
              <Select value={form.role} onValueChange={(value) => setForm((prev) => ({ ...prev, role: value }))}>
                <SelectTrigger id="user-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ROLE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.role && <p className="text-sm text-destructive">{errors.role[0]}</p>}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {field("phone", "رقم الهاتف", { dir: "ltr", placeholder: "اختياري" })}
              {field("address", "العنوان", { placeholder: "اختياري" })}
            </div>

            {!isEdit && (
              <div className="grid gap-4 sm:grid-cols-2">
                {field("password", "كلمة المرور", { type: "password", autoComplete: "new-password" })}
                {field("password_confirmation", "تأكيد كلمة المرور", {
                  type: "password",
                  autoComplete: "new-password",
                })}
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              إلغاء
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              {isEdit ? "حفظ" : "إنشاء الحساب"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
