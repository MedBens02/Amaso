"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import {
  AlertTriangle,
  ArrowLeft,
  Banknote,
  GraduationCap,
  HandCoins,
  Heart,
  Landmark,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  UserCheck,
  Users,
  Wallet,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import api from "@/lib/api"

/**
 * The main dashboard.
 *
 * It leads with what somebody can act on today - drafts waiting for approval,
 * families short of their sponsorship target - rather than with a count of
 * orphans, and it reads its figures from the database's own aggregates
 * (/reports/annual, /reports/sponsorship-gaps) instead of pulling thousands
 * of rows to add up in the browser.
 *
 * The screen this replaced is still in the tree at dashboard-old/, off the
 * menu, in case something on it turns out to be missed.
 */

const CURRENCY = new Intl.NumberFormat("ar-MA", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  numberingSystem: "latn",
})

const WHOLE = new Intl.NumberFormat("ar-MA", { numberingSystem: "latn" })

function money(value: number): string {
  return `${CURRENCY.format(value || 0)} د.م`
}

interface AnnualReport {
  period: { from: string; to: string }
  financial: {
    totals: {
      income: number
      expense: number
      balance: number
      income_count: number
      expense_count: number
      from_donors: number
    }
    expense_by_category: Array<{ label: string; total: number; count: number }>
  }
  beneficiaries: {
    widows: number
    orphans: number
    families_with_orphans: number
    average_orphans: number
    sponsored_widows: number
    sponsorship_coverage: number
    disability_rate: number
  }
  monthly: Array<{ label: string; income: number; expense: number; balance: number }>
}

interface GapsReport {
  target: number
  totals: {
    families_with_gap: number
    unsponsored: number
    orphans_affected: number
    total_shortfall: number
  }
  families: Array<{
    widow_id: number
    full_name: string
    neighborhood: string | null
    orphans_count: number
    covered: number
    shortfall: number
  }>
}

export default function DashboardPage() {
  const [annual, setAnnual] = useState<AnnualReport | null>(null)
  const [gaps, setGaps] = useState<GapsReport | null>(null)
  const [accounts, setAccounts] = useState<any[]>([])
  const [pending, setPending] = useState({ incomes: 0, expenses: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const load = async () => {
    setLoading(true)
    setError("")

    try {
      // Every one of these is small: the two reports are aggregated by the
      // database, and the draft counts ask for a single row purely to read
      // meta.total off the paginator.
      const [annualRes, gapsRes, accountsRes, draftIncomes, draftExpenses] = await Promise.all([
        api.getAnnualReport(),
        api.getSponsorshipGaps(),
        api.getBankAccounts(),
        api.getIncomes({ status: "Draft", per_page: 1 }),
        api.getExpenses({ status: "Draft", per_page: 1 }),
      ])

      setAnnual(annualRes.data)
      setGaps(gapsRes.data)
      setAccounts(accountsRes.data ?? [])
      setPending({
        incomes: (draftIncomes as any).meta?.total ?? 0,
        expenses: (draftExpenses as any).meta?.total ?? 0,
      })
    } catch (err) {
      console.error("Error loading dashboard:", err)
      setError(err instanceof Error ? err.message : "تعذر تحميل بيانات لوحة التحكم")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const totals = annual?.financial.totals
  const people = annual?.beneficiaries
  const cashOnHand = accounts.reduce((sum, account) => sum + Number(account.balance || 0), 0)
  const pendingTotal = pending.incomes + pending.expenses

  const chartData = (annual?.monthly ?? []).map((month) => ({
    // "2026-01" -> "01", so six or nine labels fit without overlapping.
    label: month.label.slice(5),
    الإيرادات: month.income,
    المصروفات: month.expense,
  }))

  const topExpenseCategories = (annual?.financial.expense_by_category ?? []).slice(0, 5)
  const largestExpense = topExpenseCategories[0]?.total || 1

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeading period={null} onRefresh={load} loading={loading} />
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>تعذر تحميل البيانات</AlertTitle>
          <AlertDescription className="flex items-center justify-between gap-4">
            <span>{error}</span>
            <Button size="sm" variant="outline" onClick={load}>
              إعادة المحاولة
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeading period={annual?.period ?? null} onRefresh={load} loading={loading} />

      {/* ------------------------------------------------ needs attention */}
      {!loading && pendingTotal > 0 && (
        <Card className="border-amber-300 bg-amber-50/70 dark:border-amber-900 dark:bg-amber-950/30">
          <CardContent className="flex flex-wrap items-center justify-between gap-4 py-4">
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-amber-500/15 p-2">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </span>
              <div>
                <p className="font-semibold text-foreground">
                  {WHOLE.format(pendingTotal)} عملية بانتظار الاعتماد
                </p>
                <p className="text-sm text-muted-foreground">
                  لا تدخل في الأرصدة ولا في التقارير قبل اعتمادها
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {pending.incomes > 0 && (
                <Button asChild size="sm" variant="outline">
                  <Link href="/dashboard/incomes">
                    {WHOLE.format(pending.incomes)} إيراد
                    <ArrowLeft className="mr-2 h-4 w-4" />
                  </Link>
                </Button>
              )}
              {pending.expenses > 0 && (
                <Button asChild size="sm" variant="outline">
                  <Link href="/dashboard/expenses">
                    {WHOLE.format(pending.expenses)} مصروف
                    <ArrowLeft className="mr-2 h-4 w-4" />
                  </Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* --------------------------------------------------------- money */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          loading={loading}
          label="إيرادات السنة"
          value={money(totals?.income ?? 0)}
          hint={`${WHOLE.format(totals?.income_count ?? 0)} عملية معتمدة`}
          icon={HandCoins}
          tone="emerald"
        />
        <Metric
          loading={loading}
          label="مصروفات السنة"
          value={money(totals?.expense ?? 0)}
          hint={`${WHOLE.format(totals?.expense_count ?? 0)} عملية معتمدة`}
          icon={Wallet}
          tone="orange"
        />
        <Metric
          loading={loading}
          label="الفائض"
          value={money(totals?.balance ?? 0)}
          hint={(totals?.balance ?? 0) >= 0 ? "الإيرادات تغطي المصروفات" : "المصروفات تفوق الإيرادات"}
          icon={(totals?.balance ?? 0) >= 0 ? TrendingUp : TrendingDown}
          tone={(totals?.balance ?? 0) >= 0 ? "teal" : "rose"}
        />
        <Metric
          loading={loading}
          label="الرصيد المتوفر"
          value={money(cashOnHand)}
          hint={`موزّع على ${WHOLE.format(accounts.length)} حساب`}
          icon={Banknote}
          tone="indigo"
        />
      </div>

      {/* -------------------------------------------------- beneficiaries */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          loading={loading}
          label="الأسر المستفيدة"
          value={WHOLE.format(people?.widows ?? 0)}
          hint={`بمعدل ${people?.average_orphans ?? 0} يتيم لكل أسرة`}
          icon={Users}
          tone="blue"
        />
        <Metric
          loading={loading}
          label="الأيتام"
          value={WHOLE.format(people?.orphans ?? 0)}
          hint={`${WHOLE.format(people?.families_with_orphans ?? 0)} أسرة لديها أيتام`}
          icon={Heart}
          tone="pink"
        />
        <Metric
          loading={loading}
          label="أسر مكفولة"
          value={WHOLE.format(people?.sponsored_widows ?? 0)}
          hint={`من أصل ${WHOLE.format(people?.widows ?? 0)} أسرة`}
          icon={UserCheck}
          tone="violet"
        />
        <Card>
          <CardContent className="space-y-3 py-5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">نسبة التغطية</span>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </div>
            {loading ? (
              <>
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-2 w-full" />
              </>
            ) : (
              <>
                <p className="text-2xl font-bold text-foreground">
                  {WHOLE.format(people?.sponsorship_coverage ?? 0)}%
                </p>
                <Progress value={people?.sponsorship_coverage ?? 0} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  {WHOLE.format(gaps?.totals.unsponsored ?? 0)} أسرة بلا كفيل
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ---------------------------------------------- monthly + expenses */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">الحركة الشهرية</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[280px] w-full" />
            ) : chartData.length === 0 ? (
              <Empty>لا توجد حركة مسجلة في هذه السنة بعد</Empty>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                  <defs>
                    <linearGradient id="d2-income" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0d9488" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="d2-expense" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} className="text-xs" />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    width={70}
                    className="text-xs"
                    tickFormatter={(value: number) => WHOLE.format(value)}
                  />
                  <Tooltip
                    formatter={(value: number) => money(value)}
                    contentStyle={{
                      borderRadius: "0.75rem",
                      border: "1px solid hsl(var(--border))",
                      background: "hsl(var(--popover))",
                      color: "hsl(var(--popover-foreground))",
                      direction: "rtl",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="الإيرادات"
                    stroke="#0d9488"
                    strokeWidth={2}
                    fill="url(#d2-income)"
                  />
                  <Area
                    type="monotone"
                    dataKey="المصروفات"
                    stroke="#f97316"
                    strokeWidth={2}
                    fill="url(#d2-expense)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">أبواب الصرف الكبرى</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              [0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-9 w-full" />)
            ) : topExpenseCategories.length === 0 ? (
              <Empty>لا توجد مصروفات معتمدة بعد</Empty>
            ) : (
              topExpenseCategories.map((category) => (
                <div key={category.label} className="space-y-1.5">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-xs text-muted-foreground">{money(category.total)}</span>
                    <span className="truncate text-sm font-medium text-foreground">{category.label}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-orange-500"
                      style={{ width: `${Math.max(4, (category.total / largestExpense) * 100)}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* ------------------------------------------------ accounts + gaps */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Landmark className="h-4 w-4 text-muted-foreground" />
              الحسابات البنكية
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              [0, 1].map((i) => <Skeleton key={i} className="h-16 w-full" />)
            ) : accounts.length === 0 ? (
              <Empty>لا توجد حسابات مسجلة</Empty>
            ) : (
              accounts.map((account) => (
                <div
                  key={account.id}
                  className="flex items-center justify-between rounded-lg border border-border p-3"
                >
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {money(Number(account.balance))}
                  </span>
                  <div className="text-right">
                    <p className="font-medium text-foreground">{account.label}</p>
                    <p className="text-xs text-muted-foreground">{account.bank_name}</p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">أسر تحتاج كفالة</CardTitle>
            {!loading && gaps && gaps.totals.total_shortfall > 0 && (
              <Badge variant="secondary">عجز {money(gaps.totals.total_shortfall)}</Badge>
            )}
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              [0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)
            ) : !gaps || gaps.families.length === 0 ? (
              <Empty>كل الأسر مغطاة بالكامل</Empty>
            ) : (
              <>
                {gaps.families.slice(0, 5).map((family) => (
                  <div
                    key={family.widow_id}
                    className="flex items-center justify-between rounded-lg border border-border p-3"
                  >
                    <span className="text-sm font-semibold text-rose-600 dark:text-rose-400">
                      ينقص {money(family.shortfall)}
                    </span>
                    <div className="text-right">
                      <p className="text-sm font-medium text-foreground">{family.full_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {family.neighborhood ?? "—"} · {WHOLE.format(family.orphans_count)} يتيم
                      </p>
                    </div>
                  </div>
                ))}
                <Button asChild variant="ghost" size="sm" className="w-full">
                  <Link href="/dashboard/reports">
                    عرض القائمة الكاملة ({WHOLE.format(gaps.totals.families_with_gap)})
                    <ArrowLeft className="mr-2 h-4 w-4" />
                  </Link>
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* -------------------------------------------------- quick actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">إجراءات سريعة</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "الأرامل", href: "/dashboard/widows", icon: Users },
            { label: "الأيتام", href: "/dashboard/orphans", icon: Heart },
            { label: "الإيرادات", href: "/dashboard/incomes", icon: HandCoins },
            { label: "المصروفات", href: "/dashboard/expenses", icon: Wallet },
          ].map(({ label, href, icon: Icon }) => (
            // Link, not window.location: these used to reload the whole
            // application to move one screen sideways.
            <Button key={href} asChild variant="outline" className="h-auto justify-start py-3">
              <Link href={href}>
                <Icon className="ml-2 h-4 w-4 text-muted-foreground" />
                {label}
              </Link>
            </Button>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

function PageHeading({
  period,
  onRefresh,
  loading,
}: {
  period: { from: string; to: string } | null
  onRefresh: () => void
  loading: boolean
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">لوحة التحكم</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {period ? `الفترة: ${period.from} — ${period.to}` : "نظرة عامة على نشاط الجمعية"}
        </p>
      </div>
      <Button variant="outline" size="sm" onClick={onRefresh} disabled={loading}>
        <RefreshCw className={`ml-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        تحديث
      </Button>
    </div>
  )
}

const TONES = {
  emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  orange: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  teal: "bg-teal-500/10 text-teal-600 dark:text-teal-400",
  rose: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  indigo: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
  blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  pink: "bg-pink-500/10 text-pink-600 dark:text-pink-400",
  violet: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
} as const

function Metric({
  label,
  value,
  hint,
  icon: Icon,
  tone,
  loading,
}: {
  label: string
  value: string
  hint: string
  icon: React.ComponentType<{ className?: string }>
  tone: keyof typeof TONES
  loading: boolean
}) {
  return (
    <Card>
      <CardContent className="py-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            {loading ? (
              <>
                <Skeleton className="mt-2 h-7 w-28" />
                <Skeleton className="mt-2 h-3 w-20" />
              </>
            ) : (
              <>
                <p className="mt-1 truncate text-2xl font-bold text-foreground" title={value}>
                  {value}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
              </>
            )}
          </div>
          <span className={`shrink-0 rounded-xl p-2.5 ${TONES[tone]}`}>
            <Icon className="h-5 w-5" />
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="py-8 text-center text-sm text-muted-foreground">{children}</p>
}
