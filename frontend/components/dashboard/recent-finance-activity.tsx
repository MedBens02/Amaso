import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { HandCoins, Wallet, TrendingUp } from "lucide-react"
import { formatDateArabic } from "@/lib/date-utils"

interface FinanceActivity {
  id: number
  type: "income" | "expense" | "transfer"
  title: string
  description: string
  time: Date
  status: string
  amount: number
}

export function RecentFinanceActivity() {
  const [activities, setActivities] = useState<FinanceActivity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRecentActivity()
  }, [])

  const fetchRecentActivity = async () => {
    try {
      setLoading(true)
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1'
      
      // Fetch recent data from all sources
      const [incomesRes, expensesRes, transfersRes] = await Promise.all([
        fetch(`${baseUrl}/incomes?per_page=10&sort_by=created_at&sort_direction=desc`).then(r => r.json()),
        fetch(`${baseUrl}/expenses?per_page=10&sort_by=created_at&sort_direction=desc`).then(r => r.json()),
        fetch(`${baseUrl}/transfers?per_page=10&sort_by=created_at&sort_direction=desc`).then(r => r.json()),
      ])

      const allActivities: FinanceActivity[] = []

      // Process incomes
      if (incomesRes.data) {
        incomesRes.data.forEach((income: any) => {
          allActivities.push({
            id: `income-${income.id}`,
            type: "income",
            title: income.income_source || "إيراد",
            description: `${income.donor_name || "مجهول"} - DH ${parseFloat(income.amount).toLocaleString()}`,
            time: new Date(income.created_at || income.income_date),
            status: income.status === "Approved" ? "معتمد" : income.status === "Draft" ? "مسودة" : "مرفوض",
            amount: parseFloat(income.amount),
          })
        })
      }

      // Process expenses  
      if (expensesRes.data) {
        expensesRes.data.forEach((expense: any) => {
          allActivities.push({
            id: `expense-${expense.id}`,
            type: "expense", 
            title: expense.expense_category?.label || "مصروف",
            description: `${expense.description || "بلا وصف"} - DH ${parseFloat(expense.amount).toLocaleString()}`,
            time: new Date(expense.created_at || expense.expense_date),
            status: expense.status === "Approved" ? "معتمد" : expense.status === "Draft" ? "مسودة" : "مرفوض",
            amount: -parseFloat(expense.amount),
          })
        })
      }

      // Process transfers
      if (transfersRes.data) {
        transfersRes.data.forEach((transfer: any) => {
          allActivities.push({
            id: `transfer-${transfer.id}`,
            type: "transfer",
            title: "تحويل بين الحسابات",
            description: `من ${transfer.from_account?.name || "حساب"} إلى ${transfer.to_account?.name || "حساب"}`,
            time: new Date(transfer.created_at || transfer.transfer_date),
            status: "معتمد",
            amount: parseFloat(transfer.amount),
          })
        })
      }

      // Sort all activities by time (newest first) and take top 10
      const sortedActivities = allActivities
        .sort((a, b) => b.time.getTime() - a.time.getTime())
        .slice(0, 10)

      setActivities(sortedActivities)
    } catch (error) {
      console.error('Error fetching recent finance activity:', error)
    } finally {
      setLoading(false)
    }
  }
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
          {loading ? (
            <div className="text-center py-4">
              <p className="text-sm text-gray-500">جار التحميل...</p>
            </div>
          ) : activities.length > 0 ? (
            activities.map((activity) => {
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
            })
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-gray-500">لا يوجد نشاط مالي حديث</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
