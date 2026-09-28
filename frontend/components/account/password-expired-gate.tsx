"use client"

import { useEffect, useState } from "react"
import { KeyRound, Loader2, LogOut, ShieldAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PasswordInput } from "@/components/ui/password-input"
import { Label } from "@/components/ui/label"
import { Logo } from "@/components/landing/logo"
import api, { ApiError, PASSWORD_EXPIRED_EVENT } from "@/lib/api"

const MIN_LENGTH = 8

/** Start warning this many days out, so nobody is surprised mid-task. */
const WARN_WITHIN_DAYS = 5

/**
 * The wall that goes up when a password is past its thirty days.
 *
 * Deliberately not a Dialog. A dialog can be dismissed - by Escape, by a
 * click outside, by the close button it comes with - and every one of those
 * would leave somebody looking at a dashboard whose every request the server
 * is refusing, with no explanation on screen. This covers the page and the
 * only two ways past it are changing the password or signing out.
 *
 * Signing out is offered because the alternative is a trap: the token is
 * handed out before the password is changed (you have to be signed in to
 * change it), so a person who does not want to deal with this right now must
 * still be able to leave rather than be stuck in a session they can neither
 * use nor end.
 *
 * The same component carries the warning for the days before: five days of
 * "this is coming" is the difference between a policy and an ambush.
 */
export function PasswordExpiredGate({ user }: { user: any }) {
  // Seeded from the profile the layout already fetched, then kept honest by
  // the 423 the server sends if the password expires mid-session.
  const [blocked, setBlocked] = useState<boolean>(Boolean(user?.must_change_password))
  const [dismissedWarning, setDismissedWarning] = useState(false)

  const [current, setCurrent] = useState("")
  const [next, setNext] = useState("")
  const [confirm, setConfirm] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setBlocked(Boolean(user?.must_change_password))
  }, [user?.must_change_password])

  useEffect(() => {
    const raise = () => setBlocked(true)
    window.addEventListener(PASSWORD_EXPIRED_EVENT, raise)
    return () => window.removeEventListener(PASSWORD_EXPIRED_EVENT, raise)
  }, [])

  const daysLeft: number | null =
    typeof user?.password_expires_in_days === "number" ? user.password_expires_in_days : null

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
    if (next === current) {
      // The server would accept it; the policy would not mean anything.
      setError("اختر كلمة مرور مختلفة عن الحالية")
      return
    }

    setSaving(true)
    try {
      await api.changePassword({
        current_password: current,
        password: next,
        password_confirmation: confirm,
      })

      // The API client already swapped in the fresh token and the updated
      // profile; this tells the header and the layout to read them.
      window.dispatchEvent(new CustomEvent("amaso:user-updated"))
      setBlocked(false)
      setCurrent("")
      setNext("")
      setConfirm("")
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.errors?.current_password?.[0] || err.errors?.password?.[0] || err.message
          : "تعذر تغيير كلمة المرور"
      )
    } finally {
      setSaving(false)
    }
  }

  const signOut = async () => {
    try {
      await api.logout()
    } finally {
      window.location.href = "/login"
    }
  }

  if (!blocked) {
    if (dismissedWarning || daysLeft === null || daysLeft > WARN_WITHIN_DAYS) {
      return null
    }

    return (
      <div className="flex items-center justify-between gap-3 border-b border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100">
        <span className="flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 shrink-0" />
          {daysLeft <= 0
            ? "تنتهي صلاحية كلمة المرور اليوم."
            : `تنتهي صلاحية كلمة المرور خلال ${daysLeft} ${daysLeft === 1 ? "يوم" : "أيام"}.`}{" "}
          غيّرها من صفحة الحساب قبل أن تُطالب بذلك.
        </span>
        <button
          type="button"
          onClick={() => setDismissedWarning(true)}
          className="shrink-0 font-medium underline-offset-4 hover:underline"
        >
          إخفاء
        </button>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 sm:p-8">
        <div className="mb-6 flex flex-col items-center text-center">
          <Logo className="mb-4 h-14 w-14" size={112} />
          <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950/60">
            <KeyRound className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            حان وقت تغيير كلمة المرور
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
            تُغيَّر كلمات المرور كل 30 يوماً لحماية بيانات الأسر. اختر كلمة
            مرور جديدة للمتابعة.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="expired-current">كلمة المرور الحالية</Label>
            <PasswordInput
              id="expired-current"
              autoComplete="current-password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="expired-next">كلمة المرور الجديدة</Label>
            <PasswordInput
              id="expired-next"
              autoComplete="new-password"
              value={next}
              onChange={(e) => setNext(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">{MIN_LENGTH} أحرف على الأقل</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="expired-confirm">تأكيد كلمة المرور</Label>
            <PasswordInput
              id="expired-confirm"
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

          <Button type="submit" className="w-full" disabled={saving}>
            {saving && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
            حفظ ومتابعة العمل
          </Button>

          <button
            type="button"
            onClick={signOut}
            disabled={saving}
            className="mx-auto flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-slate-700 disabled:opacity-50 dark:text-slate-400 dark:hover:text-slate-200"
          >
            <LogOut className="h-4 w-4" />
            تسجيل الخروج بدل ذلك
          </button>
        </form>
      </div>
    </div>
  )
}
