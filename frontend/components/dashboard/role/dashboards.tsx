"use client"

import {
  ArrowLeftRight,
  BarChart3,
  Bus,
  CalendarClock,
  FileText,
  GraduationCap,
  HandCoins,
  HandHeart,
  History,
  Plus,
  School,
  Settings,
  UserCog,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react"
import { ROLE_GROUPS } from "@/lib/roles"
import type { DashboardData } from "./types"
import { AttentionBar, DashboardHeading, QuickActions, WHOLE, money, type AttentionItem, type QuickAction } from "./widgets"
import {
  AccountHealth,
  ApprovalQueue,
  BankAccounts,
  EducationMetrics,
  EnrollmentBreakdown,
  FamilyMetrics,
  FinanceMetrics,
  IddaCases,
  MonthlyChart,
  MyDrafts,
  RecentActivity,
  RecentFamilies,
  SponsorshipGaps,
  TopCategories,
  TransportMonths,
  Unenrolled,
} from "./sections"

/**
 * One dashboard per role, assembled from the cards in sections.tsx.
 *
 * Each starts with what that person can act on today, then the figures that
 * describe their part of the association, then the lists behind them, then
 * the buttons for what they do most. The order is the argument: nobody
 * should have to scroll past somebody else's work to find their own.
 *
 * Quick actions carry the same role lists the API gates on (ROLE_GROUPS),
 * so a button is only offered to someone it will work for.
 */

interface Props {
  data: DashboardData | null
  loading: boolean
  onRefresh: () => void
  role: string | null
}

// ---------------------------------------------------------- attention

function financeAttention(data: DashboardData | null): AttentionItem[] {
  const f = data?.sections.finance
  if (!f) return []

  const items: AttentionItem[] = []
  if (f.pending.incomes.count > 0)
    items.push({ label: `${WHOLE.format(f.pending.incomes.count)} إيراد بانتظار الاعتماد`, href: "/dashboard/incomes?status=Draft" })
  if (f.pending.expenses.count > 0)
    items.push({ label: `${WHOLE.format(f.pending.expenses.count)} مصروف بانتظار الاعتماد`, href: "/dashboard/expenses?status=Draft" })
  if (f.pending.transfers.count > 0)
    items.push({ label: `${WHOLE.format(f.pending.transfers.count)} تحويل بانتظار الاعتماد`, href: "/dashboard/transfers?status=Draft" })
  if (f.untransferred.count > 0)
    items.push({
      label: `${WHOLE.format(f.untransferred.count)} إيراد نقدي لم يُودَع (${money(f.untransferred.amount)})`,
      href: "/dashboard/incomes",
    })
  return items
}

function familiesAttention(data: DashboardData | null): AttentionItem[] {
  const fam = data?.sections.families
  if (!fam) return []

  const items: AttentionItem[] = []
  if (fam.counts.idda_awaiting > 0)
    items.push({
      label: `${WHOLE.format(fam.counts.idda_awaiting)} حالة انتهت عدّتها تنتظر القرار`,
      href: "/dashboard/widows",
      urgent: true,
    })
  const soon = fam.idda.filter((i) => !i.ended).length
  if (soon > 0) items.push({ label: `${WHOLE.format(soon)} عدّة تنتهي خلال 30 يوماً`, href: "/dashboard/widows" })
  return items
}

function educationAttention(data: DashboardData | null): AttentionItem[] {
  const edu = data?.sections.education
  if (!edu) return []

  const items: AttentionItem[] = []
  if (!edu.year) {
    items.push({ label: "لم تُفتح السنة الدراسية الحالية", href: "/dashboard/education/years", urgent: true })
    return items
  }
  const overdue = edu.transport.months.filter((m) => m.overdue).length
  if (overdue > 0)
    items.push({
      label: `${WHOLE.format(overdue)} شهر نقل انتهى ولم يُرحَّل`,
      href: "/dashboard/education/transport",
      urgent: true,
    })
  if (!edu.transport.current_month_opened)
    items.push({ label: "شهر النقل الحالي لم يُفتح بعد", href: "/dashboard/education/transport" })
  if (edu.unenrolled.count > 0)
    items.push({ label: `${WHOLE.format(edu.unenrolled.count)} طفل متمدرس بلا تسجيل`, href: "/dashboard/education" })
  return items
}

// ------------------------------------------------------- quick actions

const FINANCE_ACTIONS: QuickAction[] = [
  { label: "إيراد جديد", href: "/dashboard/incomes?new=1", icon: HandCoins, roles: ROLE_GROUPS.finance, primary: true },
  { label: "مصروف جديد", href: "/dashboard/expenses?new=1", icon: Wallet, roles: ROLE_GROUPS.expenseEntry },
  { label: "تحويل بين الحسابات", href: "/dashboard/transfers?new=1", icon: ArrowLeftRight, roles: ROLE_GROUPS.finance },
  { label: "متبرع أو كفيل جديد", href: "/dashboard/donors?new=1", icon: HandHeart, roles: ROLE_GROUPS.finance },
]

const FAMILY_ACTIONS: QuickAction[] = [
  { label: "أسرة جديدة", href: "/dashboard/widows?new=1", icon: UserPlus, roles: ROLE_GROUPS.families, primary: true },
  { label: "تسجيل مصروف لأسرة", href: "/dashboard/expenses?new=1", icon: Wallet, roles: ROLE_GROUPS.expenseEntry },
  { label: "مجموعات المستفيدين", href: "/dashboard/beneficiary-groups", icon: Users, roles: ROLE_GROUPS.families },
  { label: "حالات يتيم جديد", href: "/dashboard/widows", icon: CalendarClock },
]

const EDUCATION_ACTIONS: QuickAction[] = [
  { label: "التسجيلات والنقط", href: "/dashboard/education", icon: GraduationCap, roles: ROLE_GROUPS.education, primary: true },
  { label: "حساب شهر النقل", href: "/dashboard/education/transport", icon: Bus, roles: ROLE_GROUPS.education },
  { label: "مستفيدو النقل", href: "/dashboard/education/transport/riders", icon: Users, roles: ROLE_GROUPS.education },
  { label: "المؤسسات التعليمية", href: "/dashboard/education/schools", icon: School, roles: ROLE_GROUPS.education },
]

const REPORT_ACTION: QuickAction = { label: "التقارير", href: "/dashboard/reports", icon: FileText }

// --------------------------------------------------------- dashboards

/** The books. The accountant opens this to approve, bank and reconcile. */
export function AccountantDashboard({ data, loading, onRefresh, role }: Props) {
  const f = data?.sections.finance

  return (
    <div className="space-y-6">
      <DashboardHeading
        title="لوحة المحاسب"
        subtitle={f ? `السنة المالية ${f.fiscal_year?.year ?? "—"} · الفترة ${f.period.from} — ${f.period.to}` : "الدفاتر والاعتمادات"}
        onRefresh={onRefresh}
        loading={loading}
      />
      <AttentionBar items={financeAttention(data)} loading={loading} />
      <FinanceMetrics f={f} loading={loading} />
      <div className="grid gap-6 lg:grid-cols-2">
        <ApprovalQueue f={f} loading={loading} />
        <BankAccounts f={f} loading={loading} />
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <MonthlyChart f={f} loading={loading} />
        <TopCategories f={f} loading={loading} />
      </div>
      <QuickActions
        role={role}
        actions={[...FINANCE_ACTIONS, { ...REPORT_ACTION, label: "التقرير المالي", icon: BarChart3 }]}
      />
    </div>
  )
}

/** The families. The social worker opens this to see who needs a decision or a sponsor. */
export function SocialWorkerDashboard({ data, loading, onRefresh, role }: Props) {
  const fam = data?.sections.families
  const edu = data?.sections.education

  return (
    <div className="space-y-6">
      <DashboardHeading title="لوحة الأخصائي الاجتماعي" subtitle="الأسر والأيتام والملف الاجتماعي" onRefresh={onRefresh} loading={loading} />
      <AttentionBar items={[...familiesAttention(data), ...educationAttention(data)]} loading={loading} />
      <FamilyMetrics fam={fam} loading={loading} />
      <div className="grid gap-6 lg:grid-cols-2">
        <IddaCases fam={fam} loading={loading} />
        <SponsorshipGaps fam={fam} loading={loading} />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <MyDrafts fam={fam} loading={loading} />
        <RecentFamilies fam={fam} loading={loading} />
      </div>
      {/* Schooling, compact: theirs until an education officer is appointed. */}
      {(loading || edu) && <EducationMetrics edu={edu} loading={loading} />}
      <QuickActions role={role} actions={[...FAMILY_ACTIONS, REPORT_ACTION]} />
    </div>
  )
}

/** Schooling and transport. The education officer opens this to register, mark and run the month. */
export function EducationOfficerDashboard({ data, loading, onRefresh, role }: Props) {
  const edu = data?.sections.education

  return (
    <div className="space-y-6">
      <DashboardHeading
        title="لوحة مسؤول التعليم"
        subtitle={edu?.year ? `السنة الدراسية ${edu.year.label}` : "التمدرس والنقل المدرسي"}
        onRefresh={onRefresh}
        loading={loading}
      />
      <AttentionBar items={educationAttention(data)} loading={loading} />
      <EducationMetrics edu={edu} loading={loading} />
      <div className="grid gap-6 lg:grid-cols-3">
        <TransportMonths edu={edu} loading={loading} />
        <Unenrolled edu={edu} loading={loading} />
        <EnrollmentBreakdown edu={edu} loading={loading} />
      </div>
      <QuickActions
        role={role}
        actions={[...EDUCATION_ACTIONS, { ...REPORT_ACTION, label: "تقرير الأداء الدراسي", icon: BarChart3 }]}
      />
    </div>
  )
}

/**
 * The whole association, for the person who runs it.
 *
 * Everybody's attention items at once - an administrator is who the late
 * ones get escalated to - then one row of figures per department, rather
 * than each department's full dashboard stacked.
 */
export function AdminDashboard({ data, loading, onRefresh, role, superuser }: Props & { superuser?: boolean }) {
  const f = data?.sections.finance
  const fam = data?.sections.families
  const edu = data?.sections.education
  const acc = data?.sections.accounts

  const attention = [...financeAttention(data), ...familiesAttention(data), ...educationAttention(data)]
  if (acc && acc.counts.password_due + acc.counts.password_expiring > 0) {
    attention.push({
      label: `${WHOLE.format(acc.counts.password_due + acc.counts.password_expiring)} حساب كلمة سرّه مستحقة`,
      href: "/dashboard/users",
    })
  }

  const actions: QuickAction[] = [
    FINANCE_ACTIONS[0],
    FAMILY_ACTIONS[0],
    FINANCE_ACTIONS[1],
    EDUCATION_ACTIONS[0],
    REPORT_ACTION,
    { label: "إعدادات الجمعية", href: "/dashboard/settings", icon: Settings, roles: ["admin", "superuser"] },
    ...(superuser
      ? [
          { label: "إدارة الحسابات", href: "/dashboard/users", icon: UserCog, roles: ["superuser"] },
          { label: "سجل النشاط", href: "/dashboard/audit-log", icon: History, roles: ["superuser"] },
        ]
      : []),
  ].map((action) => ({ ...action, primary: false }))

  return (
    <div className="space-y-6">
      <DashboardHeading
        title={superuser ? "لوحة المستخدم الأعلى" : "لوحة الإدارة"}
        subtitle={f ? `الفترة ${f.period.from} — ${f.period.to}` : "نظرة عامة على نشاط الجمعية"}
        onRefresh={onRefresh}
        loading={loading}
      />
      <AttentionBar items={attention} loading={loading} />

      <SectionTitle icon={Wallet}>المالية</SectionTitle>
      <FinanceMetrics f={f} loading={loading} />

      <SectionTitle icon={Users}>المستفيدون</SectionTitle>
      <FamilyMetrics fam={fam} loading={loading} />

      <SectionTitle icon={GraduationCap}>التعليم</SectionTitle>
      <EducationMetrics edu={edu} loading={loading} />

      <div className="grid gap-6 lg:grid-cols-3">
        <MonthlyChart f={f} loading={loading} />
        <TopCategories f={f} loading={loading} />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <ApprovalQueue f={f} loading={loading} />
        <SponsorshipGaps fam={fam} loading={loading} />
      </div>

      {superuser && (
        <>
          <SectionTitle icon={UserCog}>الحسابات</SectionTitle>
          <div className="grid gap-6 lg:grid-cols-2">
            <AccountHealth acc={acc} loading={loading} />
            <RecentActivity acc={acc} loading={loading} />
          </div>
        </>
      )}

      <QuickActions role={role} actions={actions} />
    </div>
  )
}

function SectionTitle({ icon: Icon, children }: { icon: typeof Plus; children: React.ReactNode }) {
  return (
    <h2 className="flex items-center gap-2 pt-2 text-sm font-semibold text-muted-foreground">
      <Icon className="h-4 w-4" />
      {children}
    </h2>
  )
}
