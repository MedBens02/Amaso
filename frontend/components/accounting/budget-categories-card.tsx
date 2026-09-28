"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Save, Search, Layers } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import api from "@/lib/api"

interface Category {
  id: number
  label: string
}

/**
 * Which categories each fund offers.
 *
 * Choosing a budget on the income or expense form narrows the category list
 * to this, which is the hierarchy the association works in: a fund, and the
 * things it pays for. A fund with nothing ticked offers every category
 * instead of none - a fund somebody has just created has to stay usable, and
 * a screen offering no choices reads as broken rather than strict.
 *
 * A category can be ticked under several funds and is still one category, so
 * a report totalling it sees one row rather than one per fund.
 */
export function BudgetCategoriesCard() {
  const [budgets, setBudgets] = useState<any[]>([])
  const [incomeCategories, setIncomeCategories] = useState<Category[]>([])
  const [expenseCategories, setExpenseCategories] = useState<Category[]>([])
  const [links, setLinks] = useState<{ income: Record<string, number[]>; expense: Record<string, number[]> }>({
    income: {},
    expense: {},
  })
  const [budgetId, setBudgetId] = useState<string>("")
  const [income, setIncome] = useState<number[]>([])
  const [expense, setExpense] = useState<number[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const [budgetsRes, incomeRes, expenseRes, linksRes] = await Promise.all([
        api.getBudgets(),
        api.getIncomeCategories(),
        api.getExpenseCategories(),
        api.getBudgetCategories(),
      ])

      setBudgets(budgetsRes.data || [])
      setIncomeCategories((incomeRes.data as any) || [])
      setExpenseCategories((expenseRes.data as any) || [])
      setLinks((linksRes.data as any) || { income: {}, expense: {} })
      setBudgetId((current) => current || String((budgetsRes.data as any)?.[0]?.id ?? ""))
    } catch (error: any) {
      toast({ title: "خطأ", description: error?.message || "تعذر تحميل الفئات", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => { load() }, [load])

  // Switching fund loads that fund's ticks. Anything unsaved is dropped, so
  // the button below says how many are pending before it happens.
  useEffect(() => {
    if (!budgetId) return
    setIncome(links.income[budgetId] ?? [])
    setExpense(links.expense[budgetId] ?? [])
  }, [budgetId, links])

  const budget = budgets.find((item) => String(item.id) === budgetId)
  const matches = (category: Category) =>
    search.trim() === "" || category.label.includes(search.trim())

  const toggle = (list: number[], setList: (next: number[]) => void, id: number) =>
    setList(list.includes(id) ? list.filter((value) => value !== id) : [...list, id])

  const dirty = useMemo(() => {
    const before = { income: links.income[budgetId] ?? [], expense: links.expense[budgetId] ?? [] }
    const same = (a: number[], b: number[]) =>
      a.length === b.length && [...a].sort().every((value, i) => value === [...b].sort()[i])

    return !same(before.income, income) || !same(before.expense, expense)
  }, [links, budgetId, income, expense])

  const save = async () => {
    setSaving(true)
    try {
      const response: any = await api.saveBudgetCategories(Number(budgetId), {
        income_category_ids: income,
        expense_category_ids: expense,
      })
      toast({ title: "تم", description: response.message })
      setLinks((current) => ({
        income: { ...current.income, [budgetId]: income },
        expense: { ...current.expense, [budgetId]: expense },
      }))
    } catch (error: any) {
      toast({ title: "تعذر الحفظ", description: error?.message, variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const column = (
    title: string,
    categories: Category[],
    selected: number[],
    setSelected: (next: number[]) => void,
  ) => {
    const shown = categories.filter(matches)

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-semibold">{title}</Label>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{selected.length} محددة</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={() => setSelected(selected.length === categories.length ? [] : categories.map((c) => c.id))}
            >
              {selected.length === categories.length ? "إلغاء الكل" : "تحديد الكل"}
            </Button>
          </div>
        </div>
        <div className="h-64 space-y-1 overflow-y-auto rounded-lg border p-2">
          {shown.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">لا توجد فئات مطابقة</p>
          ) : (
            shown.map((category) => (
              <label
                key={category.id}
                className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-muted/60"
              >
                <Checkbox
                  checked={selected.includes(category.id)}
                  onCheckedChange={() => toggle(selected, setSelected, category.id)}
                />
                <span>{category.label}</span>
              </label>
            ))
          )}
        </div>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5" />
            فئات كل ميزانية
          </div>
          <Button onClick={save} disabled={saving || !dirty || !budgetId}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <Save className="h-4 w-4 ml-2" />}
            حفظ فئات الميزانية
          </Button>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          عند اختيار ميزانية في نموذج الإيراد أو المصروف، تُعرض فئاتها وحدها. يمكن أن تنتمي الفئة
          الواحدة إلى عدة ميزانيات دون تكرارها، فتبقى فئة واحدة في التقارير.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin ml-2" />
            <span>جاري التحميل...</span>
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>الميزانية</Label>
                <Select value={budgetId} onValueChange={setBudgetId}>
                  <SelectTrigger><SelectValue placeholder="اختر الميزانية" /></SelectTrigger>
                  <SelectContent searchable>
                    {budgets.map((item) => (
                      <SelectItem key={item.id} value={String(item.id)}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>بحث في الفئات</Label>
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="pr-9"
                    placeholder="اسم الفئة..."
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                </div>
              </div>
            </div>

            {income.length === 0 && expense.length === 0 && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-300">
                لم تُحدَّد فئات لـ &quot;{budget?.label}&quot;، لذلك ستظهر جميع الفئات عند اختيارها.
              </div>
            )}

            {budget?.is_idda && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
                <Badge variant="secondary" className="ml-2">عدّة</Badge>
                هذه ميزانية العدّة: عند اختيارها لا تظهر في قائمة المستفيدين إلا الأسر التي ما تزال
                في فترة عدّتها.
              </div>
            )}

            <div className="grid gap-6 lg:grid-cols-2">
              {column("فئات الإيراد", incomeCategories, income, setIncome)}
              {column("فئات المصروف", expenseCategories, expense, setExpense)}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
