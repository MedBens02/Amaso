"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Calendar, Lock, Unlock, TrendingUp } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { StartNewFiscalYearDialog } from "@/components/forms/StartNewFiscalYearForm"

const fiscalYears = [
  {
    id: 1,
    year: "2024",
    status: "مفتوح",
    startDate: "2024-01-01",
    endDate: "2024-12-31",
    totalBudget: 500000,
    totalSpent: 285000,
    carryOver: 45000,
  },
  {
    id: 2,
    year: "2023",
    status: "مغلق",
    startDate: "2023-01-01",
    endDate: "2023-12-31",
    totalBudget: 450000,
    totalSpent: 405000,
    carryOver: 45000,
  },
  {
    id: 3,
    year: "2022",
    status: "مغلق",
    startDate: "2022-01-01",
    endDate: "2022-12-31",
    totalBudget: 380000,
    totalSpent: 365000,
    carryOver: 15000,
  },
]

export default function FiscalYearsPage() {
  const [showNewDialog, setShowNewDialog] = useState(false)

  const getStatusBadge = (status: string) => {
    return status === "مفتوح" ? (
      <Badge variant="default" className="flex items-center gap-1">
        <Unlock className="h-3 w-3" />
        مفتوح
      </Badge>
    ) : (
      <Badge variant="secondary" className="flex items-center gap-1">
        <Lock className="h-3 w-3" />
        مغلق
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="h-8 w-8" />
            السنوات المالية
          </h1>
          <p className="text-gray-600 mt-2">إدارة السنوات المالية والميزانيات</p>
        </div>
        <Button onClick={() => setShowNewDialog(true)}>
          <Plus className="h-4 w-4 ml-2" />
          بدء سنة مالية جديدة
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {fiscalYears.map((year) => (
          <Card key={year.id} className="relative">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">السنة المالية {year.year}</CardTitle>
                {getStatusBadge(year.status)}
              </div>
              <p className="text-sm text-gray-600">
                {year.startDate} - {year.endDate}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>إجمالي الميزانية:</span>
                  <span className="font-bold">DH {year.totalBudget.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>المصروف:</span>
                  <span className="font-bold text-red-600">DH {year.totalSpent.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>المتبقي:</span>
                  <span className="font-bold text-green-600">
                    DH {(year.totalBudget - year.totalSpent).toLocaleString()}
                  </span>
                </div>
                {year.carryOver > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>المرحل من السنة السابقة:</span>
                    <span className="font-bold text-blue-600">DH {year.carryOver.toLocaleString()}</span>
                  </div>
                )}
              </div>

              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${(year.totalSpent / year.totalBudget) * 100}%` }}
                ></div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                  <TrendingUp className="h-4 w-4 ml-1" />
                  عرض الميزانية
                </Button>
                {year.status === "مفتوح" && (
                  <Button variant="outline" size="sm">
                    إغلاق السنة
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <StartNewFiscalYearDialog open={showNewDialog} onOpenChange={setShowNewDialog} />
    </div>
  )
}
