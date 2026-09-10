"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowRight, Eye, EyeOff, Loader2, Lock, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Logo } from "@/components/landing/logo"
import { ThemeToggle } from "@/components/theme-toggle"
import api from "@/lib/api"
import { DEMO_ACCOUNTS } from "@/lib/roles"

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
export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      await api.login(email, password)
      router.push("/dashboard")
    } catch (err: any) {
      setError(err.message || "بيانات الدخول غير صحيحة")
      setLoading(false)
    }
    // On success the redirect above unmounts this page, so `loading` stays
    // true and the button keeps its pending state until it goes - rather
    // than flicking back to "sign in" for the moment before navigation.
  }

  const fillDemoAccount = (demoEmail: string, demoPassword: string) => {
    setEmail(demoEmail)
    setPassword(demoPassword)
    setError("")
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
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">أهلاً بعودتك</h1>
              <p className="mt-2 text-slate-500 dark:text-slate-400">
                سجّل دخولك للوصول إلى نظام إدارة الجمعية
              </p>
            </div>

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
                  placeholder="admin@amaso.org"
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
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                    dir="ltr"
                    className="h-12 rounded-xl border-slate-200 bg-white pl-12 text-left placeholder:text-slate-400 focus-visible:ring-teal-500 dark:border-slate-800 dark:bg-slate-900"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                    className="absolute inset-y-0 left-0 flex items-center px-4 text-slate-400 transition-colors hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
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

            {/* --------------------------------------------- demo accounts */}
            <div className="mt-8">
              <div className="mb-3 flex items-center gap-3">
                <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
                <span className="text-xs font-medium text-slate-400">حسابات تجريبية</span>
                <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
              </div>

              <div className="grid gap-2">
                {DEMO_ACCOUNTS.map((account) => (
                  <button
                    key={account.email}
                    type="button"
                    onClick={() => fillDemoAccount(account.email, account.password)}
                    className="group flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-right transition-all hover:border-teal-300 hover:bg-teal-50/60 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-teal-800 dark:hover:bg-slate-800"
                  >
                    <span className="text-xs text-slate-400 group-hover:text-teal-600 dark:group-hover:text-teal-400" dir="ltr">
                      {account.email}
                    </span>
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                      {account.label}
                    </span>
                  </button>
                ))}
              </div>

              <p className="mt-3 text-center text-xs text-slate-400">
                كلمة المرور لجميع الحسابات التجريبية:{" "}
                <span className="font-semibold text-slate-500 dark:text-slate-300" dir="ltr">password</span>
              </p>
            </div>
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
