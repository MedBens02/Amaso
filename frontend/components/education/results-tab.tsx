"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Edit, Award } from "lucide-react"

const resultsData = [
  {
    id: 1,
    studentName: "أحمد محمد علي",
    subject: "الرياضيات",
    grade: "الصف السادس",
    score: 85,
    semester: "الفصل الأول",
    year: "2024",
    status: "ناجح",
  },
  {
    id: 2,
    studentName: "سارة علي حسن",
    subject: "اللغة العربية",
    grade: "الصف الثالث",
    score: 92,
    semester: "الفصل الأول",
    year: "2024",
    status: "ممتاز",
  },
  {
    id: 3,
    studentName: "محمد عبدالله يوسف",
    subject: "العلوم",
    grade: "الصف التاسع",
    score: 78,
    semester: "الفصل الأول",
    year: "2024",
    status: "جيد",
  },
]

export function ResultsTab() {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredResults = resultsData.filter(
    (result) =>
      result.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      result.subject.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getScoreBadge = (score: number) => {
    if (score >= 90) return { variant: "default" as const, label: "ممتاز" }
    if (score >= 80) return { variant: "secondary" as const, label: "جيد جداً" }
    if (score >= 70) return { variant: "outline" as const, label: "جيد" }
    return { variant: "destructive" as const, label: "ضعيف" }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">النتائج الأكاديمية</h2>
          <p className="text-gray-600">إدارة ومتابعة النتائج الدراسية</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 ml-2" />
          إضافة نتيجة جديدة
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="البحث في النتائج..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">اسم الطالب</TableHead>
                  <TableHead className="text-right">المادة</TableHead>
                  <TableHead className="text-right">الصف</TableHead>
                  <TableHead className="text-right">الدرجة</TableHead>
                  <TableHead className="text-right">الفصل</TableHead>
                  <TableHead className="text-right">السنة</TableHead>
                  <TableHead className="text-right">التقدير</TableHead>
                  <TableHead className="text-center">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredResults.map((result) => {
                  const scoreBadge = getScoreBadge(result.score)
                  return (
                    <TableRow key={result.id}>
                      <TableCell className="font-medium text-right">
                        <div className="flex items-center gap-2 justify-end">
                          <span>{result.studentName}</span>
                          <Award className="h-4 w-4 text-yellow-500" />
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{result.subject}</TableCell>
                      <TableCell className="text-right">{result.grade}</TableCell>
                      <TableCell className="font-bold text-right">{result.score}%</TableCell>
                      <TableCell className="text-right">{result.semester}</TableCell>
                      <TableCell className="text-right">{result.year}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant={scoreBadge.variant}>{scoreBadge.label}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center">
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
