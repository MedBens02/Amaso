"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { 
  Calculator, 
  Plus, 
  Edit2, 
  Trash2, 
  Database,
  TrendingUp,
  TrendingDown
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { AccountingReferenceDialog } from "@/components/accounting/accounting-reference-dialog"

interface SubBudget {
  id: number
  label: string
  created_at?: string
  updated_at?: string
}

interface IncomeCategory {
  id: number
  sub_budget_id: number
  label: string
  subBudget?: SubBudget
  created_at?: string
  updated_at?: string
}

interface ExpenseCategory {
  id: number
  sub_budget_id: number
  label: string
  subBudget?: SubBudget
  created_at?: string
  updated_at?: string
}

export default function AccountingReferencesPage() {
  const [subBudgets, setSubBudgets] = useState<SubBudget[]>([])
  const [incomeCategories, setIncomeCategories] = useState<IncomeCategory[]>([])
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>([])
  const [loading, setLoading] = useState(true)
  
  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogType, setDialogType] = useState<'sub-budget' | 'income-category' | 'expense-category'>('sub-budget')
  const [selectedItem, setSelectedItem] = useState<any>()
  
  const { toast } = useToast()

  // Load reference data on mount
  useEffect(() => {
    loadReferenceData()
  }, [])

  const loadReferenceData = async () => {
    try {
      setLoading(true)
      
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1'
      
      // Load all accounting reference data from APIs
      const responses = await Promise.allSettled([
        fetch(`${baseUrl}/sub-budgets`).then(res => res.ok ? res.json() : { data: [] }),
        fetch(`${baseUrl}/income-categories`).then(res => res.ok ? res.json() : { data: [] }),
        fetch(`${baseUrl}/expense-categories`).then(res => res.ok ? res.json() : { data: [] })
      ])

      const [
        subBudgetsResponse, 
        incomeCategoriesResponse, 
        expenseCategoriesResponse
      ] = responses

      if (subBudgetsResponse.status === 'fulfilled') {
        setSubBudgets(subBudgetsResponse.value.data || [])
      }
      if (incomeCategoriesResponse.status === 'fulfilled') {
        setIncomeCategories(incomeCategoriesResponse.value.data || [])
      }
      if (expenseCategoriesResponse.status === 'fulfilled') {
        setExpenseCategories(expenseCategoriesResponse.value.data || [])
      }
    } catch (error) {
      console.error('Error loading accounting reference data:', error)
      toast({
        title: "خطأ",
        description: "حدث خطأ في تحميل البيانات المحاسبية المرجعية",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAddItem = (type: 'sub-budget' | 'income-category' | 'expense-category') => {
    setSelectedItem(undefined)
    setDialogType(type)
    setDialogOpen(true)
  }

  const handleEditItem = (type: 'sub-budget' | 'income-category' | 'expense-category', item: any) => {
    setDialogType(type)
    setSelectedItem(item)
    setDialogOpen(true)
  }

  const handleDialogSuccess = () => {
    loadReferenceData()
  }

  const handleDialogOpenChange = (open: boolean) => {
    setDialogOpen(open)
    if (!open) {
      setSelectedItem(undefined)
    }
  }

  const handleDeleteItem = async (type: 'sub-budget' | 'income-category' | 'expense-category', id: number) => {
    if (!confirm(`هل أنت متأكد من حذف هذا العنصر؟ سيتم حذف جميع البيانات المرتبطة به.`)) {
      return
    }

    try {
      const apiUrls = {
        'sub-budget': 'references/sub-budgets',
        'income-category': 'references/income-categories',
        'expense-category': 'references/expense-categories'
      }
      
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1'
      const url = `${baseUrl}/${apiUrls[type]}/${id}`
      
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
      console.error('Error deleting accounting reference item:', error)
      toast({
        title: "خطأ",
        description: error instanceof Error ? error.message : "حدث خطأ أثناء حذف العنصر",
        variant: "destructive",
      })
    }
  }

  const SubBudgetsTable = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            الميزانيات الفرعية
          </div>
          <Button size="sm" onClick={() => handleAddItem('sub-budget')}>
            <Plus className="h-4 w-4 ml-2" />
            إضافة ميزانية فرعية
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-4">جاري التحميل...</div>
        ) : subBudgets.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            لا توجد ميزانيات فرعية مضافة بعد
          </div>
        ) : (
          <div className="space-y-2">
            {subBudgets.map((subBudget) => (
              <div key={subBudget.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="font-medium">{subBudget.label}</span>
                  <div className="flex gap-2">
                    <Badge variant="outline">
                      الإيرادات: {incomeCategories.filter(cat => cat.sub_budget_id === subBudget.id).length}
                    </Badge>
                    <Badge variant="outline">
                      المصروفات: {expenseCategories.filter(cat => cat.sub_budget_id === subBudget.id).length}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => handleEditItem('sub-budget', subBudget)}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-red-600 hover:text-red-700" 
                    onClick={() => handleDeleteItem('sub-budget', subBudget.id)}
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
  )

  const IncomeCategoriesTable = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            فئات الإيرادات
          </div>
          <Button size="sm" onClick={() => handleAddItem('income-category')}>
            <Plus className="h-4 w-4 ml-2" />
            إضافة فئة إيراد
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-4">جاري التحميل...</div>
        ) : incomeCategories.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            لا توجد فئات إيرادات مضافة بعد
          </div>
        ) : (
          <div className="space-y-2">
            {incomeCategories.map((category) => (
              <div key={category.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="font-medium">{category.label}</span>
                  {category.subBudget && (
                    <Badge variant="secondary">
                      {category.subBudget.label}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm">
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-red-600 hover:text-red-700" 
                    onClick={() => handleDeleteItem('income-category', category.id)}
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
  )

  const ExpenseCategoriesTable = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-red-600" />
            فئات المصروفات
          </div>
          <Button size="sm">
            <Plus className="h-4 w-4 ml-2" />
            إضافة فئة مصروف
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-4">جاري التحميل...</div>
        ) : expenseCategories.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            لا توجد فئات مصروفات مضافة بعد
          </div>
        ) : (
          <div className="space-y-2">
            {expenseCategories.map((category) => (
              <div key={category.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="font-medium">{category.label}</span>
                  {category.subBudget && (
                    <Badge variant="secondary">
                      {category.subBudget.label}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm">
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-red-600 hover:text-red-700" 
                    onClick={() => handleDeleteItem('expense-category', category.id)}
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
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <Calculator className="h-8 w-8" />
          المراجع المحاسبية
        </h1>
        <p className="text-gray-600 mt-2">إدارة الميزانيات الفرعية وفئات الإيرادات والمصروفات</p>
      </div>

      <Tabs defaultValue="sub-budgets" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="sub-budgets" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            الميزانيات الفرعية
          </TabsTrigger>
          <TabsTrigger value="income-categories" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            فئات الإيرادات
          </TabsTrigger>
          <TabsTrigger value="expense-categories" className="flex items-center gap-2">
            <TrendingDown className="h-4 w-4" />
            فئات المصروفات
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sub-budgets">
          <SubBudgetsTable />
        </TabsContent>

        <TabsContent value="income-categories">
          <IncomeCategoriesTable />
        </TabsContent>

        <TabsContent value="expense-categories">
          <ExpenseCategoriesTable />
        </TabsContent>
      </Tabs>
    </div>
  )
}