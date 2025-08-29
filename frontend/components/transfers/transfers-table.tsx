"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Eye, Edit, Trash2, ArrowRight, CheckCircle, Clock } from "lucide-react"
import { format } from "date-fns"
import { ar } from "date-fns/locale"
import { useToast } from "@/hooks/use-toast"
import { ApproveTransferDialog } from "./approve-transfer-dialog"
import { EditTransferDialog } from "./edit-transfer-dialog"
import { ViewTransferDialog } from "./view-transfer-dialog"

interface Transfer {
  id: number
  fiscal_year_id: number
  transfer_date: string
  from_account_id: number
  to_account_id: number
  amount: string
  remarks?: string
  status: 'Draft' | 'Approved'
  created_by: any
  approved_by: any
  approved_at?: string
  created_at: string
  updated_at: string
  fiscal_year: any
  from_account: {
    id: number
    label: string
    bank_name: string
    account_number: string
    balance: string
  }
  to_account: {
    id: number
    label: string
    bank_name: string
    account_number: string
    balance: string
  }
}

interface FilterState {
  search: string
  from_account_id: string
  to_account_id: string
  month: string
  year: string
  min_amount: string
  max_amount: string
  status: string
  from_date: string
  to_date: string
}

interface TransfersTableProps {
  filters: FilterState
  onBalanceUpdate?: () => void
}

export function TransfersTable({ filters, onBalanceUpdate }: TransfersTableProps) {
  const [transfers, setTransfers] = useState<Transfer[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [selectedTransfer, setSelectedTransfer] = useState<Transfer | null>(null)
  const [showApproveDialog, setShowApproveDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showViewDialog, setShowViewDialog] = useState(false)
  const { toast } = useToast()
  
  const itemsPerPage = 15

  // Fetch transfers from API
  useEffect(() => {
    fetchTransfers()
  }, [filters, currentPage])

  const fetchTransfers = async () => {
    setLoading(true)
    try {
      // Build query parameters from filters
      const queryParams = new URLSearchParams()
      
      if (filters.search) queryParams.append('search', filters.search)
      if (filters.from_account_id && filters.from_account_id !== 'all') queryParams.append('from_account_id', filters.from_account_id)
      if (filters.to_account_id && filters.to_account_id !== 'all') queryParams.append('to_account_id', filters.to_account_id)
      if (filters.month && filters.month !== 'all') queryParams.append('month', filters.month)
      if (filters.year) queryParams.append('year', filters.year)
      if (filters.min_amount) queryParams.append('min_amount', filters.min_amount)
      if (filters.max_amount) queryParams.append('max_amount', filters.max_amount)
      if (filters.status && filters.status !== 'all') queryParams.append('status', filters.status)
      if (filters.from_date) queryParams.append('from_date', filters.from_date)
      if (filters.to_date) queryParams.append('to_date', filters.to_date)
      
      queryParams.append('page', currentPage.toString())
      queryParams.append('per_page', itemsPerPage.toString())

      const response = await fetch(`http://127.0.0.1:8000/api/v1/transfers?${queryParams.toString()}`)
      const data = await response.json()
      
      if (data.success) {
        setTransfers(data.data)
        setTotalPages(data.meta.last_page)
        setTotal(data.meta.total)
      } else {
        toast({
          title: "خطأ في تحميل البيانات",
          description: "فشل في تحميل بيانات التحويلات",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "خطأ في الاتصال",
        description: "فشل في الاتصال بالخادم",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleApproveClick = (transfer: Transfer) => {
    setSelectedTransfer(transfer)
    setShowApproveDialog(true)
  }

  const handleApprovalComplete = () => {
    fetchTransfers() // Refresh data after approval
    onBalanceUpdate?.() // Notify parent to refresh account balances
  }

  const handleEditClick = (transfer: Transfer) => {
    setSelectedTransfer(transfer)
    setShowEditDialog(true)
  }

  const handleTransferUpdated = () => {
    fetchTransfers() // Refresh data after update
  }

  const handleViewClick = (transfer: Transfer) => {
    setSelectedTransfer(transfer)
    setShowViewDialog(true)
  }

  const handleDeleteTransfer = async (transferId: number) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا التحويل؟')) {
      return
    }

    try {
      const response = await fetch(`http://127.0.0.1:8000/api/v1/transfers/${transferId}`, {
        method: 'DELETE'
      })
      const data = await response.json()
      
      if (response.ok) {
        toast({
          title: "تم حذف التحويل",
          description: data.message,
          variant: "default"
        })
        fetchTransfers() // Refresh data after deletion
      } else {
        toast({
          title: "خطأ في الحذف",
          description: data.message,
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "خطأ في الحذف",
        description: "فشل في حذف التحويل",
        variant: "destructive"
      })
    }
  }

  const getStatusBadge = (status: 'Draft' | 'Approved') => {
    switch (status) {
      case "Approved":
        return (
          <Badge variant="default" className="flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            معتمد
          </Badge>
        )
      case "Draft":
        return (
          <Badge variant="secondary" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            مسودة
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل التحويلات...</p>
        </div>
      </div>
    )
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
              <TableHead className="text-right">الحالة</TableHead>
              <TableHead className="text-right">ملاحظات</TableHead>
              <TableHead className="text-center">الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transfers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  لا توجد تحويلات تطابق المعايير المحددة
                </TableCell>
              </TableRow>
            ) : (
              transfers.map((transfer) => (
                <TableRow key={transfer.id}>
                  <TableCell className="text-right">
                    {format(new Date(transfer.transfer_date), "dd/MM/yyyy", { locale: ar })}
                  </TableCell>
                  <TableCell className="font-medium text-right">
                    <div>
                      <div className="font-medium">{transfer.from_account.label}</div>
                      <div className="text-xs text-gray-500">{transfer.from_account.bank_name}</div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center gap-2 justify-end">
                      <div>
                        <div className="font-medium">{transfer.to_account.label}</div>
                        <div className="text-xs text-gray-500">{transfer.to_account.bank_name}</div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-gray-400" />
                    </div>
                  </TableCell>
                  <TableCell className="font-bold text-blue-600 text-right">
                    DH {parseFloat(transfer.amount).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">{getStatusBadge(transfer.status)}</TableCell>
                  <TableCell className="text-sm text-gray-600 text-right max-w-48 truncate">
                    {transfer.remarks || '-'}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex gap-2 justify-center">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        title="عرض التفاصيل"
                        onClick={() => handleViewClick(transfer)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {transfer.status === 'Draft' && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          title="اعتماد التحويل"
                          onClick={() => handleApproveClick(transfer)}
                          className="text-green-600 hover:text-green-700"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        title="تعديل" 
                        disabled={transfer.status === 'Approved'}
                        onClick={() => handleEditClick(transfer)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        title="حذف"
                        className="text-red-600"
                        disabled={transfer.status === 'Approved'}
                        onClick={() => handleDeleteTransfer(transfer.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
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
            عرض {((currentPage - 1) * itemsPerPage) + 1} إلى {Math.min(currentPage * itemsPerPage, total)} من {total}{" "}
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

      <ApproveTransferDialog
        transfer={selectedTransfer}
        open={showApproveDialog}
        onOpenChange={setShowApproveDialog}
        onApprovalComplete={handleApprovalComplete}
      />

      <EditTransferDialog
        transfer={selectedTransfer}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        onTransferUpdated={handleTransferUpdated}
      />

      <ViewTransferDialog
        transfer={selectedTransfer}
        open={showViewDialog}
        onOpenChange={setShowViewDialog}
      />
    </div>
  )
}
