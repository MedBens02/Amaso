"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Search, Users, Edit, Trash2, Eye } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { BeneficiaryGroupsTable } from "@/components/beneficiary-groups/beneficiary-groups-table"
import { NewBeneficiaryGroupDialog } from "@/components/beneficiary-groups/new-beneficiary-group-dialog"
import { ViewGroupDetailsDialog } from "@/components/beneficiary-groups/view-group-details-dialog"
import { EditBeneficiaryGroupDialog, GroupMember } from "@/components/beneficiary-groups/edit-beneficiary-group-dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"

export default function BeneficiaryGroupsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [showNewDialog, setShowNewDialog] = useState(false)
  const [viewingGroup, setViewingGroup] = useState<any>(null)
  const [editingGroup, setEditingGroup] = useState<any>(null)
  const [groupMembers, setGroupMembers] = useState<any[]>([])
  const [refreshKey, setRefreshKey] = useState(0)
  const [memberToRemove, setMemberToRemove] = useState<GroupMember | null>(null)
  const [showRemoveDialog, setShowRemoveDialog] = useState(false)
  const [editDialogRefreshTrigger, setEditDialogRefreshTrigger] = useState(0)
  const { toast } = useToast()

  const fetchGroupMembers = async (groupId: number) => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1'
      const response = await fetch(`${baseUrl}/beneficiary-groups/${groupId}/members`, {
        headers: { 'Accept': 'application/json' }
      })
      
      if (!response.ok) throw new Error('Failed to fetch members')
      
      const data = await response.json()
      setGroupMembers(data.data || [])
    } catch (error) {
      console.error('Error fetching members:', error)
      setGroupMembers([])
    }
  }

  const handleViewGroup = async (group: any) => {
    setViewingGroup(group)
    await fetchGroupMembers(group.id)
  }

  const handleEditGroup = async (group: any) => {
    setEditingGroup(group)
  }

  const handleGroupUpdated = () => {
    setRefreshKey(prev => prev + 1)
  }

  const handleRemoveMember = (member: GroupMember) => {
    console.log('🔴 DELETE BUTTON CLICKED')
    console.log('Member to remove:', member)
    console.log('Member ID:', member.id)
    console.log('Member full_name:', member.full_name)
    console.log('Current editingGroup:', editingGroup)
    setMemberToRemove(member)
    setShowRemoveDialog(true)
    console.log('✅ Confirmation dialog should now be visible')
  }

  const confirmRemoveMember = async () => {
    console.log('🟡 CONFIRM DELETE CLICKED')
    console.log('memberToRemove:', memberToRemove)
    console.log('editingGroup:', editingGroup)
    
    if (!memberToRemove || !editingGroup) {
      console.log('❌ Missing memberToRemove or editingGroup, aborting')
      return
    }
    
    setShowRemoveDialog(false)
    
    try {
      console.log('🚀 Making API call to remove member:', memberToRemove.full_name, 'from group:', editingGroup.id)
      console.log('API URL will be:', `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1'}/beneficiary-groups/${editingGroup.id}/members/${memberToRemove.id}`)
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1'
      const response = await fetch(`${baseUrl}/beneficiary-groups/${editingGroup.id}/members/${memberToRemove.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      })
      
      console.log('📡 API response status:', response.status)
      console.log('📡 API response ok:', response.ok)
      
      if (!response.ok) {
        const errorData = await response.json()
        console.log('❌ API error response:', errorData)
        throw new Error(errorData.message || 'Failed to remove member')
      }
      
      const successData = await response.json()
      console.log('✅ API success response:', successData)
      console.log('✅ Member removed successfully')
      toast({
        title: "تم حذف العضو بنجاح",
        description: "تم حذف العضو من المجموعة بنجاح",
      })
      
      // Refresh the group members for the current editing group
      console.log('🔄 Refreshing group members')
      await fetchGroupMembers(editingGroup.id)
      console.log('🔄 Triggering edit dialog refresh')
      setEditDialogRefreshTrigger(prev => prev + 1)
      handleGroupUpdated()
      console.log('🎉 Member removal process completed successfully')
      
    } catch (error) {
      console.error('❌ Error removing member:', error)
      toast({
        title: "خطأ في حذف العضو",
        description: error instanceof Error ? error.message : "حدث خطأ أثناء حذف العضو",
        variant: "destructive",
      })
    } finally {
      setMemberToRemove(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="h-8 w-8" />
            إدارة مجموعات المستفيدين
          </h1>
          <p className="text-gray-600 mt-2">إنشاء وإدارة مجموعات المستفيدين من الأرامل والأيتام</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowNewDialog(true)}>
            <Plus className="h-4 w-4 ml-2" />
            مجموعة جديدة
          </Button>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="البحث في المجموعات..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Groups Table */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة المجموعات</CardTitle>
        </CardHeader>
        <CardContent>
          <BeneficiaryGroupsTable 
            key={refreshKey}
            searchTerm={searchTerm} 
            onViewGroup={handleViewGroup}
            onEditGroup={handleEditGroup}
          />
        </CardContent>
      </Card>

      <NewBeneficiaryGroupDialog 
        open={showNewDialog} 
        onOpenChange={setShowNewDialog}
        onGroupCreated={handleGroupUpdated}
      />

      <ViewGroupDetailsDialog
        group={viewingGroup}
        members={groupMembers}
        open={!!viewingGroup}
        onOpenChange={(open) => {
          if (!open) {
            setViewingGroup(null)
            setGroupMembers([])
          }
        }}
      />

      <EditBeneficiaryGroupDialog
        key={editDialogRefreshTrigger}
        group={editingGroup}
        open={!!editingGroup}
        onOpenChange={(open) => {
          console.log('EditBeneficiaryGroupDialog onOpenChange:', open)
          if (!open) {
            setEditingGroup(null)
          }
        }}
        onGroupUpdated={handleGroupUpdated}
        onRemoveMember={handleRemoveMember}
      />

      {/* Remove Member Confirmation Dialog */}
      <AlertDialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد حذف العضو</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف "{memberToRemove?.full_name}" من المجموعة؟
              لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={() => {
                setShowRemoveDialog(false)
                setMemberToRemove(null)
              }}
            >
              إلغاء
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRemoveMember}
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