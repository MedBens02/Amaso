"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Eye, Edit, Trash2, MoreHorizontal, CheckCircle, Copy, ArrowRightLeft, Banknote } from "lucide-react"
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
import { NewIncomeDialog } from "@/components/forms/NewIncomeForm"
import { TransferIncomeDialog } from "@/components/incomes/transfer-income-dialog"
import { cn } from "@/lib/utils"

// Sample data
const incomesData = [
  {
    id: 1,
    date: new Date("2024-01-15"),
    subBudget: "المساعدات الشهرية",
    category: "تبرعات نقدية",
    donor: "محمد أحمد السيد",
    amount: 5000,
    paymentMethod: "نقدي",
    status: "معتمد",
    isTransferred: false,
    remarks: "تبرع شهري منتظم",
  },
  {
    id: 2,
    date: new Date("2024-01-14"),
    subBudget: "التعليم",
    category: "رسوم دراسية",
    kafil: "فاطمة علي حسن",
    amount: 1200,
    paymentMethod: "شيك",
    status: "مسودة",
    isTransferred: true,
    transferDate: new Date("2024-01-13"),
    transferAccount: "الحساب الجاري",
    remarks: "كفالة طالب",
  },
  {
    id: 3,
    date: new Date("2024-01-13"),
    subBudget: "الطوارئ",
    category: "تبرعات طارئة",
    donor: "عبدالله محمود",
    amount: 3000,
    paymentMethod: "حوالة بنكية",
    status: "معتمد",
    isTransferred: true, // Bank transfers are automatically considered transferred
    remarks: "مساعدة طارئة",
  },
  {
    id: 4,
    date: new Date("2024-01-12"),
    subBudget: "المساعدات الشهرية",
    category: "تبرعات نقدية",
    donor: "سارة أحمد",
    amount: 2500,
    paymentMethod: "نقدي",
    status: "معتمد",
    isTransferred: true,
    transferDate: new Date("2024-01-13"),
    transferAccount: "الحساب الجاري",
    remarks: "تبرع نقدي",
  },
  {
    id: 5,
    date: new Date("2024-05-12"),
    subBudget: "المساعدات الشهرية",
    category: "تبرعات نقدية",
    donor: "سارة أحمد",
    amount: 3400,
    paymentMethod: "نقدي",
    status: "معتمد",
    isTransferred: false,
    remarks: "تبرع نقدي",
  },
]

interface IncomesTableProps {
  searchTerm: string
}

export function IncomesTable({ searchTerm }: IncomesTableProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [showValidateDialog, setShowValidateDialog] = useState(false)
  const [showTransferDialog, setShowTransferDialog] = useState(false)
  const [validateTarget, setValidateTarget] = useState<{ type: "single" | "bulk"; id?: number }>({ type: "single" })
  const [transferTarget, setTransferTarget] = useState<{ type: "single" | "bulk"; id?: number; items?: any[] }>({
    type: "single",
  })
  const [duplicateIncome, setDuplicateIncome] = useState<any>(null)
  const { toast } = useToast()

  const filteredData = incomesData.filter(
    (income) =>
      income.subBudget.toLowerCase().includes(searchTerm.toLowerCase()) ||
      income.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (income.donor && income.donor.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (income.kafil && income.kafil.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  const totalPages = Math.ceil(filteredData.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage)

  // Get transferable items (cash or cheque that are validated but not transferred)
  const transferableItems = filteredData.filter(
    (income) =>
      (income.paymentMethod === "نقدي" || income.paymentMethod === "شيك") &&
      income.status === "معتمد" &&
      !income.isTransferred,
  )

  const selectedTransferableItems = Array.from(selectedIds)
    .map((id) => filteredData.find((item) => item.id === id))
    .filter((item) => item && transferableItems.includes(item))

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

  const getTransferStatusBadge = (income: any) => {
    if (income.paymentMethod === "حوالة بنكية") {
      return (
        <Badge variant="outline" className="text-xs">
          حوالة بنكية
        </Badge>
      )
    }

    if (income.isTransferred) {
      return (
        <div className="flex flex-col gap-1">
          <Badge variant="default" className="text-xs">
            محول
          </Badge>
          {income.transferDate && (
            <span className="text-xs text-gray-500">{formatDateArabic(income.transferDate, "dd/MM/yyyy")}</span>
          )}
        </div>
      )
    }

    return (
      <Badge variant="destructive" className="text-xs">
        غير محول
      </Badge>
    )
  }

  const needsTransfer = (income: any) => {
    return (
      (income.paymentMethod === "نقدي" || income.paymentMethod === "شيك") &&
      income.status === "معتمد" &&
      !income.isTransferred
    )
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(filteredData.map((income) => income.id)))
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

  const handleValidateIncome = (id: number) => {
    setValidateTarget({ type: "single", id })
    setShowValidateDialog(true)
  }

  const handleBulkValidate = () => {
    setValidateTarget({ type: "bulk" })
    setShowValidateDialog(true)
  }

  const handleTransferIncome = (id: number) => {
    const income = filteredData.find((item) => item.id === id)
    setTransferTarget({ type: "single", id, items: income ? [income] : [] })
    setShowTransferDialog(true)
  }

  const handleBulkTransfer = () => {
    setTransferTarget({ type: "bulk", items: selectedTransferableItems })
    setShowTransferDialog(true)
  }

  const handleDuplicateIncome = (income: any) => {
    // Create a copy of the income without the id and reset status to draft
    const duplicatedIncome = {
      ...income,
      id: undefined,
      status: "مسودة",
      date: new Date(), // Set to current date
      isTransferred: false,
      transferDate: undefined,
      transferAccount: undefined,
    }
    setDuplicateIncome(duplicatedIncome)
  }

  const confirmValidation = () => {
    if (validateTarget.type === "single" && validateTarget.id) {
      // Update single income status to معتمد
      toast({
        title: "تم التأكيد بنجاح",
        description: "تم تأكيد الإيراد بنجاح",
      })
    } else if (validateTarget.type === "bulk") {
      // Update multiple incomes status to معتمد
      toast({
        title: "تم التأكيد بنجاح",
        description: `تم تأكيد ${selectedIds.size} إيراد بنجاح`,
      })
      setSelectedIds(new Set())
    }
    setShowValidateDialog(false)
  }

  const handleTransferSuccess = () => {
    if (transferTarget.type === "single") {
      toast({
        title: "تم التحويل بنجاح",
        description: "تم تحويل الإيراد إلى الحساب البنكي بنجاح",
      })
    } else {
      toast({
        title: "تم التحويل بنجاح",
        description: `تم تحويل ${transferTarget.items?.length || 0} إيراد إلى الحساب البنكي بنجاح`,
      })
      setSelectedIds(new Set())
    }
    setShowTransferDialog(false)
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
            {selectedTransferableItems.length > 0 && (
              <Button size="sm" variant="outline" onClick={handleBulkTransfer}>
                <ArrowRightLeft className="h-4 w-4 ml-2" />
                تحويل المحدد ({selectedTransferableItems.length})
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={() => setSelectedIds(new Set())}>
              إلغاء التحديد
            </Button>
          </div>
        </div>
      )}

      {transferableItems.length > 0 && (
        <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
          <div className="flex items-center gap-2">
            <Banknote className="h-4 w-4 text-orange-600" />
            <span className="text-sm font-medium text-orange-900">
              يوجد {transferableItems.length} إيراد نقدي/شيك بحاجة للتحويل إلى البنك
            </span>
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
              <TableHead className="text-right">المتبرع/الكفيل</TableHead>
              <TableHead className="text-right">المبلغ</TableHead>
              <TableHead className="text-right">طريقة الدفع</TableHead>
              <TableHead className="text-right">حالة التحويل</TableHead>
              <TableHead className="text-right">الحالة</TableHead>
              <TableHead className="text-center">الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.map((income) => (
              <TableRow key={income.id} className={cn(needsTransfer(income) && "bg-red-50 hover:bg-red-100")}>
                <TableCell className="text-center">
                  <Checkbox
                    checked={selectedIds.has(income.id)}
                    onCheckedChange={(checked) => handleSelectRow(income.id, checked as boolean)}
                  />
                </TableCell>
                <TableCell className="text-right">{formatDateArabic(income.date, "dd/MM/yyyy")}</TableCell>
                <TableCell className="text-right font-medium">{income.subBudget}</TableCell>
                <TableCell className="text-right">{income.category}</TableCell>
                <TableCell className="text-right">
                  {income.donor && (
                    <div className="flex items-center gap-1 justify-end">
                      <span>{income.donor}</span>
                      <span className="text-xs text-blue-600">:متبرع</span>
                    </div>
                  )}
                  {income.kafil && (
                    <div className="flex items-center gap-1 justify-end">
                      <span>{income.kafil}</span>
                      <span className="text-xs text-green-600">:كفيل</span>
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-right font-bold text-green-600">
                  ₪ {income.amount.toLocaleString()}
                </TableCell>
                <TableCell className="text-right">{getPaymentMethodBadge(income.paymentMethod)}</TableCell>
                <TableCell className="text-right">{getTransferStatusBadge(income)}</TableCell>
                <TableCell className="text-right">{getStatusBadge(income.status)}</TableCell>
                <TableCell className="text-center">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => handleValidateIncome(income.id)}
                        disabled={income.status === "معتمد"}
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        تأكيد
                      </DropdownMenuItem>
                      {needsTransfer(income) && (
                        <DropdownMenuItem onClick={() => handleTransferIncome(income.id)}>
                          <ArrowRightLeft className="mr-2 h-4 w-4" />
                          تحويل للبنك
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => handleDuplicateIncome(income)}>
                        <Copy className="mr-2 h-4 w-4" />
                        نسخ
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Eye className="mr-2 h-4 w-4" />
                        عرض التفاصيل
                      </DropdownMenuItem>
                      <DropdownMenuItem disabled={income.status === "معتمد"}>
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
                ? "هل أنت متأكد من تأكيد هذا الإيراد؟ لن تتمكن من تعديله بعد التأكيد."
                : `هل أنت متأكد من تأكيد ${selectedIds.size} إيراد؟ لن تتمكن من تعديلها بعد التأكيد.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={confirmValidation}>تأكيد</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Transfer Dialog */}
      <TransferIncomeDialog
        open={showTransferDialog}
        onOpenChange={setShowTransferDialog}
        items={transferTarget.items || []}
        onSuccess={handleTransferSuccess}
      />

      {/* Duplicate Income Dialog */}
      {duplicateIncome && (
        <NewIncomeDialog
          open={!!duplicateIncome}
          onOpenChange={() => setDuplicateIncome(null)}
          initialData={duplicateIncome}
          onSuccess={() => {
            setDuplicateIncome(null)
            toast({
              title: "تم النسخ بنجاح",
              description: "تم إنشاء نسخة من الإيراد بنجاح",
            })
          }}
        />
      )}
    </div>
  )
}
