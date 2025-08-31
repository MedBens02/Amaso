"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, Search, Filter } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

const beneficiaryGroupSchema = z.object({
  name: z.string().min(1, "اسم المجموعة مطلوب").max(100, "اسم المجموعة يجب أن يكون أقل من 100 حرف"),
  description: z.string().optional(),
})

type BeneficiaryGroupForm = z.infer<typeof beneficiaryGroupSchema>

interface Beneficiary {
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

interface NewBeneficiaryGroupDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onGroupCreated?: () => void
}

export function NewBeneficiaryGroupDialog({ open, onOpenChange, onGroupCreated }: NewBeneficiaryGroupDialogProps) {
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([])
  const [selectedBeneficiaries, setSelectedBeneficiaries] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const { toast } = useToast()

  const form = useForm<BeneficiaryGroupForm>({
    resolver: zodResolver(beneficiaryGroupSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  })

  const handleClose = () => {
    // Force remove any lingering pointer-events blocking
    setTimeout(() => {
      document.body.style.pointerEvents = 'auto'
    }, 100)
    onOpenChange(false)
    form.reset()
    setSelectedBeneficiaries(new Set())
    setSearchTerm("")
    setTypeFilter("all")
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      handleClose()
    }
  }

  // Load beneficiaries when dialog opens
  useEffect(() => {
    if (open) {
      fetchBeneficiaries()
    }
  }, [open])

  const fetchBeneficiaries = async () => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1'
      const response = await fetch(`${baseUrl}/beneficiaries`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch beneficiaries')
      }
      
      const result = await response.json()
      setBeneficiaries(result.data || [])
    } catch (error) {
      console.error('Error fetching beneficiaries:', error)
      toast({
        title: "خطأ في تحميل البيانات",
        description: "حدث خطأ أثناء تحميل المستفيدين",
        variant: "destructive",
      })
    }
  }

  // Filter beneficiaries based on search and type
  const filteredBeneficiaries = beneficiaries.filter((beneficiary) => {
    // Type filter
    if (typeFilter !== "all" && beneficiary.type !== typeFilter) {
      return false
    }

    // Search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase()
      const person = beneficiary.widow || beneficiary.orphan
      if (person) {
        const fullName = `${person.first_name} ${person.last_name}`.toLowerCase()
        return fullName.includes(searchLower)
      }
    }

    return true
  })

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(filteredBeneficiaries.map(b => b.id))
      setSelectedBeneficiaries(allIds)
    } else {
      setSelectedBeneficiaries(new Set())
    }
  }

  const handleSelectBeneficiary = (id: number, checked: boolean) => {
    const newSelected = new Set(selectedBeneficiaries)
    if (checked) {
      newSelected.add(id)
    } else {
      newSelected.delete(id)
    }
    setSelectedBeneficiaries(newSelected)
  }

  const onSubmit = async (data: BeneficiaryGroupForm) => {
    if (selectedBeneficiaries.size === 0) {
      toast({
        title: "خطأ في البيانات",
        description: "يجب اختيار مستفيد واحد على الأقل",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1'
      const response = await fetch(`${baseUrl}/beneficiary-groups`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          ...data,
          beneficiary_ids: Array.from(selectedBeneficiaries)
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        console.error('API Error:', errorData)
        throw new Error(errorData.message || `HTTP ${response.status}: Failed to create beneficiary group`)
      }
      
      const result = await response.json()
      
      toast({
        title: "تم الحفظ بنجاح",
        description: result.message || "تم إنشاء المجموعة بنجاح",
      })
      
      handleClose()
      onGroupCreated?.()
      // No need to reload the page, parent will refresh the data
      
    } catch (error) {
      console.error('Error creating beneficiary group:', error)
      toast({
        title: "خطأ في الحفظ",
        description: "حدث خطأ أثناء إنشاء المجموعة",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getBeneficiaryName = (beneficiary: Beneficiary) => {
    const person = beneficiary.widow || beneficiary.orphan
    return person ? `${person.first_name} ${person.last_name}` : 'غير محدد'
  }

  const getBeneficiaryDetails = (beneficiary: Beneficiary) => {
    if (beneficiary.widow) {
      return beneficiary.widow.phone || 'لا يوجد رقم هاتف'
    } else if (beneficiary.orphan) {
      const age = new Date().getFullYear() - new Date(beneficiary.orphan.birth_date).getFullYear()
      return `العمر: ${age} سنة`
    }
    return ''
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            إنشاء مجموعة مستفيدين جديدة
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">معلومات أساسية</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">اسم المجموعة *</Label>
                  <Controller
                    name="name"
                    control={form.control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        id="name"
                        placeholder="مثال: مستفيدي عيد الأضحى"
                        className={form.formState.errors.name ? "border-red-500" : ""}
                      />
                    )}
                  />
                  {form.formState.errors.name && (
                    <p className="text-sm text-red-600">{form.formState.errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">الوصف</Label>
                  <Controller
                    name="description"
                    control={form.control}
                    render={({ field }) => (
                      <Textarea
                        {...field}
                        id="description"
                        placeholder="وصف اختياري للمجموعة"
                        rows={3}
                      />
                    )}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Member Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">اختيار الأعضاء</CardTitle>
              <p className="text-sm text-gray-600">اختر المستفيدين الذين تريد إضافتهم للمجموعة</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="البحث بالاسم..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pr-10"
                  />
                </div>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الأنواع</SelectItem>
                    <SelectItem value="Widow">الأرامل</SelectItem>
                    <SelectItem value="Orphan">الأيتام</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Selection Summary */}
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                <span className="text-sm font-medium text-blue-900">
                  تم اختيار {selectedBeneficiaries.size} من {filteredBeneficiaries.length} مستفيد
                </span>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => handleSelectAll(true)}
                  >
                    اختيار الكل
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => handleSelectAll(false)}
                  >
                    إلغاء الكل
                  </Button>
                </div>
              </div>

              {/* Beneficiaries Table */}
              <div className="border rounded-md max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12"></TableHead>
                      <TableHead className="text-right">الاسم</TableHead>
                      <TableHead className="text-center">النوع</TableHead>
                      <TableHead className="text-right">التفاصيل</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBeneficiaries.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                          لا توجد مستفيدون متاحون
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredBeneficiaries.map((beneficiary) => (
                        <TableRow key={beneficiary.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedBeneficiaries.has(beneficiary.id)}
                              onCheckedChange={(checked) => 
                                handleSelectBeneficiary(beneficiary.id, checked as boolean)
                              }
                            />
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {getBeneficiaryName(beneficiary)}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant={beneficiary.type === 'Widow' ? 'default' : 'secondary'}>
                              {beneficiary.type === 'Widow' ? 'أرملة' : 'يتيم'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right text-sm text-gray-600">
                            {getBeneficiaryDetails(beneficiary)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
              إلغاء
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "جاري الحفظ..." : "إنشاء المجموعة"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}