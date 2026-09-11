"use client"

import { useState } from "react"
import type { LucideIcon } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import {
  FileText, BarChart3, PieChart, TrendingUp, Users, HandCoins, GraduationCap,
  HeartHandshake, CalendarClock, Wallet, ChevronLeft,
} from "lucide-react"
import { WidowsReportDialog } from "@/components/reports/entity-reports/widows-report-dialog"
import { FinancialReportDialog } from "@/components/reports/entity-reports/financial-report-dialog"
import { DonorsReportDialog } from "@/components/reports/entity-reports/donors-report-dialog"
import { AnnualPerformanceReport } from "@/components/reports/entity-reports/annual-performance-report"
import { KafilStatementDialog } from "@/components/reports/entity-reports/kafil-statement-dialog"
import { SchoolPerformanceDialog } from "@/components/reports/entity-reports/school-performance-dialog"
import { OperationalReportDialog } from "@/components/reports/entity-reports/operational-report-dialog"
import {
  SPONSORSHIP_GAPS,
  KAFIL_FOLLOW_UP,
  BUDGET_UTILIZATION,
} from "@/components/reports/entity-reports/operational-report-specs"

type Report = {
  id: string
  title: string
  description: string
  icon: LucideIcon
  /** Tinted rather than solid: a saturated block of colour per card was the
   *  loudest thing on a page whose job is to be scanned, and the tint keeps
   *  its meaning in both themes. */
  tint: string
}

/**
 * Nine reports as one undifferentiated grid gave no clue which one answered
 * which question - you had to read all nine descriptions every time. They are
 * grouped by what you are asking about, which is how someone arrives here:
 * "how are the families doing", "where did the money go", "is the sponsorship
 * holding up", "how are the children doing at school".
 */
const SECTIONS: Array<{ heading: string; blurb: string; reports: Report[] }> = [
  {
    heading: "المستفيدون",
    blurb: "من تتكفل به الجمعية، وكيف تتوزع الأسر",
    reports: [
      {
        id: "widows",
        title: "تقرير الأرامل والأيتام",
        description: "الأسر والأطفال المسجلون، مع التوزيع حسب الحي والمستوى التعليمي",
        icon: Users,
        tint: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
      },
      {
        id: "annual",
        title: "تقرير الأداء السنوي",
        description: "الأداء المالي والاجتماعي خلال السنة، شهراً بشهر",
        icon: TrendingUp,
        tint: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
      },
    ],
  },
  {
    heading: "المالية",
    blurb: "الوارد والمصروف، وأين ذهبت الميزانيات",
    reports: [
      {
        id: "financial",
        title: "التقرير المالي الشامل",
        description: "الإيرادات والمصروفات مع التوزيع حسب الميزانية والفئة وطريقة الدفع",
        icon: BarChart3,
        tint: "bg-green-500/10 text-green-600 dark:text-green-400",
      },
      {
        id: "budget-utilization",
        title: "استعمال الميزانيات",
        description: "الوارد والمصروف والمتبقي في كل ميزانية، مع تنبيه الميزانيات المتجاوزة",
        icon: Wallet,
        tint: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
      },
    ],
  },
  {
    heading: "الكفالة والمتبرعون",
    blurb: "من يدعم الجمعية، ومن ينتظر كفيلاً",
    reports: [
      {
        id: "donors",
        title: "تقرير الكفلاء والمتبرعين",
        description: "المتبرعون والكفلاء ومساهماتهم",
        icon: PieChart,
        tint: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
      },
      {
        id: "kafil-statement",
        title: "كشف الكفيل",
        description: "مساهمات الكفيل وتوزيعها، وما تلقّته الأسر المكفولة من الجمعية",
        icon: HandCoins,
        tint: "bg-teal-500/10 text-teal-600 dark:text-teal-400",
      },
      {
        id: "sponsorship-gaps",
        title: "تقرير نقص الكفالة",
        description: "الأسر غير المكفولة وذات التغطية الناقصة — من يحتاج كفيلاً وبكم",
        icon: HeartHandshake,
        tint: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
      },
      {
        id: "kafil-follow-up",
        title: "متابعة التزامات الكفلاء",
        description: "المتوقّع مقابل المحصّل خلال الفترة، ومن تأخر عن التزامه",
        icon: CalendarClock,
        tint: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
      },
    ],
  },
  {
    heading: "التعليم",
    blurb: "نتائج التلاميذ ومسارهم الدراسي",
    reports: [
      {
        id: "school-performance",
        title: "تقرير الأداء الدراسي",
        description: "ترتيب التلاميذ حسب نقط الأسدسين، مع التصفية حسب الجنس والمستوى والمؤسسة",
        icon: GraduationCap,
        tint: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
      },
    ],
  },
]

export default function ReportsPage() {
  const [openDialog, setOpenDialog] = useState<string | null>(null)

  const totalReports = SECTIONS.reduce((sum, section) => sum + section.reports.length, 0)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="flex items-center gap-2 text-3xl font-bold text-foreground">
          <FileText className="h-8 w-8 shrink-0" />
          التقارير والإحصائيات
        </h1>
        <p className="mt-2 text-muted-foreground">
          {totalReports} تقريراً، كلٌّ منها قابل للتصفية والتصدير إلى PDF أو Excel
        </p>
      </div>

      {SECTIONS.map((section) => (
        <section key={section.heading} className="space-y-3">
          <div className="flex items-baseline gap-3 border-b pb-2">
            <h2 className="text-lg font-semibold">{section.heading}</h2>
            <p className="text-sm text-muted-foreground">{section.blurb}</p>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {section.reports.map((report) => (
              <Card
                key={report.id}
                role="button"
                tabIndex={0}
                onClick={() => setOpenDialog(report.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault()
                    setOpenDialog(report.id)
                  }
                }}
                className="group cursor-pointer transition-colors hover:border-primary/50 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <CardContent className="flex items-start gap-3 p-4">
                  <div className={`rounded-lg p-2 ${report.tint}`}>
                    <report.icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium leading-tight">{report.title}</h3>
                    <p className="mt-1 text-sm leading-snug text-muted-foreground">{report.description}</p>
                  </div>
                  {/* Points at the start edge, which in Arabic is the left - the
                      direction the card opens towards. */}
                  <ChevronLeft className="mt-1 h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      ))}

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
      <OperationalReportDialog
        open={openDialog === "sponsorship-gaps"}
        onOpenChange={(open) => setOpenDialog(open ? "sponsorship-gaps" : null)}
        spec={SPONSORSHIP_GAPS}
      />
      <OperationalReportDialog
        open={openDialog === "kafil-follow-up"}
        onOpenChange={(open) => setOpenDialog(open ? "kafil-follow-up" : null)}
        spec={KAFIL_FOLLOW_UP}
      />
      <OperationalReportDialog
        open={openDialog === "budget-utilization"}
        onOpenChange={(open) => setOpenDialog(open ? "budget-utilization" : null)}
        spec={BUDGET_UTILIZATION}
      />
    </div>
  )
}
