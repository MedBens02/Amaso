"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Home,
  Users,
  Heart,
  GraduationCap,
  HandHeart,
  TrendingUp,
  TrendingDown,
  ArrowLeftRight,
  Calendar,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  FolderOpen,
  LogOut,
  Database,
  Calculator,
  UserCog,
  History,
  Wallet,
  Loader2,
  Bus,
  School,
  ListOrdered,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { isCurrentUserAdmin, isCurrentUserSuperuser } from "@/lib/roles"
import { logout } from "@/lib/auth"
import api from "@/lib/api"

/**
 * One page in the sidebar.
 *
 * Declared rather than inferred: with the flags optional and only set on
 * some entries, TypeScript infers a union per array and then refuses to read
 * a flag that is missing from one branch of it.
 */
interface NavItem {
  name: string
  href: string
  icon: LucideIcon
  /** Hidden from everyone below admin. A superuser counts as an admin. */
  adminOnly?: boolean
  /** Hidden from admins too - accounts and the activity log. */
  superuserOnly?: boolean
}

interface NavGroup {
  /** Stable key: what the open/closed state is remembered under. */
  id: string
  name: string
  icon: LucideIcon
  items: NavItem[]
}

/**
 * The menu, as one structure.
 *
 * It used to be five arrays rendered by five copies of the same twelve
 * lines, all of them always open - so finding a page meant reading past
 * every page in every other section. Now a section is a heading you can
 * fold away, and adding one is adding an entry here.
 *
 * The dashboard stays outside the groups: it is one page, and putting it
 * behind a heading called "main" that contains only itself would be a
 * folder with one thing in it.
 */
const HOME: NavItem = { name: "الرئيسية", href: "/dashboard", icon: Home }

const groups: NavGroup[] = [
  {
    id: "beneficiaries",
    name: "المستفيدون",
    icon: Users,
    items: [
      { name: "الأرامل", href: "/dashboard/widows", icon: Users },
      { name: "الأيتام", href: "/dashboard/orphans", icon: Heart },
      { name: "مجموعات المستفيدين", href: "/dashboard/beneficiary-groups", icon: Users },
    ],
  },
  {
    id: "finance",
    name: "المالية",
    icon: Wallet,
    items: [
      { name: "المتبرعون", href: "/dashboard/donors", icon: HandHeart },
      { name: "الإيرادات", href: "/dashboard/incomes", icon: TrendingUp },
      { name: "المصروفات", href: "/dashboard/expenses", icon: TrendingDown },
      { name: "المشاريع الممولة", href: "/dashboard/budgeted-projects", icon: FolderOpen },
      { name: "التحويلات", href: "/dashboard/transfers", icon: ArrowLeftRight },
      { name: "السنوات المالية", href: "/dashboard/fiscal-years", icon: Calendar },
    ],
  },
  {
    id: "education",
    name: "التعليم",
    icon: GraduationCap,
    // The education section used to be a single page carrying four tabs,
    // one of which held two more. Each of its screens is a page now, so
    // each one is reachable from here instead of only from inside it.
    items: [
      { name: "التسجيلات", href: "/dashboard/education", icon: GraduationCap },
      { name: "النقل المدرسي", href: "/dashboard/education/transport", icon: Bus },
      { name: "المؤسسات التعليمية", href: "/dashboard/education/schools", icon: School },
      { name: "السنوات الدراسية", href: "/dashboard/education/years", icon: Calendar },
      { name: "المستويات التعليمية", href: "/dashboard/education/levels", icon: ListOrdered },
    ],
  },
  {
    id: "references",
    name: "البيانات المرجعية",
    icon: Database,
    items: [
      { name: "المراجع العامة", href: "/dashboard/references", icon: Database },
      { name: "المراجع المحاسبية", href: "/dashboard/accounting-references", icon: Calculator },
    ],
  },
  {
    id: "system",
    name: "النظام",
    icon: Settings,
    items: [
      { name: "التقارير", href: "/dashboard/reports", icon: FileText },
      { name: "الإعدادات", href: "/dashboard/settings", icon: Settings },
      // The two an admin does not get. The API enforces it too
      // (role:superuser); hiding the entries just keeps doors the user
      // cannot open out of the menu.
      { name: "إدارة الحسابات", href: "/dashboard/users", icon: UserCog, superuserOnly: true },
      { name: "سجل النشاط", href: "/dashboard/audit-log", icon: History, superuserOnly: true },
    ],
  },
]

const OPEN_GROUPS_KEY = "amaso.sidebar.openGroups"
const COLLAPSED_KEY = "amaso.sidebar.collapsed"

export function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  // Read after mount: localStorage is not available during SSR, and
  // rendering the admin entry on the server would flash it for everyone.
  const [isAdmin, setIsAdmin] = useState(false)
  const [isSuperuser, setIsSuperuser] = useState(false)
  // Whatever the admin saved on the settings screen, so the sidebar carries
  // the association's own name rather than a generic label.
  const [orgName, setOrgName] = useState("")
  const [signingOut, setSigningOut] = useState(false)
  // Which sections are open. Everything starts open, so the menu on a fresh
  // browser looks like the one everybody already knows.
  const [open, setOpen] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(groups.map((group) => [group.id, true])),
  )

  useEffect(() => {
    setIsAdmin(isCurrentUserAdmin())
    setIsSuperuser(isCurrentUserSuperuser())

    try {
      const savedGroups = window.localStorage.getItem(OPEN_GROUPS_KEY)
      if (savedGroups) {
        const parsed = JSON.parse(savedGroups)
        // Merged rather than replaced, so a section added after somebody
        // last saved their choices is open rather than missing.
        setOpen((current) => ({ ...current, ...parsed }))
      }
      setCollapsed(window.localStorage.getItem(COLLAPSED_KEY) === "1")
    } catch {
      /* a private window, or storage turned off - the defaults are fine */
    }

    api
      .getOrganizationSettings()
      .then((response) => setOrgName(response.data.name ?? ""))
      .catch(() => {
        /* the fallback heading below covers this */
      })
  }, [])

  const remember = (key: string, value: unknown) => {
    try {
      window.localStorage.setItem(key, typeof value === "string" ? value : JSON.stringify(value))
    } catch {
      /* not worth failing a click over */
    }
  }

  const toggleGroup = (id: string) => {
    setOpen((current) => {
      const next = { ...current, [id]: !current[id] }
      remember(OPEN_GROUPS_KEY, next)

      return next
    })
  }

  const toggleCollapsed = () => {
    setCollapsed((current) => {
      remember(COLLAPSED_KEY, current ? "0" : "1")

      return !current
    })
  }

  const visible = (item: NavItem) =>
    (!item.adminOnly || isAdmin) && (!item.superuserOnly || isSuperuser)

  const link = (item: NavItem, nested: boolean) => {
    const isActive = pathname === item.href

    return (
      <Link key={item.href} href={item.href} title={collapsed ? item.name : undefined}>
        <Button
          variant={isActive ? "secondary" : "ghost"}
          className={cn(
            "w-full justify-start font-normal",
            collapsed ? "px-2" : nested ? "pe-3 ps-9" : "px-3",
            isActive && "bg-secondary font-medium",
          )}
        >
          <item.icon className={cn("h-4 w-4 shrink-0", collapsed ? "" : "ml-2")} />
          {!collapsed && <span className="truncate">{item.name}</span>}
        </Button>
      </Link>
    )
  }

  return (
    <div className={cn("flex flex-col border-r bg-background", collapsed ? "w-16" : "w-64")}>
      <div className="flex h-16 items-center justify-between px-4 border-b">
        {!collapsed && (
          <h2 className="line-clamp-2 text-sm font-semibold leading-tight" title={orgName || undefined}>
            {orgName || "نظام الجمعية"}
          </h2>
        )}
        <Button variant="ghost" size="sm" onClick={toggleCollapsed} className="h-8 w-8 p-0 shrink-0">
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {link(HOME, false)}

          {groups.map((group) => {
            const items = group.items.filter(visible)
            if (items.length === 0) return null

            // Narrowed to the strip of icons, a heading that opens nothing
            // visible would just be a button that does nothing, so the
            // pages are shown flat instead.
            if (collapsed) {
              return (
                <div key={group.id} className="space-y-1 border-t pt-1 first:border-0">
                  {items.map((item) => link(item, false))}
                </div>
              )
            }

            const isOpen = open[group.id] !== false
            // A page inside a closed section would otherwise be invisible
            // with nothing saying where you are.
            const holdsCurrentPage = items.some((item) => item.href === pathname)

            return (
              <div key={group.id} className="pt-2">
                <button
                  type="button"
                  onClick={() => toggleGroup(group.id)}
                  aria-expanded={isOpen}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs font-semibold uppercase tracking-wider transition-colors",
                    "text-muted-foreground hover:bg-accent hover:text-foreground",
                    holdsCurrentPage && !isOpen && "text-foreground",
                  )}
                >
                  <group.icon className="h-4 w-4 shrink-0" />
                  <span className="flex-1 text-start">{group.name}</span>
                  <ChevronDown
                    className={cn("h-4 w-4 shrink-0 transition-transform", isOpen ? "" : "-rotate-90")}
                  />
                </button>

                {isOpen && <div className="mt-1 space-y-1">{items.map((item) => link(item, true))}</div>}
              </div>
            )
          })}
        </nav>
      </ScrollArea>

      {/* Logout Button - Outside ScrollArea to stick to bottom */}
      <div className="p-3 border-t">
        <Button
          variant="ghost"
          disabled={signingOut}
          title={collapsed ? "تسجيل الخروج" : undefined}
          className={cn(
            "w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50",
            collapsed ? "px-2" : "px-3",
          )}
          onClick={() => {
            if (signingOut) return
            setSigningOut(true)
            logout()
          }}
        >
          {signingOut ? (
            <Loader2 className={cn("h-4 w-4 animate-spin", collapsed ? "" : "ml-2")} />
          ) : (
            <LogOut className={cn("h-4 w-4", collapsed ? "" : "ml-2")} />
          )}
          {!collapsed && (signingOut ? "جاري تسجيل الخروج..." : "تسجيل الخروج")}
        </Button>
      </div>
    </div>
  )
}
