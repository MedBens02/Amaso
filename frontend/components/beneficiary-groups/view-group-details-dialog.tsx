'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, Phone, MapPin, Calendar } from "lucide-react"

interface BeneficiaryGroup {
  id: number
  name: string
  description?: string
  members_count: number
}

interface GroupMember {
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

interface ViewGroupDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  group: BeneficiaryGroup | null
  members: GroupMember[]
}

export function ViewGroupDetailsDialog({
  open,
  onOpenChange,
  group,
  members
}: ViewGroupDetailsDialogProps) {
  const getMemberDetails = (member: GroupMember) => {
    if (member.widow) {
      return {
        phone: member.widow.phone || 'غير محدد',
        address: member.widow.address || 'غير محدد',
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

  if (!group) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
                    <p className="text-gray-900 mt-1">{group.description}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Members List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                <span>أعضاء المجموعة</span>
                <Badge variant="secondary">{members.length} عضو</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {members.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>لا توجد أعضاء في هذه المجموعة</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {members.map((member) => {
                    const details = getMemberDetails(member)
                    return (
                      <div key={member.id} className="border rounded-lg p-4 bg-gray-50">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-medium text-lg">{member.full_name}</h4>
                              <Badge variant={member.type === 'Widow' ? 'default' : 'secondary'}>
                                {member.type === 'Widow' ? 'أرملة' : 'يتيم'}
                              </Badge>
                            </div>
                            <div className="space-y-1 text-sm text-gray-600">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                <span>العمر: {details.age} سنة</span>
                              </div>
                              {member.widow && (
                                <>
                                  {details.phone && (
                                    <div className="flex items-center gap-2">
                                      <Phone className="h-4 w-4" />
                                      <span>{details.phone}</span>
                                    </div>
                                  )}
                                  {details.address && (
                                    <div className="flex items-center gap-2">
                                      <MapPin className="h-4 w-4" />
                                      <span className="line-clamp-1">{details.address}</span>
                                    </div>
                                  )}
                                </>
                              )}
                              {member.orphan && details.education && (
                                <div className="flex items-center gap-2">
                                  <span>المستوى التعليمي: {details.education}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}