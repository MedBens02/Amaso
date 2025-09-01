"use client"
import { useState, useEffect } from "react"
import { Users, Heart, TrendingUp, UserCheck, HandCoins, Wallet, Banknote, Download } from "lucide-react"
import { StatsCard } from "@/components/dashboard/stats-card"
import { RecentIncomes } from "@/components/dashboard/recent-incomes"
import { RecentExpenses } from "@/components/dashboard/recent-expenses"
import { MonthlyCharts } from "@/components/dashboard/monthly-charts"
import { QuickActions } from "@/components/dashboard/quick-actions"
import { Button } from "@/components/ui/button"

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

export default function DashboardPage() {
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

  const fetchDashboardStats = async () => {
    try {
      setLoading(true)
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1'
      
      // Calculate date ranges
      const now = new Date()
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0) // Last day of previous month
      
      // Fetch counts and financial data with parallel requests
      const [widowsRes, orphansRes, kafilsRes, bankAccountsRes, currentIncomesRes, currentExpensesRes, previousIncomesRes, previousExpensesRes] = await Promise.all([
        fetch(`${baseUrl}/widows?per_page=1`).then(r => r.json()),
        fetch(`${baseUrl}/orphans?per_page=1`).then(r => r.json()),
        fetch(`${baseUrl}/kafils?per_page=1`).then(r => r.json()),
        fetch(`${baseUrl}/bank-accounts`).then(r => r.json()),
        // Current month's incomes
        fetch(`${baseUrl}/incomes?per_page=1000&from_date=${currentMonthStart.toISOString().split('T')[0]}&to_date=${now.toISOString().split('T')[0]}&status=Approved`).then(r => r.json()),
        // Current month's expenses  
        fetch(`${baseUrl}/expenses?per_page=1000&from_date=${currentMonthStart.toISOString().split('T')[0]}&to_date=${now.toISOString().split('T')[0]}&status=Approved`).then(r => r.json()),
        // Previous month's incomes
        fetch(`${baseUrl}/incomes?per_page=1000&from_date=${previousMonthStart.toISOString().split('T')[0]}&to_date=${previousMonthEnd.toISOString().split('T')[0]}&status=Approved`).then(r => r.json()),
        // Previous month's expenses
        fetch(`${baseUrl}/expenses?per_page=1000&from_date=${previousMonthStart.toISOString().split('T')[0]}&to_date=${previousMonthEnd.toISOString().split('T')[0]}&status=Approved`).then(r => r.json()),
      ])

      // Calculate totals
      const currentCashBalance = bankAccountsRes.data?.reduce((sum: number, account: any) => sum + parseFloat(account.balance), 0) || 0
      const monthlyIncomes = currentIncomesRes.data?.reduce((sum: number, income: any) => sum + parseFloat(income.amount), 0) || 0
      const monthlyExpenses = currentExpensesRes.data?.reduce((sum: number, expense: any) => sum + parseFloat(expense.amount), 0) || 0
      const previousMonthIncomes = previousIncomesRes.data?.reduce((sum: number, income: any) => sum + parseFloat(income.amount), 0) || 0
      const previousMonthExpenses = previousExpensesRes.data?.reduce((sum: number, expense: any) => sum + parseFloat(expense.amount), 0) || 0

      setDashboardStats({
        widowsCount: widowsRes.meta?.total || 0,
        orphansCount: orphansRes.meta?.total || 0,
        kafilsCount: kafilsRes.meta?.total || 0,
        monthlyIncomes,
        monthlyExpenses,
        currentCashBalance,
        previousMonthIncomes,
        previousMonthExpenses,
        previousCashBalance: currentCashBalance, // We'll use current as approximation
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
        <h1 className="text-3xl font-bold text-gray-900">لوحة التحكم</h1>
        <p className="text-gray-600 mt-2">مرحباً بك في نظام إدارة جمعية أماسو الخيرية</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <StatsCard key={index} {...stat} />
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg border p-6">
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
                <div className="text-sm text-gray-600">{action.description}</div>
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
