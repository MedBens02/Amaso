"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Edit, Trash2, School } from "lucide-react"

const institutionsData = [
  {
    id: 1,
    name: "مدرسة الأمل الابتدائية",
    type: "ابتدائي",
    location: "حي الزهراء",
    students: 45,
    status: "نشط",
  },
  {
    id: 2,
    name: "مدرسة النور الابتدائية",
    type: "ابتدائي",
    location: "حي النور",
    students: 32,
    status: "نشط",
  },
  {
    id: 3,
    name: "مدرسة الفلاح الإعدادية",
    type: "إعدادي",
    location: "حي السلام",
    students: 28,
    status: "نشط",
  },
  {
    id: 4,
    name: "مدرسة المستقبل الثانوية",
    type: "ثانوي",
    location: "حي الأمل",
    students: 15,
    status: "معلق",
  },
]

export function InstitutionsTab() {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredInstitutions = institutionsData.filter(
    (institution) =>
      institution.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      institution.location.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">المؤسسات التعليمية</h2>
          <p className="text-gray-600">إدارة المدارس والمؤسسات التعليمية</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 ml-2" />
          إضافة مؤسسة جديدة
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="البحث في المؤسسات..."
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
                  <TableHead className="text-right">اسم المؤسسة</TableHead>
                  <TableHead className="text-right">النوع</TableHead>
                  <TableHead className="text-right">الموقع</TableHead>
                  <TableHead className="text-right">عدد الطلاب</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-center">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInstitutions.map((institution) => (
                  <TableRow key={institution.id}>
                    <TableCell className="font-medium text-right">
                      <div className="flex items-center gap-2 justify-end">
                        <span>{institution.name}</span>
                        <School className="h-4 w-4 text-blue-500" />
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{institution.type}</TableCell>
                    <TableCell className="text-right">{institution.location}</TableCell>
                    <TableCell className="text-right">{institution.students}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant={institution.status === "نشط" ? "default" : "secondary"}>
                        {institution.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex gap-2 justify-center">
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
        </CardContent>
      </Card>
    </div>
  )
}
