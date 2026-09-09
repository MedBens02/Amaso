"use client"

import { useState } from "react"
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
import { useToast } from "@/hooks/use-toast"
import api, { ApiError } from "@/lib/api"
import { Loader2 } from "lucide-react"

const MIN_LENGTH = 8

/**
 * Changing your OWN password: the current one must be given.
 *
 * On success the backend revokes every token and returns a fresh one, which
 * the API client swaps in - so sessions on other devices are logged out but
 * this one carries on.
 */
export function ChangePasswordDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const [current, setCurrent] = useState("")
  const [next, setNext] = useState("")
  const [confirm, setConfirm] = useState("")
  const [error, setError] = useState<string | null>(null)

  const reset = () => {
    setCurrent("")
    setNext("")
    setConfirm("")
    setError(null)
  }

  const close = (value: boolean) => {
    if (!value) reset()
    onOpenChange(value)
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)

    if (next.length < MIN_LENGTH) {
      setError(`كلمة المرور يجب أن تتكون من ${MIN_LENGTH} أحرف على الأقل`)
      return
    }
    if (next !== confirm) {
      setError("تأكيد كلمة المرور غير مطابق")
      return
    }

    setSaving(true)
    try {
      await api.changePassword({
        current_password: current,
        password: next,
        password_confirmation: confirm,
      })
      toast({
        title: "تم تغيير كلمة المرور بنجاح",
        description: "تم تسجيل الخروج من الأجهزة الأخرى",
      })
      close(false)
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.errors?.current_password?.[0] || err.message
          : "تعذر تغيير كلمة المرور"
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>تغيير كلمة المرور</DialogTitle>
            <DialogDescription>
              سيتم تسجيل الخروج من كل الأجهزة الأخرى بعد التغيير.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">كلمة المرور الحالية</Label>
              <Input
                id="current-password"
                type="password"
                autoComplete="current-password"
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">كلمة المرور الجديدة</Label>
              <Input
                id="new-password"
                type="password"
                autoComplete="new-password"
                value={next}
                onChange={(e) => setNext(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">{MIN_LENGTH} أحرف على الأقل</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">تأكيد كلمة المرور</Label>
              <Input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
              />
            </div>

            {error && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => close(false)} disabled={saving}>
              إلغاء
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              تغيير كلمة المرور
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
