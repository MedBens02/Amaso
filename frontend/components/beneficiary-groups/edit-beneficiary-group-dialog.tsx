'use client'

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/hooks/use-toast"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Users, Search, Trash2, Plus, UserPlus, Phone, MapPin, Calendar } from "lucide-react"

interface BeneficiaryGroup {
  id: number
  name: string
  description?: string
  members_count: number
}

interface Beneficiary {
  id: number
  type: 'Widow' | 'Orphan'
  full_name: string
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

interface EditBeneficiaryGroupDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  group: BeneficiaryGroup | null
  onGroupUpdated: () => void
  onRemoveMember?: (member: GroupMember) => void
}

// Export the GroupMember interface so parent can use it
export interface GroupMember {
  id: number
  type: 'Widow' | 'Orphan'
  full_name: string
  widow?: {
    id: number
    first_name: string
    last_name: string
    phone?: string
    address?: string
    birth_date: string
  }
  orphan?: {
    id: number
    first_name: string
    last_name: string
    birth_date: string
    education_level?: {
      name_ar: string
    }
  }
}

export function EditBeneficiaryGroupDialog({
  open,
  onOpenChange,
  group,
  onGroupUpdated,
  onRemoveMember
}: EditBeneficiaryGroupDialogProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [members, setMembers] = useState<GroupMember[]>([])
  const [availableBeneficiaries, setAvailableBeneficiaries] = useState<Beneficiary[]>([])
  const [selectedBeneficiaries, setSelectedBeneficiaries] = useState<Set<number>>(new Set())
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'Widow' | 'Orphan'>('all')
  const [loading, setLoading] = useState(false)
  const [loadingBeneficiaries, setLoadingBeneficiaries] = useState(false)
  const [showAddMembersSection, setShowAddMembersSection] = useState(false)

  useEffect(() => {
    if (group && open) {
      setName(group.name)
      setDescription(group.description || '')
      fetchGroupMembers()
      fetchAvailableBeneficiaries()
      // Reset all dialog states when opening
      setShowAddMembersSection(false)
      setSelectedBeneficiaries(new Set())
      setSearchTerm('')
      setTypeFilter('all')
    } else if (!open) {
      // Reset states when closing
      setShowAddMembersSection(false)
      setSelectedBeneficiaries(new Set())
      setSearchTerm('')
      setTypeFilter('all')
    }
  }, [group, open])


  const fetchGroupMembers = async () => {
    if (!group) return
    
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1'
      const response = await fetch(`${baseUrl}/beneficiary-groups/${group.id}/members`, {
        headers: { 'Accept': 'application/json' }
      })
      
      if (!response.ok) throw new Error('Failed to fetch members')
      
      const data = await response.json()
      setMembers(data.data || [])
    } catch (error) {
      console.error('Error fetching members:', error)
      toast({
        title: "خطأ في تحميل الأعضاء",
        description: "حدث خطأ أثناء تحميل أعضاء المجموعة",
        variant: "destructive",
      })
    }
  }

  const fetchAvailableBeneficiaries = async () => {
    setLoadingBeneficiaries(true)
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1'
      let url = `${baseUrl}/beneficiaries?per_page=200`
      if (searchTerm) url += `&search=${encodeURIComponent(searchTerm)}`
      if (typeFilter !== 'all') url += `&type=${typeFilter}`
      
      const response = await fetch(url, {
        headers: { 'Accept': 'application/json' }
      })
      
      if (!response.ok) throw new Error('Failed to fetch beneficiaries')
      
      const data = await response.json()
      setAvailableBeneficiaries(data.data || [])
    } catch (error) {
      console.error('Error fetching beneficiaries:', error)
    } finally {
      setLoadingBeneficiaries(false)
    }
  }

  useEffect(() => {
    if (open && showAddMembersSection) {
      fetchAvailableBeneficiaries()
    }
  }, [searchTerm, typeFilter, open, showAddMembersSection])

  const handleSave = async () => {
    if (!group || !name.trim()) return
    
    setLoading(true)
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1'
      const response = await fetch(`${baseUrl}/beneficiary-groups/${group.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim()
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to update group')
      }
      
      toast({
        title: "تم التحديث بنجاح",
        description: "تم تحديث بيانات المجموعة بنجاح",
      })
      
      onGroupUpdated()
      onOpenChange(false)
    } catch (error) {
      console.error('Error updating group:', error)
      toast({
        title: "خطأ في التحديث",
        description: error instanceof Error ? error.message : "حدث خطأ أثناء تحديث المجموعة",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAddMembers = async () => {
    if (!group || selectedBeneficiaries.size === 0) return
    
    setLoading(true)
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1'
      const response = await fetch(`${baseUrl}/beneficiary-groups/${group.id}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          beneficiary_ids: Array.from(selectedBeneficiaries)
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to add members')
      }
      
      toast({
        title: "تم إضافة الأعضاء بنجاح",
        description: `تم إضافة ${selectedBeneficiaries.size} عضو جديد للمجموعة`,
      })
      
      setSelectedBeneficiaries(new Set())
      setShowAddMembersSection(false)
      await fetchGroupMembers()
      onGroupUpdated()
    } catch (error) {
      console.error('Error adding members:', error)
      toast({
        title: "خطأ في إضافة الأعضاء",
        description: error instanceof Error ? error.message : "حدث خطأ أثناء إضافة الأعضاء",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }


  const getMemberDetails = (member: GroupMember) => {
    if (member.widow) {
      return {
        phone: member.widow.phone || 'غير محدد',
        age: new Date().getFullYear() - new Date(member.widow.birth_date).getFullYear()
      }
    } else if (member.orphan) {
      return {
        age: new Date().getFullYear() - new Date(member.orphan.birth_date).getFullYear(),
        education: member.orphan.education_level?.name_ar || 'غير محدد'
      }
    }
    return {}
  }

  const currentMemberIds = new Set(members.map(m => m.id))
  const filteredBeneficiaries = availableBeneficiaries.filter(b => !currentMemberIds.has(b.id))

  if (!group) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              تعديل المجموعة: {group.name}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Group Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">معلومات أساسية</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Label htmlFor="name">اسم المجموعة *</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="أدخل اسم المجموعة"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">الوصف</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="أدخل وصف المجموعة (اختياري)"
                      rows={3}
                      className="mt-1"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Current Members */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  <span>الأعضاء الحاليون</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{members.length} عضو</Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowAddMembersSection(!showAddMembersSection)}
                      className="flex items-center gap-2"
                    >
                      <UserPlus className="h-4 w-4" />
                      إضافة أعضاء
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {members.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>لا توجد أعضاء في هذه المجموعة</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {members.map((member) => {
                      const details = getMemberDetails(member)
                      return (
                        <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg bg-muted">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">{member.full_name}</span>
                              <Badge variant={member.type === 'Widow' ? 'default' : 'secondary'} className="text-xs">
                                {member.type === 'Widow' ? 'أرملة' : 'يتيم'}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span>العمر: {details.age} سنة</span>
                              {details.phone && (
                                <span className="flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  {details.phone}
                                </span>
                              )}
                              {details.education && (
                                <span>المستوى: {details.education}</span>
                              )}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              console.log('🔴 DELETE BUTTON CLICKED IN EDIT DIALOG')
                              console.log('Member:', member)
                              console.log('onRemoveMember callback:', onRemoveMember)
                              if (onRemoveMember) {
                                console.log('✅ Calling onRemoveMember callback')
                                onRemoveMember(member)
                              } else {
                                console.log('❌ No onRemoveMember callback provided!')
                              }
                            }}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Add New Members Section */}
            {showAddMembersSection && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    إضافة أعضاء جدد
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Search and Filter */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1 relative">
                      <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="البحث في المستفيدين..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pr-10"
                      />
                    </div>
                    <Select value={typeFilter} onValueChange={(value: 'all' | 'Widow' | 'Orphan') => setTypeFilter(value)}>
                      <SelectTrigger className="w-full sm:w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">جميع المستفيدين</SelectItem>
                        <SelectItem value="Widow">الأرامل فقط</SelectItem>
                        <SelectItem value="Orphan">الأيتام فقط</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Available Beneficiaries */}
                  {loadingBeneficiaries ? (
                    <div className="text-center py-4">
                      <p>جاري تحميل المستفيدين...</p>
                    </div>
                  ) : filteredBeneficiaries.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>لا توجد مستفيدين متاحين للإضافة</p>
                    </div>
                  ) : (
                    <div className="max-h-64 overflow-y-auto space-y-2">
                      {filteredBeneficiaries.map((beneficiary) => (
                        <div key={beneficiary.id} className="flex items-center space-x-3 space-x-reverse p-2 hover:bg-muted rounded">
                          <Checkbox
                            checked={selectedBeneficiaries.has(beneficiary.id)}
                            onCheckedChange={(checked) => {
                              const newSelected = new Set(selectedBeneficiaries)
                              if (checked) {
                                newSelected.add(beneficiary.id)
                              } else {
                                newSelected.delete(beneficiary.id)
                              }
                              setSelectedBeneficiaries(newSelected)
                            }}
                          />
                          <div className="flex-1 flex items-center justify-between">
                            <div>
                              <span className="font-medium">{beneficiary.full_name}</span>
                              <Badge variant={beneficiary.type === 'Widow' ? 'default' : 'secondary'} className="mr-2 text-xs">
                                {beneficiary.type === 'Widow' ? 'أرملة' : 'يتيم'}
                              </Badge>
                            </div>
                            {beneficiary.widow?.phone && (
                              <span className="text-sm text-muted-foreground">{beneficiary.widow.phone}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add Members Actions */}
                  {selectedBeneficiaries.size > 0 && (
                    <div className="flex items-center justify-between pt-4 border-t">
                      <p className="text-sm text-muted-foreground">
                        تم تحديد {selectedBeneficiaries.size} مستفيد
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedBeneficiaries(new Set())
                            setShowAddMembersSection(false)
                          }}
                        >
                          إلغاء
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleAddMembers}
                          disabled={loading}
                        >
                          {loading ? 'جاري الإضافة...' : 'إضافة الأعضاء'}
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Dialog Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                إلغاء
              </Button>
              <Button
                onClick={handleSave}
                disabled={loading || !name.trim()}
              >
                {loading ? 'جاري الحفظ...' : 'حفظ التغييرات'}
              </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}