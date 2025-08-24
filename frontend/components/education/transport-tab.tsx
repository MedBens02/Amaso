"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Edit, Bus, MapPin } from "lucide-react"

const transportData = [
  {
    id: 1,
    routeName: "خط حي الزهراء",
    driver: "محمد أحمد",
    students: 12,
    schools: ["مدرسة الأمل الابتدائية", "مدرسة النور الابتدائية"],
    status: "نشط",
    schedule: "7:00 ص - 2:00 م",
  },
  {
    id: 2,
    routeName: "خط حي النور",
    driver: "علي محمود",
    students: 8,
    schools: ["مدرسة الفلاح الإعدادية"],
    status: "نشط",
    schedule: "7:30 ص - 1:30 م",
  },
  {
    id: 3,
    routeName: "خط حي السلام",
    driver: "أحمد يوسف",
    students: 15,
    schools: ["مدرسة المستقبل الثانوية"],
    status: "معلق",
    schedule: "8:00 ص - 3:00 م",
  },
]

export function TransportTab() {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredTransport = transportData.filter(
    (transport) =>
      transport.routeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transport.driver.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">النقل المدرسي</h2>
          <p className="text-gray-600">إدارة خطوط النقل والمواصلات المدرسية</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 ml-2" />
          إضافة خط نقل جديد
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="البحث في خطوط النقل..."
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
                  <TableHead className="text-right">اسم الخط</TableHead>
                  <TableHead className="text-right">السائق</TableHead>
                  <TableHead className="text-right">عدد الطلاب</TableHead>
                  <TableHead className="text-right">المدارس</TableHead>
                  <TableHead className="text-right">المواعيد</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-center">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransport.map((transport) => (
                  <TableRow key={transport.id}>
                    <TableCell className="font-medium text-right">
                      <div className="flex items-center gap-2 justify-end">
                        <span>{transport.routeName}</span>
                        <Bus className="h-4 w-4 text-blue-500" />
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{transport.driver}</TableCell>
                    <TableCell className="text-right">{transport.students}</TableCell>
                    <TableCell className="text-right">
                      <div className="space-y-1">
                        {transport.schools.map((school, index) => (
                          <div key={index} className="text-sm text-gray-600 flex items-center gap-1 justify-end">
                            <span>{school}</span>
                            <MapPin className="h-3 w-3" />
                          </div>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-right">{transport.schedule}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant={transport.status === "نشط" ? "default" : "secondary"}>{transport.status}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center">
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
