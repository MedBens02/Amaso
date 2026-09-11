"use client"

import { Fragment, useEffect, useMemo, useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  ArrowRightLeft, Banknote, CheckCircle, ChevronDown, ChevronLeft, Copy, Edit, Eye,
  MoreHorizontal, Trash2,
} from "lucide-react"
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
import { apiUrl } from "@/lib/api"
import { formatDateArabic } from "@/lib/date-utils"
import { NewIncomeDialog } from "@/components/forms/NewIncomeForm"
import { TransferIncomeDialog } from "@/components/incomes/transfer-income-dialog"
import { ViewIncomeDialog } from "@/components/incomes/view-income-dialog"
import { cn, toNumber } from "@/lib/utils"

// Interface for real income data from API
interface IncomeData {
  id: number
  fiscal_year_id: number
  budget_id: number
  income_category_id: number
  donor_id?: number
  kafil_id?: number
  widow_id?: number
  /** Set on every row a single kafala chamila payment was split into. */
  kafala_batch_id?: string | null
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
  budget: {
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
  widow?: {
    id: number
    first_name: string
    last_name: string
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
    /** Payments, not rows: a kafala chamila batch counts once. */
    total: number
    total_rows?: number
  }
}

interface FilterValues {
  fromDate?: Date
  toDate?: Date
  budgetId?: string
  paymentMethod?: string
  status?: string
  minAmount?: string
  maxAmount?: string
  fiscalYearId?: string
}

interface IncomesTableProps {
  searchTerm: string
  filters: FilterValues
  /** Bump this to force a refetch, e.g. after a new income is created elsewhere on the page. */
  refreshKey?: number
}

export function IncomesTable({ searchTerm, filters, refreshKey }: IncomesTableProps) {
  const [incomesData, setIncomesData] = useState<IncomeData[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const itemsPerPage = 10
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [showValidateDialog, setShowValidateDialog] = useState(false)
  const [showTransferDialog, setShowTransferDialog] = useState(false)
  const [validateTarget, setValidateTarget] = useState<{
    type: "single" | "bulk" | "batch"
    id?: number
    ids?: number[]
  }>({ type: "single" })
  const [transferTarget, setTransferTarget] = useState<{ type: "single" | "bulk"; id?: number; items?: any[] }>({
    type: "single",
  })
  const [duplicateIncome, setDuplicateIncome] = useState<any>(null)
  const [editingIncome, setEditingIncome] = useState<IncomeData | null>(null)
  const [viewingIncome, setViewingIncome] = useState<IncomeData | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ ids: number[]; isBatch: boolean } | null>(null)
  /** Batch ids whose individual budget lines are showing. */
  const [expandedBatches, setExpandedBatches] = useState<Set<string>>(new Set())
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
      const url = apiUrl('/incomes')
      
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
      if (filters.budgetId) {
        params.append('budget_id', filters.budgetId)
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
        params.append('search', searchTerm.trim())
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

  // One request per change. This was three effects - one on
  // currentPage/filters, one on searchTerm, one on filters again - and every
  // load asked the server for the same page three times over.
  useEffect(() => {
    fetchIncomes()
  }, [currentPage, searchTerm, filters, refreshKey])

  // A new search or filter invalidates whichever page is being held.
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, filters])

  // The server does the searching now, so the page it returns is already the
  // answer. Filtering again here is what made the pager disagree with the
  // rows: it counted every income in the table while the screen showed only
  // the matches that happened to fall on the page being held.
  const filteredData = incomesData

  // Helper function to check if income can be selected for approval
  const canBeApproved = (income: IncomeData) => {
    return income.status !== "Approved"
  }

  /**
   * One payment, however many rows it was written down as.
   *
   * A kafala chamila is stored as one income per budget line - seven rows for
   * a single 800 DH sponsorship - because that is what the money does once it
   * lands, and the split is what the budgets are built on. On screen that put
   * seven rows with the same date, the same sponsor and the same payment
   * method between every other income on the page.
   *
   * Grouping happens here and only here: nothing is written, nothing is
   * merged, and each row keeps its own id, status and actions underneath the
   * summary. The server already returns a batch's rows together and in order
   * (and pages by payment, so a batch never straddles a page boundary), so
   * this only has to fold consecutive rows that share a batch id.
   */
  type IncomeGroup = {
    key: string
    rows: IncomeData[]
    /** The row the shared details are read from - they are equal on all of them. */
    lead: IncomeData
    isBatch: boolean
    total: number
  }

  const groups = useMemo<IncomeGroup[]>(() => {
    const ordered: IncomeGroup[] = []
    const byBatch = new Map<string, IncomeGroup>()

    for (const income of filteredData) {
      const batchId = income.kafala_batch_id
      const open = batchId ? byBatch.get(batchId) : undefined

      if (open) {
        open.rows.push(income)
        continue
      }

      const group: IncomeGroup = {
        key: batchId ?? `income:${income.id}`,
        rows: [income],
        lead: income,
        isBatch: false,
        total: 0,
      }

      if (batchId) byBatch.set(batchId, group)
      ordered.push(group)
    }

    return ordered.map((group) => ({
      ...group,
      // A batch that somehow arrived with one row is just an income.
      isBatch: group.rows.length > 1,
      total: group.rows.reduce((sum, row) => sum + toNumber(row.amount), 0),
    }))
  }, [filteredData])

  const toggleBatch = (key: string) => {
    setExpandedBatches((previous) => {
      const next = new Set(previous)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  // Helper function to check if income can be transferred
  const canBeTransferred = (income: IncomeData) => {
    return income.status === "Approved" && 
           (income.payment_method === "Cash" || income.payment_method === "Cheque") && 
           !income.transferred_at
  }

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

  const selectedApprovableItems = Array.from(selectedIds)
    .map((id) => filteredData.find((item) => item.id === id))
    .filter((item) => item && canBeApproved(item))

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
          <span className="text-xs text-muted-foreground">
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

  /** Rows of a payment that are worth selecting - the rest are already done. */
  const selectableRows = (rows: IncomeData[]) => rows.filter((row) => canBeApproved(row) || canBeTransferred(row))

  /** One badge for the whole payment, unless its parts really do disagree. */
  const getGroupStatusBadge = (group: IncomeGroup) => {
    const distinct = new Set(group.rows.map((row) => row.status))
    if (distinct.size === 1) return getStatusBadge(group.lead.status)

    const approved = group.rows.filter((row) => row.status === "Approved").length
    return (
      <Badge variant="secondary" className="text-xs">
        {approved} من {group.rows.length} معتمد
      </Badge>
    )
  }

  const getGroupTransferBadge = (group: IncomeGroup) => {
    const transferred = group.rows.filter((row) => row.transferred_at).length
    if (transferred === 0 || transferred === group.rows.length) return getTransferStatusBadge(group.lead)

    return (
      <Badge variant="secondary" className="text-xs">
        {transferred} من {group.rows.length} محول
      </Badge>
    )
  }

  const handleSelectGroup = (group: IncomeGroup, checked: boolean) => {
    const ids = selectableRows(group.rows).map((row) => row.id)
    const next = new Set(selectedIds)
    for (const id of ids) {
      if (checked) {
        next.add(id)
      } else {
        next.delete(id)
      }
    }
    setSelectedIds(next)
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      // Select incomes that can be approved or transferred
      const selectableIds = filteredData
        .filter(income => canBeApproved(income) || canBeTransferred(income))
        .map(income => income.id)
      setSelectedIds(new Set(selectableIds))
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

  const handleValidateBatch = (group: IncomeGroup) => {
    setValidateTarget({ type: "batch", ids: group.rows.filter(canBeApproved).map((row) => row.id) })
    setShowValidateDialog(true)
  }

  const handleTransferBatch = (group: IncomeGroup) => {
    setTransferTarget({ type: "bulk", items: group.rows.filter(needsTransfer) })
    setShowTransferDialog(true)
  }

  const handleDuplicateIncome = (income: IncomeData) => {
    const duplicatedIncome = {
      income_date: new Date(),
      budget_id: income.budget_id.toString(),
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
      budget_id: income.budget_id.toString(),
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
    setDeleteTarget({ ids: [id], isBatch: false })
    setShowDeleteDialog(true)
  }

  /** A kafala chamila is one payment: its budget lines go together. */
  const handleDeleteBatch = (group: IncomeGroup) => {
    setDeleteTarget({ ids: group.rows.map((row) => row.id), isBatch: true })
    setShowDeleteDialog(true)
  }

  const confirmDelete = async () => {
    if (!deleteTarget || deleteTarget.ids.length === 0) return

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1'

      for (const id of deleteTarget.ids) {
        const response = await fetch(`${baseUrl}/incomes/${id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        })

        if (!response.ok) {
          throw new Error(`Failed to delete income ${id}`)
        }
      }

      toast({
        title: "تم الحذف بنجاح",
        description: deleteTarget.isBatch
          ? `تم حذف الكفالة الشاملة و${deleteTarget.ids.length} حصص تابعة لها`
          : "تم حذف الإيراد بنجاح",
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
      setDeleteTarget(null)
    }
  }

  const confirmValidation = async () => {
    // Single row, every approvable row of one kafala chamila, or the current
    // selection - the same loop either way, so the three cannot drift apart.
    const ids =
      validateTarget.type === "single"
        ? filteredData.filter((income) => income.id === validateTarget.id && canBeApproved(income)).map((income) => income.id)
        : validateTarget.type === "batch"
          ? (validateTarget.ids ?? [])
          : filteredData.filter((income) => selectedIds.has(income.id) && canBeApproved(income)).map((income) => income.id)

    if (ids.length === 0) {
      toast({
        title: "لا توجد إيرادات للاعتماد",
        description: "الإيرادات المحددة معتمدة مسبقاً أو غير قابلة للاعتماد",
      })
      handleCloseValidateDialog()
      return
    }

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1'

      for (const id of ids) {
        const response = await fetch(`${baseUrl}/incomes/${id}/approve`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        })

        if (!response.ok) {
          throw new Error(`Failed to approve income ${id}`)
        }
      }

      toast({
        title: "تم التأكيد بنجاح",
        description: ids.length === 1 ? "تم تأكيد الإيراد بنجاح" : `تم تأكيد ${ids.length} إيراد بنجاح`,
      })

      if (validateTarget.type === "bulk") {
        setSelectedIds(new Set())
      }
      fetchIncomes()
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

  const renderRowActions = (income: IncomeData) => (
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
          <CheckCircle className="h-4 w-4" />
          تأكيد
        </DropdownMenuItem>
        {needsTransfer(income) && (
          <DropdownMenuItem onClick={() => handleTransferIncome(income.id)}>
            <ArrowRightLeft className="h-4 w-4" />
            تحويل للبنك
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={() => handleDuplicateIncome(income)}>
          <Copy className="h-4 w-4" />
          نسخ
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleViewIncome(income)}>
          <Eye className="h-4 w-4" />
          عرض التفاصيل
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={income.status === "Approved"}
          onClick={() => handleEditIncome(income)}
        >
          <Edit className="h-4 w-4" />
          تعديل
        </DropdownMenuItem>
        <DropdownMenuItem
          className="text-red-600"
          disabled={income.status === "Approved"}
          onClick={() => handleDeleteIncome(income.id)}
        >
          <Trash2 className="h-4 w-4" />
          حذف
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )

  const renderSponsor = (income: IncomeData) => (
    <>
      {income.donor && (
        <div className="flex items-center justify-start gap-1">
          <span className="text-xs text-blue-600">متبرع:</span>
          <span>{`${income.donor.first_name} ${income.donor.last_name}`}</span>
        </div>
      )}
      {income.kafil && (
        <div className="flex items-center justify-start gap-1">
          <span className="text-xs text-green-600">كفيل:</span>
          <span>{`${income.kafil.first_name} ${income.kafil.last_name}`}</span>
        </div>
      )}
      {income.widow && (
        <div className="text-xs text-muted-foreground">
          لفائدة {`${income.widow.first_name} ${income.widow.last_name}`}
        </div>
      )}
      {!income.donor && !income.kafil && <span className="text-muted-foreground">غير محدد</span>}
    </>
  )

  const renderIncomeRow = (income: IncomeData) => (
    <TableRow key={income.id} className={cn(needsTransfer(income) && "bg-red-50 dark:bg-red-950/40 hover:bg-red-100")}>
      <TableCell className="text-center">
        <Checkbox
          checked={selectedIds.has(income.id)}
          onCheckedChange={(checked) => handleSelectRow(income.id, checked as boolean)}
          disabled={!canBeApproved(income) && !canBeTransferred(income)}
        />
      </TableCell>
      <TableCell className="text-right">
        {formatDateArabic(new Date(income.income_date), "dd/MM/yyyy")}
      </TableCell>
      <TableCell className="text-right font-medium">{income.budget.label}</TableCell>
      <TableCell className="text-right">{income.income_category.label}</TableCell>
      <TableCell className="text-right">{renderSponsor(income)}</TableCell>
      <TableCell className="text-right font-bold text-green-600">
        {toNumber(income.amount).toLocaleString()} د.م
      </TableCell>
      <TableCell className="text-right">{getPaymentMethodBadge(income.payment_method)}</TableCell>
      <TableCell className="text-right">{getTransferStatusBadge(income)}</TableCell>
      <TableCell className="text-right">{getStatusBadge(income.status)}</TableCell>
      <TableCell className="text-center">{renderRowActions(income)}</TableCell>
    </TableRow>
  )

  /**
   * A kafala chamila as the one payment it was, with its budget lines folded
   * away behind an arrow.
   *
   * The summary row carries what the whole payment shares - date, sponsor,
   * family, method, the total actually received - and the rows underneath
   * carry only what differs between them: which budget the share went to and
   * how much. Repeating the date and the sponsor seven times is exactly what
   * made this unreadable in the first place, so the expanded rows leave those
   * cells empty; status and transfer state appear per row only when the rows
   * genuinely disagree, which is the one case where the summary cannot tell
   * the whole story.
   */
  const renderBatchRows = (group: IncomeGroup) => {
    const expanded = expandedBatches.has(group.key)
    const selectable = selectableRows(group.rows)
    const selectedCount = selectable.filter((row) => selectedIds.has(row.id)).length
    const approvable = group.rows.filter(canBeApproved)
    const transferable = group.rows.filter(needsTransfer)
    const mixedStatus = new Set(group.rows.map((row) => row.status)).size > 1
    const transferredCount = group.rows.filter((row) => row.transferred_at).length
    const mixedTransfer = transferredCount > 0 && transferredCount < group.rows.length

    return (
      <Fragment key={group.key}>
        <TableRow
          className={cn(
            "cursor-pointer",
            transferable.length > 0 && "bg-red-50 dark:bg-red-950/40 hover:bg-red-100",
          )}
          onClick={() => toggleBatch(group.key)}
        >
          <TableCell className="text-center" onClick={(event) => event.stopPropagation()}>
            <Checkbox
              checked={
                selectable.length > 0 && selectedCount === selectable.length
                  ? true
                  : selectedCount > 0
                    ? "indeterminate"
                    : false
              }
              onCheckedChange={(checked) => handleSelectGroup(group, checked as boolean)}
              disabled={selectable.length === 0}
            />
          </TableCell>
          <TableCell className="text-right">
            {formatDateArabic(new Date(group.lead.income_date), "dd/MM/yyyy")}
          </TableCell>
          <TableCell className="text-right">
            <button
              type="button"
              className="flex items-center gap-2 text-right hover:text-primary"
              aria-expanded={expanded}
              aria-label={expanded ? "إخفاء حصص الكفالة الشاملة" : "عرض حصص الكفالة الشاملة"}
              onClick={(event) => {
                event.stopPropagation()
                toggleBatch(group.key)
              }}
            >
              {expanded ? (
                <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
              ) : (
                <ChevronLeft className="h-4 w-4 shrink-0 text-muted-foreground" />
              )}
              <span className="text-sm text-muted-foreground">
                موزّعة على {group.rows.length} ميزانيات
              </span>
            </button>
          </TableCell>
          <TableCell className="text-right font-medium">{group.lead.income_category.label}</TableCell>
          <TableCell className="text-right">{renderSponsor(group.lead)}</TableCell>
          <TableCell className="text-right font-bold text-green-600">
            {group.total.toLocaleString()} د.م
          </TableCell>
          <TableCell className="text-right">{getPaymentMethodBadge(group.lead.payment_method)}</TableCell>
          <TableCell className="text-right">{getGroupTransferBadge(group)}</TableCell>
          <TableCell className="text-right">{getGroupStatusBadge(group)}</TableCell>
          <TableCell className="text-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0" onClick={(event) => event.stopPropagation()}>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" onClick={(event) => event.stopPropagation()}>
                <DropdownMenuItem onClick={() => toggleBatch(group.key)}>
                  {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                  {expanded ? "إخفاء الحصص" : `عرض الحصص (${group.rows.length})`}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleValidateBatch(group)} disabled={approvable.length === 0}>
                  <CheckCircle className="h-4 w-4" />
                  تأكيد الكل{approvable.length > 0 ? ` (${approvable.length})` : ""}
                </DropdownMenuItem>
                {transferable.length > 0 && (
                  <DropdownMenuItem onClick={() => handleTransferBatch(group)}>
                    <ArrowRightLeft className="h-4 w-4" />
                    تحويل للبنك ({transferable.length})
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => handleViewIncome(group.lead)}>
                  <Eye className="h-4 w-4" />
                  عرض التفاصيل
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-red-600"
                  disabled={approvable.length !== group.rows.length}
                  onClick={() => handleDeleteBatch(group)}
                >
                  <Trash2 className="h-4 w-4" />
                  حذف الكفالة بالكامل
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </TableCell>
        </TableRow>

        {expanded &&
          group.rows.map((row) => (
            <TableRow key={row.id} className="bg-muted/30 hover:bg-muted/50">
              <TableCell className="text-center">
                <Checkbox
                  checked={selectedIds.has(row.id)}
                  onCheckedChange={(checked) => handleSelectRow(row.id, checked as boolean)}
                  disabled={!canBeApproved(row) && !canBeTransferred(row)}
                />
              </TableCell>
              <TableCell />
              <TableCell className="text-right text-sm" colSpan={2}>
                <span className="inline-flex items-center gap-2 pr-6">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/40" />
                  {row.budget.label}
                </span>
              </TableCell>
              <TableCell />
              <TableCell className="text-right text-sm text-green-700 dark:text-green-400">
                {toNumber(row.amount).toLocaleString()} د.م
              </TableCell>
              <TableCell />
              <TableCell className="text-right">{mixedTransfer ? getTransferStatusBadge(row) : null}</TableCell>
              <TableCell className="text-right">{mixedStatus ? getStatusBadge(row.status) : null}</TableCell>
              <TableCell className="text-center">{renderRowActions(row)}</TableCell>
            </TableRow>
          ))}
      </Fragment>
    )
  }

  return (
    <div className="space-y-4">
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-950/40 rounded-lg border border-blue-200 dark:border-blue-900">
          <span className="text-sm font-medium text-blue-900 dark:text-blue-400">تم تحديد {selectedIds.size} عنصر</span>
          <div className="flex gap-2">
            {selectedApprovableItems.length > 0 && (
              <Button size="sm" onClick={handleBulkValidate}>
                <CheckCircle className="h-4 w-4 ml-2" />
                تأكيد المحدد ({selectedApprovableItems.length})
              </Button>
            )}
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
        <div className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-950/40 rounded-lg border border-orange-200 dark:border-orange-900">
          <div className="flex items-center gap-2">
            <Banknote className="h-4 w-4 text-orange-600" />
            <span className="text-sm font-medium text-orange-900 dark:text-orange-400">
              يوجد {groups.filter((group) => group.rows.some(needsTransfer)).length} إيراد نقدي/شيك بحاجة للتحويل إلى البنك
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
                  checked={(() => {
                    const selectableIncomes = filteredData.filter(income => canBeApproved(income) || canBeTransferred(income))
                    return selectableIncomes.length > 0 && selectedIds.size === selectableIncomes.length
                  })()}
                  onCheckedChange={handleSelectAll}
                  disabled={filteredData.filter(income => canBeApproved(income) || canBeTransferred(income)).length === 0}
                />
              </TableHead>
              <TableHead className="text-right">التاريخ</TableHead>
              <TableHead className="text-right">الميزانية</TableHead>
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
                <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                  {searchTerm ? "لم يتم العثور على إيرادات تطابق البحث" : "لا توجد إيرادات مسجلة"}
                </TableCell>
              </TableRow>
            ) : (
              groups.map((group) => (group.isBatch ? renderBatchRows(group) : renderIncomeRow(group.lead)))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
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
                : validateTarget.type === "batch"
                  ? `هل أنت متأكد من تأكيد الكفالة الشاملة بحصصها (${validateTarget.ids?.length ?? 0})؟ لن تتمكن من تعديلها بعد التأكيد.`
                  : `هل أنت متأكد من تأكيد ${selectedApprovableItems.length} إيراد؟ لن تتمكن من تعديلها بعد التأكيد.`}
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
            budget_id: editingIncome.budget_id.toString(),
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
              {deleteTarget?.isBatch
                ? `سيتم حذف الكفالة الشاملة بكل حصصها (${deleteTarget.ids.length}). هذا الإجراء لا يمكن التراجع عنه.`
                : "هل أنت متأكد من حذف هذا الإيراد؟ هذا الإجراء لا يمكن التراجع عنه."}
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