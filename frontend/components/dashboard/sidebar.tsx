"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
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
  FolderOpen,
  LogOut,
  Database,
  Calculator,
  UserCog,
  Loader2,
} from "lucide-react"
import { isCurrentUserAdmin } from "@/lib/roles"
import { logout } from "@/lib/auth"
import api from "@/lib/api"

const navigation = [
  {
    name: "الرئيسية",
    href: "/dashboard",
    icon: Home,
  },
  {
    name: "الأرامل",
    href: "/dashboard/widows",
    icon: Users,
  },
  {
    name: "الأيتام",
    href: "/dashboard/orphans",
    icon: Heart,
  },
  {
    name: "المتبرعون",
    href: "/dashboard/donors",
    icon: HandHeart,
  },
  {
    name: "مجموعات المستفيدين",
    href: "/dashboard/beneficiary-groups",
    icon: Users,
  },
]

const educationNavigation = [
  {
    name: "التعليم",
    href: "/dashboard/education",
    icon: GraduationCap,
  },
]

const financialNavigation = [
  {
    name: "الإيرادات",
    href: "/dashboard/incomes",
    icon: TrendingUp,
  },
  {
    name: "المصروفات",
    href: "/dashboard/expenses",
    icon: TrendingDown,
  },
  {
    name: "المشاريع الممولة",
    href: "/dashboard/budgeted-projects",
    icon: FolderOpen,
  },
  {
    name: "التحويلات",
    href: "/dashboard/transfers",
    icon: ArrowLeftRight,
  },
  {
    name: "السنوات المالية",
    href: "/dashboard/fiscal-years",
    icon: Calendar,
  },
]

const systemNavigation = [
  {
    name: "التقارير",
    href: "/dashboard/reports",
    icon: FileText,
  },
  {
    name: "الإعدادات",
    href: "/dashboard/settings",
    icon: Settings,
  },
  // Account management is admin-only. The API enforces that too (role:admin);
  // hiding the entry just keeps a door the user cannot open out of the menu.
  {
    name: "إدارة الحسابات",
    href: "/dashboard/users",
    icon: UserCog,
    adminOnly: true,
  },
]

const referencesNavigation = [
  {
    name: "البيانات المرجعية",
    href: "/dashboard/references",
    icon: Database,
  },
  {
    name: "المراجع المحاسبية",
    href: "/dashboard/accounting-references",
    icon: Calculator,
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  // Read after mount: localStorage is not available during SSR, and
  // rendering the admin entry on the server would flash it for everyone.
  const [isAdmin, setIsAdmin] = useState(false)
  // Whatever the admin saved on the settings screen, so the sidebar carries
  // the association's own name rather than a generic label.
  const [orgName, setOrgName] = useState("")
  const [signingOut, setSigningOut] = useState(false)

  useEffect(() => {
    setIsAdmin(isCurrentUserAdmin())

    api
      .getOrganizationSettings()
      .then((response) => setOrgName(response.data.name ?? ""))
      .catch(() => {
        /* the fallback heading below covers this */
      })
  }, [])

  return (
    <div className={cn("flex flex-col border-r bg-background", collapsed ? "w-16" : "w-64")}>
      <div className="flex h-16 items-center justify-between px-4 border-b">
        {!collapsed && (
          <h2
            className="line-clamp-2 text-sm font-semibold leading-tight"
            title={orgName || undefined}
          >
            {orgName || "نظام الجمعية"}
          </h2>
        )}
        <Button variant="ghost" size="sm" onClick={() => setCollapsed(!collapsed)} className="h-8 w-8 p-0">
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      <ScrollArea className="flex-1 px-3 py-4">
        <div className="space-y-6">
          {/* Main Navigation */}
          <div className="space-y-2">
            {!collapsed && (
              <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">الرئيسية</h3>
            )}
            <nav className="space-y-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link key={item.name} href={item.href}>
                    <Button
                      variant={isActive ? "secondary" : "ghost"}
                      className={cn("w-full justify-start", collapsed ? "px-2" : "px-3", isActive && "bg-secondary")}
                    >
                      <item.icon className={cn("h-4 w-4", collapsed ? "" : "ml-2")} />
                      {!collapsed && item.name}
                    </Button>
                  </Link>
                )
              })}
            </nav>
          </div>

          <Separator />

          {/* Financial Navigation */}
          <div className="space-y-2">
            {!collapsed && (
              <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">المالية</h3>
            )}
            <nav className="space-y-1">
              {financialNavigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link key={item.name} href={item.href}>
                    <Button
                      variant={isActive ? "secondary" : "ghost"}
                      className={cn("w-full justify-start", collapsed ? "px-2" : "px-3", isActive && "bg-secondary")}
                    >
                      <item.icon className={cn("h-4 w-4", collapsed ? "" : "ml-2")} />
                      {!collapsed && item.name}
                    </Button>
                  </Link>
                )
              })}
            </nav>
          </div>

          <Separator />

          {/* System Navigation */}
          <div className="space-y-2">
            {!collapsed && (
              <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">النظام</h3>
            )}
            <nav className="space-y-1">
              {systemNavigation
                .filter((item) => !item.adminOnly || isAdmin)
                .map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link key={item.name} href={item.href}>
                    <Button
                      variant={isActive ? "secondary" : "ghost"}
                      className={cn("w-full justify-start", collapsed ? "px-2" : "px-3", isActive && "bg-secondary")}
                    >
                      <item.icon className={cn("h-4 w-4", collapsed ? "" : "ml-2")} />
                      {!collapsed && item.name}
                    </Button>
                  </Link>
                )
              })}
            </nav>
          </div>

          <Separator />

          {/* References Navigation */}
          <div className="space-y-2">
            {!collapsed && (
              <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">البيانات المرجعية</h3>
            )}
            <nav className="space-y-1">
              {referencesNavigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link key={item.name} href={item.href}>
                    <Button
                      variant={isActive ? "secondary" : "ghost"}
                      className={cn("w-full justify-start", collapsed ? "px-2" : "px-3", isActive && "bg-secondary")}
                    >
                      <item.icon className={cn("h-4 w-4", collapsed ? "" : "ml-2")} />
                      {!collapsed && item.name}
                    </Button>
                  </Link>
                )
              })}
            </nav>
          </div>

          <Separator />

          {/* Education Navigation - Moved to end */}
          <div className="space-y-2">
            {!collapsed && (
              <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">التعليم</h3>
            )}
            <nav className="space-y-1">
              {educationNavigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link key={item.name} href={item.href}>
                    <Button
                      variant={isActive ? "secondary" : "ghost"}
                      className={cn("w-full justify-start", collapsed ? "px-2" : "px-3", isActive && "bg-secondary")}
                    >
                      <item.icon className={cn("h-4 w-4", collapsed ? "" : "ml-2")} />
                      {!collapsed && item.name}
                    </Button>
                  </Link>
                )
              })}
            </nav>
          </div>
        </div>
      </ScrollArea>

      {/* Logout Button - Outside ScrollArea to stick to bottom */}
      <div className="p-3 border-t">
        <Button
          variant="ghost"
          disabled={signingOut}
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
