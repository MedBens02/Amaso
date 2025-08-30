"use client"

import React, { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Building, 
  Layers,
  Users,
  Search,
  ChevronDown,
  ChevronRight
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { ReferenceItemDialog } from "./reference-item-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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

interface PartnerField {
  id: number
  label: string
  subfields_count?: number
  partners_count?: number
}

interface PartnerSubfield {
  id: number
  field_id: number
  label: string
  field?: PartnerField
  partners_count?: number
}

interface Partner {
  id: number
  name: string
  phone?: string
  email?: string
  address?: string
  field?: PartnerField
  subfield?: PartnerSubfield
  field_id?: number
  subfield_id?: number
}

interface PartnersManagementProps {
  onDataChange: () => void
}

export function PartnersManagement({ onDataChange }: PartnersManagementProps) {
  const [partnerFields, setPartnerFields] = useState<PartnerField[]>([])
  const [partnerSubfields, setPartnerSubfields] = useState<PartnerSubfield[]>([])
  const [partners, setPartners] = useState<Partner[]>([])
  const [loading, setLoading] = useState(true)
  
  // Search state
  const [partnerSearch, setPartnerSearch] = useState("")
  
  // Dialog states
  const [fieldDialogOpen, setFieldDialogOpen] = useState(false)
  const [subfieldDialogOpen, setSubfieldDialogOpen] = useState(false)
  const [partnerDialogOpen, setPartnerDialogOpen] = useState(false)
  
  // Selected items for editing
  const [selectedField, setSelectedField] = useState<PartnerField | undefined>()
  const [selectedSubfield, setSelectedSubfield] = useState<PartnerSubfield | undefined>()
  const [selectedPartner, setSelectedPartner] = useState<Partner | undefined>()
  
  // Delete confirmation
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deleteItem, setDeleteItem] = useState<{ type: string, item: any }>()
  
  const { toast } = useToast()

  // Filtered and grouped partners data
  const filteredPartners = useMemo(() => {
    return partners.filter(partner =>
      partner.name.toLowerCase().includes(partnerSearch.toLowerCase()) ||
      (partner.phone && partner.phone.toLowerCase().includes(partnerSearch.toLowerCase())) ||
      (partner.email && partner.email.toLowerCase().includes(partnerSearch.toLowerCase())) ||
      (partner.address && partner.address.toLowerCase().includes(partnerSearch.toLowerCase()))
    )
  }, [partners, partnerSearch])

  const groupedPartners = useMemo(() => {
    const groups = new Map<string, { field: PartnerField | null, subfield: PartnerSubfield | null, partners: Partner[] }>()
    
    filteredPartners.forEach(partner => {
      let groupKey = ""
      let field: PartnerField | null = null
      let subfield: PartnerSubfield | null = null
      
      if (partner.field_id && partner.subfield_id) {
        // Group by field and subfield
        field = partnerFields.find(f => f.id === partner.field_id) || null
        subfield = partnerSubfields.find(sf => sf.id === partner.subfield_id) || null
        groupKey = `field-${partner.field_id}-subfield-${partner.subfield_id}`
      } else if (partner.field_id) {
        // Group by field only
        field = partnerFields.find(f => f.id === partner.field_id) || null
        groupKey = `field-${partner.field_id}`
      } else {
        // Group ungrouped partners
        groupKey = "no-field"
      }
      
      if (!groups.has(groupKey)) {
        groups.set(groupKey, { field, subfield, partners: [] })
      }
      groups.get(groupKey)!.partners.push(partner)
    })
    
    return Array.from(groups.values()).sort((a, b) => {
      // Sort by field name, then by subfield name, ungrouped last
      if (!a.field && !b.field) return 0
      if (!a.field) return 1
      if (!b.field) return -1
      
      const fieldCompare = a.field.label.localeCompare(b.field.label)
      if (fieldCompare !== 0) return fieldCompare
      
      if (!a.subfield && !b.subfield) return 0
      if (!a.subfield) return 1
      if (!b.subfield) return -1
      
      return a.subfield.label.localeCompare(b.subfield.label)
    })
  }, [filteredPartners, partnerFields, partnerSubfields])

  const loadData = async () => {
    setLoading(true)
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1'
      
      const [fieldsRes, subfieldsRes, partnersRes] = await Promise.all([
        fetch(`${baseUrl}/references/partner-fields`),
        fetch(`${baseUrl}/references/partner-subfields`),
        fetch(`${baseUrl}/references/partners`)
      ])

      if (fieldsRes.ok) {
        const fieldsData = await fieldsRes.json()
        setPartnerFields(fieldsData.data || [])
      }

      if (subfieldsRes.ok) {
        const subfieldsData = await subfieldsRes.json()
        setPartnerSubfields(subfieldsData.data || [])
      }

      if (partnersRes.ok) {
        const partnersData = await partnersRes.json()
        setPartners(partnersData.data || [])
      }
    } catch (error) {
      console.error('Error loading partner data:', error)
      toast({
        title: "خطأ في تحميل البيانات",
        description: "حدث خطأ أثناء تحميل بيانات الشركاء",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleDelete = async () => {
    if (!deleteItem) return
    
    const { type, item } = deleteItem
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1'
    
    try {
      let endpoint = ''
      if (type === 'field') endpoint = `references/partner-fields/${item.id}`
      else if (type === 'subfield') endpoint = `references/partner-subfields/${item.id}`
      else if (type === 'partner') endpoint = `references/partners/${item.id}`
      
      const response = await fetch(`${baseUrl}/${endpoint}`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
        },
      })

      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.message || `HTTP ${response.status}`)
      }

      toast({
        title: "تم الحذف بنجاح",
        description: result.message,
      })
      
      loadData()
      onDataChange()
    } catch (error) {
      console.error('Delete error:', error)
      toast({
        title: "خطأ في الحذف",
        description: error instanceof Error ? error.message : "حدث خطأ أثناء الحذف",
        variant: "destructive",
      })
    } finally {
      setDeleteConfirmOpen(false)
      setDeleteItem(undefined)
    }
  }

  const openDeleteConfirm = (type: string, item: any) => {
    setDeleteItem({ type, item })
    setDeleteConfirmOpen(true)
  }

  const handleFieldSuccess = () => {
    setFieldDialogOpen(false)
    setSelectedField(undefined)
    loadData()
    onDataChange()
  }

  const handleSubfieldSuccess = () => {
    setSubfieldDialogOpen(false)
    setSelectedSubfield(undefined)
    loadData()
    onDataChange()
  }

  const handlePartnerSuccess = () => {
    setPartnerDialogOpen(false)
    setSelectedPartner(undefined)
    loadData()
    onDataChange()
  }

  // Functions to open dialogs for creating new items
  const openNewFieldDialog = () => {
    setSelectedField(undefined)
    setFieldDialogOpen(true)
  }

  const openNewSubfieldDialog = () => {
    setSelectedSubfield(undefined)
    setSubfieldDialogOpen(true)
  }

  const openNewPartnerDialog = () => {
    setSelectedPartner(undefined)
    setPartnerDialogOpen(true)
  }

  // Handle dialog close events to clear selections
  const handleFieldDialogOpenChange = (open: boolean) => {
    setFieldDialogOpen(open)
    if (!open) {
      setSelectedField(undefined)
    }
  }

  const handleSubfieldDialogOpenChange = (open: boolean) => {
    setSubfieldDialogOpen(open)
    if (!open) {
      setSelectedSubfield(undefined)
    }
  }

  const handlePartnerDialogOpenChange = (open: boolean) => {
    setPartnerDialogOpen(open)
    if (!open) {
      setSelectedPartner(undefined)
    }
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="fields" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="fields">مجالات الشركاء</TabsTrigger>
          <TabsTrigger value="subfields">تخصصات الشركاء</TabsTrigger>
          <TabsTrigger value="partners">الشركاء</TabsTrigger>
        </TabsList>

        <TabsContent value="fields">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="h-5 w-5" />
                  مجالات الشركاء
                </div>
                <Button size="sm" onClick={openNewFieldDialog}>
                  <Plus className="h-4 w-4 ml-2" />
                  إضافة مجال جديد
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-4">جاري التحميل...</div>
              ) : partnerFields.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  لا توجد مجالات مضافة بعد
                </div>
              ) : (
                <div className="space-y-2">
                  {partnerFields.map((field) => (
                    <div key={field.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="font-medium">{field.label}</span>
                        <Badge variant="outline">
                          {field.subfields_count || 0} تخصص
                        </Badge>
                        <Badge variant="outline">
                          {field.partners_count || 0} شريك
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedField(field)
                            setFieldDialogOpen(true)
                          }}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openDeleteConfirm('field', field)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subfields">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  تخصصات الشركاء
                </div>
                <Button size="sm" onClick={openNewSubfieldDialog}>
                  <Plus className="h-4 w-4 ml-2" />
                  إضافة تخصص جديد
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-4">جاري التحميل...</div>
              ) : partnerSubfields.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  لا توجد تخصصات مضافة بعد
                </div>
              ) : (
                <div className="space-y-2">
                  {partnerSubfields.map((subfield) => (
                    <div key={subfield.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="font-medium">{subfield.label}</span>
                        <Badge variant="secondary">
                          {subfield.field?.label || 'غير محدد'}
                        </Badge>
                        <Badge variant="outline">
                          {subfield.partners_count || 0} شريك
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedSubfield(subfield)
                            setSubfieldDialogOpen(true)
                          }}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openDeleteConfirm('subfield', subfield)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="partners">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  الشركاء
                </div>
                <Button size="sm" onClick={openNewPartnerDialog}>
                  <Plus className="h-4 w-4 ml-2" />
                  إضافة شريك جديد
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="البحث في الشركاء (الاسم، الهاتف، البريد، العنوان)..."
                    value={partnerSearch}
                    onChange={(e) => setPartnerSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              {loading ? (
                <div className="text-center py-4">جاري التحميل...</div>
              ) : groupedPartners.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {partnerSearch ? "لم يتم العثور على شركاء يطابقون البحث" : "لا توجد شركاء مضافين بعد"}
                </div>
              ) : (
                <div className="space-y-4">
                  {groupedPartners.map((group, index) => (
                    <Collapsible key={index} defaultOpen>
                      <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="flex items-center gap-2">
                          <ChevronRight className="h-4 w-4 transition-transform group-data-[state=open]:rotate-90" />
                          <span className="font-semibold text-gray-700">
                            {group.field 
                              ? group.subfield 
                                ? `${group.field.label} - ${group.subfield.label}`
                                : group.field.label
                              : "بدون تصنيف"
                            }
                          </span>
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            {group.partners.length} شريك
                          </Badge>
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="mt-2 space-y-2">
                        {group.partners.map((partner) => (
                          <div key={partner.id} className="flex items-center justify-between p-3 border rounded-lg ml-6 bg-white">
                            <div className="flex flex-col gap-2">
                              <div className="flex items-center gap-3">
                                <span className="font-medium">{partner.name}</span>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-gray-600">
                                {partner.phone && (
                                  <span className="flex items-center gap-1">
                                    📞 {partner.phone}
                                  </span>
                                )}
                                {partner.email && (
                                  <span className="flex items-center gap-1">
                                    ✉️ {partner.email}
                                  </span>
                                )}
                                {partner.address && (
                                  <span className="flex items-center gap-1">
                                    📍 {partner.address}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedPartner(partner)
                                  setPartnerDialogOpen(true)
                                }}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openDeleteConfirm('partner', partner)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </CollapsibleContent>
                    </Collapsible>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Field Dialog */}
      <PartnerFieldDialog
        open={fieldDialogOpen}
        onOpenChange={handleFieldDialogOpenChange}
        field={selectedField}
        onSuccess={handleFieldSuccess}
      />

      {/* Subfield Dialog */}
      <PartnerSubfieldDialog
        open={subfieldDialogOpen}
        onOpenChange={handleSubfieldDialogOpenChange}
        subfield={selectedSubfield}
        fields={partnerFields}
        onSuccess={handleSubfieldSuccess}
      />

      {/* Partner Dialog */}
      <PartnerDialog
        open={partnerDialogOpen}
        onOpenChange={handlePartnerDialogOpenChange}
        partner={selectedPartner}
        fields={partnerFields}
        subfields={partnerSubfields}
        onSuccess={handlePartnerSuccess}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف هذا العنصر؟ هذا الإجراء لا يمكن التراجع عنه.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>حذف</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// Separate dialog components for each type
function PartnerFieldDialog({ open, onOpenChange, field, onSuccess }: any) {
  return (
    <ReferenceItemDialog
      open={open}
      onOpenChange={onOpenChange}
      type="partner-field"
      item={field ? { name: field.label, label: field.label, ...field } : undefined}
      onSuccess={onSuccess}
    />
  )
}

function PartnerSubfieldDialog({ open, onOpenChange, subfield, fields, onSuccess }: any) {
  return (
    <ReferenceItemDialog
      open={open}
      onOpenChange={onOpenChange}
      type="partner-subfield"
      item={subfield ? { 
        name: subfield.label, 
        label: subfield.label, 
        field_id: subfield.field_id,
        ...subfield 
      } : undefined}
      onSuccess={onSuccess}
      extraProps={{ fields }}
    />
  )
}

function PartnerDialog({ open, onOpenChange, partner, fields, subfields, onSuccess }: any) {
  return (
    <ReferenceItemDialog
      open={open}
      onOpenChange={onOpenChange}
      type="partner"
      item={partner}
      onSuccess={onSuccess}
      extraProps={{ fields, subfields }}
    />
  )
}