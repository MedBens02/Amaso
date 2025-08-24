"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Eye, Edit, Trash2 } from "lucide-react"

// Sample data
const orphansData = [
  {
    id: 1,
    name: "أحمد محمد علي",
    age: 12,
    gender: "ذكر",
    motherName: "فاطمة أحمد محمد",
    school: "مدرسة الأمل الابتدائية",
    grade: "الصف السادس",
    status: "مسجل",
    neighborhood: "حي الزهراء",
  },
  {
    id: 2,
    name: "سارة علي حسن",
    age: 9,
    gender: "أنثى",
    motherName: "خديجة علي حسن",
    school: "مدرسة النور الابتدائية",
    grade: "الصف الثالث",
    status: "مسجل",
    neighborhood: "حي النور",
  },
  {
    id: 3,
    name: "محمد عبدالله يوسف",
    age: 15,
    gender: "ذكر",
    motherName: "مريم محمود عبدالله",
    school: "مدرسة الفلاح الإعدادية",
    grade: "الصف التاسع",
    status: "معلق",
    neighborhood: "حي السلام",
  },
  {
    id: 4,
    name: "فاطمة يوسف إبراهيم",
    age: 7,
    gender: "أنثى",
    motherName: "عائشة يوسف إبراهيم",
    school: "مدرسة الأمل الابتدائية",
    grade: "الصف الأول",
    status: "مسجل",
    neighborhood: "حي الأمل",
  },
]

interface OrphansTableProps {
  searchTerm: string
}

export function OrphansTable({ searchTerm }: OrphansTableProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const filteredData = orphansData.filter(
    (orphan) =>
      orphan.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      orphan.motherName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      orphan.school.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const totalPages = Math.ceil(filteredData.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage)

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">اسم اليتيم</TableHead>
              <TableHead className="text-right">العمر</TableHead>
              <TableHead className="text-right">الجنس</TableHead>
              <TableHead className="text-right">اسم الأم</TableHead>
              <TableHead className="text-right">المدرسة</TableHead>
              <TableHead className="text-right">الصف</TableHead>
              <TableHead className="text-right">الحي</TableHead>
              <TableHead className="text-right">الحالة</TableHead>
              <TableHead className="text-center">الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.map((orphan) => (
              <TableRow key={orphan.id}>
                <TableCell className="font-medium text-right">{orphan.name}</TableCell>
                <TableCell className="text-right">{orphan.age}</TableCell>
                <TableCell className="text-right">{orphan.gender}</TableCell>
                <TableCell className="text-right">{orphan.motherName}</TableCell>
                <TableCell className="text-right">{orphan.school}</TableCell>
                <TableCell className="text-right">{orphan.grade}</TableCell>
                <TableCell className="text-right">{orphan.neighborhood}</TableCell>
                <TableCell className="text-right">
                  <Badge variant={orphan.status === "مسجل" ? "default" : "secondary"}>{orphan.status}</Badge>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex gap-2 justify-center">
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-red-600">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
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
