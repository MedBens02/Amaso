"use client"

import { useState, useEffect } from "react"
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
import { ViewIncomeDialog } from "@/components/incomes/view-income-dialog"
import { cn } from "@/lib/utils"

// Interface for real income data from API
interface IncomeData {
  id: number
  fiscal_year_id: number
  sub_budget_id: number
  income_category_id: number
  donor_id?: number
  kafil_id?: number
  income_date: string
  amount: string
  payment_method: "Cash" | "Cheque" | "BankWire"
  cheque_number?: string
  receipt_number?: string
  bank_account_id?: number
  remarks?: string
  status: "Draft" | "Approved" | "Rejected"
  created_by?: number
  approved_by?: number
  approved_at?: string
  transferred_at?: string
  created_at: string
  updated_at: string
  fiscal_year: {
    id: number
    year: string
    is_active: boolean
  }
  sub_budget: {
    id: number
    label: string
  }
  income_category: {
    id: number
    label: string
  }
  donor?: {
    id: number
    first_name: string
    last_name: string
    phone?: string
    email?: string
  }
  kafil?: {
    id: number
    first_name: string
    last_name: string
    phone?: string
    email?: string
  }
  bank_account?: {
    id: number
    label: string
    bank_name: string
  }
}

interface ApiResponse {
  data: IncomeData[]
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}

interface FilterValues {
  fromDate?: Date
  toDate?: Date
  subBudgetId?: string
  paymentMethod?: string
  status?: string
  minAmount?: string
  maxAmount?: string
  fiscalYearId?: string
}

interface IncomesTableProps {
  searchTerm: string
  filters: FilterValues
}

export function IncomesTable({ searchTerm, filters }: IncomesTableProps) {
  const [incomesData, setIncomesData] = useState<IncomeData[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const itemsPerPage = 10
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [showValidateDialog, setShowValidateDialog] = useState(false)
  const [showTransferDialog, setShowTransferDialog] = useState(false)
  const [validateTarget, setValidateTarget] = useState<{ type: "single" | "bulk"; id?: number }>({ type: "single" })
  const [transferTarget, setTransferTarget] = useState<{ type: "single" | "bulk"; id?: number; items?: any[] }>({
    type: "single",
  })
  const [duplicateIncome, setDuplicateIncome] = useState<any>(null)
  const [editingIncome, setEditingIncome] = useState<IncomeData | null>(null)
  const [viewingIncome, setViewingIncome] = useState<IncomeData | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [incomeToDelete, setIncomeToDelete] = useState<number | null>(null)
  const { toast } = useToast()

  // Dialog handlers with pointer-events fix
  const handleCloseValidateDialog = () => {
    // Force remove any lingering pointer-events blocking
    setTimeout(() => {
      document.body.style.pointerEvents = 'auto'
    }, 100)
    setShowValidateDialog(false)
  }

  const handleValidateDialogOpenChange = (open: boolean) => {
    if (!open) {
      // Force remove any lingering pointer-events blocking
      setTimeout(() => {
        document.body.style.pointerEvents = 'auto'
      }, 100)
      setShowValidateDialog(false)
    }
  }

  const handleCloseDeleteDialog = () => {
    // Force remove any lingering pointer-events blocking
    setTimeout(() => {
      document.body.style.pointerEvents = 'auto'
    }, 100)
    setShowDeleteDialog(false)
  }

  const handleDeleteDialogOpenChange = (open: boolean) => {
    if (!open) {
      // Force remove any lingering pointer-events blocking
      setTimeout(() => {
        document.body.style.pointerEvents = 'auto'
      }, 100)
      setShowDeleteDialog(false)
    }
  }

  const handleCloseTransferDialog = () => {
    // Force remove any lingering pointer-events blocking
    setTimeout(() => {
      document.body.style.pointerEvents = 'auto'
    }, 100)
    setShowTransferDialog(false)
  }

  const handleTransferDialogOpenChange = (open: boolean) => {
    if (!open) {
      // Force remove any lingering pointer-events blocking
      setTimeout(() => {
        document.body.style.pointerEvents = 'auto'
      }, 100)
      setShowTransferDialog(false)
    }
  }

  // Fetch incomes data from API
  const fetchIncomes = async () => {
    setLoading(true)
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1'
      const url = new URL(`${baseUrl}/incomes`)
      
      const params = new URLSearchParams()
      params.append('page', currentPage.toString())
      params.append('per_page', itemsPerPage.toString())
      
      // Apply filters
      if (filters.fromDate) {
        params.append('from_date', filters.fromDate.toISOString().split('T')[0])
      }
      if (filters.toDate) {
        params.append('to_date', filters.toDate.toISOString().split('T')[0])
      }
      if (filters.subBudgetId) {
        params.append('sub_budget_id', filters.subBudgetId)
      }
      if (filters.paymentMethod) {
        params.append('payment_method', filters.paymentMethod)
      }
      if (filters.status) {
        params.append('status', filters.status)
      }
      if (filters.minAmount) {
        params.append('min_amount', filters.minAmount)
      }
      if (filters.maxAmount) {
        params.append('max_amount', filters.maxAmount)
      }
      if (filters.fiscalYearId) {
        params.append('fiscal_year_id', filters.fiscalYearId)
      }
      
      if (searchTerm.trim()) {
        // For now, we'll implement client-side filtering
        // In production, you'd want server-side search
      }
      
      url.search = params.toString()
      
      const response = await fetch(url.toString())
      if (!response.ok) {
        throw new Error('Failed to fetch incomes')
      }
      
      const result: ApiResponse = await response.json()
      setIncomesData(result.data)
      setTotalPages(result.meta.last_page)
      setTotalItems(result.meta.total)
    } catch (error) {
      console.error('Error fetching incomes:', error)
      toast({
        title: "خطأ في تحميل البيانات",
        description: "حدث خطأ أثناء تحميل بيانات الإيرادات",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchIncomes()
  }, [currentPage, filters])

  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1)
    } else {
      fetchIncomes()
    }
  }, [searchTerm])

  // Reset to first page when filters change
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1)
    } else {
      fetchIncomes()
    }
  }, [filters])

  // Client-side filtering for search
  const filteredData = incomesData.filter((income) => {
    if (!searchTerm.trim()) return true
    
    const searchLower = searchTerm.toLowerCase()
    return (
      income.sub_budget.label.toLowerCase().includes(searchLower) ||
      income.income_category.label.toLowerCase().includes(searchLower) ||
      (income.donor && `${income.donor.first_name} ${income.donor.last_name}`.toLowerCase().includes(searchLower)) ||
      (income.kafil && `${income.kafil.first_name} ${income.kafil.last_name}`.toLowerCase().includes(searchLower)) ||
      (income.remarks && income.remarks.toLowerCase().includes(searchLower))
    )
  })

  // Get transferable items
  const transferableItems = filteredData.filter(
    (income) =>
      (income.payment_method === "Cash" || income.payment_method === "Cheque") &&
      income.status === "Approved" &&
      !income.transferred_at,
  )

  const selectedTransferableItems = Array.from(selectedIds)
    .map((id) => filteredData.find((item) => item.id === id))
    .filter((item) => item && transferableItems.includes(item))

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
    const methodMap = {
      "Cash": "نقدي",
      "Cheque": "شيك", 
      "BankWire": "حوالة بنكية",
    } as const

    const arabicMethod = methodMap[method as keyof typeof methodMap] || method

    const variants = {
      "نقدي": "default",
      "شيك": "secondary",
      "حوالة بنكية": "outline",
    } as const

    return <Badge variant={variants[arabicMethod as keyof typeof variants] || "outline"}>{arabicMethod}</Badge>
  }

  const getTransferStatusBadge = (income: IncomeData) => {
    if (income.payment_method === "BankWire") {
      return (
        <Badge variant="outline" className="text-xs">
          حوالة بنكية
        </Badge>
      )
    }

    if (income.transferred_at) {
      return (
        <div className="flex flex-col gap-1">
          <Badge variant="default" className="text-xs">
            محول
          </Badge>
          <span className="text-xs text-gray-500">
            {formatDateArabic(new Date(income.transferred_at), "dd/MM/yyyy")}
          </span>
        </div>
      )
    }

    return (
      <Badge variant="destructive" className="text-xs">
        غير محول
      </Badge>
    )
  }

  const needsTransfer = (income: IncomeData) => {
    return (
      (income.payment_method === "Cash" || income.payment_method === "Cheque") &&
      income.status === "Approved" &&
      !income.transferred_at
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

  const handleDuplicateIncome = (income: IncomeData) => {
    const duplicatedIncome = {
      income_date: new Date(),
      sub_budget_id: income.sub_budget_id.toString(),
      income_category_id: income.income_category_id.toString(),
      income_type: income.donor_id ? "donation" : "kafala" as "donation" | "kafala",
      donor_id: income.donor_id?.toString() || "",
      kafil_id: income.kafil_id?.toString() || "",
      amount: parseFloat(income.amount),
      payment_method: income.payment_method,
      cheque_number: income.cheque_number || "",
      receipt_number: income.receipt_number || "",
      bank_account_id: income.bank_account_id?.toString() || "",
      remarks: income.remarks || "",
    }
    setDuplicateIncome(duplicatedIncome)
  }

  const handleEditIncome = (income: IncomeData) => {
    const editIncomeData = {
      id: income.id,
      income_date: new Date(income.income_date),
      sub_budget_id: income.sub_budget_id.toString(),
      income_category_id: income.income_category_id.toString(),
      income_type: income.donor_id ? "donation" : "kafala" as "donation" | "kafala",
      donor_id: income.donor_id?.toString() || "",
      kafil_id: income.kafil_id?.toString() || "",
      amount: parseFloat(income.amount),
      payment_method: income.payment_method,
      cheque_number: income.cheque_number || "",
      receipt_number: income.receipt_number || "",
      bank_account_id: income.bank_account_id?.toString() || "",
      remarks: income.remarks || "",
    }
    setEditingIncome(income)
  }

  const handleViewIncome = (income: IncomeData) => {
    setViewingIncome(income)
  }

  const handleDeleteIncome = (id: number) => {
    setIncomeToDelete(id)
    setShowDeleteDialog(true)
  }

  const confirmDelete = async () => {
    if (!incomeToDelete) return

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1'
      const response = await fetch(`${baseUrl}/incomes/${incomeToDelete}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to delete income')
      }

      toast({
        title: "تم الحذف بنجاح",
        description: "تم حذف الإيراد بنجاح",
      })

      fetchIncomes()
    } catch (error) {
      console.error('Error deleting income:', error)
      toast({
        title: "خطأ في الحذف",
        description: "حدث خطأ أثناء حذف الإيراد",
        variant: "destructive",
      })
    } finally {
      handleCloseDeleteDialog()
      setIncomeToDelete(null)
    }
  }

  const confirmValidation = async () => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1'
      
      if (validateTarget.type === "single" && validateTarget.id) {
        const response = await fetch(`${baseUrl}/incomes/${validateTarget.id}/approve`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        })
        
        if (!response.ok) {
          throw new Error('Failed to approve income')
        }
        
        toast({
          title: "تم التأكيد بنجاح",
          description: "تم تأكيد الإيراد بنجاح",
        })
        
        fetchIncomes()
      } else if (validateTarget.type === "bulk") {
        const selectedIdsArray = Array.from(selectedIds)
        
        for (const id of selectedIdsArray) {
          const response = await fetch(`${baseUrl}/incomes/${id}/approve`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            }
          })
          
          if (!response.ok) {
            console.error(`Failed to approve income ${id}`)
          }
        }
        
        toast({
          title: "تم التأكيد بنجاح",
          description: `تم تأكيد ${selectedIds.size} إيراد بنجاح`,
        })
        
        setSelectedIds(new Set())
        fetchIncomes()
      }
    } catch (error) {
      console.error('Error approving income:', error)
      toast({
        title: "خطأ في التأكيد",
        description: "حدث خطأ أثناء تأكيد الإيراد",
        variant: "destructive",
      })
    } finally {
      handleCloseValidateDialog()
    }
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
    fetchIncomes()
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
            {loading ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-8">
                  جاري التحميل...
                </TableCell>
              </TableRow>
            ) : filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-8 text-gray-500">
                  {searchTerm ? "لم يتم العثور على إيرادات تطابق البحث" : "لا توجد إيرادات مسجلة"}
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((income) => (
                <TableRow key={income.id} className={cn(needsTransfer(income) && "bg-red-50 hover:bg-red-100")}>
                  <TableCell className="text-center">
                    <Checkbox
                      checked={selectedIds.has(income.id)}
                      onCheckedChange={(checked) => handleSelectRow(income.id, checked as boolean)}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    {formatDateArabic(new Date(income.income_date), "dd/MM/yyyy")}
                  </TableCell>
                  <TableCell className="text-right font-medium">{income.sub_budget.label}</TableCell>
                  <TableCell className="text-right">{income.income_category.label}</TableCell>
                  <TableCell className="text-right">
                    {income.donor && (
                      <div className="flex items-center gap-1 justify-end">
                        <span>{`${income.donor.first_name} ${income.donor.last_name}`}</span>
                        <span className="text-xs text-blue-600">متبرع:</span>
                      </div>
                    )}
                    {income.kafil && (
                      <div className="flex items-center gap-1 justify-end">
                        <span>{`${income.kafil.first_name} ${income.kafil.last_name}`}</span>
                        <span className="text-xs text-green-600">كفيل:</span>
                      </div>
                    )}
                    {!income.donor && !income.kafil && (
                      <span className="text-gray-500">غير محدد</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-bold text-green-600">
                    {parseFloat(income.amount).toLocaleString()} د.م
                  </TableCell>
                  <TableCell className="text-right">{getPaymentMethodBadge(income.payment_method)}</TableCell>
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
                          disabled={income.status === "Approved"}
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
                        <DropdownMenuItem onClick={() => handleViewIncome(income)}>
                          <Eye className="mr-2 h-4 w-4" />
                          عرض التفاصيل
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          disabled={income.status === "Approved"}
                          onClick={() => handleEditIncome(income)}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          تعديل
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-red-600"
                          disabled={income.status === "Approved"}
                          onClick={() => handleDeleteIncome(income.id)}
                        >
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
            عرض {(currentPage - 1) * itemsPerPage + 1} إلى {Math.min(currentPage * itemsPerPage, totalItems)} من {totalItems}{" "}
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
      <AlertDialog open={showValidateDialog} onOpenChange={handleValidateDialogOpenChange}>
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
            <AlertDialogCancel onClick={handleCloseValidateDialog}>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={confirmValidation}>تأكيد</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Transfer Dialog */}
      <TransferIncomeDialog
        open={showTransferDialog}
        onOpenChange={handleTransferDialogOpenChange}
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
            fetchIncomes()
          }}
        />
      )}

      {/* Edit Income Dialog */}
      {editingIncome && (
        <NewIncomeDialog
          open={!!editingIncome}
          onOpenChange={() => setEditingIncome(null)}
          initialData={{
            id: editingIncome.id,
            income_date: new Date(editingIncome.income_date),
            sub_budget_id: editingIncome.sub_budget_id.toString(),
            income_category_id: editingIncome.income_category_id.toString(),
            income_type: editingIncome.donor_id ? "donation" : "kafala" as "donation" | "kafala",
            donor_id: editingIncome.donor_id?.toString() || "",
            kafil_id: editingIncome.kafil_id?.toString() || "",
            amount: parseFloat(editingIncome.amount),
            payment_method: editingIncome.payment_method,
            cheque_number: editingIncome.cheque_number || "",
            receipt_number: editingIncome.receipt_number || "",
            bank_account_id: editingIncome.bank_account_id?.toString() || "",
            remarks: editingIncome.remarks || "",
          }}
          onSuccess={() => {
            setEditingIncome(null)
            toast({
              title: "تم التحديث بنجاح",
              description: "تم تحديث الإيراد بنجاح",
            })
            fetchIncomes()
          }}
        />
      )}

      {/* View Income Dialog */}
      <ViewIncomeDialog
        income={viewingIncome}
        open={!!viewingIncome}
        onOpenChange={(open) => {
          if (!open) {
            setViewingIncome(null)
          }
        }}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={handleDeleteDialogOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف هذا الإيراد؟ هذا الإجراء لا يمكن التراجع عنه.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCloseDeleteDialog}>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}