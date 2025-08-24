"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Eye, Edit, Trash2, MoreHorizontal, Users, ExternalLink, CheckCircle, Copy } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { ar } from "date-fns/locale"
import { NewExpenseDialog } from "@/components/forms/NewExpenseForm"

// Sample data
const expensesData = [
  {
    id: 1,
    date: new Date("2024-01-15"),
    subBudget: "المساعدات الشهرية",
    category: "مساعدات نقدية",
    partner: "شريك المعونة الأول",
    budgetedProject: "مشروع كفالة الأيتام 2024",
    amount: 7500,
    paymentMethod: "نقدي",
    status: "معتمد",
    beneficiariesCount: 15,
    remarks: "توزيع المساعدات الشهرية",
    beneficiaries: [
      { id: "w1", name: "فاطمة أحمد محمد", type: "widow", amount: 500 },
      { id: "w2", name: "خديجة علي حسن", type: "widow", amount: 500 },
    ],
  },
  {
    id: 2,
    date: new Date("2024-01-14"),
    subBudget: "التعليم",
    category: "رسوم دراسية",
    partner: "وزارة التعليم",
    budgetedProject: "مشروع التعليم المتميز",
    amount: 3200,
    paymentMethod: "شيك",
    status: "مسودة",
    beneficiariesCount: 8,
    remarks: "رسوم الفصل الثاني",
    beneficiaries: [
      { id: "o1", name: "أحمد محمد علي", type: "orphan", amount: 400 },
      { id: "o2", name: "سارة علي حسن", type: "orphan", amount: 400 },
    ],
  },
  {
    id: 3,
    date: new Date("2024-01-13"),
    subBudget: "الطوارئ",
    category: "مساعدات طبية",
    partner: "مستشفى الأمل",
    budgetedProject: null,
    amount: 2800,
    paymentMethod: "حوالة بنكية",
    status: "معتمد",
    beneficiariesCount: 3,
    remarks: "علاج طارئ",
    beneficiaries: [{ id: "w3", name: "مريم محمود عبدالله", type: "widow", amount: 933.33 }],
  },
]

interface ExpensesTableProps {
  searchTerm: string
}

export function ExpensesTable({ searchTerm }: ExpensesTableProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [showValidateDialog, setShowValidateDialog] = useState(false)
  const [validateTarget, setValidateTarget] = useState<{ type: "single" | "bulk"; id?: number }>({ type: "single" })
  const [duplicateExpense, setDuplicateExpense] = useState<any>(null)
  const { toast } = useToast()

  const filteredData = expensesData.filter(
    (expense) =>
      expense.subBudget.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.partner.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const totalPages = Math.ceil(filteredData.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage)

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "معتمد":
        return <Badge variant="default">معتمد</Badge>
      case "مسودة":
        return <Badge variant="secondary">مسودة</Badge>
      case "مرفوض":
        return <Badge variant="destructive">مرفوض</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getPaymentMethodBadge = (method: string) => {
    const variants = {
      نقدي: "default",
      شيك: "secondary",
      "حوالة بنكية": "outline",
    } as const

    return <Badge variant={variants[method as keyof typeof variants] || "outline"}>{method}</Badge>
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(filteredData.map((expense) => expense.id)))
    } else {
      setSelectedIds(new Set())
    }
  }

  const handleSelectRow = (id: number, checked: boolean) => {
    const newSelected = new Set(selectedIds)
    if (checked) {
      newSelected.add(id)
    } else {
      newSelected.delete(id)
    }
    setSelectedIds(newSelected)
  }

  const handleValidateExpense = (id: number) => {
    setValidateTarget({ type: "single", id })
    setShowValidateDialog(true)
  }

  const handleBulkValidate = () => {
    setValidateTarget({ type: "bulk" })
    setShowValidateDialog(true)
  }

  const handleDuplicateExpense = (expense: any) => {
    // Create a copy of the expense without the id and reset status to draft
    const duplicatedExpense = {
      ...expense,
      id: undefined,
      status: "مسودة",
      date: new Date(), // Set to current date
      totalAmount: expense.amount, // Map amount to totalAmount for the form
    }
    setDuplicateExpense(duplicatedExpense)
  }

  const confirmValidation = () => {
    if (validateTarget.type === "single" && validateTarget.id) {
      // Update single expense status to معتمد
      toast({
        title: "تم التأكيد بنجاح",
        description: "تم تأكيد المصروف بنجاح",
      })
    } else if (validateTarget.type === "bulk") {
      // Update multiple expenses status to معتمد
      toast({
        title: "تم التأكيد بنجاح",
        description: `تم تأكيد ${selectedIds.size} مصروف بنجاح`,
      })
      setSelectedIds(new Set())
    }
    setShowValidateDialog(false)
  }

  return (
    <div className="space-y-4">
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
          <span className="text-sm font-medium text-blue-900">تم تحديد {selectedIds.size} عنصر</span>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleBulkValidate}>
              <CheckCircle className="h-4 w-4 ml-2" />
              تأكيد المحدد
            </Button>
            <Button size="sm" variant="outline" onClick={() => setSelectedIds(new Set())}>
              إلغاء التحديد
            </Button>
          </div>
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12 text-center">
                <Checkbox
                  checked={selectedIds.size === filteredData.length && filteredData.length > 0}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead className="text-right">التاريخ</TableHead>
              <TableHead className="text-right">الميزانية الفرعية</TableHead>
              <TableHead className="text-right">الفئة</TableHead>
              <TableHead className="text-right">الشريك</TableHead>
              <TableHead className="text-right">المشروع الممول</TableHead>
              <TableHead className="text-right">المبلغ</TableHead>
              <TableHead className="text-center">المستفيدون</TableHead>
              <TableHead className="text-right">طريقة الدفع</TableHead>
              <TableHead className="text-right">الحالة</TableHead>
              <TableHead className="text-center">الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.map((expense) => (
              <TableRow key={expense.id}>
                <TableCell className="text-center">
                  <Checkbox
                    checked={selectedIds.has(expense.id)}
                    onCheckedChange={(checked) => handleSelectRow(expense.id, checked as boolean)}
                  />
                </TableCell>
                <TableCell className="text-right">{format(expense.date, "dd/MM/yyyy", { locale: ar })}</TableCell>
                <TableCell className="text-right font-medium">{expense.subBudget}</TableCell>
                <TableCell className="text-right">{expense.category}</TableCell>
                <TableCell className="text-right">{expense.partner}</TableCell>
                <TableCell className="text-right">
                  {expense.budgetedProject ? (
                    <Badge variant="outline" className="text-xs">
                      {expense.budgetedProject}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground text-sm">غير مرتبط</span>
                  )}
                </TableCell>
                <TableCell className="text-right font-bold text-red-600">₪ {expense.amount.toLocaleString()}</TableCell>
                <TableCell className="text-center">
                  <Button variant="ghost" size="sm" className="h-8 px-2">
                    <Users className="h-4 w-4 ml-1" />
                    {expense.beneficiariesCount}
                    <ExternalLink className="h-3 w-3 mr-1" />
                  </Button>
                </TableCell>
                <TableCell className="text-right">{getPaymentMethodBadge(expense.paymentMethod)}</TableCell>
                <TableCell className="text-right">{getStatusBadge(expense.status)}</TableCell>
                <TableCell className="text-center">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => handleValidateExpense(expense.id)}
                        disabled={expense.status === "معتمد"}
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        تأكيد
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDuplicateExpense(expense)}>
                        <Copy className="mr-2 h-4 w-4" />
                        نسخ
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Eye className="mr-2 h-4 w-4" />
                        عرض التفاصيل
                      </DropdownMenuItem>
                      <DropdownMenuItem disabled={expense.status === "معتمد"}>
                        <Edit className="mr-2 h-4 w-4" />
                        تعديل
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600">
                        <Trash2 className="mr-2 h-4 w-4" />
                        حذف
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
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

      {/* Validation Confirmation Dialog */}
      <AlertDialog open={showValidateDialog} onOpenChange={setShowValidateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد العملية</AlertDialogTitle>
            <AlertDialogDescription>
              {validateTarget.type === "single"
                ? "هل أنت متأكد من تأكيد هذا المصروف؟ لن تتمكن من تعديله بعد التأكيد."
                : `هل أنت متأكد من تأكيد ${selectedIds.size} مصروف؟ لن تتمكن من تعديلها بعد التأكيد.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={confirmValidation}>تأكيد</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Duplicate Expense Dialog */}
      {duplicateExpense && (
        <NewExpenseDialog
          open={!!duplicateExpense}
          onOpenChange={() => setDuplicateExpense(null)}
          initialData={duplicateExpense}
          onSuccess={() => {
            setDuplicateExpense(null)
            toast({
              title: "تم النسخ بنجاح",
              description: "تم إنشاء نسخة من المصروف بنجاح",
            })
          }}
        />
      )}
    </div>
  )
}
