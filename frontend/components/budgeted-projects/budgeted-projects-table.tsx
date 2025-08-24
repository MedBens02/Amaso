"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Eye, Edit, Trash2, Calendar, DollarSign } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { ar } from "date-fns/locale"

// Sample data for budgeted projects
const budgetedProjectsData = [
  {
    id: 1,
    name: "مشروع كفالة الأيتام 2024",
    description: "برنامج كفالة شهرية للأيتام",
    totalBudget: 120000,
    usedBudget: 75000,
    startDate: new Date("2024-01-01"),
    endDate: new Date("2024-12-31"),
    status: "نشط",
    donor: "مؤسسة الخير",
    category: "كفالات",
    expensesCount: 25,
  },
  {
    id: 2,
    name: "مشروع التعليم المتميز",
    description: "دعم الطلاب المتفوقين بالرسوم الدراسية",
    totalBudget: 80000,
    usedBudget: 45000,
    startDate: new Date("2024-02-01"),
    endDate: new Date("2024-11-30"),
    status: "نشط",
    donor: "جمعية التعليم",
    category: "تعليم",
    expensesCount: 18,
  },
  {
    id: 3,
    name: "مشروع الرعاية الصحية",
    description: "توفير العلاج والأدوية للمحتاجين",
    totalBudget: 60000,
    usedBudget: 60000,
    startDate: new Date("2023-06-01"),
    endDate: new Date("2024-05-31"),
    status: "مكتمل",
    donor: "مستشفى الأمل",
    category: "صحة",
    expensesCount: 42,
  },
  {
    id: 4,
    name: "مشروع الإغاثة الطارئة",
    description: "مساعدات عاجلة للحالات الطارئة",
    totalBudget: 50000,
    usedBudget: 12000,
    startDate: new Date("2024-03-01"),
    endDate: new Date("2024-08-31"),
    status: "نشط",
    donor: "صندوق الطوارئ",
    category: "طوارئ",
    expensesCount: 8,
  },
  {
    id: 5,
    name: "مشروع بناء المدرسة",
    description: "إنشاء مدرسة جديدة للأطفال",
    totalBudget: 200000,
    usedBudget: 150000,
    startDate: new Date("2023-09-01"),
    endDate: new Date("2024-06-30"),
    status: "قيد التنفيذ",
    donor: "مؤسسة البناء",
    category: "بنية تحتية",
    expensesCount: 35,
  },
]

interface BudgetedProjectsTableProps {
  searchTerm: string
}

export function BudgetedProjectsTable({ searchTerm }: BudgetedProjectsTableProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const { toast } = useToast()

  const filteredData = budgetedProjectsData.filter(
    (project) =>
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.donor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.category.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const totalPages = Math.ceil(filteredData.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage)

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "نشط":
        return <Badge variant="default">نشط</Badge>
      case "قيد التنفيذ":
        return <Badge variant="secondary">قيد التنفيذ</Badge>
      case "مكتمل":
        return <Badge variant="outline">مكتمل</Badge>
      case "متوقف":
        return <Badge variant="destructive">متوقف</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getCategoryBadge = (category: string) => {
    const variants = {
      كفالات: "default",
      تعليم: "secondary",
      صحة: "destructive",
      طوارئ: "outline",
      "بنية تحتية": "secondary",
    } as const

    return <Badge variant={variants[category as keyof typeof variants] || "outline"}>{category}</Badge>
  }

  const calculateProgress = (used: number, total: number) => {
    return Math.round((used / total) * 100)
  }

  const getRemainingBudget = (total: number, used: number) => {
    return total - used
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">اسم المشروع</TableHead>
              <TableHead className="text-right">الفئة</TableHead>
              <TableHead className="text-right">المتبرع</TableHead>
              <TableHead className="text-right">الميزانية الإجمالية</TableHead>
              <TableHead className="text-right">المبلغ المستخدم</TableHead>
              <TableHead className="text-center">التقدم</TableHead>
              <TableHead className="text-right">تاريخ البداية</TableHead>
              <TableHead className="text-right">تاريخ النهاية</TableHead>
              <TableHead className="text-right">الحالة</TableHead>
              <TableHead className="text-center">الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.map((project) => {
              const progress = calculateProgress(project.usedBudget, project.totalBudget)
              const remaining = getRemainingBudget(project.totalBudget, project.usedBudget)

              return (
                <TableRow key={project.id}>
                  <TableCell className="text-right">
                    <div>
                      <div className="font-medium">{project.name}</div>
                      <div className="text-sm text-muted-foreground">{project.description}</div>
                      <div className="text-xs text-muted-foreground mt-1">{project.expensesCount} مصروف مرتبط</div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{getCategoryBadge(project.category)}</TableCell>
                  <TableCell className="text-right font-medium">{project.donor}</TableCell>
                  <TableCell className="text-right font-bold text-blue-600">
                    ₪ {project.totalBudget.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div>
                      <div className="font-bold text-red-600">₪ {project.usedBudget.toLocaleString()}</div>
                      <div className="text-xs text-green-600">متبقي: ₪ {remaining.toLocaleString()}</div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="space-y-2">
                      <Progress value={progress} className="w-20" />
                      <div className="text-xs text-center">{progress}%</div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center gap-1 text-sm justify-end">
                      <span>{format(project.startDate, "dd/MM/yyyy", { locale: ar })}</span>
                      <Calendar className="h-3 w-3" />
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center gap-1 text-sm justify-end">
                      <span>{format(project.endDate, "dd/MM/yyyy", { locale: ar })}</span>
                      <Calendar className="h-3 w-3" />
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{getStatusBadge(project.status)}</TableCell>
                  <TableCell className="text-center">
                    <div className="flex gap-2 justify-center">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <DollarSign className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" disabled={project.status === "مكتمل"}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            عرض {startIndex + 1} إلى {Math.min(startIndex + itemsPerPage, filteredData.length)} من {filteredData.length}{" "}
            نتيجة
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              السابق
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              التالي
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
