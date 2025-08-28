import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { HandCoins, Wallet, TrendingUp } from "lucide-react"
import { formatDateArabic } from "@/lib/date-utils"

const financeActivities = [
  {
    id: 1,
    type: "income",
    title: "تبرع نقدي",
    description: "محمد أحمد السيد - DH 5,000",
    time: new Date("2024-01-15T10:30:00"),
    status: "معتمد",
    amount: 5000,
  },
  {
    id: 2,
    type: "expense",
    title: "مساعدة شهرية",
    description: "توزيع مساعدات على 15 عائلة",
    time: new Date("2024-01-15T09:15:00"),
    status: "معتمد",
    amount: -7500,
  },
  {
    id: 3,
    type: "income",
    title: "كفالة شهرية",
    description: "فاطمة علي حسن - DH 1,200",
    time: new Date("2024-01-14T16:45:00"),
    status: "مسودة",
    amount: 1200,
  },
  {
    id: 4,
    type: "transfer",
    title: "تحويل بين الحسابات",
    description: "من الحساب الجاري إلى حساب الطوارئ",
    time: new Date("2024-01-14T14:20:00"),
    status: "معتمد",
    amount: 10000,
  },
  {
    id: 5,
    type: "expense",
    title: "مصاريف تعليمية",
    description: "رسوم دراسية لـ 8 طلاب",
    time: new Date("2024-01-13T11:30:00"),
    status: "معتمد",
    amount: -3200,
  },
]

export function RecentFinanceActivity() {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case "income":
        return HandCoins
      case "expense":
        return Wallet
      case "transfer":
        return TrendingUp
      default:
        return HandCoins
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case "income":
        return "text-green-600"
      case "expense":
        return "text-red-600"
      case "transfer":
        return "text-blue-600"
      default:
        return "text-gray-600"
    }
  }

  const getAmountDisplay = (amount: number, type: string) => {
    if (type === "transfer") return ""
    const color = amount > 0 ? "text-green-600" : "text-red-600"
    const sign = amount > 0 ? "+" : ""
    return (
      <span className={`font-medium ${color}`}>
        {sign}DH {Math.abs(amount).toLocaleString()}
      </span>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>النشاط المالي الأخير</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {financeActivities.map((activity) => {
            const Icon = getActivityIcon(activity.type)
            return (
              <div key={activity.id} className="flex items-start space-x-4 space-x-reverse">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className={`text-xs ${getActivityColor(activity.type)}`}>
                    <Icon className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{activity.title}</p>
                    <div className="flex items-center gap-2">
                      {getAmountDisplay(activity.amount, activity.type)}
                      <Badge
                        variant={
                          activity.status === "معتمد"
                            ? "default"
                            : activity.status === "مسودة"
                              ? "secondary"
                              : "outline"
                        }
                      >
                        {activity.status}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">{activity.description}</p>
                  <p className="text-xs text-gray-500">{formatDateArabic(activity.time, "dd/MM/yyyy - HH:mm")}</p>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
