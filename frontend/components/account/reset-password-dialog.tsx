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
import { useToast } from "@/hooks/use-toast"
import api, { ApiError } from "@/lib/api"
import { Loader2 } from "lucide-react"
import type { ManagedUser } from "./types"

const MIN_LENGTH = 8

/**
 * Set another user's password, without knowing their current one.
 *
 * The backend revokes that user's tokens, so anyone signed in as them is
 * dropped - which is the point when a reset happens because an account may
 * be compromised.
 */
export function ResetPasswordDialog({
  open,
  onOpenChange,
  user,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: ManagedUser | null
}) {
  const { toast } = useToast()
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setPassword("")
      setConfirm("")
      setError(null)
    }
  }, [open])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!user) return

    if (password.length < MIN_LENGTH) {
      setError(`كلمة المرور يجب أن تتكون من ${MIN_LENGTH} أحرف على الأقل`)
      return
    }
    if (password !== confirm) {
      setError("تأكيد كلمة المرور غير مطابق")
      return
    }

    setSaving(true)
    try {
      await api.resetUserPassword(user.id, password)
      toast({
        title: "تم تغيير كلمة المرور",
        description: `أبلغ ${user.name} بكلمة المرور الجديدة — تم تسجيل خروجه من كل الأجهزة`,
      })
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof ApiError ? err.errors?.password?.[0] || err.message : "تعذر تغيير كلمة المرور")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>إعادة تعيين كلمة المرور</DialogTitle>
            <DialogDescription>
              {user ? `حساب: ${user.name} (${user.email})` : ""}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reset-password">كلمة المرور الجديدة</Label>
              <Input
                id="reset-password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">{MIN_LENGTH} أحرف على الأقل</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reset-confirm">تأكيد كلمة المرور</Label>
              <Input
                id="reset-confirm"
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
              />
            </div>

            {error && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              إلغاء
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              تعيين كلمة المرور
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
