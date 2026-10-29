"use client"

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
  Banknote,
  Bus,
  CalendarClock,
  ClipboardList,
  GraduationCap,
  HandCoins,
  Heart,
  History,
  Hourglass,
  Landmark,
  ShieldAlert,
  TrendingDown,
  TrendingUp,
  UserCheck,
  UserX,
  Users,
  Wallet,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { getRoleLabel } from "@/lib/roles"
import type { AccountsSection, EducationSection, FamiliesSection, FinanceSection } from "./types"
import { Empty, Metric, MetricRow, Panel, Row, RowsSkeleton, WHOLE, money, shortDate } from "./widgets"

/**
 * The cards each dashboard is built from, one group per section of
 * GET /dashboard. A dashboard is a choice of these, in an order - see
 * dashboards.tsx.
 */

type Loading = { loading: boolean }

// ================================================================ finance

export function FinanceMetrics({ f, loading }: { f?: FinanceSection } & Loading) {
  const t = f?.totals
  const balance = t?.balance ?? 0

  return (
    <MetricRow>
      <Metric
        loading={loading}
        label="إيرادات السنة"
        value={money(t?.income ?? 0)}
        hint={`${WHOLE.format(t?.income_count ?? 0)} عملية معتمدة`}
        icon={HandCoins}
        tone="emerald"
        href="/dashboard/incomes"
      />
      <Metric
        loading={loading}
        label="مصروفات السنة"
        value={money(t?.expense ?? 0)}
        hint={`${WHOLE.format(t?.expense_count ?? 0)} عملية معتمدة`}
        icon={Wallet}
        tone="orange"
        href="/dashboard/expenses"
      />
      <Metric
        loading={loading}
        label="الفائض"
        value={money(balance)}
        hint={balance >= 0 ? "الإيرادات تغطي المصروفات" : "المصروفات تفوق الإيرادات"}
        icon={balance >= 0 ? TrendingUp : TrendingDown}
        tone={balance >= 0 ? "teal" : "rose"}
      />
      <Metric
        loading={loading}
        label="الرصيد المتوفر"
        value={money(f?.cash.total ?? 0)}
        hint={`موزّع على ${WHOLE.format(f?.cash.accounts.length ?? 0)} حساب`}
        icon={Banknote}
        tone="indigo"
        href="/dashboard/transfers"
      />
    </MetricRow>
  )
}

/** The accountant's work: every draft, oldest first, one click from approving it. */
export function ApprovalQueue({ f, loading }: { f?: FinanceSection } & Loading) {
  const pending = f?.pending
  const total = (pending?.incomes.count ?? 0) + (pending?.expenses.count ?? 0)

  return (
    <Panel
      title="بانتظار الاعتماد"
      icon={Hourglass}
      action={
        total > 0
          ? {
              label: `الكل (${WHOLE.format(total)})`,
              // Whichever list actually has drafts in it.
              href: (pending?.incomes.count ?? 0) > 0 ? "/dashboard/incomes?status=Draft" : "/dashboard/expenses?status=Draft",
            }
          : undefined
      }
    >
      {loading ? (
        <RowsSkeleton rows={5} />
      ) : !f || f.queue.length === 0 ? (
        <Empty>لا توجد مسودات. كل ما سُجّل معتمد.</Empty>
      ) : (
        f.queue.map((item) => (
          <Row
            key={`${item.type}-${item.id}`}
            href={item.type === "income" ? "/dashboard/incomes?status=Draft" : "/dashboard/expenses?status=Draft"}
            title={`${item.type === "income" ? "إيراد" : "مصروف"} · ${item.label}`}
            detail={[shortDate(item.date), item.party, item.created_by && `سجّله ${item.created_by}`]
              .filter(Boolean)
              .join(" · ")}
            aside={money(item.amount)}
            asideClassName={item.type === "income" ? "text-emerald-600 dark:text-emerald-400" : "text-orange-600 dark:text-orange-400"}
          />
        ))
      )}
    </Panel>
  )
}

export function BankAccounts({ f, loading }: { f?: FinanceSection } & Loading) {
  return (
    <Panel title="الحسابات البنكية" icon={Landmark} action={{ label: "التحويلات", href: "/dashboard/transfers" }}>
      {loading ? (
        <RowsSkeleton rows={2} />
      ) : !f || f.cash.accounts.length === 0 ? (
        <Empty>لا توجد حسابات مسجلة</Empty>
      ) : (
        f.cash.accounts.map((account) => (
          <Row
            key={account.id}
            title={account.label}
            detail={account.bank_name ?? undefined}
            aside={money(account.balance)}
            asideClassName="text-emerald-600 dark:text-emerald-400"
          />
        ))
      )}
    </Panel>
  )
}

export function MonthlyChart({ f, loading }: { f?: FinanceSection } & Loading) {
  const data = (f?.monthly ?? []).map((month) => ({
    // "2026-01" -> "01", so nine or twelve labels fit without overlapping.
    label: month.label.slice(5),
    الإيرادات: month.income,
    المصروفات: month.expense,
  }))

  return (
    <Panel title="الحركة الشهرية" className="lg:col-span-2">
      {loading ? (
        <Skeleton className="h-[260px] w-full" />
      ) : data.length === 0 ? (
        <Empty>لا توجد حركة معتمدة في هذه السنة بعد</Empty>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
            <defs>
              <linearGradient id="rd-income" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0d9488" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="rd-expense" x1="0" y1="0" x2="0" y2="1">
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
            <Area type="monotone" dataKey="الإيرادات" stroke="#0d9488" strokeWidth={2} fill="url(#rd-income)" />
            <Area type="monotone" dataKey="المصروفات" stroke="#f97316" strokeWidth={2} fill="url(#rd-expense)" />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </Panel>
  )
}

export function TopCategories({ f, loading }: { f?: FinanceSection } & Loading) {
  const rows = f?.top_expense_categories ?? []
  const largest = rows[0]?.total || 1

  return (
    <Panel title="أبواب الصرف الكبرى">
      {loading ? (
        <RowsSkeleton rows={5} />
      ) : rows.length === 0 ? (
        <Empty>لا توجد مصروفات معتمدة بعد</Empty>
      ) : (
        <div className="space-y-4">
          {rows.map((category) => (
            <div key={category.label} className="space-y-1.5">
              <div className="flex items-baseline justify-between gap-3">
                <span className="truncate text-sm font-medium text-foreground">{category.label}</span>
                <span className="shrink-0 text-xs text-muted-foreground">{money(category.total)}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-orange-500"
                  style={{ width: `${Math.max(4, (category.total / largest) * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </Panel>
  )
}

// =============================================================== families

export function FamilyMetrics({ fam, loading }: { fam?: FamiliesSection } & Loading) {
  const c = fam?.counts

  return (
    <MetricRow>
      <Metric
        loading={loading}
        label="الأسر المستفيدة"
        value={WHOLE.format(c?.families ?? 0)}
        hint="دون حالات يتيم جديد"
        icon={Users}
        tone="blue"
        href="/dashboard/widows"
      />
      <Metric
        loading={loading}
        label="الأيتام"
        value={WHOLE.format(c?.orphans ?? 0)}
        hint="في الأسر المستفيدة"
        icon={Heart}
        tone="pink"
        href="/dashboard/orphans"
      />
      <Metric
        loading={loading}
        label="حالات يتيم جديد"
        value={WHOLE.format(c?.idda_active ?? 0)}
        hint={
          (c?.idda_awaiting ?? 0) > 0
            ? `${WHOLE.format(c?.idda_awaiting ?? 0)} انتهت عدّتها وتنتظر القرار`
            : "في فترة العدّة"
        }
        icon={CalendarClock}
        tone={(c?.idda_awaiting ?? 0) > 0 ? "rose" : "amber"}
        href="/dashboard/widows"
      />
      <Metric
        loading={loading}
        label="أسر بلا كفيل"
        value={WHOLE.format(fam?.sponsorship.totals.unsponsored ?? 0)}
        hint={`نسبة التغطية ${WHOLE.format(c?.coverage ?? 0)}%`}
        icon={UserCheck}
        tone="violet"
        href="/dashboard/reports"
      />
    </MetricRow>
  )
}

/** عدة cases that are over, or about to be - each one a decision somebody owes the family. */
export function IddaCases({ fam, loading }: { fam?: FamiliesSection } & Loading) {
  return (
    <Panel title="حالات يتيم جديد تقترب نهايتها" icon={CalendarClock} action={{ label: "كل الحالات", href: "/dashboard/widows" }}>
      {loading ? (
        <RowsSkeleton rows={3} />
      ) : !fam || fam.idda.length === 0 ? (
        <Empty>لا توجد عدّة تنتهي خلال الثلاثين يوماً القادمة</Empty>
      ) : (
        fam.idda.map((item) => (
          <Row
            key={item.id}
            href="/dashboard/widows"
            title={item.full_name}
            detail={`${item.neighborhood ?? "—"} · تنتهي ${shortDate(item.end_date)}`}
            aside={
              item.ended ? (
                <Badge variant="destructive">انتهت منذ {WHOLE.format(-item.days)} يوماً</Badge>
              ) : (
                <Badge variant="secondary">بعد {WHOLE.format(item.days)} يوماً</Badge>
              )
            }
          />
        ))
      )}
    </Panel>
  )
}

export function SponsorshipGaps({ fam, loading }: { fam?: FamiliesSection } & Loading) {
  const gaps = fam?.sponsorship

  return (
    <Panel
      title="أسر تحتاج كفالة"
      icon={UserX}
      action={gaps && gaps.totals.families_with_gap > 0 ? { label: `الكل (${WHOLE.format(gaps.totals.families_with_gap)})`, href: "/dashboard/reports" } : undefined}
    >
      {loading ? (
        <RowsSkeleton rows={4} />
      ) : !gaps || gaps.families.length === 0 ? (
        <Empty>كل الأسر مغطاة بالكامل</Empty>
      ) : (
        <>
          <p className="text-xs text-muted-foreground">
            العجز الكلي {money(gaps.totals.total_shortfall)} شهرياً، على أساس {money(gaps.target)} للأسرة
          </p>
          {gaps.families.map((family) => (
            <Row
              key={family.widow_id}
              title={family.full_name}
              detail={`${family.neighborhood ?? "—"} · ${WHOLE.format(family.orphans_count)} يتيم`}
              aside={`ينقص ${money(family.shortfall)}`}
              asideClassName="text-rose-600 dark:text-rose-400"
            />
          ))}
        </>
      )}
    </Panel>
  )
}

/** The aid this person wrote down that the books have not approved yet. */
export function MyDrafts({ fam, loading }: { fam?: FamiliesSection } & Loading) {
  const drafts = fam?.my_drafts

  return (
    <Panel
      title="مصروفاتي بانتظار الاعتماد"
      icon={Hourglass}
      action={drafts && drafts.count > 0 ? { label: "المصروفات", href: "/dashboard/expenses?status=Draft" } : undefined}
    >
      {loading ? (
        <RowsSkeleton rows={3} />
      ) : !drafts || drafts.count === 0 ? (
        <Empty>لا توجد مصروفات سجّلتها تنتظر الاعتماد</Empty>
      ) : (
        <>
          <p className="text-xs text-muted-foreground">
            {WHOLE.format(drafts.count)} مصروف بمجموع {money(drafts.amount)} — يعتمدها المحاسب
          </p>
          {drafts.items.map((item) => (
            <Row
              key={item.id}
              title={item.label}
              detail={[shortDate(item.date), item.details].filter(Boolean).join(" · ")}
              aside={money(item.amount)}
              asideClassName="text-orange-600 dark:text-orange-400"
            />
          ))}
        </>
      )}
    </Panel>
  )
}

export function RecentFamilies({ fam, loading }: { fam?: FamiliesSection } & Loading) {
  return (
    <Panel title="آخر الأسر المنضمّة" icon={Users} action={{ label: "الأرامل", href: "/dashboard/widows" }}>
      {loading ? (
        <RowsSkeleton rows={4} />
      ) : !fam || fam.recent_families.length === 0 ? (
        <Empty>لا توجد أسر مسجلة بعد</Empty>
      ) : (
        fam.recent_families.map((family) => (
          <Row
            key={family.id}
            title={family.full_name}
            detail={family.neighborhood ?? undefined}
            aside={shortDate(family.admission_date)}
            asideClassName="text-xs font-normal text-muted-foreground"
          />
        ))
      )}
    </Panel>
  )
}

// ============================================================== education

export function EducationMetrics({ edu, loading }: { edu?: EducationSection } & Loading) {
  const prev = edu?.previous_year

  return (
    <MetricRow>
      <Metric
        loading={loading}
        label="مسجلون هذه السنة"
        value={WHOLE.format(edu?.enrollments.total ?? 0)}
        hint={edu?.year ? `السنة الدراسية ${edu.year.label}` : "لم تُفتح سنة دراسية بعد"}
        icon={GraduationCap}
        tone="blue"
        href="/dashboard/education"
      />
      <Metric
        loading={loading}
        label="غير مسجلين"
        value={WHOLE.format(edu?.unenrolled.count ?? 0)}
        hint="متمدرسون بلا تسجيل هذه السنة"
        icon={UserX}
        tone={(edu?.unenrolled.count ?? 0) > 0 ? "rose" : "teal"}
        href="/dashboard/education"
      />
      <Metric
        loading={loading}
        label="مستفيدو النقل"
        value={WHOLE.format((edu?.transport.riders.bus ?? 0) + (edu?.transport.riders.allowance ?? 0))}
        hint={`${WHOLE.format(edu?.transport.riders.bus ?? 0)} في الحافلة · ${WHOLE.format(edu?.transport.riders.allowance ?? 0)} بمنحة`}
        icon={Bus}
        tone="indigo"
        href="/dashboard/education/transport/riders"
      />
      <Metric
        loading={loading}
        label="نسبة النجاح"
        value={prev?.pass_rate != null ? `${WHOLE.format(prev.pass_rate)}%` : "—"}
        hint={prev ? `السنة الماضية ${prev.label}` : "لا توجد سنة سابقة"}
        icon={TrendingUp}
        tone="emerald"
        href="/dashboard/reports"
      />
    </MetricRow>
  )
}

const MONTH_BADGE: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  closed: "default",
  partial: "secondary",
  draft: "outline",
}

export function TransportMonths({ edu, loading }: { edu?: EducationSection } & Loading) {
  const months = edu?.transport.months ?? []

  return (
    <Panel title="أشهر النقل المدرسي" icon={Bus} action={{ label: "حساب الشهر", href: "/dashboard/education/transport" }}>
      {loading ? (
        <RowsSkeleton rows={3} />
      ) : months.length === 0 ? (
        <Empty>لم يُفتح أي شهر في هذه السنة الدراسية</Empty>
      ) : (
        <>
          {!edu?.transport.current_month_opened && (
            <p className="text-xs text-amber-700 dark:text-amber-400">لم يُفتح شهر النقل الحالي بعد</p>
          )}
          {[...months].reverse().map((month) => (
            <Row
              key={month.id}
              href="/dashboard/education/transport"
              title={month.label}
              detail={month.overdue ? "انتهى الشهر ولم يُرحَّل بعد" : undefined}
              aside={
                <Badge variant={month.overdue ? "destructive" : MONTH_BADGE[month.status]}>{month.status_label}</Badge>
              }
            />
          ))}
        </>
      )}
    </Panel>
  )
}

export function Unenrolled({ edu, loading }: { edu?: EducationSection } & Loading) {
  const list = edu?.unenrolled

  return (
    <Panel
      title="متمدرسون بلا تسجيل هذه السنة"
      icon={UserX}
      action={list && list.count > 0 ? { label: "التسجيلات", href: "/dashboard/education" } : undefined}
    >
      {loading ? (
        <RowsSkeleton rows={4} />
      ) : !list || list.count === 0 ? (
        <Empty>كل الأطفال المتمدرسين مسجلون هذه السنة</Empty>
      ) : (
        <>
          {list.count > list.items.length && (
            <p className="text-xs text-muted-foreground">
              {WHOLE.format(list.items.length)} من أصل {WHOLE.format(list.count)}
            </p>
          )}
          {list.items.map((child) => (
            <Row
              key={child.id}
              href="/dashboard/education"
              title={child.full_name}
              detail={child.family ? `أسرة ${child.family}` : undefined}
              aside={child.age != null ? `${WHOLE.format(child.age)} سنة` : undefined}
              asideClassName="text-xs font-normal text-muted-foreground"
            />
          ))}
        </>
      )}
    </Panel>
  )
}

const STATUS_ROWS = [
  { key: "enrolled", label: "مسجل", bar: "bg-blue-500" },
  { key: "passed", label: "ناجح", bar: "bg-emerald-500" },
  { key: "failed", label: "راسب", bar: "bg-rose-500" },
  { key: "left", label: "غادر", bar: "bg-slate-400" },
] as const

export function EnrollmentBreakdown({ edu, loading }: { edu?: EducationSection } & Loading) {
  const e = edu?.enrollments
  const total = e?.total || 1

  return (
    <Panel title="حالة التسجيلات" icon={ClipboardList} action={{ label: "التسجيلات", href: "/dashboard/education" }}>
      {loading ? (
        <RowsSkeleton rows={4} />
      ) : !e || e.total === 0 ? (
        <Empty>لا توجد تسجيلات في هذه السنة بعد</Empty>
      ) : (
        <div className="space-y-4">
          {STATUS_ROWS.map(({ key, label, bar }) => (
            <div key={key} className="space-y-1.5">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-sm font-medium text-foreground">{label}</span>
                <span className="text-xs text-muted-foreground">{WHOLE.format(e.by_status[key])}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div className={`h-full rounded-full ${bar}`} style={{ width: `${(e.by_status[key] / total) * 100}%` }} />
              </div>
            </div>
          ))}
          {e.ungraded > 0 && (
            <p className="rounded-lg bg-muted/60 p-2 text-xs text-muted-foreground">
              {WHOLE.format(e.ungraded)} تسجيل بلا أي نقطة بعد
            </p>
          )}
        </div>
      )}
    </Panel>
  )
}

// =============================================================== accounts

export function AccountHealth({ acc, loading }: { acc?: AccountsSection } & Loading) {
  const c = acc?.counts

  return (
    <Panel title="حالة الحسابات" icon={ShieldAlert} action={{ label: "إدارة الحسابات", href: "/dashboard/users" }}>
      {loading ? (
        <RowsSkeleton rows={4} />
      ) : !acc || !c ? (
        <Empty>تعذر تحميل الحسابات</Empty>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 text-center sm:grid-cols-4">
            <Stat label="نشطة" value={c.active} />
            <Stat label="معطّلة" value={c.inactive} />
            <Stat label="كلمة سر مستحقة" value={c.password_due + c.password_expiring} warn />
            <Stat label="لم تدخل قط" value={c.never_signed_in} />
          </div>

          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">حسب الدور</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(acc.by_role).map(([role, n]) => (
                <Badge key={role} variant={n > 0 ? "secondary" : "outline"}>
                  {getRoleLabel(role)}: {WHOLE.format(n)}
                </Badge>
              ))}
            </div>
          </div>

          {acc.two_factor_off.length > 0 && (
            <div className="space-y-2 rounded-lg border border-amber-300 bg-amber-50/60 p-3 dark:border-amber-900 dark:bg-amber-950/30">
              <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">
                {WHOLE.format(acc.two_factor_off.length)} حساب نشط بلا تحقق بخطوتين
              </p>
              <p className="text-xs text-muted-foreground">
                {acc.two_factor_off.map((u) => u.name).join("، ")}
              </p>
            </div>
          )}
        </>
      )}
    </Panel>
  )
}

function Stat({ label, value, warn }: { label: string; value: number; warn?: boolean }) {
  return (
    <div className="rounded-lg border border-border p-2">
      <p className={`text-xl font-bold ${warn && value > 0 ? "text-rose-600 dark:text-rose-400" : "text-foreground"}`}>
        {WHOLE.format(value)}
      </p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  )
}

export function RecentActivity({ acc, loading }: { acc?: AccountsSection } & Loading) {
  return (
    <Panel title="آخر النشاط" icon={History} action={{ label: "سجل النشاط", href: "/dashboard/audit-log" }}>
      {loading ? (
        <RowsSkeleton rows={5} />
      ) : !acc || acc.recent_activity.length === 0 ? (
        <Empty>لا يوجد نشاط مسجل بعد</Empty>
      ) : (
        acc.recent_activity.map((log) => (
          <Row
            key={log.id}
            title={`${log.user_name ?? "—"} · ${log.action_label}`}
            detail={[log.entity_type_label, log.entity_label].filter(Boolean).join(" · ") || undefined}
            aside={log.created_at ? shortDate(log.created_at) : "—"}
            asideClassName="text-xs font-normal text-muted-foreground"
          />
        ))
      )}
    </Panel>
  )
}
