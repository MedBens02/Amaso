"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  Calculator,
  Plus,
  Edit2,
  Trash2,
  Database,
  TrendingUp,
  TrendingDown,
  Search,
  ChevronDown,
  ChevronRight,
  Lock,
  Star,
  HandCoins,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { AccountingReferenceDialog } from "@/components/accounting/accounting-reference-dialog"
import { isCurrentUserAdmin } from "@/lib/roles"
import api from "@/lib/api"

interface Budget {
  id: number
  label: string
  is_default?: boolean
  created_at?: string
  updated_at?: string
}

interface Category {
  id: number
  label: string
  parent_id?: number | null
  parent?: { id: number; label: string } | null
  created_at?: string
  updated_at?: string
}

type IncomeCategory = Category
type ExpenseCategory = Category

interface KafalaChamilaSplit {
  id: number
  key: string
  label: string
  percentage: string | number
  budget_id: number
  income_category_id: number
  budget?: Budget
  income_category?: IncomeCategory
}

interface KafalaChamilaBalance {
  id: number
  key: string
  label: string
  percentage: string | number
  budget?: Budget
  income_category?: IncomeCategory
  total_income: number
  total_expense: number
  remaining: number
}

interface CategoryBranch {
  root: Category
  children: Category[]
}

/** Roots first, each with the children that nest under it. */
function buildTree(categories: Category[]): CategoryBranch[] {
  const present = new Set(categories.map((c) => c.id))
  const parentOf = (c: Category) => c.parent_id ?? c.parent?.id ?? null

  const roots = categories.filter((c) => {
    const parentId = parentOf(c)
    return parentId === null || !present.has(parentId)
  })

  return roots
    .sort((a, b) => a.label.localeCompare(b.label, "ar"))
    .map((root) => ({
      root,
      children: categories
        .filter((c) => parentOf(c) === root.id)
        .sort((a, b) => a.label.localeCompare(b.label, "ar")),
    }))
}

export default function AccountingReferencesPage() {
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [incomeCategories, setIncomeCategories] = useState<IncomeCategory[]>([])
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>([])
  const [loading, setLoading] = useState(true)

  // Kafala chamila split percentages - a fixed 7-part structure whose
  // budgets/categories are locked against edit/delete everywhere else.
  const [kafalaChamilaSplits, setKafalaChamilaSplits] = useState<KafalaChamilaSplit[]>([])
  const [kafalaChamilaDraft, setKafalaChamilaDraft] = useState<Record<number, string>>({})
  const [savingSplits, setSavingSplits] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [kafalaChamilaBalances, setKafalaChamilaBalances] = useState<KafalaChamilaBalance[]>([])
  const [loadingBalances, setLoadingBalances] = useState(true)

  const lockedBudgetIds = useMemo(
    () => new Set(kafalaChamilaSplits.map((s) => s.budget_id)),
    [kafalaChamilaSplits],
  )
  const lockedIncomeCategoryIds = useMemo(
    () => new Set(kafalaChamilaSplits.map((s) => s.income_category_id)),
    [kafalaChamilaSplits],
  )

  // Search state
  const [incomeCategorySearch, setIncomeCategorySearch] = useState("")
  const [expenseCategorySearch, setExpenseCategorySearch] = useState("")

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogType, setDialogType] = useState<'budget' | 'income-category' | 'expense-category'>('budget')
  const [selectedItem, setSelectedItem] = useState<any>()

  const { toast } = useToast()

  // Filtered and grouped data
  const filteredIncomeCategories = useMemo(() => {
    return incomeCategories.filter(category =>
      category.label.toLowerCase().includes(incomeCategorySearch.toLowerCase())
    )
  }, [incomeCategories, incomeCategorySearch])

  const filteredExpenseCategories = useMemo(() => {
    return expenseCategories.filter(category =>
      category.label.toLowerCase().includes(expenseCategorySearch.toLowerCase())
    )
  }, [expenseCategories, expenseCategorySearch])

  // Categories no longer belong to a budget - they nest under each other, so
  // the list is a one-level-deep tree of roots and their children. Anything
  // whose parent was filtered out by the search is shown as its own root so
  // it never silently disappears.
  const incomeCategoryTree = useMemo(
    () => buildTree(filteredIncomeCategories),
    [filteredIncomeCategories],
  )

  const expenseCategoryTree = useMemo(
    () => buildTree(filteredExpenseCategories),
    [filteredExpenseCategories],
  )

  // Load reference data on mount
  useEffect(() => {
    loadReferenceData()
    loadKafalaChamilaSplits()
    loadKafalaChamilaBalances()
    setIsAdmin(isCurrentUserAdmin())
  }, [])

  const loadKafalaChamilaSplits = async () => {
    try {
      const res = await api.getKafalaChamilaSplits()
      const splits: KafalaChamilaSplit[] = res.data || []
      setKafalaChamilaSplits(splits)
      setKafalaChamilaDraft(Object.fromEntries(splits.map((s) => [s.id, String(s.percentage)])))
    } catch (error) {
      console.error('Error loading kafala chamila splits:', error)
    }
  }

  const loadKafalaChamilaBalances = async () => {
    setLoadingBalances(true)
    try {
      const res = await api.getKafalaChamilaBalances()
      setKafalaChamilaBalances(res.data || [])
    } catch (error) {
      console.error('Error loading kafala chamila balances:', error)
    } finally {
      setLoadingBalances(false)
    }
  }

  const kafalaChamilaDraftSum = useMemo(
    () => Object.values(kafalaChamilaDraft).reduce((sum, v) => sum + (parseFloat(v) || 0), 0),
    [kafalaChamilaDraft],
  )

  const handleSaveKafalaChamilaSplits = async () => {
    if (Math.abs(kafalaChamilaDraftSum - 100) > 0.01) {
      toast({
        title: "خطأ",
        description: `مجموع النسب يجب أن يساوي 100%. المجموع الحالي: ${kafalaChamilaDraftSum}%`,
        variant: "destructive",
      })
      return
    }

    setSavingSplits(true)
    try {
      const payload = kafalaChamilaSplits.map((s) => ({
        id: s.id,
        percentage: parseFloat(kafalaChamilaDraft[s.id]) || 0,
      }))
      const res = await api.updateKafalaChamilaSplits(payload)
      toast({
        title: "تم الحفظ بنجاح",
        description: res.message || "تم تحديث نسب توزيع الكفالة الشاملة",
      })
      await loadKafalaChamilaSplits()
    } catch (error) {
      toast({
        title: "خطأ",
        description: error instanceof Error ? error.message : "حدث خطأ أثناء حفظ النسب",
        variant: "destructive",
      })
    } finally {
      setSavingSplits(false)
    }
  }

  const loadReferenceData = async () => {
    try {
      setLoading(true)
      
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1'
      
      // Load all accounting reference data from APIs
      const responses = await Promise.allSettled([
        fetch(`${baseUrl}/budgets`).then(res => res.ok ? res.json() : { data: [] }),
        fetch(`${baseUrl}/income-categories`).then(res => res.ok ? res.json() : { data: [] }),
        fetch(`${baseUrl}/expense-categories`).then(res => res.ok ? res.json() : { data: [] })
      ])

      const [
        budgetsResponse, 
        incomeCategoriesResponse, 
        expenseCategoriesResponse
      ] = responses

      if (budgetsResponse.status === 'fulfilled') {
        setBudgets(budgetsResponse.value.data || [])
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

  const handleAddItem = (type: 'budget' | 'income-category' | 'expense-category') => {
    setSelectedItem(undefined)
    setDialogType(type)
    setDialogOpen(true)
  }

  const handleEditItem = (type: 'budget' | 'income-category' | 'expense-category', item: any) => {
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

  const handleSetDefaultBudget = async (budget: Budget) => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1'
      const response = await fetch(`${baseUrl}/references/budgets/${budget.id}/default`, {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
      })
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'تعذر تعيين الميزانية الافتراضية')
      }

      toast({ title: "تم", description: result.message })
      loadReferenceData()
    } catch (error) {
      toast({
        title: "خطأ",
        description: error instanceof Error ? error.message : "تعذر تعيين الميزانية الافتراضية",
        variant: "destructive",
      })
    }
  }

  const handleDeleteItem = async (type: 'budget' | 'income-category' | 'expense-category', id: number) => {
    try {
      const apiUrls = {
        'budget': 'references/budgets',
        'income-category': 'references/income-categories',
        'expense-category': 'references/expense-categories'
      }
      
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1'

      // First check if there are related records for accounting categories
      let confirmMessage = `هل أنت متأكد من حذف هذا العنصر؟`
      
      if (type === 'income-category' || type === 'expense-category') {
        try {
          const countUrl = `${baseUrl}/${apiUrls[type]}/${id}/related-count`
          const countResponse = await fetch(countUrl, {
            headers: { 'Accept': 'application/json' }
          })
          
          if (countResponse.ok) {
            const countData = await countResponse.json()
            const relatedCount = type === 'income-category' 
              ? countData.data.related_incomes_count 
              : countData.data.related_expenses_count
            
            if (relatedCount > 0) {
              const itemType = type === 'income-category' ? 'إيراد' : 'مصروف'
              confirmMessage = `هذه الفئة مرتبطة بـ ${relatedCount} ${itemType}. إذا تم حذفها، ستتم إعادة تعيين جميع العناصر المرتبطة إلى الفئة الافتراضية.\n\nهل تريد المتابعة؟`
            }
          }
        } catch (countError) {
          console.warn('Could not fetch related count:', countError)
        }
      }

      if (!confirm(confirmMessage)) {
        return
      }
      
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

  const CategoryTree = ({
    branches,
    accent,
    isLocked,
    onEdit,
    onDelete,
  }: {
    branches: CategoryBranch[]
    accent: 'green' | 'red'
    isLocked: (category: Category) => boolean
    onEdit: (category: Category) => void
    onDelete: (category: Category) => void
  }) => {
    const badgeClass =
      accent === 'green'
        ? 'bg-green-50 text-green-700 border-green-200'
        : 'bg-red-50 text-red-700 border-red-200'

    const actions = (category: Category) =>
      isLocked(category) ? (
        <Badge variant="outline" className="gap-1 text-amber-700 border-amber-300 bg-amber-50">
          <Lock className="h-3 w-3" />
          كفالة شاملة (ثابت)
        </Badge>
      ) : (
        <>
          <Button variant="ghost" size="sm" onClick={() => onEdit(category)}>
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-red-600 hover:text-red-700"
            onClick={() => onDelete(category)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </>
      )

    return (
      <div className="space-y-3">
        {branches.map(({ root, children }) => (
          <Collapsible key={root.id} defaultOpen>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                {children.length > 0 ? (
                  <CollapsibleTrigger className="flex items-center gap-2 hover:opacity-70 transition-opacity">
                    <ChevronDown className="h-4 w-4" />
                    <span className="font-semibold text-gray-700">{root.label}</span>
                    <Badge variant="outline" className={badgeClass}>
                      {children.length} فئة فرعية
                    </Badge>
                  </CollapsibleTrigger>
                ) : (
                  <span className="font-semibold text-gray-700 pr-6">{root.label}</span>
                )}
              </div>
              <div className="flex items-center gap-2">{actions(root)}</div>
            </div>
            <CollapsibleContent className="mt-2 space-y-2">
              {children.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center justify-between p-3 border rounded-lg mr-6 bg-white"
                >
                  <span className="font-medium">{category.label}</span>
                  <div className="flex items-center gap-2">{actions(category)}</div>
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>
        ))}
      </div>
    )
  }

  const BudgetsTable = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            الميزانيات
          </div>
          <Button size="sm" onClick={() => handleAddItem('budget')}>
            <Plus className="h-4 w-4 ml-2" />
            إضافة ميزانية
          </Button>
        </CardTitle>
        <p className="text-sm text-gray-500">
          الميزانية هي الوعاء الذي يُخصم منه المصروف ويُضاف إليه الإيراد. الفئات تصنّف العملية فقط ولا ترتبط بميزانية بعينها.
        </p>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-4">جاري التحميل...</div>
        ) : budgets.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            لا توجد ميزانيات مضافة بعد
          </div>
        ) : (
          <div className="space-y-2">
            {budgets.map((budget) => {
              const locked = lockedBudgetIds.has(budget.id)
              return (
              <div key={budget.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="font-medium">{budget.label}</span>
                  {budget.is_default && (
                    <Badge variant="outline" className="gap-1 text-blue-700 border-blue-300 bg-blue-50">
                      <Star className="h-3 w-3" />
                      افتراضية
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {locked ? (
                    <Badge variant="outline" className="gap-1 text-amber-700 border-amber-300 bg-amber-50">
                      <Lock className="h-3 w-3" />
                      كفالة شاملة (ثابت)
                    </Badge>
                  ) : (
                    <>
                      {!budget.is_default && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-blue-600 hover:text-blue-700"
                          onClick={() => handleSetDefaultBudget(budget)}
                          title="تعيين كميزانية افتراضية"
                        >
                          <Star className="h-4 w-4" />
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => handleEditItem('budget', budget)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleDeleteItem('budget', budget.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
              )
            })}
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
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="البحث في فئات الإيرادات..."
              value={incomeCategorySearch}
              onChange={(e) => setIncomeCategorySearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        {loading ? (
          <div className="text-center py-4">جاري التحميل...</div>
        ) : incomeCategoryTree.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {incomeCategorySearch ? "لم يتم العثور على فئات إيرادات تطابق البحث" : "لا توجد فئات إيرادات مضافة بعد"}
          </div>
        ) : (
          <CategoryTree
            branches={incomeCategoryTree}
            accent="green"
            isLocked={(category) => lockedIncomeCategoryIds.has(category.id)}
            onEdit={(category) => handleEditItem('income-category', category)}
            onDelete={(category) => handleDeleteItem('income-category', category.id)}
          />
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
          <Button size="sm" onClick={() => handleAddItem('expense-category')}>
            <Plus className="h-4 w-4 ml-2" />
            إضافة فئة مصروف
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="البحث في فئات المصروفات..."
              value={expenseCategorySearch}
              onChange={(e) => setExpenseCategorySearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        {loading ? (
          <div className="text-center py-4">جاري التحميل...</div>
        ) : expenseCategoryTree.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {expenseCategorySearch ? "لم يتم العثور على فئات مصروفات تطابق البحث" : "لا توجد فئات مصروفات مضافة بعد"}
          </div>
        ) : (
          <CategoryTree
            branches={expenseCategoryTree}
            accent="red"
            isLocked={() => false}
            onEdit={(category) => handleEditItem('expense-category', category)}
            onDelete={(category) => handleDeleteItem('expense-category', category.id)}
          />
        )}
      </CardContent>
    </Card>
  )

  const money = (value: number) =>
    `${Number(value || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} د.م`

  const kafalaChamilaTotals = useMemo(
    () => ({
      income: kafalaChamilaBalances.reduce((sum, b) => sum + b.total_income, 0),
      expense: kafalaChamilaBalances.reduce((sum, b) => sum + b.total_expense, 0),
      remaining: kafalaChamilaBalances.reduce((sum, b) => sum + b.remaining, 0),
    }),
    [kafalaChamilaBalances],
  )

  const KafalaChamilaBalancesCard = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HandCoins className="h-5 w-5 text-teal-600" />
            الأرصدة الحالية لبنود الكفالة الشاملة
          </div>
          <Button size="sm" variant="outline" onClick={loadKafalaChamilaBalances} disabled={loadingBalances}>
            {loadingBalances ? "جاري التحديث..." : "تحديث"}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 mb-4">
          كل بند رصيد واحد مشترك بين جميع الكفلاء (ليس رصيداً خاصاً بكفيل أو بأسرة معينة): مجموع الإيرادات المعتمدة
          الموجهة إلى ميزانيته ناقص مجموع المصروفات المعتمدة منها. عند تسجيل كفالة شاملة، المبلغ يُوزَّع على
          هذه الميزانيات المشتركة نفسها بغض النظر عن الأسرة أو الكفيل.
        </p>

        {loadingBalances ? (
          <div className="text-center py-4">جاري التحميل...</div>
        ) : kafalaChamilaBalances.length === 0 ? (
          <div className="text-center py-8 text-gray-500">تعذر تحميل أرصدة الكفالة الشاملة</div>
        ) : (
          <div className="space-y-2">
            {kafalaChamilaBalances.map((balance) => (
              <div key={balance.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <span className="font-medium">{balance.label}</span>
                  <span className="text-xs text-gray-500 block">
                    {balance.budget?.label} ← {balance.income_category?.label}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="text-left">
                    <p className="text-xs text-gray-500">إيرادات</p>
                    <p className="font-semibold text-green-600">{money(balance.total_income)}</p>
                  </div>
                  <div className="text-left">
                    <p className="text-xs text-gray-500">مصروفات</p>
                    <p className="font-semibold text-red-600">{money(balance.total_expense)}</p>
                  </div>
                  <div className="text-left min-w-[110px]">
                    <p className="text-xs text-gray-500">الرصيد المتبقي</p>
                    <p className={`font-bold ${balance.remaining < 0 ? "text-red-600" : "text-blue-600"}`}>
                      {money(balance.remaining)}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            <div className="flex items-center justify-end gap-4 pt-3 border-t text-sm">
              <div className="text-left">
                <p className="text-xs text-gray-500">إجمالي الإيرادات</p>
                <p className="font-semibold text-green-600">{money(kafalaChamilaTotals.income)}</p>
              </div>
              <div className="text-left">
                <p className="text-xs text-gray-500">إجمالي المصروفات</p>
                <p className="font-semibold text-red-600">{money(kafalaChamilaTotals.expense)}</p>
              </div>
              <div className="text-left min-w-[110px]">
                <p className="text-xs text-gray-500">إجمالي الرصيد</p>
                <p className="font-bold text-blue-600">{money(kafalaChamilaTotals.remaining)}</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )

  const KafalaChamilaSplitsTable = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HandCoins className="h-5 w-5 text-blue-600" />
            توزيع الكفالة الشاملة
          </div>
          {isAdmin && (
            <Button size="sm" onClick={handleSaveKafalaChamilaSplits} disabled={savingSplits}>
              {savingSplits ? "جاري الحفظ..." : "حفظ النسب"}
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 mb-4">
          كفالة شاملة (800 د.م افتراضياً) تُقسّم دائماً على هذه البنود السبعة الثابتة، وكل بند مرتبط بميزانية وفئة إيراد مقفلتين لا يمكن حذفهما أو تعديلهما.
          {isAdmin ? " يمكنك تعديل النسب أدناه بشرط أن يبقى مجموعها 100%." : " تعديل النسب مقتصر على المديرين."}
        </p>

        {loading ? (
          <div className="text-center py-4">جاري التحميل...</div>
        ) : kafalaChamilaSplits.length === 0 ? (
          <div className="text-center py-8 text-gray-500">تعذر تحميل بنود توزيع الكفالة الشاملة</div>
        ) : (
          <div className="space-y-2">
            {kafalaChamilaSplits.map((split) => (
              <div key={split.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <span className="font-medium">{split.label}</span>
                  <span className="text-xs text-gray-500 block">
                    {split.budget?.label} ← {split.income_category?.label}
                  </span>
                </div>
                {isAdmin ? (
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={kafalaChamilaDraft[split.id] ?? ""}
                      onChange={(e) =>
                        setKafalaChamilaDraft((prev) => ({ ...prev, [split.id]: e.target.value }))
                      }
                      className="w-24 text-left"
                    />
                    <span className="text-sm text-gray-500">%</span>
                  </div>
                ) : (
                  <Badge variant="outline">{parseFloat(String(split.percentage))}%</Badge>
                )}
              </div>
            ))}

            <div className="flex items-center justify-between pt-3 border-t">
              <span className="font-semibold">المجموع:</span>
              <span className={`font-bold ${Math.abs(kafalaChamilaDraftSum - 100) > 0.01 ? "text-red-600" : "text-green-600"}`}>
                {kafalaChamilaDraftSum.toFixed(2)}%
              </span>
            </div>
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
        <p className="text-gray-600 mt-2">إدارة الميزانيات وفئات الإيرادات والمصروفات</p>
      </div>

      <Tabs defaultValue="budgets" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="budgets" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            الميزانيات
          </TabsTrigger>
          <TabsTrigger value="income-categories" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            فئات الإيرادات
          </TabsTrigger>
          <TabsTrigger value="expense-categories" className="flex items-center gap-2">
            <TrendingDown className="h-4 w-4" />
            فئات المصروفات
          </TabsTrigger>
          <TabsTrigger value="kafala-chamila" className="flex items-center gap-2">
            <HandCoins className="h-4 w-4" />
            الكفالة الشاملة
          </TabsTrigger>
        </TabsList>

        <TabsContent value="budgets">
          <BudgetsTable />
        </TabsContent>

        <TabsContent value="income-categories">
          <IncomeCategoriesTable />
        </TabsContent>

        <TabsContent value="expense-categories">
          <ExpenseCategoriesTable />
        </TabsContent>

        <TabsContent value="kafala-chamila" className="space-y-6">
          <KafalaChamilaBalancesCard />
          <KafalaChamilaSplitsTable />
        </TabsContent>
      </Tabs>

      <AccountingReferenceDialog
        open={dialogOpen}
        onOpenChange={handleDialogOpenChange}
        type={dialogType}
        item={selectedItem}
        onSuccess={handleDialogSuccess}
      />
    </div>
  )
}