"use client"

import Link from "next/link"
import { AlertTriangle, ArrowLeft, RefreshCw, type LucideIcon } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

/**
 * The pieces every role's dashboard is assembled from.
 *
 * Kept apart from the dashboards themselves so the five of them look like one
 * application: a figure is drawn the same way whether it is a balance on the
 * accountant's screen or a headcount on the social worker's.
 */

const CURRENCY = new Intl.NumberFormat("ar-MA", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  numberingSystem: "latn",
})

export const WHOLE = new Intl.NumberFormat("ar-MA", { numberingSystem: "latn" })

export function money(value: number): string {
  return `${CURRENCY.format(value || 0)} د.م`
}

/** "2026-10-04" -> "04/10/2026", the order the association writes dates in. */
export function shortDate(value: string | null | undefined): string {
  if (!value) return "—"
  const [y, m, d] = value.slice(0, 10).split("-")
  return `${d}/${m}/${y}`
}

// --------------------------------------------------------------- heading

export function DashboardHeading({
  title,
  subtitle,
  onRefresh,
  loading,
}: {
  title: string
  subtitle: string
  onRefresh: () => void
  loading: boolean
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      </div>
      <Button variant="outline" size="sm" onClick={onRefresh} disabled={loading}>
        <RefreshCw className={`ml-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        تحديث
      </Button>
    </div>
  )
}

// -------------------------------------------------------------- attention

export interface AttentionItem {
  /** What is waiting, as a sentence: "3 مصروفات بانتظار الاعتماد". */
  label: string
  href: string
  /** Late rather than merely pending - drawn in red instead of amber. */
  urgent?: boolean
}

/**
 * What somebody can act on today, above everything else.
 *
 * Drawn only when there is something in it. A permanent "nothing to do" box
 * teaches people to stop reading the top of the screen, which is the one
 * place this needs them to look.
 */
export function AttentionBar({ items, loading }: { items: AttentionItem[]; loading: boolean }) {
  if (loading || items.length === 0) return null

  const urgent = items.some((item) => item.urgent)

  return (
    <Card
      className={
        urgent
          ? "border-rose-300 bg-rose-50/70 dark:border-rose-900 dark:bg-rose-950/30"
          : "border-amber-300 bg-amber-50/70 dark:border-amber-900 dark:bg-amber-950/30"
      }
    >
      <CardContent className="flex flex-wrap items-center justify-between gap-4 py-4">
        <div className="flex items-center gap-3">
          <span className={`rounded-full p-2 ${urgent ? "bg-rose-500/15" : "bg-amber-500/15"}`}>
            <AlertTriangle
              className={`h-5 w-5 ${urgent ? "text-rose-600 dark:text-rose-400" : "text-amber-600 dark:text-amber-400"}`}
            />
          </span>
          <p className="font-semibold text-foreground">يحتاج إلى متابعتك</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {items.map((item) => (
            <Button
              key={item.label}
              asChild
              size="sm"
              variant="outline"
              className={item.urgent ? "border-rose-300 text-rose-700 dark:text-rose-300" : undefined}
            >
              <Link href={item.href}>
                {item.label}
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// ----------------------------------------------------------------- metric

const TONES = {
  emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  orange: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  teal: "bg-teal-500/10 text-teal-600 dark:text-teal-400",
  rose: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  indigo: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
  blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  pink: "bg-pink-500/10 text-pink-600 dark:text-pink-400",
  violet: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  slate: "bg-slate-500/10 text-slate-600 dark:text-slate-300",
} as const

export type Tone = keyof typeof TONES

export function Metric({
  label,
  value,
  hint,
  icon: Icon,
  tone,
  loading,
  href,
}: {
  label: string
  value: string
  hint: string
  icon: LucideIcon
  tone: Tone
  loading: boolean
  /** Where the figure comes from, so a number on the dashboard is one click from its rows. */
  href?: string
}) {
  const body = (
    <Card className={href ? "transition-colors hover:border-primary/40" : undefined}>
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

  return href ? <Link href={href}>{body}</Link> : body
}

export function MetricRow({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{children}</div>
}

// ------------------------------------------------------------ list cards

export function Panel({
  title,
  icon: Icon,
  action,
  children,
  className,
}: {
  title: string
  icon?: LucideIcon
  /** A link to the full list, top-left of the card. */
  action?: { label: string; href: string }
  children: React.ReactNode
  className?: string
}) {
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2 text-base">
          {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
          {title}
        </CardTitle>
        {action && (
          <Button asChild variant="ghost" size="sm" className="h-8 text-xs">
            <Link href={action.href}>
              {action.label}
              <ArrowLeft className="h-3.5 w-3.5" />
            </Link>
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-3">{children}</CardContent>
    </Card>
  )
}

/** One line of a list card: a name and its detail on the right, a figure on the left. */
export function Row({
  title,
  detail,
  aside,
  asideClassName,
  href,
}: {
  title: string
  detail?: string
  aside?: React.ReactNode
  asideClassName?: string
  href?: string
}) {
  const content = (
    <div
      className={`flex items-center justify-between gap-3 rounded-lg border border-border p-3 ${
        href ? "transition-colors hover:bg-muted/50" : ""
      }`}
    >
      <div className="min-w-0 text-right">
        <p className="truncate text-sm font-medium text-foreground">{title}</p>
        {detail && <p className="truncate text-xs text-muted-foreground">{detail}</p>}
      </div>
      {aside !== undefined && (
        <span className={`shrink-0 text-sm font-semibold ${asideClassName ?? "text-foreground"}`}>{aside}</span>
      )}
    </div>
  )

  return href ? <Link href={href}>{content}</Link> : content
}

export function RowsSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className="h-14 w-full" />
      ))}
    </>
  )
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <p className="py-8 text-center text-sm text-muted-foreground">{children}</p>
}

// ---------------------------------------------------------- quick actions

export interface QuickAction {
  label: string
  href: string
  icon: LucideIcon
  /**
   * Who may use it. Omitted means anyone - reading is open to every account.
   * Mirrors the backend gate on whatever the action writes, so nobody is
   * offered a button that answers 403.
   */
  roles?: readonly string[]
  /** The one thing this role does most - drawn filled instead of outlined. */
  primary?: boolean
}

/**
 * The role is passed in rather than read here: the page reads it once after
 * mount, because on the server there is no signed-in user and reading
 * localStorage during render would draw one set of buttons there and
 * another in the browser.
 */
export function QuickActions({ actions, role }: { actions: QuickAction[]; role: string | null }) {
  const visible = actions.filter((action) => !action.roles || (!!role && action.roles.includes(role)))

  if (visible.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">إجراءات سريعة</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {visible.map(({ label, href, icon: Icon, primary }) => (
          // Link, not window.location: moving one screen sideways should not
          // reload the whole application.
          <Button
            key={href + label}
            asChild
            variant={primary ? "default" : "outline"}
            className="h-auto justify-start py-3"
          >
            <Link href={href}>
              <Icon className={`ml-2 h-4 w-4 ${primary ? "" : "text-muted-foreground"}`} />
              {label}
            </Link>
          </Button>
        ))}
      </CardContent>
    </Card>
  )
}
