"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowRight, ArrowLeft, Loader2, Lock, MailCheck, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/ui/password-input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Logo } from "@/components/landing/logo"
import { ThemeToggle } from "@/components/theme-toggle"
import api from "@/lib/api"

const ORG_NAME = "جمعية المنصور لكفالة اليتيم"

/**
 * Staff sign-in.
 *
 * Deliberately built from the landing page's vocabulary - the warm off-white
 * ground, the teal-to-emerald mark, the amber accent, the same rounded pill
 * buttons - because it is the one screen where somebody crosses from the
 * public site into the system, and the two should read as one product rather
 * than as a marketing page bolted to an admin panel.
 *
 * The layout is two columns on a wide screen: the form on the right, where an
 * RTL reader starts, and a panel on the left carrying the association's name.
 * Below `lg` the panel drops away entirely rather than stacking, so a phone
 * gets the form immediately instead of a screenful of decoration to scroll
 * past.
 */
/** How long before the code can be asked for again, in seconds. */
const RESEND_AFTER = 45

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  // The second step. `challenge` is what the server gave us to name this
  // attempt; it is not a token and opens nothing on its own.
  const [challenge, setChallenge] = useState<string | null>(null)
  const [emailHint, setEmailHint] = useState("")
  const [code, setCode] = useState("")
  const [notice, setNotice] = useState("")
  const [cooldown, setCooldown] = useState(0)
  const codeRef = useRef<HTMLInputElement>(null)

  // Count the resend cooldown down. Asking again is a real send to a real
  // inbox, so it is worth a short wait - and every resend invalidates the
  // code already sitting in the person's mail, which is confusing if they
  // can trigger it by clicking twice.
  useEffect(() => {
    if (cooldown <= 0) return
    const id = setTimeout(() => setCooldown((s) => s - 1), 1000)
    return () => clearTimeout(id)
  }, [cooldown])

  // Land the cursor in the code box the moment the step changes, so the
  // person can type the digits straight out of the email.
  useEffect(() => {
    if (challenge) codeRef.current?.focus()
  }, [challenge])

  const startCodeStep = (hint: string, message?: string) => {
    setEmailHint(hint)
    setNotice(message || `أرسلنا رمزاً من ستة أرقام إلى ${hint}`)
    setCode("")
    setCooldown(RESEND_AFTER)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setNotice("")
    setLoading(true)

    try {
      const outcome = await api.login(email, password)

      if (outcome.status === "code_required") {
        setChallenge(outcome.challenge)
        startCodeStep(outcome.emailHint, outcome.message)
        setLoading(false)
        return
      }

      router.push("/dashboard")
    } catch (err: any) {
      setError(err.message || "بيانات الدخول غير صحيحة")
      setLoading(false)
    }
    // On success the redirect above unmounts this page, so `loading` stays
    // true and the button keeps its pending state until it goes - rather
    // than flicking back to "sign in" for the moment before navigation.
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!challenge) return
    setError("")
    setNotice("")
    setLoading(true)

    try {
      await api.verifyLoginCode(challenge, code)
      router.push("/dashboard")
    } catch (err: any) {
      setError(err.message || "رمز التحقق غير صحيح")
      // Cleared so the next attempt starts from an empty box rather than
      // from digits the person then has to select and delete.
      setCode("")
      codeRef.current?.focus()
      setLoading(false)
    }
  }

  /**
   * Ask for another code.
   *
   * Signing in again is the resend: the server issues a new code and
   * consumes the old one, which is exactly what "send me another" should
   * mean. It also hands back a new challenge, so the old one is replaced
   * here too rather than left pointing at a code that no longer exists.
   */
  const handleResend = async () => {
    if (cooldown > 0 || loading) return
    setError("")
    setNotice("")
    setLoading(true)

    try {
      const outcome = await api.login(email, password)

      if (outcome.status === "code_required") {
        setChallenge(outcome.challenge)
        startCodeStep(outcome.emailHint, `أرسلنا رمزاً جديداً إلى ${outcome.emailHint}`)
      } else {
        // 2FA was switched off between the two steps; nothing left to verify.
        router.push("/dashboard")
        return
      }
    } catch (err: any) {
      setError(err.message || "تعذّر إرسال الرمز")
    }

    setLoading(false)
  }

  const backToPassword = () => {
    setChallenge(null)
    setCode("")
    setError("")
    setNotice("")
    setPassword("")
  }

  return (
    <div className="flex min-h-screen bg-[#fdfcfa] text-slate-800 dark:bg-slate-950 dark:text-slate-200">
      {/* ------------------------------------------------------------ form */}
      <div className="flex w-full flex-col px-5 py-8 sm:px-10 lg:w-[52%] lg:px-16">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex w-fit items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-teal-50 hover:text-teal-700 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-teal-400"
          >
            <ArrowRight className="h-4 w-4" />
            العودة إلى الموقع
          </Link>
          <ThemeToggle className="text-slate-500 dark:text-slate-400" />
        </div>

        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-md">
            {/* The mark repeats here rather than only in the side panel,
                since the panel is not rendered on a phone. */}
            <div className="mb-8 flex flex-col items-center text-center lg:items-start lg:text-right">
              <Logo className="mb-5 h-16 w-16" size={128} priority />
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                {challenge ? "تحقّق من بريدك" : "أهلاً بعودتك"}
              </h1>
              <p className="mt-2 text-slate-500 dark:text-slate-400">
                {challenge
                  ? "أدخل الرمز الذي وصلك لإتمام تسجيل الدخول"
                  : "سجّل دخولك للوصول إلى نظام إدارة الجمعية"}
              </p>
            </div>

            {challenge ? (
            /* ------------------------------------------------- step two */
            <form onSubmit={handleVerify} className="space-y-5">
              <div className="flex items-start gap-3 rounded-xl border border-teal-200 bg-teal-50/70 p-4 text-sm text-teal-900 dark:border-teal-900/60 dark:bg-teal-950/40 dark:text-teal-100">
                <MailCheck className="mt-0.5 h-5 w-5 shrink-0 text-teal-600 dark:text-teal-400" />
                <p className="leading-relaxed">{notice}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="code" className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  رمز التحقق
                </Label>
                <Input
                  id="code"
                  ref={codeRef}
                  value={code}
                  /* Digits only, and never more than six: the box refuses
                     what the server would refuse, instead of accepting it
                     and spending one of five attempts to say so. */
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="000000"
                  required
                  dir="ltr"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  className="h-14 rounded-xl border-slate-200 bg-white text-center text-2xl font-bold tracking-[0.5em] placeholder:tracking-[0.5em] placeholder:text-slate-300 focus-visible:ring-teal-500 dark:border-slate-800 dark:bg-slate-900"
                />
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  الرمز صالح لمدة قصيرة ولمرة واحدة. إن لم تجده، راجع مجلد الرسائل غير المرغوب فيها.
                </p>
              </div>

              {error && (
                <Alert variant="destructive" className="rounded-xl">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                disabled={loading || code.length !== 6}
                className="h-12 w-full rounded-xl bg-gradient-to-l from-teal-600 to-emerald-600 text-base font-semibold text-white shadow-lg shadow-teal-600/20 transition-transform hover:scale-[1.01] hover:from-teal-700 hover:to-emerald-700 disabled:scale-100 disabled:opacity-70"
              >
                {loading ? (
                  <>
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    جاري التحقق...
                  </>
                ) : (
                  "تأكيد الدخول"
                )}
              </Button>

              <div className="flex items-center justify-between text-sm">
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={cooldown > 0 || loading}
                  className="font-medium text-teal-700 transition-colors hover:text-teal-800 disabled:cursor-default disabled:text-slate-400 dark:text-teal-400 dark:hover:text-teal-300 dark:disabled:text-slate-600"
                >
                  {cooldown > 0 ? `إعادة الإرسال بعد ${cooldown} ثانية` : "لم يصلني الرمز، أعد الإرسال"}
                </button>

                <button
                  type="button"
                  onClick={backToPassword}
                  className="inline-flex items-center gap-1 font-medium text-slate-500 transition-colors hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                >
                  <ArrowLeft className="h-4 w-4" />
                  حساب آخر
                </button>
              </div>
            </form>
            ) : (
            /* ------------------------------------------------- step one */
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  البريد الإلكتروني
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@amaso.site"
                  required
                  autoComplete="username"
                  dir="ltr"
                  className="h-12 rounded-xl border-slate-200 bg-white text-left placeholder:text-slate-400 focus-visible:ring-teal-500 dark:border-slate-800 dark:bg-slate-900"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  كلمة المرور
                </Label>
                <PasswordInput
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="h-12 rounded-xl border-slate-200 bg-white pl-12 placeholder:text-slate-400 focus-visible:ring-teal-500 dark:border-slate-800 dark:bg-slate-900"
                />
              </div>

              {error && (
                <Alert variant="destructive" className="rounded-xl">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="h-12 w-full rounded-xl bg-gradient-to-l from-teal-600 to-emerald-600 text-base font-semibold text-white shadow-lg shadow-teal-600/20 transition-transform hover:scale-[1.01] hover:from-teal-700 hover:to-emerald-700 disabled:scale-100 disabled:opacity-70"
              >
                {loading ? (
                  <>
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    جاري تسجيل الدخول...
                  </>
                ) : (
                  "تسجيل الدخول"
                )}
              </Button>
            </form>
            )}

          </div>
        </div>
      </div>

      {/* ----------------------------------------------------------- panel */}
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-teal-700 via-teal-800 to-emerald-900 lg:flex lg:w-[48%]">
        {/* Two soft blooms and a grid, so the panel has depth without needing
            a photograph the association has not supplied yet. */}
        <div className="pointer-events-none absolute -left-24 -top-24 h-96 w-96 rounded-full bg-emerald-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -right-16 h-96 w-96 rounded-full bg-amber-400/15 blur-3xl" />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
            backgroundSize: "44px 44px",
          }}
        />

        <div className="relative flex flex-col justify-between p-14 text-white">
          <div className="flex items-center gap-3">
            <Logo className="h-12 w-12" size={96} plate={false} />
            <span className="text-sm font-semibold tracking-[0.2em]" dir="ltr">
              AMASO
            </span>
          </div>

          <div>
            <h2 className="text-4xl font-bold leading-[1.3]">{ORG_NAME}</h2>
            <p className="mt-5 max-w-md text-lg leading-relaxed text-teal-50/85">
              نظام إدارة الكفالات والأسر المستفيدة — من ملف الأسرة إلى كشف
              الكفيل، ومن نقطة التلميذ إلى ميزانية السنة.
            </p>

            <div className="mt-10 flex flex-wrap gap-3">
              {[
                { icon: ShieldCheck, label: "بيانات محمية" },
                { icon: Lock, label: "صلاحيات حسب الدور" },
              ].map(({ icon: Icon, label }) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium ring-1 ring-white/15 backdrop-blur"
                >
                  <Icon className="h-4 w-4 text-amber-300" />
                  {label}
                </span>
              ))}
            </div>
          </div>

          <p className="text-sm text-teal-100/60">
            © {new Date().getFullYear()} {ORG_NAME}
          </p>
        </div>
      </div>
    </div>
  )
}
