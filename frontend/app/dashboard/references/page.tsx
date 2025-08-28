"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { 
  Database, 
  Plus, 
  Edit2, 
  Trash2, 
  Heart, 
  Users, 
  DollarSign, 
  Building, 
  Star,
  HandHeart,
  ArrowUpDown
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { ReferenceItemDialog } from "@/components/references/reference-item-dialog"
import { EducationLevelReorder } from "@/components/references/education-level-reorder"

interface ReferenceItem {
  id: number
  label?: string
  name?: string
  name_ar?: string
  is_active?: boolean
  is_chronic?: boolean
}

export default function ReferencesPage() {
  const [illnesses, setIllnesses] = useState<ReferenceItem[]>([])
  const [skills, setSkills] = useState<ReferenceItem[]>([])
  const [aidTypes, setAidTypes] = useState<ReferenceItem[]>([])
  const [incomeCategories, setIncomeCategories] = useState<ReferenceItem[]>([])
  const [expenseCategories, setExpenseCategories] = useState<ReferenceItem[]>([])
  const [partners, setPartners] = useState<ReferenceItem[]>([])
  const [educationLevels, setEducationLevels] = useState<ReferenceItem[]>([])
  const [loading, setLoading] = useState(true)
  
  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogType, setDialogType] = useState<'illness' | 'skill' | 'aid-type' | 'income-category' | 'expense-category' | 'partner' | 'education-level'>('illness')
  const [selectedItem, setSelectedItem] = useState<ReferenceItem | undefined>()
  
  // Reorder dialog state
  const [reorderDialogOpen, setReorderDialogOpen] = useState(false)
  
  const { toast } = useToast()

  // Load reference data on mount
  useEffect(() => {
    loadReferenceData()
  }, [])

  const loadReferenceData = async () => {
    try {
      setLoading(true)
      
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1'
      
      // Load all reference data from individual APIs
      const responses = await Promise.allSettled([
        fetch(`${baseUrl}/references/skills`).then(res => res.ok ? res.json() : { data: [] }),
        fetch(`${baseUrl}/references/illnesses`).then(res => res.ok ? res.json() : { data: [] }),
        fetch(`${baseUrl}/references/aid-types`).then(res => res.ok ? res.json() : { data: [] }),
        fetch(`${baseUrl}/references/income-categories`).then(res => res.ok ? res.json() : { data: [] }),
        fetch(`${baseUrl}/references/expense-categories`).then(res => res.ok ? res.json() : { data: [] }),
        fetch(`${baseUrl}/references/partners`).then(res => res.ok ? res.json() : { data: [] }),
        fetch(`${baseUrl}/references/education-levels`).then(res => res.ok ? res.json() : { data: [] })
      ])

      const [
        skillsResponse, 
        illnessesResponse, 
        aidTypesResponse, 
        incomeCategoriesResponse, 
        expenseCategoriesResponse, 
        partnersResponse, 
        educationResponse
      ] = responses

      if (skillsResponse.status === 'fulfilled') {
        setSkills(skillsResponse.value.data || [])
      }
      if (illnessesResponse.status === 'fulfilled') {
        setIllnesses(illnessesResponse.value.data || [])
      }
      if (aidTypesResponse.status === 'fulfilled') {
        setAidTypes(aidTypesResponse.value.data || [])
      }
      if (incomeCategoriesResponse.status === 'fulfilled') {
        setIncomeCategories(incomeCategoriesResponse.value.data || [])
      }
      if (expenseCategoriesResponse.status === 'fulfilled') {
        setExpenseCategories(expenseCategoriesResponse.value.data || [])
      }
      if (partnersResponse.status === 'fulfilled') {
        setPartners(partnersResponse.value.data || [])
      }
      if (educationResponse.status === 'fulfilled') {
        setEducationLevels(educationResponse.value.data || [])
      }
    } catch (error) {
      console.error('Error loading reference data:', error)
      toast({
        title: "خطأ",
        description: "حدث خطأ في تحميل البيانات المرجعية",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAddItem = (type: typeof dialogType) => {
    setDialogType(type)
    setSelectedItem(undefined)
    setDialogOpen(true)
  }

  const handleEditItem = (type: typeof dialogType, item: ReferenceItem) => {
    setDialogType(type)
    setSelectedItem(item)
    setDialogOpen(true)
  }

  const handleDialogSuccess = () => {
    loadReferenceData() // Reload data after successful add/edit
  }

  const handleDeleteItem = async (type: typeof dialogType, item: ReferenceItem) => {
    if (!confirm(`هل أنت متأكد من حذف هذا العنصر؟ سيتم حذف جميع البيانات المرتبطة به.`)) {
      return
    }

    try {
      const apiUrls = {
        'illness': 'references/illnesses',
        'skill': 'references/skills',
        'aid-type': 'references/aid-types',
        'income-category': 'references/income-categories',
        'expense-category': 'references/expense-categories',
        'partner': 'references/partners',
        'education-level': 'references/education-levels'
      }
      
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1'
      const url = `${baseUrl}/${apiUrls[type]}/${item.id}`
      
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `HTTP ${response.status}`)
      }

      const result = await response.json()
      
      toast({
        title: "تم الحذف بنجاح",
        description: result.message || "تم حذف العنصر بنجاح",
      })
      
      loadReferenceData() // Reload data after successful delete
    } catch (error) {
      console.error('Error deleting reference item:', error)
      toast({
        title: "خطأ",
        description: error instanceof Error ? error.message : "حدث خطأ أثناء حذف العنصر",
        variant: "destructive",
      })
    }
  }

  const ReferenceDataTable = ({ 
    data, 
    title, 
    icon: Icon, 
    keyField = "label", 
    showActive = false,
    showChronic = false,
    type
  }: {
    data: ReferenceItem[]
    title: string
    icon: any
    keyField?: string
    showActive?: boolean
    showChronic?: boolean
    type: typeof dialogType
  }) => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className="h-5 w-5" />
            {title}
          </div>
          <div className="flex items-center gap-2">
            {type === 'education-level' && (
              <Button size="sm" variant="outline" onClick={() => setReorderDialogOpen(true)}>
                <ArrowUpDown className="h-4 w-4 ml-2" />
                إعادة ترتيب
              </Button>
            )}
            <Button size="sm" onClick={() => handleAddItem(type)}>
              <Plus className="h-4 w-4 ml-2" />
              إضافة جديد
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-4">جاري التحميل...</div>
        ) : data.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            لا توجد بيانات مضافة بعد
          </div>
        ) : (
          <div className="space-y-2">
            {data.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="font-medium">
                    {item[keyField as keyof ReferenceItem] || item.name_ar || item.name}
                  </span>
                  <div className="flex gap-2">
                    {showActive && (
                      <Badge variant={item.is_active ? "default" : "secondary"}>
                        {item.is_active ? "نشط" : "غير نشط"}
                      </Badge>
                    )}
                    {showChronic && item.is_chronic && (
                      <Badge variant="destructive">
                        مزمن
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => handleEditItem(type, item)}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => handleDeleteItem(type, item)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <Database className="h-8 w-8" />
          البيانات المرجعية
        </h1>
        <p className="text-gray-600 mt-2">إدارة البيانات الأساسية للنظام</p>
      </div>

      <Tabs defaultValue="illnesses" className="space-y-6">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="illnesses" className="flex items-center gap-2">
            <Heart className="h-4 w-4" />
            الأمراض
          </TabsTrigger>
          <TabsTrigger value="skills" className="flex items-center gap-2">
            <Star className="h-4 w-4" />
            المهارات
          </TabsTrigger>
          <TabsTrigger value="aid-types" className="flex items-center gap-2">
            <HandHeart className="h-4 w-4" />
            أنواع المساعدات
          </TabsTrigger>
          <TabsTrigger value="income" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            فئات الدخل
          </TabsTrigger>
          <TabsTrigger value="expense" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            فئات المصروف
          </TabsTrigger>
          <TabsTrigger value="partners" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            الشركاء
          </TabsTrigger>
          <TabsTrigger value="education" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            التعليم
          </TabsTrigger>
        </TabsList>

        <TabsContent value="illnesses">
          <ReferenceDataTable
            data={illnesses}
            title="الأمراض"
            icon={Heart}
            keyField="label"
            showChronic
            type="illness"
          />
        </TabsContent>

        <TabsContent value="skills">
          <ReferenceDataTable
            data={skills}
            title="المهارات"
            icon={Star}
            keyField="label"
            type="skill"
          />
        </TabsContent>

        <TabsContent value="aid-types">
          <ReferenceDataTable
            data={aidTypes}
            title="أنواع المساعدات"
            icon={HandHeart}
            keyField="label"
            type="aid-type"
          />
        </TabsContent>

        <TabsContent value="income">
          <ReferenceDataTable
            data={incomeCategories}
            title="فئات الدخل للأرامل"
            icon={DollarSign}
            keyField="name"
            type="income-category"
          />
        </TabsContent>

        <TabsContent value="expense">
          <ReferenceDataTable
            data={expenseCategories}
            title="فئات المصروف للأرامل"
            icon={DollarSign}
            keyField="name"
            type="expense-category"
          />
        </TabsContent>

        <TabsContent value="partners">
          <ReferenceDataTable
            data={partners}
            title="الشركاء"
            icon={Building}
            keyField="name"
            type="partner"
          />
        </TabsContent>

        <TabsContent value="education">
          <ReferenceDataTable
            data={educationLevels}
            title="المراحل التعليمية"
            icon={Users}
            keyField="name_ar"
            showActive
            type="education-level"
          />
        </TabsContent>
      </Tabs>

      <ReferenceItemDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        type={dialogType}
        item={selectedItem}
        onSuccess={handleDialogSuccess}
      />

      <EducationLevelReorder
        open={reorderDialogOpen}
        onOpenChange={setReorderDialogOpen}
        educationLevels={educationLevels}
        onReorderSuccess={loadReferenceData}
      />
    </div>
  )
}