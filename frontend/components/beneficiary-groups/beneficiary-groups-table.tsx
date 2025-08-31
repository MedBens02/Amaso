"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { MoreHorizontal, Eye, Edit, Trash2, Users } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { formatDateArabic } from "@/lib/date-utils"

interface BeneficiaryGroupData {
  id: number
  name: string
  description?: string
  members_count: number
  created_at: string
  updated_at: string
}

interface BeneficiaryGroupsTableProps {
  searchTerm: string
  onViewGroup: (group: BeneficiaryGroupData) => void
  onEditGroup: (group: BeneficiaryGroupData) => void
}

export function BeneficiaryGroupsTable({ searchTerm, onViewGroup, onEditGroup }: BeneficiaryGroupsTableProps) {
  const [groupsData, setGroupsData] = useState<BeneficiaryGroupData[]>([])
  const [loading, setLoading] = useState(true)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [groupToDelete, setGroupToDelete] = useState<number | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchGroups()
  }, [])

  const fetchGroups = async () => {
    setLoading(true)
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1'
      const response = await fetch(`${baseUrl}/beneficiary-groups`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch beneficiary groups')
      }
      
      const result = await response.json()
      setGroupsData(result.data || [])
    } catch (error) {
      console.error('Error fetching beneficiary groups:', error)
      toast({
        title: "خطأ في تحميل البيانات",
        description: "حدث خطأ أثناء تحميل مجموعات المستفيدين",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Client-side filtering for search
  const filteredData = groupsData.filter((group) => {
    if (!searchTerm.trim()) return true
    
    const searchLower = searchTerm.toLowerCase()
    return (
      group.name.toLowerCase().includes(searchLower) ||
      (group.description && group.description.toLowerCase().includes(searchLower))
    )
  })

  const handleDeleteGroup = async (id: number) => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1'
      const response = await fetch(`${baseUrl}/beneficiary-groups/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to delete beneficiary group')
      }
      
      toast({
        title: "تم الحذف بنجاح",
        description: "تم حذف المجموعة بنجاح",
      })
      
      fetchGroups()
    } catch (error) {
      console.error('Error deleting beneficiary group:', error)
      toast({
        title: "خطأ في الحذف",
        description: "حدث خطأ أثناء حذف المجموعة",
        variant: "destructive",
      })
    } finally {
      setShowDeleteDialog(false)
      setGroupToDelete(null)
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

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">اسم المجموعة</TableHead>
              <TableHead className="text-right">الوصف</TableHead>
              <TableHead className="text-center">عدد الأعضاء</TableHead>
              <TableHead className="text-right">تاريخ الإنشاء</TableHead>
              <TableHead className="text-center">الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  جاري التحميل...
                </TableCell>
              </TableRow>
            ) : filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                  {searchTerm ? "لم يتم العثور على مجموعات تطابق البحث" : "لا توجد مجموعات مسجلة"}
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((group) => (
                <TableRow key={group.id}>
                  <TableCell className="text-right font-medium">{group.name}</TableCell>
                  <TableCell className="text-right">{group.description || '-'}</TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Users className="h-4 w-4 text-blue-600" />
                      <span className="font-bold text-blue-800">{group.members_count}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {formatDateArabic(new Date(group.created_at), "dd/MM/yyyy")}
                  </TableCell>
                  <TableCell className="text-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onViewGroup(group)}>
                          <Eye className="mr-2 h-4 w-4" />
                          عرض التفاصيل
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEditGroup(group)}>
                          <Edit className="mr-2 h-4 w-4" />
                          تعديل المجموعة
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-red-600"
                          onClick={() => {
                            setGroupToDelete(group.id)
                            setShowDeleteDialog(true)
                          }}
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={handleDeleteDialogOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف هذه المجموعة؟ سيتم حذف جميع أعضائها أيضاً. هذا الإجراء لا يمكن التراجع عنه.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCloseDeleteDialog}>إلغاء</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => groupToDelete && handleDeleteGroup(groupToDelete)}
              className="bg-red-600 hover:bg-red-700"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}