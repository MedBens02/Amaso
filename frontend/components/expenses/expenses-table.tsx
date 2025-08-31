"use client"

import { useState, useEffect } from "react"
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
import { formatDateArabic } from "@/lib/date-utils"
import { NewExpenseDialog } from "@/components/forms/NewExpenseForm"

interface Expense {
  id: number
  expense_date: string
  amount: number
  payment_method: string
  status: string
  details?: string
  remarks?: string
  cheque_number?: string
  receipt_number?: string
  unrelated_to_benef: boolean
  sub_budget: {
    id: number
    label: string
  }
  expense_category: {
    id: number
    label: string
  }
  partner?: {
    id: number
    name: string
  }
  bank_account?: {
    id: number
    name: string
    bank_name: string
  }
  beneficiaries: Array<{
    id: number
    beneficiary_id: number
    amount: number
    notes?: string
    beneficiary: {
      id: number
      full_name: string
      type: string
    }
  }>
}

interface ExpensesTableProps {
  searchTerm: string
}

export function ExpensesTable({ searchTerm }: ExpensesTableProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 15
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [showValidateDialog, setShowValidateDialog] = useState(false)
  const [validateTarget, setValidateTarget] = useState<{ type: "single" | "bulk"; id?: number }>({ type: "single" })
  const [duplicateExpense, setDuplicateExpense] = useState<any>(null)
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [totalExpenses, setTotalExpenses] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const { toast } = useToast()

  useEffect(() => {
    fetchExpenses()
  }, [currentPage, searchTerm])

  const fetchExpenses = async () => {
    setLoading(true)
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1'
      const url = new URL(`${baseUrl}/expenses`)
      
      const params = new URLSearchParams()
      params.append('page', currentPage.toString())
      params.append('per_page', itemsPerPage.toString())
      
      if (searchTerm && searchTerm.trim()) {
        params.append('search', searchTerm.trim())
      }
      
      url.search = params.toString()
      
      const response = await fetch(url.toString())
      if (!response.ok) {
        throw new Error('Failed to fetch expenses')
      }
      
      const result = await response.json()
      setExpenses(result.data || [])
      setTotalExpenses(result.meta?.total || 0)
      setTotalPages(result.meta?.last_page || 1)
    } catch (error) {
      console.error('Error fetching expenses:', error)
      toast({
        title: "خطأ",
        description: "حدث خطأ في تحميل البيانات",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Approved":
        return <Badge variant="default">معتمد</Badge>
      case "Draft":
        return <Badge variant="secondary">مسودة</Badge>
      case "Rejected":
        return <Badge variant="destructive">مرفوض</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getPaymentMethodBadge = (method: string) => {
    const methodLabels = {
      Cash: "نقدي",
      Cheque: "شيك",
      BankWire: "حوالة بنكية",
    } as const

    const variants = {
      Cash: "default",
      Cheque: "secondary",
      BankWire: "outline",
    } as const

    const label = methodLabels[method as keyof typeof methodLabels] || method
    return <Badge variant={variants[method as keyof typeof variants] || "outline"}>{label}</Badge>
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(expenses.map((expense) => expense.id)))
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

  const handleValidateExpense = async (id: number) => {
    try {
      await api.approveExpense(id)
      toast({
        title: "تم التأكيد بنجاح",
        description: "تم تأكيد المصروف بنجاح",
      })
      fetchExpenses()
    } catch (error) {
      console.error('Error approving expense:', error)
      toast({
        title: "خطأ",
        description: "حدث خطأ في تأكيد المصروف",
        variant: "destructive",
      })
    }
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
                  checked={selectedIds.size === expenses.length && expenses.length > 0}
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
            {loading ? (
              <TableRow>
                <TableCell colSpan={11} className="text-center py-6">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    <span className="mr-2">جاري التحميل...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : expenses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} className="text-center py-6 text-gray-500">
                  لا توجد مصروفات
                </TableCell>
              </TableRow>
            ) : (
              expenses.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell className="text-center">
                    <Checkbox
                      checked={selectedIds.has(expense.id)}
                      onCheckedChange={(checked) => handleSelectRow(expense.id, checked as boolean)}
                    />
                  </TableCell>
                  <TableCell className="text-right">{formatDateArabic(new Date(expense.expense_date), "dd/MM/yyyy")}</TableCell>
                  <TableCell className="text-right font-medium">{expense.sub_budget?.label || 'غير محدد'}</TableCell>
                  <TableCell className="text-right">{expense.expense_category?.label || 'غير محدد'}</TableCell>
                  <TableCell className="text-right">{expense.partner?.name || 'غير محدد'}</TableCell>
                  <TableCell className="text-right">
                    <span className="text-muted-foreground text-sm">غير مرتبط</span>
                  </TableCell>
                  <TableCell className="text-right font-bold text-red-600">DH {Number(expense.amount).toLocaleString()}</TableCell>
                  <TableCell className="text-center">
                    <Button variant="ghost" size="sm" className="h-8 px-2">
                      <Users className="h-4 w-4 ml-1" />
                      {expense.beneficiaries?.length || 0}
                      <ExternalLink className="h-3 w-3 mr-1" />
                    </Button>
                  </TableCell>
                  <TableCell className="text-right">{getPaymentMethodBadge(expense.payment_method)}</TableCell>
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
                          disabled={expense.status === "Approved"}
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
                        <DropdownMenuItem disabled={expense.status === "Approved"}>
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
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            عرض {((currentPage - 1) * itemsPerPage) + 1} إلى {Math.min(currentPage * itemsPerPage, totalExpenses)} من {totalExpenses}{" "}
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
            <span className="flex items-center px-3 py-1 text-sm">
              {currentPage} من {totalPages}
            </span>
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
