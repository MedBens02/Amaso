"use client"

/**
 * The dashboard this application shipped with, kept reachable at
 * /dashboard/dashboard-old but deliberately absent from the sidebar.
 *
 * It is here only so nothing on it is lost by accident while the replacement
 * beds in. It is not maintained: it hard-codes light-mode colours, so it
 * reads poorly in dark mode. Delete it once nobody misses it.
 */
import { useState, useEffect } from "react"
import { Users, Heart, TrendingUp, UserCheck, HandCoins, Wallet, Banknote, Download } from "lucide-react"
import { StatsCard } from "@/components/dashboard/stats-card"
import { RecentIncomes } from "@/components/dashboard/recent-incomes"
import { RecentExpenses } from "@/components/dashboard/recent-expenses"
import { MonthlyCharts } from "@/components/dashboard/monthly-charts"
import { QuickActions } from "@/components/dashboard/quick-actions"
import { Button } from "@/components/ui/button"
import api from "@/lib/api"

interface DashboardStats {
  widowsCount: number
  orphansCount: number
  kafilsCount: number
  monthlyIncomes: number
  monthlyExpenses: number
  currentCashBalance: number
  previousMonthIncomes: number
  previousMonthExpenses: number
  previousCashBalance: number
}

export default function DashboardOldPage() {
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    widowsCount: 0,
    orphansCount: 0,
    kafilsCount: 0,
    monthlyIncomes: 0,
    monthlyExpenses: 0,
    currentCashBalance: 0,
    previousMonthIncomes: 0,
    previousMonthExpenses: 0,
    previousCashBalance: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  /**
   * The figures behind the cards.
   *
   * This used to make eight requests, four of them asking for up to a
   * thousand income or expense rows purely so the browser could add the
   * amounts up - once for this month and once for last month. The totals
   * come from the database now: /reports/financial returns them for any
   * window, so two small calls replace the four bulk ones, and the counts
   * come from the paginator's `meta.total` rather than from any rows.
   *
   * Note for anyone tempted to "just lower per_page here": these calls were
   * never paging through data to display it, they were summing it. Capping
   * them at twenty rows would not have made the dashboard faster so much as
   * quietly wrong.
   */
  const fetchDashboardStats = async () => {
    try {
      setLoading(true)

      const now = new Date()
      const iso = (d: Date) =>
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`

      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)

      const [widowsRes, orphansRes, kafilsRes, accountsRes, thisMonth, lastMonth] = await Promise.all([
        // per_page=1 because only meta.total is wanted - the row itself is
        // just the smallest payload the paginator will return.
        api.getWidows({ per_page: 1 }),
        api.getOrphans({ per_page: 1 }),
        api.getKafils({ per_page: 1 }),
        api.getBankAccounts(),
        api.getFinancialReport({ from: iso(thisMonthStart), to: iso(now) }),
        api.getFinancialReport({ from: iso(lastMonthStart), to: iso(lastMonthEnd) }),
      ])

      const currentCashBalance = (accountsRes.data ?? []).reduce(
        (sum: number, account: any) => sum + parseFloat(account.balance ?? 0),
        0,
      )

      setDashboardStats({
        widowsCount: (widowsRes as any).meta?.total || 0,
        orphansCount: (orphansRes as any).meta?.total || 0,
        kafilsCount: (kafilsRes as any).meta?.total || 0,
        monthlyIncomes: thisMonth.data?.totals?.income || 0,
        monthlyExpenses: thisMonth.data?.totals?.expense || 0,
        currentCashBalance,
        previousMonthIncomes: lastMonth.data?.totals?.income || 0,
        previousMonthExpenses: lastMonth.data?.totals?.expense || 0,
        previousCashBalance: currentCashBalance,
      })
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
    } finally {
      setLoading(false)
    }
  }

  // Calculate month-over-month changes
  const incomeChange = dashboardStats.previousMonthIncomes > 0 
    ? ((dashboardStats.monthlyIncomes - dashboardStats.previousMonthIncomes) / dashboardStats.previousMonthIncomes * 100)
    : 0

  const expenseChange = dashboardStats.previousMonthExpenses > 0
    ? ((dashboardStats.monthlyExpenses - dashboardStats.previousMonthExpenses) / dashboardStats.previousMonthExpenses * 100)
    : 0

  const stats = [
    {
      title: "إجمالي الأرامل",
      value: loading ? "..." : dashboardStats.widowsCount.toString(),
      change: "",
      changeType: "neutral" as const,
      icon: Users,
      color: "blue",
    },
    {
      title: "إجمالي الأيتام",
      value: loading ? "..." : dashboardStats.orphansCount.toString(),
      change: "",
      changeType: "neutral" as const,
      icon: Heart,
      color: "pink",
    },
    {
      title: "الكفلاء النشطين",
      value: loading ? "..." : dashboardStats.kafilsCount.toString(),
      change: "",
      changeType: "neutral" as const,
      icon: UserCheck,
      color: "purple",
    },
    {
      title: "الإيرادات الشهرية",
      value: loading ? "..." : `${dashboardStats.monthlyIncomes.toFixed(2)} د.م`,
      change: loading ? "" : `${incomeChange > 0 ? '+' : ''}${incomeChange.toFixed(1)}%`,
      changeType: (incomeChange >= 0 ? "increase" : "decrease") as const,
      icon: HandCoins,
      color: "green",
    },
    {
      title: "المصروفات الشهرية",
      value: loading ? "..." : `${dashboardStats.monthlyExpenses.toFixed(2)} د.م`,
      change: loading ? "" : `${expenseChange > 0 ? '+' : ''}${expenseChange.toFixed(1)}%`,
      changeType: (expenseChange >= 0 ? "increase" : "decrease") as const,
      icon: Wallet,
      color: "orange",
    },
    {
      title: "الرصيد النقدي الحالي",
      value: loading ? "..." : `${dashboardStats.currentCashBalance.toFixed(2)} د.م`,
      change: loading ? "" : `${(dashboardStats.monthlyIncomes - dashboardStats.monthlyExpenses).toFixed(2)} د.م`,
      changeType: (dashboardStats.monthlyIncomes >= dashboardStats.monthlyExpenses ? "increase" : "decrease") as const,
      icon: Banknote,
      color: "indigo",
    },
  ]

  const quickActions = [
    {
      title: "إضافة أرملة",
      description: "تسجيل أرملة جديدة في النظام",
      icon: Users,
      color: "bg-blue-500 hover:bg-blue-600",
      href: "/dashboard/widows",
    },
    {
      title: "إضافة يتيم",
      description: "تسجيل يتيم جديد",
      icon: Heart,
      color: "bg-pink-500 hover:bg-pink-600",
      href: "/dashboard/orphans",
    },
    {
      title: "إضافة إيراد",
      description: "تسجيل إيراد أو تبرع جديد",
      icon: HandCoins,
      color: "bg-green-500 hover:bg-green-600",
      href: "/dashboard/incomes",
    },
    {
      title: "إضافة مصروف",
      description: "تسجيل مصروف جديد",
      icon: Wallet,
      color: "bg-orange-500 hover:bg-orange-600",
      href: "/dashboard/expenses",
    },
    {
      title: "تحويل جديد",
      description: "إجراء تحويل بين الحسابات",
      icon: TrendingUp,
      color: "bg-purple-500 hover:bg-purple-600",
      href: "/dashboard/transfers",
    },
    {
      title: "تصدير Excel",
      description: "تصدير البيانات إلى Excel",
      icon: Download,
      color: "bg-indigo-500 hover:bg-indigo-600",
      action: "export",
    },
  ]

  const handleExport = () => {
    console.log("Exporting to Excel...")
    // Implement export logic
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">لوحة التحكم</h1>
        <p className="text-muted-foreground mt-2">مرحباً بك في نظام إدارة جمعية المنصور لكفالة اليتيم</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <StatsCard key={index} {...stat} />
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-card rounded-lg border p-6">
        <h2 className="text-xl font-semibold mb-4">الإجراءات السريعة</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickActions.map((action, index) => (
            <Button
              key={index}
              variant="outline"
              className="h-auto p-4 bg-transparent justify-start"
              onClick={() => {
                if (action.action === "export") {
                  handleExport()
                } else if (action.href) {
                  window.location.href = action.href
                }
              }}
            >
              <div className={`p-2 rounded-lg ${action.color} mr-3`}>
                <action.icon className="h-4 w-4 text-white" />
              </div>
              <div className="text-right">
                <div className="font-medium">{action.title}</div>
                <div className="text-sm text-muted-foreground">{action.description}</div>
              </div>
            </Button>
          ))}
        </div>
      </div>

      {/* Recent Activity Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentIncomes />
        <RecentExpenses />
      </div>

      {/* Monthly Charts */}
      <MonthlyCharts />
    </div>
  )
}
