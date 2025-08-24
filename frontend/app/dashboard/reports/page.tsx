"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Download, BarChart3, PieChart, TrendingUp, Users } from "lucide-react"

export default function ReportsPage() {
  const reports = [
    {
      title: "تقرير الأرامل والأيتام",
      description: "إحصائيات شاملة عن الأرامل والأيتام المسجلين",
      icon: Users,
      color: "bg-blue-500",
    },
    {
      title: "التقرير المالي الشهري",
      description: "ملخص الإيرادات والمصروفات الشهرية",
      icon: BarChart3,
      color: "bg-green-500",
    },
    {
      title: "تقرير الكفلاء والمتبرعين",
      description: "إحصائيات المتبرعين والكفلاء ومساهماتهم",
      icon: PieChart,
      color: "bg-purple-500",
    },
    {
      title: "تقرير الأداء السنوي",
      description: "تحليل شامل للأداء المالي والاجتماعي",
      icon: TrendingUp,
      color: "bg-orange-500",
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <FileText className="h-8 w-8" />
          التقارير والإحصائيات
        </h1>
        <p className="text-gray-600 mt-2">إنشاء وتصدير التقارير المختلفة</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reports.map((report, index) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${report.color}`}>
                  <report.icon className="h-5 w-5 text-white" />
                </div>
                {report.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">{report.description}</p>
              <div className="flex gap-2">
                <Button size="sm">
                  <FileText className="h-4 w-4 ml-1" />
                  عرض التقرير
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 ml-1" />
                  تصدير PDF
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
