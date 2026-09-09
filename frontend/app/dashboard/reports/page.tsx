"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, BarChart3, PieChart, TrendingUp, Users, HandCoins, GraduationCap } from "lucide-react"
import { WidowsReportDialog } from "@/components/reports/entity-reports/widows-report-dialog"
import { FinancialReportDialog } from "@/components/reports/entity-reports/financial-report-dialog"
import { DonorsReportDialog } from "@/components/reports/entity-reports/donors-report-dialog"
import { AnnualPerformanceReport } from "@/components/reports/entity-reports/annual-performance-report"
import { KafilStatementDialog } from "@/components/reports/entity-reports/kafil-statement-dialog"
import { SchoolPerformanceDialog } from "@/components/reports/entity-reports/school-performance-dialog"

export default function ReportsPage() {
  const [openDialog, setOpenDialog] = useState<string | null>(null)

  const reports = [
    {
      id: "widows",
      title: "تقرير الأرامل والأيتام",
      description: "إحصائيات شاملة عن الأرامل والأيتام المسجلين",
      icon: Users,
      color: "bg-blue-500",
    },
    {
      id: "financial",
      title: "التقرير المالي الشامل",
      description: "ملخص الإيرادات والمصروفات مع التحليلات المالية",
      icon: BarChart3,
      color: "bg-green-500",
    },
    {
      id: "donors",
      title: "تقرير الكفلاء والمتبرعين",
      description: "إحصائيات المتبرعين والكفلاء ومساهماتهم",
      icon: PieChart,
      color: "bg-purple-500",
    },
    {
      id: "annual",
      title: "تقرير الأداء السنوي",
      description: "تحليل شامل للأداء المالي والاجتماعي",
      icon: TrendingUp,
      color: "bg-orange-500",
    },
    {
      id: "kafil-statement",
      title: "كشف الكفيل",
      description: "مساهمات الكفيل وتوزيعها، وما تلقّته الأسر المكفولة من الجمعية",
      icon: HandCoins,
      color: "bg-teal-500",
    },
    {
      id: "school-performance",
      title: "تقرير الأداء الدراسي",
      description: "ترتيب التلاميذ حسب نقط الأسدسين، مع تصفية حسب الجنس والمستوى والمؤسسة والتعليم العالي",
      icon: GraduationCap,
      color: "bg-indigo-500",
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <FileText className="h-8 w-8" />
          التقارير والإحصائيات
        </h1>
        <p className="text-gray-600 mt-2">اضغط على أي تقرير لإنشاءه وتصديره</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reports.map((report) => (
          <Card
            key={report.id}
            className="cursor-pointer hover:shadow-lg transition-all hover:border-primary/50"
            onClick={() => setOpenDialog(report.id)}
          >
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
              <div className="flex items-center gap-2 text-sm text-primary">
                <FileText className="h-4 w-4" />
                <span>اضغط لفتح التقرير</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Report Dialogs */}
      <WidowsReportDialog
        open={openDialog === "widows"}
        onOpenChange={(open) => setOpenDialog(open ? "widows" : null)}
      />
      <FinancialReportDialog
        open={openDialog === "financial"}
        onOpenChange={(open) => setOpenDialog(open ? "financial" : null)}
      />
      <DonorsReportDialog
        open={openDialog === "donors"}
        onOpenChange={(open) => setOpenDialog(open ? "donors" : null)}
      />
      <AnnualPerformanceReport
        open={openDialog === "annual"}
        onOpenChange={(open) => setOpenDialog(open ? "annual" : null)}
      />
      <KafilStatementDialog
        open={openDialog === "kafil-statement"}
        onOpenChange={(open) => setOpenDialog(open ? "kafil-statement" : null)}
      />
      <SchoolPerformanceDialog
        open={openDialog === "school-performance"}
        onOpenChange={(open) => setOpenDialog(open ? "school-performance" : null)}
      />
    </div>
  )
}
