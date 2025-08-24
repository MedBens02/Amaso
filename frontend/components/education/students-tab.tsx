"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Edit, Eye, GraduationCap } from "lucide-react"

const studentsData = [
  {
    id: 1,
    name: "أحمد محمد علي",
    school: "مدرسة الأمل الابتدائية",
    grade: "الصف السادس",
    age: 12,
    motherName: "فاطمة أحمد",
    status: "نشط",
  },
  {
    id: 2,
    name: "سارة علي حسن",
    school: "مدرسة النور الابتدائية",
    grade: "الصف الثالث",
    age: 9,
    motherName: "خديجة علي",
    status: "نشط",
  },
  {
    id: 3,
    name: "محمد عبدالله يوسف",
    school: "مدرسة الفلاح الإعدادية",
    grade: "الصف التاسع",
    age: 15,
    motherName: "مريم محمود",
    status: "معلق",
  },
]

export function StudentsTab() {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredStudents = studentsData.filter(
    (student) =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.school.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">الطلاب المسجلين</h2>
          <p className="text-gray-600">إدارة الطلاب والتسجيل الأكاديمي</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 ml-2" />
          تسجيل طالب جديد
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="البحث في الطلاب..."
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
                  <TableHead className="text-right">الم��رسة</TableHead>
                  <TableHead className="text-right">الصف</TableHead>
                  <TableHead className="text-right">العمر</TableHead>
                  <TableHead className="text-right">اسم الأم</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-center">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium text-right">
                      <div className="flex items-center gap-2 justify-end">
                        <span>{student.name}</span>
                        <GraduationCap className="h-4 w-4 text-green-500" />
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{student.school}</TableCell>
                    <TableCell className="text-right">{student.grade}</TableCell>
                    <TableCell className="text-right">{student.age}</TableCell>
                    <TableCell className="text-right">{student.motherName}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant={student.status === "نشط" ? "default" : "secondary"}>{student.status}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex gap-2 justify-center">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
