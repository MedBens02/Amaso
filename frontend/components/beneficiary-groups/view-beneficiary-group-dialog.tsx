"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Calendar, Edit, Trash2, UserMinus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { formatDateArabic } from "@/lib/date-utils"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"

interface GroupMember {
  id: number
  type: 'Widow' | 'Orphan'
  widow?: {
    id: number
    first_name: string
    last_name: string
    phone?: string
  }
  orphan?: {
    id: number
    first_name: string
    last_name: string
    birth_date: string
  }
}

interface BeneficiaryGroupData {
  id: number
  name: string
  description?: string
  members_count: number
  created_at: string
  updated_at: string
  members?: GroupMember[]
}

interface ViewBeneficiaryGroupDialogProps {
  group: BeneficiaryGroupData | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ViewBeneficiaryGroupDialog({ group, open, onOpenChange }: ViewBeneficiaryGroupDialogProps) {
  const [members, setMembers] = useState<GroupMember[]>([])
  const [loading, setLoading] = useState(false)
  const [showRemoveMemberDialog, setShowRemoveMemberDialog] = useState(false)
  const [memberToRemove, setMemberToRemove] = useState<number | null>(null)
  const { toast } = useToast()

  const handleClose = () => {
    // Force remove any lingering pointer-events blocking
    setTimeout(() => {
      document.body.style.pointerEvents = 'auto'
    }, 100)
    onOpenChange(false)
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      handleClose()
    }
  }

  // Load group members when dialog opens
  useEffect(() => {
    if (open && group) {
      fetchGroupMembers()
    }
  }, [open, group])

  const fetchGroupMembers = async () => {
    if (!group) return

    setLoading(true)
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1'
      const response = await fetch(`${baseUrl}/beneficiary-groups/${group.id}/members`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch group members')
      }
      
      const result = await response.json()
      setMembers(result.data || [])
    } catch (error) {
      console.error('Error fetching group members:', error)
      toast({
        title: "خطأ في تحميل البيانات",
        description: "حدث خطأ أثناء تحميل أعضاء المجموعة",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveMember = async (beneficiaryId: number) => {
    if (!group) return

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1'
      const response = await fetch(`${baseUrl}/beneficiary-groups/${group.id}/members/${beneficiaryId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to remove member')
      }
      
      toast({
        title: "تم الحذف بنجاح",
        description: "تم حذف العضو من المجموعة بنجاح",
      })
      
      fetchGroupMembers()
    } catch (error) {
      console.error('Error removing member:', error)
      toast({
        title: "خطأ في الحذف",
        description: "حدث خطأ أثناء حذف العضو",
        variant: "destructive",
      })
    } finally {
      setShowRemoveMemberDialog(false)
      setMemberToRemove(null)
    }
  }

  const getMemberName = (member: GroupMember) => {
    const person = member.widow || member.orphan
    return person ? `${person.first_name} ${person.last_name}` : 'غير محدد'
  }

  const getMemberDetails = (member: GroupMember) => {
    if (member.widow) {
      return member.widow.phone || 'لا يوجد رقم هاتف'
    } else if (member.orphan) {
      const age = new Date().getFullYear() - new Date(member.orphan.birth_date).getFullYear()
      return `العمر: ${age} سنة`
    }
    return ''
  }

  const handleCloseRemoveMemberDialog = () => {
    // Force remove any lingering pointer-events blocking
    setTimeout(() => {
      document.body.style.pointerEvents = 'auto'
    }, 100)
    setShowRemoveMemberDialog(false)
  }

  const handleRemoveMemberDialogOpenChange = (open: boolean) => {
    if (!open) {
      handleCloseRemoveMemberDialog()
    }
  }

  if (!group) return null

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              تفاصيل المجموعة: {group.name}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Group Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">معلومات المجموعة</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">اسم المجموعة</label>
                    <p className="text-lg font-semibold">{group.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">عدد الأعضاء</label>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-blue-600" />
                      <span className="text-lg font-bold text-blue-800">{members.length}</span>
                    </div>
                  </div>
                  {group.description && (
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium text-gray-700">الوصف</label>
                      <p className="text-gray-600">{group.description}</p>
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium text-gray-700">تاريخ الإنشاء</label>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span>{formatDateArabic(new Date(group.created_at), "dd/MM/yyyy")}</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">آخر تحديث</label>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span>{formatDateArabic(new Date(group.updated_at), "dd/MM/yyyy")}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Group Members */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">أعضاء المجموعة</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">جاري التحميل...</div>
                ) : members.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">لا توجد أعضاء في المجموعة</div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-right">الاسم</TableHead>
                          <TableHead className="text-center">النوع</TableHead>
                          <TableHead className="text-right">التفاصيل</TableHead>
                          <TableHead className="text-center">الإجراءات</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {members.map((member) => (
                          <TableRow key={member.id}>
                            <TableCell className="text-right font-medium">
                              {getMemberName(member)}
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant={member.type === 'Widow' ? 'default' : 'secondary'}>
                                {member.type === 'Widow' ? 'أرملة' : 'يتيم'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right text-sm text-gray-600">
                              {getMemberDetails(member)}
                            </TableCell>
                            <TableCell className="text-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setMemberToRemove(member.id)
                                  setShowRemoveMemberDialog(true)
                                }}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <UserMinus className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleClose}>
              إغلاق
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Remove Member Confirmation Dialog */}
      <AlertDialog open={showRemoveMemberDialog} onOpenChange={handleRemoveMemberDialogOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف هذا العضو من المجموعة؟ هذا الإجراء لا يمكن التراجع عنه.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCloseRemoveMemberDialog}>إلغاء</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => memberToRemove && handleRemoveMember(memberToRemove)}
              className="bg-red-600 hover:bg-red-700"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}