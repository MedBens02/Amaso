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

interface FilterValues {
  fromDate?: Date
  toDate?: Date
  subBudgetId?: string
  expenseCategoryId?: string
  partnerId?: string
  paymentMethod?: string
  status?: string
  minAmount?: string
  maxAmount?: string
  fiscalYearId?: string
}

interface ExpensesTableProps {
  searchTerm: string
  appliedFilters?: FilterValues
}

export function ExpensesTable({ searchTerm, appliedFilters }: ExpensesTableProps) {
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
  const [showBeneficiariesDialog, setShowBeneficiariesDialog] = useState(false)
  const [selectedExpenseBeneficiaries, setSelectedExpenseBeneficiaries] = useState<any[]>([])
  const [showBankAccountDialog, setShowBankAccountDialog] = useState(false)
  const [pendingApprovalExpense, setPendingApprovalExpense] = useState<any>(null)
  const [bankAccounts, setBankAccounts] = useState<any[]>([])
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null)
  const [editingExpense, setEditingExpense] = useState<any>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchExpenses()
  }, [currentPage, searchTerm, appliedFilters])

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
      
      // Apply filters
      if (appliedFilters) {
        if (appliedFilters.fromDate) {
          params.append('from_date', appliedFilters.fromDate.toISOString().split('T')[0])
        }
        if (appliedFilters.toDate) {
          params.append('to_date', appliedFilters.toDate.toISOString().split('T')[0])
        }
        if (appliedFilters.subBudgetId) {
          params.append('sub_budget_id', appliedFilters.subBudgetId)
        }
        if (appliedFilters.expenseCategoryId) {
          params.append('expense_category_id', appliedFilters.expenseCategoryId)
        }
        if (appliedFilters.partnerId) {
          params.append('partner_id', appliedFilters.partnerId)
        }
        if (appliedFilters.paymentMethod) {
          params.append('payment_method', appliedFilters.paymentMethod)
        }
        if (appliedFilters.status) {
          params.append('status', appliedFilters.status)
        }
        if (appliedFilters.minAmount) {
          params.append('min_amount', appliedFilters.minAmount)
        }
        if (appliedFilters.maxAmount) {
          params.append('max_amount', appliedFilters.maxAmount)
        }
        if (appliedFilters.fiscalYearId) {
          params.append('fiscal_year_id', appliedFilters.fiscalYearId)
        }
      }
      
      url.search = params.toString()
      
      const response = await fetch(url.toString())
      if (!response.ok) {
        throw new Error(`Failed to fetch expenses: ${response.status} ${response.statusText}`)
      }
      
      const responseText = await response.text()
      let result
      try {
        result = JSON.parse(responseText)
      } catch (jsonError) {
        console.error('JSON parsing error:', jsonError)
        console.error('Response text:', responseText)
        throw new Error('Server returned invalid JSON response')
      }
      
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

  // Load bank accounts when needed
  const loadBankAccounts = async () => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1'
      const response = await fetch(`${baseUrl}/bank-accounts`)
      if (response.ok) {
        const result = await response.json()
        setBankAccounts(result.data || [])
      }
    } catch (error) {
      console.error('Error loading bank accounts:', error)
    }
  }

  // Handle showing beneficiaries
  const handleShowBeneficiaries = async (expenseId: number) => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1'
      const response = await fetch(`${baseUrl}/expenses/${expenseId}`)
      if (response.ok) {
        const result = await response.json()
        setSelectedExpenseBeneficiaries(result.data?.beneficiaries || [])
        setShowBeneficiariesDialog(true)
      }
    } catch (error) {
      console.error('Error loading expense beneficiaries:', error)
      toast({
        title: "خطأ",
        description: "حدث خطأ في تحميل بيانات المستفيدين",
        variant: "destructive",
      })
    }
  }

  // Handle delete expense
  const handleDeleteExpense = async (expenseId: number) => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1'
      const response = await fetch(`${baseUrl}/expenses/${expenseId}`, {
        method: 'DELETE'
      })
      if (response.ok) {
        toast({
          title: "تم الحذف بنجاح",
          description: "تم حذف المصروف بنجاح",
        })
        fetchExpenses()
      } else {
        throw new Error('Failed to delete expense')
      }
    } catch (error) {
      console.error('Error deleting expense:', error)
      toast({
        title: "خطأ",
        description: "حدث خطأ في حذف المصروف",
        variant: "destructive",
      })
    }
    setShowDeleteDialog(false)
    setDeleteTargetId(null)
  }

  // Handle edit expense
  const handleEditExpense = (expense: any) => {
    setEditingExpense(expense)
  }

  // Handle approve expense (with bank account selection for cash)
  const handleApproveExpense = async (expense: any) => {
    if (expense.payment_method === 'Cash' && !expense.bank_account_id) {
      // For cash expenses without bank account, show bank account selection
      setPendingApprovalExpense(expense)
      await loadBankAccounts()
      setShowBankAccountDialog(true)
    } else {
      // Direct approval for expenses with bank accounts
      await performApproval(expense.id, expense.bank_account_id)
    }
  }

  // Perform the actual approval
  const performApproval = async (expenseId: number, bankAccountId?: number) => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1'
      
      // First, if bank account is provided, get current expense data and update with bank account
      if (bankAccountId) {
        console.log('Updating expense with bank account:', bankAccountId)
        
        // Get current expense data
        const expenseResponse = await fetch(`${baseUrl}/expenses/${expenseId}`)
        if (!expenseResponse.ok) {
          throw new Error('Failed to fetch expense data')
        }
        const expenseData = await expenseResponse.json()
        const expense = expenseData.data
        
        // Update with all required fields plus the new bank account
        const updateData = {
          fiscal_year_id: expense.fiscal_year_id,
          sub_budget_id: expense.sub_budget_id,
          expense_category_id: expense.expense_category_id,
          partner_id: expense.partner_id,
          details: expense.details,
          expense_date: expense.expense_date,
          amount: expense.amount,
          payment_method: expense.payment_method,
          cheque_number: expense.cheque_number,
          receipt_number: expense.receipt_number,
          bank_account_id: bankAccountId,
          remarks: expense.remarks,
          unrelated_to_benef: expense.unrelated_to_benef,
          beneficiaries: expense.beneficiaries || [],
          beneficiary_groups: expense.beneficiary_groups || []
        }
        
        const updateResponse = await fetch(`${baseUrl}/expenses/${expenseId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(updateData)
        })
        
        if (!updateResponse.ok) {
          const errorData = await updateResponse.text()
          console.error('Failed to update bank account:', errorData)
          throw new Error('Failed to update bank account')
        }
      }
      
      // Then approve the expense
      console.log('Approving expense:', expenseId)
      const response = await fetch(`${baseUrl}/expenses/${expenseId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ bank_account_id: bankAccountId })
      })
      
      if (response.ok) {
        const result = await response.json()
        console.log('Approval response:', result)
        toast({
          title: "تم التأكيد بنجاح",
          description: "تم تأكيد المصروف وتحديث رصيد الحساب",
        })
        fetchExpenses()
      } else {
        const errorData = await response.text()
        console.error('Approval failed:', errorData)
        throw new Error('Failed to approve expense')
      }
    } catch (error) {
      console.error('Error approving expense:', error)
      toast({
        title: "خطأ",
        description: "حدث خطأ في تأكيد المصروف",
        variant: "destructive",
      })
    }
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
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 px-2 hover:bg-blue-50" 
                      onClick={() => handleShowBeneficiaries(expense.id)}
                    >
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
                          onClick={() => handleApproveExpense(expense)}
                          disabled={expense.status === "Approved"}
                        >
                          <CheckCircle className="mr-2 h-4 w-4" />
                          تأكيد
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDuplicateExpense(expense)}>
                          <Copy className="mr-2 h-4 w-4" />
                          نسخ
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleShowBeneficiaries(expense.id)}>
                          <Eye className="mr-2 h-4 w-4" />
                          عرض التفاصيل
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleEditExpense(expense)}
                          disabled={expense.status === "Approved"}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          تعديل
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-red-600"
                          onClick={() => {
                            setDeleteTargetId(expense.id)
                            setShowDeleteDialog(true)
                          }}
                          disabled={expense.status === "Approved"}
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

      {/* Beneficiaries Display Dialog */}
      <AlertDialog open={showBeneficiariesDialog} onOpenChange={setShowBeneficiariesDialog}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>مستفيدو المصروف</AlertDialogTitle>
            <AlertDialogDescription>
              قائمة بجميع المستفيدين من هذا المصروف
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="max-h-96 overflow-y-auto space-y-3">
            {selectedExpenseBeneficiaries.length === 0 ? (
              <p className="text-center text-gray-500 py-8">لا توجد بيانات مستفيدين</p>
            ) : (
              selectedExpenseBeneficiaries.map((beneficiary, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="text-right">
                    <p className="font-medium">{beneficiary.beneficiary?.full_name || beneficiary.beneficiary?.first_name + ' ' + beneficiary.beneficiary?.last_name}</p>
                    <p className="text-sm text-gray-600">
                      {beneficiary.beneficiary?.type === 'Widow' ? 'أرملة' : 'يتيم'}
                    </p>
                    {beneficiary.notes && (
                      <p className="text-xs text-gray-500 mt-1">{beneficiary.notes}</p>
                    )}
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-green-600">DH {Number(beneficiary.amount).toLocaleString()}</p>
                  </div>
                </div>
              ))
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>إغلاق</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bank Account Selection Dialog */}
      <AlertDialog open={showBankAccountDialog} onOpenChange={setShowBankAccountDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>اختيار حساب بنكي</AlertDialogTitle>
            <AlertDialogDescription>
              هذا المصروف نقدي، يرجى اختيار الحساب البنكي الذي سيتم خصم المبلغ منه
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-3">
            {bankAccounts.map(account => (
              <div
                key={account.id}
                className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                onClick={async () => {
                  await performApproval(pendingApprovalExpense?.id, account.id)
                  setShowBankAccountDialog(false)
                  setPendingApprovalExpense(null)
                }}
              >
                <div className="flex justify-between items-center">
                  <div className="text-right">
                    <p className="font-medium">{account.name}</p>
                    <p className="text-sm text-gray-600">{account.bank_name}</p>
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-green-600">DH {Number(account.balance || 0).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowBankAccountDialog(false)
              setPendingApprovalExpense(null)
            }}>إلغاء</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف هذا المصروف؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowDeleteDialog(false)
              setDeleteTargetId(null)
            }}>إلغاء</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deleteTargetId && handleDeleteExpense(deleteTargetId)}
              className="bg-red-600 hover:bg-red-700"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Expense Dialog */}
      {editingExpense && (
        <NewExpenseDialog
          open={!!editingExpense}
          onOpenChange={() => setEditingExpense(null)}
          initialData={editingExpense}
          onSuccess={() => {
            setEditingExpense(null)
            toast({
              title: "تم التحديث بنجاح",
              description: "تم تحديث المصروف بنجاح",
            })
            fetchExpenses()
          }}
        />
      )}
    </div>
  )
}
