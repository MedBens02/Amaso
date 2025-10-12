"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
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
} from "lucide-react"

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
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className={cn("flex flex-col border-r bg-background", collapsed ? "w-16" : "w-64")}>
      <div className="flex h-16 items-center justify-between px-4 border-b">
        {!collapsed && <h2 className="text-lg font-semibold">نظام الجمعية الخيرية</h2>}
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
              {systemNavigation.map((item) => {
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
          className={cn(
            "w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50",
            collapsed ? "px-2" : "px-3",
          )}
          onClick={() => {
            localStorage.removeItem("user")
            router.push("/login")
          }}
        >
          <LogOut className={cn("h-4 w-4", collapsed ? "" : "ml-2")} />
          {!collapsed && "تسجيل الخروج"}
        </Button>
      </div>
    </div>
  )
}
