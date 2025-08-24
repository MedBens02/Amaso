"use client"
import { Users, Heart, TrendingUp, UserCheck, HandCoins, Wallet, Banknote, Download } from "lucide-react"
import { StatsCard } from "@/components/dashboard/stats-card"
import { RecentFinanceActivity } from "@/components/dashboard/recent-finance-activity"
import { QuickActions } from "@/components/dashboard/quick-actions"
import { Button } from "@/components/ui/button"

export default function DashboardPage() {
  const stats = [
    {
      title: "إجمالي الأرامل",
      value: "247",
      change: "+12",
      changeType: "increase" as const,
      icon: Users,
      color: "blue",
    },
    {
      title: "إجمالي الأيتام",
      value: "589",
      change: "+23",
      changeType: "increase" as const,
      icon: Heart,
      color: "pink",
    },
    {
      title: "الكفلاء النشطين",
      value: "156",
      change: "+5",
      changeType: "increase" as const,
      icon: UserCheck,
      color: "purple",
    },
    {
      title: "الإيرادات الشهرية",
      value: "₪ 85,430",
      change: "+12.5%",
      changeType: "increase" as const,
      icon: HandCoins,
      color: "green",
    },
    {
      title: "المصروفات الشهرية",
      value: "₪ 72,150",
      change: "+8.2%",
      changeType: "increase" as const,
      icon: Wallet,
      color: "orange",
    },
    {
      title: "الرصيد النقدي الحالي",
      value: "₪ 125,680",
      change: "+15.3%",
      changeType: "increase" as const,
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

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentFinanceActivity />
        </div>
        <div>
          <QuickActions />
        </div>
      </div>
    </div>
  )
}
