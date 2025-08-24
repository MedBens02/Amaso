"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Eye, Edit, Trash2, ArrowRight } from "lucide-react"
import { format } from "date-fns"
import { ar } from "date-fns/locale"

// Sample data
const transfersData = [
  {
    id: 1,
    date: new Date("2024-01-15"),
    fromAccount: "الحساب الجاري",
    toAccount: "حساب الطوارئ",
    amount: 10000,
    status: "مكتمل",
    remarks: "تحويل للطوارئ",
    runningBalance: 125680,
  },
  {
    id: 2,
    date: new Date("2024-01-14"),
    fromAccount: "حساب التوفير",
    toAccount: "الحساب الجاري",
    amount: 5000,
    status: "معلق",
    remarks: "تحويل للمصروفات الشهرية",
    runningBalance: 135680,
  },
  {
    id: 3,
    date: new Date("2024-01-13"),
    fromAccount: "الحساب الجاري",
    toAccount: "حساب التوفير",
    amount: 15000,
    status: "مكتمل",
    remarks: "توفير جزء من التبرعات",
    runningBalance: 140680,
  },
]

interface TransfersTableProps {
  searchTerm: string
}

export function TransfersTable({ searchTerm }: TransfersTableProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const filteredData = transfersData.filter(
    (transfer) =>
      transfer.fromAccount.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transfer.toAccount.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transfer.remarks.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const totalPages = Math.ceil(filteredData.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage)

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "مكتمل":
        return <Badge variant="default">مكتمل</Badge>
      case "معلق":
        return <Badge variant="secondary">معلق</Badge>
      case "ملغي":
        return <Badge variant="destructive">ملغي</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">التاريخ</TableHead>
              <TableHead className="text-right">من حساب</TableHead>
              <TableHead className="text-right">إلى حساب</TableHead>
              <TableHead className="text-right">المبلغ</TableHead>
              <TableHead className="text-right">الرصيد الجاري</TableHead>
              <TableHead className="text-right">الحالة</TableHead>
              <TableHead className="text-right">ملاحظات</TableHead>
              <TableHead className="text-center">الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.map((transfer) => (
              <TableRow key={transfer.id}>
                <TableCell className="text-right">{format(transfer.date, "dd/MM/yyyy", { locale: ar })}</TableCell>
                <TableCell className="font-medium text-right">{transfer.fromAccount}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center gap-2 justify-end">
                    <span>{transfer.toAccount}</span>
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                  </div>
                </TableCell>
                <TableCell className="font-bold text-blue-600 text-right">
                  ₪ {transfer.amount.toLocaleString()}
                </TableCell>
                <TableCell className="font-medium text-right">₪ {transfer.runningBalance.toLocaleString()}</TableCell>
                <TableCell className="text-right">{getStatusBadge(transfer.status)}</TableCell>
                <TableCell className="text-sm text-gray-600 text-right">{transfer.remarks}</TableCell>
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
