"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { HandCoins } from "lucide-react"
import { formatDateArabic } from "@/lib/date-utils"

interface Income {
  id: number
  income_source: string
  donor_name: string
  amount: string
  status: string
  income_date: string
  created_at: string
}

export function RecentIncomes() {
  const [incomes, setIncomes] = useState<Income[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRecentIncomes()
  }, [])

  const fetchRecentIncomes = async () => {
    try {
      setLoading(true)
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1'
      
      const response = await fetch(`${baseUrl}/incomes?per_page=5&sort_by=created_at&sort_direction=desc`)
      const data = await response.json()
      
      if (data.data) {
        setIncomes(data.data)
      }
    } catch (error) {
      console.error('Error fetching recent incomes:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "Approved":
        return "default"
      case "Draft":
        return "secondary"
      default:
        return "outline"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "Approved":
        return "معتمد"
      case "Draft":
        return "مسودة"
      default:
        return "مرفوض"
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">الإيرادات الأخيرة</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-4">
              <p className="text-sm text-gray-500">جار التحميل...</p>
            </div>
          ) : incomes.length > 0 ? (
            incomes.map((income) => (
              <div key={income.id} className="flex items-start space-x-4 space-x-reverse">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs text-green-600">
                    <HandCoins className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{income.income_source || "إيراد"}</p>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-green-600">
                        +DH {parseFloat(income.amount).toLocaleString()}
                      </span>
                      <Badge variant={getStatusVariant(income.status)}>
                        {getStatusLabel(income.status)}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">{income.donor_name || "مجهول"}</p>
                  <p className="text-xs text-gray-500">
                    {formatDateArabic(new Date(income.created_at || income.income_date), "dd/MM/yyyy - HH:mm")}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-gray-500">لا توجد إيرادات حديثة</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}