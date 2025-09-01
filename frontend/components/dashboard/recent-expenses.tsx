"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Wallet } from "lucide-react"
import { formatDateArabic } from "@/lib/date-utils"

interface Expense {
  id: number
  description: string
  amount: string
  status: string
  expense_date: string
  created_at: string
  expense_category?: {
    label: string
  }
}

export function RecentExpenses() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRecentExpenses()
  }, [])

  const fetchRecentExpenses = async () => {
    try {
      setLoading(true)
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1'
      
      const response = await fetch(`${baseUrl}/expenses?per_page=5&sort_by=created_at&sort_direction=desc`)
      const data = await response.json()
      
      if (data.data) {
        setExpenses(data.data)
      }
    } catch (error) {
      console.error('Error fetching recent expenses:', error)
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
        <CardTitle className="text-lg">المصروفات الأخيرة</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-4">
              <p className="text-sm text-gray-500">جار التحميل...</p>
            </div>
          ) : expenses.length > 0 ? (
            expenses.map((expense) => (
              <div key={expense.id} className="flex items-start space-x-4 space-x-reverse">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs text-red-600">
                    <Wallet className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{expense.expense_category?.label || "مصروف"}</p>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-red-600">
                        -DH {parseFloat(expense.amount).toLocaleString()}
                      </span>
                      <Badge variant={getStatusVariant(expense.status)}>
                        {getStatusLabel(expense.status)}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">{expense.description || "بلا وصف"}</p>
                  <p className="text-xs text-gray-500">
                    {formatDateArabic(new Date(expense.created_at || expense.expense_date), "dd/MM/yyyy - HH:mm")}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-gray-500">لا توجد مصروفات حديثة</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}