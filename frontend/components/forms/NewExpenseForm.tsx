"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useForm, useFieldArray, useWatch, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { api } from "@/lib/api"
import { Plus, Trash2, Users, UsersRound, DollarSign, FileText, CreditCard, Split } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { toDateInputValue, fromDateInputValue } from "@/lib/date-utils"
import { KafalaCoveragePanel } from "@/components/forms/KafalaCoveragePanel"
import { buildCategoryOptions } from "@/lib/categories"
import { SingleSelectRS } from "@/components/common/SingleSelectRS"

// Form validation schema
const expenseSchema = z.object({
  fiscal_year_id: z.number().min(1, "السنة المالية مطلوبة"),
  budget_id: z.number().min(1, "الميزانية مطلوبة"),
  expense_category_id: z.number().min(1, "فئة المصروف مطلوبة"),
  partner_id: z.number().optional(),
  expense_date: z.date({ required_error: "تاريخ المصروف مطلوب" }),
  amount: z.number().min(0.01, "المبلغ يجب أن يكون أكبر من صفر"),
  payment_method: z.enum(["Cash", "Cheque", "BankWire"], { required_error: "طريقة الدفع مطلوبة" }),
  cheque_number: z.string().optional(),
  receipt_number: z.string().optional(),
  bank_account_id: z.number().optional(),
  details: z.string().optional(),
  remarks: z.string().optional(),
  unrelated_to_benef: z.boolean().default(false),
  beneficiaries: z.array(z.object({
    beneficiary_id: z.number(),
    amount: z.number().min(0),
    notes: z.string().optional(),
    // The saved group this person was picked from, if any. Kept on the row
    // so the expense records where its list of people came from.
    group_id: z.number().nullable().optional(),
  })).optional()
}).refine((data) => {
  // Payment method specific validations
  if (data.payment_method === "Cheque" && !data.cheque_number) {
    return false
  }
  if ((data.payment_method === "Cheque" || data.payment_method === "BankWire") && !data.bank_account_id) {
    return false
  }
  return true
}, {
  message: "تأكد من ملء جميع الحقول المطلوبة لطريقة الدفع المختارة"
}).refine((data) => {
  // Beneficiaries validation - only check if not unrelated to beneficiaries
  if (!data.unrelated_to_benef) {
    const hasBeneficiaries = data.beneficiaries && data.beneficiaries.length > 0
    return hasBeneficiaries
  }
  return true
}, {
  message: "يجب اختيار مستفيدين إذا كان المصروف مرتبط بالمستفيدين"
}).refine((data) => {
  // What was handed out has to equal what was spent, otherwise the
  // per-beneficiary figures drift from the financial ones. Mirrors the
  // server rule so the mismatch is caught before submitting.
  if (data.unrelated_to_benef) return true

  const allocated = (data.beneficiaries || []).reduce((sum, b) => sum + (Number(b.amount) || 0), 0)
  return Math.abs(allocated - (Number(data.amount) || 0)) <= 0.01
}, {
  message: "مجموع مبالغ المستفيدين يجب أن يساوي مبلغ المصروف",
  path: ["beneficiaries"],
})

type ExpenseFormData = z.infer<typeof expenseSchema>

// Types
interface Budget {
  id: number
  label: string
  is_default?: boolean
}

interface ExpenseCategory {
  id: number
  label: string
  parent_id?: number | null
  parent?: { id: number; label: string } | null
}

interface Partner {
  id: number
  name: string
}

interface BankAccount {
  id: number
  name: string
  bank_name: string
}

interface Beneficiary {
  id: number
  first_name: string
  last_name: string
  type: 'Widow' | 'Orphan'
  full_name?: string
  orphan?: {
    id: number
    widow_id: number
    birth_date: string
    gender: string
    health_status?: string
    education_level?: {
      name_ar: string
    }
    // Eager-loaded alongside the orphan, so the mother's name is on the
    // record rather than looked up in a separate list.
    widow?: {
      id: number
      full_name?: string
      first_name?: string
      last_name?: string
    }
  }
  widow?: {
    id: number
    full_name: string
    birth_date: string
    disability_flag: boolean
    disability_type?: string
  }
}


interface BeneficiaryGroup {
  id: number
  label: string
  name?: string
  description?: string | null
  members_count?: number
}

interface NewExpenseFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
  initialData?: Partial<ExpenseFormData>
}

export function NewExpenseDialog({ open, onOpenChange, onSuccess, initialData }: NewExpenseFormProps) {
  // Force cleanup function
  const forceCleanup = () => {
    // Close any open popovers
    document.querySelectorAll('[data-radix-popper-content-wrapper]').forEach(element => {
      const popoverElement = element as HTMLElement
      if (popoverElement.style.pointerEvents !== 'none') {
        popoverElement.style.pointerEvents = 'none'
        popoverElement.style.opacity = '0'
        setTimeout(() => {
          popoverElement.style.display = 'none'
        }, 100)
      }
    })
    
    // Remove any backdrop elements
    document.querySelectorAll('[data-radix-portal]').forEach(portal => {
      const portalElement = portal as HTMLElement
      if (portalElement.querySelector('[data-radix-popper-content-wrapper]')) {
        // Only hide if it contains popover content, not the main dialog
        const dialogContent = portalElement.querySelector('[role="dialog"]')
        if (!dialogContent) {
          portalElement.style.display = 'none'
        }
      }
    })
  }
  // Form state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("basic")
  
  // Reference data
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>([])
  const [partners, setPartners] = useState<Partner[]>([])
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([])
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([])
  const [familyByBeneficiary, setFamilyByBeneficiary] = useState<Record<number, { widowId: number; widowName: string }>>({})
  const [activeFiscalYear, setActiveFiscalYear] = useState<any>(null)

  // Everyone currently on the expense, keyed by id. The search results are
  // replaced on every new search, so this is what lets the selected list stay
  // on screen - and be edited - after searching for somebody else, or after
  // pulling in a whole group nobody searched for.
  const [selectedBeneficiaries, setSelectedBeneficiaries] = useState<Record<number, Beneficiary>>({})

  // Beneficiary groups - the saved lists of people who receive the same
  // recurring expense together.
  const [beneficiaryGroups, setBeneficiaryGroups] = useState<BeneficiaryGroup[]>([])
  const [selectedGroupId, setSelectedGroupId] = useState<string>("")
  const [groupLoading, setGroupLoading] = useState(false)

  // Beneficiary search
  const [beneficiarySearchTerm, setBeneficiarySearchTerm] = useState("")
  const [beneficiaryTypeFilter, setBeneficiaryTypeFilter] = useState<'all' | 'Widow' | 'Orphan'>('all')
  const [beneficiarySearchLoading, setBeneficiarySearchLoading] = useState(false)
  
  const { toast } = useToast()
  
  // Custom onOpenChange handler with proper cleanup
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Force cleanup before closing
      forceCleanup()
      setTimeout(() => {
        onOpenChange(newOpen)
      }, 50)
    } else {
      onOpenChange(newOpen)
    }
  }
  
  // Form setup
  const form = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      payment_method: "Cash",
      unrelated_to_benef: false,
      amount: 0,
      beneficiaries: [],
      expense_date: new Date()
    }
  })
  
  const { fields: beneficiaryFields, append: addBeneficiary, remove: removeBeneficiary } = useFieldArray({
    control: form.control,
    name: "beneficiaries"
  })
  
  
  // Watch form values
  const paymentMethod = form.watch("payment_method")
  // useWatch, not form.watch: these are set by reset() once the reference data
  // lands, and only useWatch re-renders the selects reliably when it does.
  const budgetId = useWatch({ control: form.control, name: "budget_id" })
  const expenseCategoryId = useWatch({ control: form.control, name: "expense_category_id" })
  // useWatch rather than form.watch: the per-beneficiary amounts are edited
  // through registered inputs, and only useWatch re-renders reliably on each
  // keystroke so the coverage panel tracks what is actually typed.
  const watchedBeneficiaries = useWatch({ control: form.control, name: "beneficiaries" })
  const unrelatedToBenef = form.watch("unrelated_to_benef")
  const totalAmount = form.watch("amount") || 0
  
  // Load data when dialog opens and cleanup when it closes
  useEffect(() => {
    if (open) {
      loadReferenceData()
    } else {
      // Clean up when dialog closes
      setBeneficiarySearchTerm("")
      setBeneficiaryTypeFilter('all')
      setBeneficiaries([])
      setSelectedBeneficiaries({})
      setFamilyByBeneficiary({})
      setSelectedGroupId("")
      setActiveTab("basic")
      
      // Force cleanup of any remaining UI elements
      setTimeout(() => {
        forceCleanup()
      }, 100)
    }
  }, [open])
  
  // Initialize form with data after reference data is loaded
  useEffect(() => {
    if (open && !loading) {
      resetForm()
    }
  }, [open, loading, initialData])
  
  /**
   * Radix can emit an empty value while its option list has not mounted yet,
   * and parseInt("") is NaN - which would silently wipe a preselected id.
   */
  const setNumericField = (field: "budget_id" | "expense_category_id" | "partner_id" | "bank_account_id", value: string) => {
    const parsed = parseInt(value)
    if (!Number.isNaN(parsed)) {
      form.setValue(field, parsed)
    }
  }

  // Reset form
  const resetForm = () => {
    const defaultValues: any = {
      payment_method: "Cash" as const,
      unrelated_to_benef: false,
      amount: 0,
      beneficiaries: [],
      expense_date: new Date(),
      // This runs again once the reference data has loaded, so the defaults
      // that come from it have to be seeded here or they get reset away.
      fiscal_year_id: activeFiscalYear?.id,
      budget_id: budgets.find(budget => budget.is_default)?.id,
      ...initialData
    }

    // Convert string IDs to numbers if they exist in initialData
    if (initialData) {
      if (initialData.budget_id && typeof initialData.budget_id === 'string') {
        defaultValues.budget_id = Number(initialData.budget_id)
      }
      if (initialData.expense_category_id && typeof initialData.expense_category_id === 'string') {
        defaultValues.expense_category_id = Number(initialData.expense_category_id)
      }
      if (initialData.partner_id && typeof initialData.partner_id === 'string') {
        defaultValues.partner_id = Number(initialData.partner_id)
      }
      if (initialData.bank_account_id && typeof initialData.bank_account_id === 'string') {
        defaultValues.bank_account_id = Number(initialData.bank_account_id)
      }
      if (initialData.fiscal_year_id && typeof initialData.fiscal_year_id === 'string') {
        defaultValues.fiscal_year_id = Number(initialData.fiscal_year_id)
      }
      // Convert date string to Date object
      if (initialData.expense_date && typeof initialData.expense_date === 'string') {
        defaultValues.expense_date = new Date(initialData.expense_date)
      }

      // An expense being edited or duplicated arrives with its saved
      // beneficiary rows: the stored pivot records, each carrying the
      // beneficiary itself. They are reduced to the four fields the form
      // works in - amount included, which the API sends as the string
      // "1050.00" and the schema requires as a number - and the people are
      // put back into the selected list so the rows show names rather than
      // bare ids.
      const savedRows: any[] = Array.isArray((initialData as any).beneficiaries)
        ? (initialData as any).beneficiaries
        : []

      if (savedRows.length > 0) {
        defaultValues.beneficiaries = savedRows.map(row => ({
          beneficiary_id: Number(row.beneficiary_id ?? row.id),
          amount: Number(row.amount) || 0,
          notes: row.notes ?? "",
          group_id: row.group_id != null ? Number(row.group_id) : null,
        }))

        const records: Record<number, Beneficiary> = {}
        const families: Record<number, { widowId: number; widowName: string }> = {}

        savedRows.forEach(row => {
          const beneficiary: Beneficiary | undefined = row.beneficiary
          if (!beneficiary) return

          records[beneficiary.id] = beneficiary

          const widowId = beneficiary.type === 'Widow' ? beneficiary.widow?.id : beneficiary.orphan?.widow_id
          if (!widowId) return

          families[beneficiary.id] = {
            widowId,
            widowName: beneficiary.type === 'Widow'
              ? (beneficiary.widow?.full_name || beneficiary.full_name || '')
              : (findMotherName(beneficiary) || 'غير محدد'),
          }
        })

        setSelectedBeneficiaries(records)
        setFamilyByBeneficiary(families)
      } else {
        setSelectedBeneficiaries({})
        setFamilyByBeneficiary({})
      }
    }

    console.log('Resetting form with values:', defaultValues)
    form.reset(defaultValues)
    setActiveTab("basic")
  }
  
  // Load reference data
  const loadReferenceData = async () => {
    setLoading(true)
    try {
      // Try to load real data from API
      const [budgetsRes, categoriesRes, partnersRes, bankAccountsRes, fiscalYearRes, groupsRes] = await Promise.all([
        api.getBudgets(),
        api.getExpenseCategories(),
        api.getPartners(),
        api.getBankAccounts(),
        api.getActiveFiscalYear(),
        // Groups are small and there is no searching to do over them, so the
        // whole list is fetched once and offered as a dropdown.
        api.getBeneficiaryGroups().catch(() => ({ data: [] as any[] })),
      ])
      
      // Use real data from API
      setBudgets(budgetsRes.data || [])
      setExpenseCategories(categoriesRes.data || [])

      setPartners(partnersRes.data || [])
      setBankAccounts(bankAccountsRes.data || [])
      setBeneficiaries([]) // Start with empty - user must search
      setActiveFiscalYear(fiscalYearRes || null)
      setBeneficiaryGroups((groupsRes as any)?.data || [])

      if (fiscalYearRes && !initialData?.fiscal_year_id) {
        form.setValue("fiscal_year_id", fiscalYearRes.id)
      }
      
      console.log('Successfully loaded real data from API')
      
    } catch (error) {
      console.error('Error loading reference data from API:', error)
      
      // Fallback data only if API fails
      const fallbackData = {
        budgets: [
          { id: 1, label: "المساعدات الشهرية" },
          { id: 2, label: "التعليم" },
          { id: 3, label: "الطوارئ" },
          { id: 4, label: "الصحة" }
        ],
        expenseCategories: [
          { id: 1, label: "مساعدات نقدية" },
          { id: 2, label: "رسوم دراسية" },
          { id: 3, label: "مساعدات طبية" },
          { id: 4, label: "أدوية" }
        ],
        partners: [
          { id: 1, name: "شريك المؤونة الأول" },
          { id: 2, name: "وزارة التعليم" },
          { id: 3, name: "مستشفى الأمل" }
        ],
        bankAccounts: [
          { id: 1, name: "الحساب الرئيسي", bank_name: "البنك الأهلي" },
          { id: 2, name: "حساب المساعدات", bank_name: "بنك المغرب" }
        ],
        beneficiaries: [
          { id: 1, first_name: "فاطمة", last_name: "أحمد محمد", type: "Widow" as const, full_name: "فاطمة أحمد محمد" },
          { id: 2, first_name: "خديجة", last_name: "علي حسن", type: "Widow" as const, full_name: "خديجة علي حسن" },
          { id: 3, first_name: "أحمد", last_name: "محمد علي", type: "Orphan" as const, full_name: "أحمد محمد علي" },
          { id: 4, first_name: "سارة", last_name: "علي حسن", type: "Orphan" as const, full_name: "سارة علي حسن" }
        ],
        fiscalYear: { id: 1, year: "2024", isActive: true }
      }
      
      console.log('Using fallback data due to API error')
      setBudgets(fallbackData.budgets)
      setExpenseCategories(fallbackData.expenseCategories)
      setPartners(fallbackData.partners)
      setBankAccounts(fallbackData.bankAccounts)
      setBeneficiaries([]) // Start with empty - user must search
      setActiveFiscalYear(fallbackData.fiscalYear)
      
      if (fallbackData.fiscalYear && !initialData?.fiscal_year_id) {
        form.setValue("fiscal_year_id", fallbackData.fiscalYear.id)
      }
      
      toast({
        title: "تحذير",
        description: "تم تحميل بيانات تجريبية، تأكد من اتصال الخادم",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }
  
  // Search beneficiaries  
  const searchBeneficiaries = useCallback(async () => {
    if (!beneficiarySearchTerm.trim() && beneficiaryTypeFilter === 'all') {
      setBeneficiaries([])
      return
    }
    
    setBeneficiarySearchLoading(true)
    try {
      // The name and the type go to the server. They used to be applied here
      // to whatever the first page happened to contain, so searching for
      // somebody who sorted past the first hundred beneficiaries returned
      // nothing at all and looked like they were not registered.
      const response = await api.getBeneficiaries({
        search: beneficiarySearchTerm.trim() || undefined,
        type: beneficiaryTypeFilter === 'all' ? undefined : beneficiaryTypeFilter,
        per_page: 50,
      })

      setBeneficiaries(response.data || [])
    } catch (error) {
      console.error('Error searching beneficiaries:', error)
      toast({
        title: "خطأ",
        description: "حدث خطأ في البحث عن المستفيدين",
        variant: "destructive"
      })
    } finally {
      setBeneficiarySearchLoading(false)
    }
  }, [beneficiarySearchTerm, beneficiaryTypeFilter, toast])
  
  /**
   * Search as you type, once you have stopped.
   *
   * The panel used to run a search on every render of the callback, which
   * meant one request per keystroke as soon as a type filter was on; and
   * with no filter on, typing did nothing at all until the button was
   * pressed. Both are replaced by a single debounced search that fires
   * 300ms after the last key, for a name of at least two letters or for a
   * type filter on its own. The بحث button still works and now just skips
   * the wait.
   */
  useEffect(() => {
    const term = beneficiarySearchTerm.trim()
    const hasTerm = term.length >= 2
    const hasFilter = beneficiaryTypeFilter !== 'all'

    if (!hasTerm && !hasFilter) {
      setBeneficiaries([])
      return
    }

    const timer = setTimeout(() => { searchBeneficiaries() }, 300)
    return () => clearTimeout(timer)
  }, [beneficiarySearchTerm, beneficiaryTypeFilter, searchBeneficiaries])
  
  

  // Helper functions for orphan data
  const calculateAge = (birthDate: string) => {
    const today = new Date()
    const birth = new Date(birthDate)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    return age
  }

  // The mother travels with the orphan now (the endpoint eager-loads her),
  // rather than being looked up in a separate copy of the widow list held in
  // the browser - which was only ever complete while every widow fitted in
  // one page of results.
  const findMotherName = (orphan: Beneficiary) => {
    if (orphan.type !== 'Orphan') return null

    const mother = orphan.orphan?.widow
    if (!mother) return 'غير محدد'

    return mother.full_name || `${mother.first_name ?? ''} ${mother.last_name ?? ''}`.trim() || 'غير محدد'
  }

  // Memoized set for tracking beneficiary selections
  const selectedBeneficiaryIds = useMemo(() => {
    return new Set(beneficiaryFields.map(field => field.beneficiary_id))
  }, [beneficiaryFields])

  // How much of this expense each family is receiving, for the kafala
  // coverage panel. Orphan rows roll up to their mother's family.
  const familyAllocations = useMemo(() => {
    const byFamily = new Map<number, { widowId: number; widowName: string; amount: number }>()

    beneficiaryFields.forEach((field, index) => {
      const family = familyByBeneficiary[field.beneficiary_id]
      if (!family) return

      const amount = parseFloat(String(watchedBeneficiaries?.[index]?.amount ?? field.amount ?? 0)) || 0
      const existing = byFamily.get(family.widowId)

      byFamily.set(family.widowId, {
        widowId: family.widowId,
        widowName: family.widowName,
        amount: (existing?.amount ?? 0) + amount,
      })
    })

    return Array.from(byFamily.values())
  }, [beneficiaryFields, familyByBeneficiary, watchedBeneficiaries])

  // Categories are independent of budgets - the full tree is always offered,
  // parents first with their children indented underneath.
  const categoryOptions = useMemo(() => buildCategoryOptions(expenseCategories), [expenseCategories])
  
  // Which family each selected beneficiary belongs to, recorded at selection
  // time: the search results are replaced on every new search, so the mapping
  // would otherwise be lost for beneficiaries selected in an earlier search.
  const rememberFamily = (beneficiary: Beneficiary) => {
    const widowId = beneficiary.type === 'Widow' ? beneficiary.widow?.id : beneficiary.orphan?.widow_id
    if (!widowId) return

    const widowName = beneficiary.type === 'Widow'
      ? (beneficiary.widow?.full_name || beneficiary.full_name || `${beneficiary.first_name} ${beneficiary.last_name}`)
      : (findMotherName(beneficiary) || 'غير محدد')

    setFamilyByBeneficiary(prev => ({ ...prev, [beneficiary.id]: { widowId, widowName } }))
  }

  /** The name to show for a beneficiary, wherever the record came from. */
  const displayName = (beneficiary: Beneficiary) =>
    beneficiary.full_name || `${beneficiary.first_name ?? ''} ${beneficiary.last_name ?? ''}`.trim()

  /**
   * Put one beneficiary on the expense.
   *
   * The record itself is kept, not just the id: the selected list has to keep
   * showing a name and an amount box for somebody the current search results
   * no longer contain.
   */
  const selectBeneficiary = (beneficiary: Beneficiary, groupId?: number) => {
    if (selectedBeneficiaryIds.has(beneficiary.id)) return

    rememberFamily(beneficiary)
    setSelectedBeneficiaries(prev => ({ ...prev, [beneficiary.id]: beneficiary }))

    addBeneficiary({
      beneficiary_id: beneficiary.id,
      amount: 0,
      notes: "",
      group_id: groupId ?? null,
    })
  }

  const deselectBeneficiary = (beneficiaryId: number) => {
    const index = beneficiaryFields.findIndex(field => field.beneficiary_id === beneficiaryId)
    if (index !== -1) {
      removeBeneficiary(index)
    }

    setSelectedBeneficiaries(prev => {
      const next = { ...prev }
      delete next[beneficiaryId]
      return next
    })
  }

  // Handle beneficiary selection
  const handleBeneficiarySelect = (beneficiaryId: number, checked: boolean) => {
    if (checked) {
      const beneficiary = beneficiaries.find(b => b.id === beneficiaryId)
      if (beneficiary) selectBeneficiary(beneficiary)
    } else {
      deselectBeneficiary(beneficiaryId)
    }
  }

  /**
   * Add everybody in a saved group to the expense.
   *
   * This is what the groups are for: the same families receive the same
   * recurring expense month after month, and ticking them off one by one is
   * the work the group was created to avoid. Members already on the expense
   * are left alone rather than added twice, so pulling in two overlapping
   * groups does the sensible thing.
   */
  const addGroupMembers = async () => {
    if (!selectedGroupId) return

    setGroupLoading(true)
    try {
      const response = await api.getBeneficiaryGroupMembers(Number(selectedGroupId))
      const members: Beneficiary[] = (response.data as any) || []

      const seen = new Set<number>()
      const fresh = members.filter(member => {
        if (selectedBeneficiaryIds.has(member.id) || seen.has(member.id)) return false
        seen.add(member.id)
        return true
      })

      fresh.forEach(member => selectBeneficiary(member, Number(selectedGroupId)))

      const group = beneficiaryGroups.find(g => String(g.id) === selectedGroupId)
      const skipped = members.length - fresh.length

      if (members.length === 0) {
        toast({
          title: "المجموعة فارغة",
          description: `لا يوجد أعضاء في «${group?.label ?? ''}»`,
          variant: "destructive",
        })
      } else {
        toast({
          title: "تمت إضافة أعضاء المجموعة",
          description: `${fresh.length} مستفيد من «${group?.label ?? ''}»`
            + (skipped > 0 ? ` (${skipped} كانوا مضافين من قبل)` : ''),
        })
      }
    } catch (error) {
      console.error('Error loading group members:', error)
      toast({
        title: "خطأ",
        description: "تعذر تحميل أعضاء المجموعة",
        variant: "destructive",
      })
    } finally {
      setGroupLoading(false)
    }
  }

  /**
   * Split the expense evenly over everybody selected.
   *
   * The server requires the per-beneficiary amounts to add up to the expense
   * exactly, so the division is done in centimes and the remainder goes to
   * the first row: twenty families sharing 1000 د.م get 50.00 each, and an
   * amount that does not divide cleanly still totals to the penny instead of
   * leaving a rounding gap that blocks the save.
   */
  const distributeEqually = () => {
    const count = beneficiaryFields.length
    const total = Math.round((parseFloat(String(totalAmount)) || 0) * 100)

    if (count === 0 || total <= 0) return

    const share = Math.floor(total / count)
    const remainder = total - share * count

    beneficiaryFields.forEach((field, index) => {
      const centimes = index === 0 ? share + remainder : share
      form.setValue(`beneficiaries.${index}.amount`, centimes / 100, { shouldValidate: true })
    })
  }
  
  // Handle form submission
  const onSubmit = async (data: ExpenseFormData) => {
    setIsSubmitting(true)
    try {
      console.log('Submitting expense data:', data)
      
      // Prepare data for API
      const apiData = {
        ...data,
        fiscal_year_id: activeFiscalYear?.id || 1,
        budget_id: Number(data.budget_id),
        expense_category_id: Number(data.expense_category_id),
        partner_id: data.partner_id && data.partner_id > 0 ? Number(data.partner_id) : undefined,
        bank_account_id: data.bank_account_id && data.bank_account_id > 0 ? Number(data.bank_account_id) : undefined,
        expense_date: data.expense_date ? format(data.expense_date, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')
      }
      
      console.log('API data to be sent:', apiData)
      
      const response = await api.createExpense(apiData)
      
      console.log('Expense created successfully:', response)
      
      toast({
        title: "تم إنشاء المصروف بنجاح",
        description: "تم حفظ المصروف في قاعدة البيانات"
      })
      handleOpenChange(false)
      onSuccess?.()
    } catch (error: any) {
      console.error('Error creating expense:', error)
      console.error('Error details:', error.errors)
      
      let errorMessage = "حدث خطأ أثناء حفظ المصروف"
      
      if (error.errors) {
        // Show specific validation errors
        const firstError = Object.values(error.errors)[0]
        if (Array.isArray(firstError) && firstError.length > 0) {
          errorMessage = firstError[0]
        }
      } else if (error.message) {
        errorMessage = error.message
      }
      
      toast({
        title: "خطأ في إنشاء المصروف",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }


  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            إنشاء مصروف جديد
          </DialogTitle>
        </DialogHeader>
        
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="mr-3">جاري التحميل...</span>
          </div>
        ) : (
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  البيانات الأساسية
                </TabsTrigger>
                <TabsTrigger value="payment" className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  طريقة الدفع
                </TabsTrigger>
                <TabsTrigger value="beneficiaries" className="flex items-center gap-2" disabled={unrelatedToBenef}>
                  <Users className="h-4 w-4" />
                  المستفيدون
                </TabsTrigger>
              </TabsList>
              
              {/* Basic Information Tab */}
              <TabsContent value="basic" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>معلومات المصروف</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Expense Date */}
                    <div className="space-y-2">
                      <Label>تاريخ المصروف *</Label>
                      <Controller
                        name="expense_date"
                        control={form.control}
                        render={({ field }) => (
                          <Input
                            type="date"
                            max={toDateInputValue(new Date())}
                            value={toDateInputValue(field.value)}
                            onChange={(e) => field.onChange(fromDateInputValue(e.target.value))}
                          />
                        )}
                      />
                      {form.formState.errors.expense_date && (
                        <p className="text-sm text-red-600">{form.formState.errors.expense_date.message}</p>
                      )}
                    </div>
                    
                    {/* Sub Budget */}
                    <div className="space-y-2">
                      <Label>الميزانية *</Label>
                      <Select 
                        value={budgetId?.toString() || ""} 
                        onValueChange={(value) => setNumericField("budget_id", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="اختر الميزانية" />
                        </SelectTrigger>
                        <SelectContent>
                          {budgets.map(budget => (
                            <SelectItem key={budget.id} value={budget.id.toString()}>
                              {budget.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {form.formState.errors.budget_id && (
                        <p className="text-sm text-red-600">{form.formState.errors.budget_id.message}</p>
                      )}
                    </div>
                    
                    {/* Expense Category */}
                    <div className="space-y-2">
                      <Label>فئة المصروف *</Label>
                      <Select 
                        value={expenseCategoryId?.toString() || ""} 
                        onValueChange={(value) => setNumericField("expense_category_id", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="اختر فئة المصروف" />
                        </SelectTrigger>
                        <SelectContent>
                          {categoryOptions.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {form.formState.errors.expense_category_id && (
                        <p className="text-sm text-red-600">{form.formState.errors.expense_category_id.message}</p>
                      )}
                    </div>
                    
                    {/* Partner */}
                    <div className="space-y-2">
                      <Label>الشريك</Label>
                      <Select 
                        value={form.watch("partner_id")?.toString() || "0"} 
                        onValueChange={(value) => setNumericField("partner_id", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="اختر الشريك (اختياري)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">بدون شريك</SelectItem>
                          {partners.map(partner => (
                            <SelectItem key={partner.id} value={partner.id.toString()}>
                              {partner.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Amount */}
                    <div className="space-y-2">
                      <Label>المبلغ الإجمالي (DH) *</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        {...form.register("amount", { valueAsNumber: true })}
                        onChange={(e) => {
                          form.setValue("amount", parseFloat(e.target.value) || 0)
                        }}
                      />
                      {form.formState.errors.amount && (
                        <p className="text-sm text-red-600">{form.formState.errors.amount.message}</p>
                      )}
                    </div>
                    
                    {/* Project (Disabled) */}
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">المشروع الممول</Label>
                      <Select disabled>
                        <SelectTrigger className="bg-muted text-muted-foreground cursor-not-allowed">
                          <SelectValue placeholder="غير متاح حالياً" />
                        </SelectTrigger>
                      </Select>
                      <p className="text-sm text-muted-foreground">إدارة المشاريع غير متاحة حالياً</p>
                    </div>
                    
                    {/* Details */}
                    <div className="space-y-2 md:col-span-2">
                      <Label>تفاصيل المصروف</Label>
                      <Textarea
                        placeholder="أدخل تفاصيل المصروف..."
                        {...form.register("details")}
                      />
                    </div>
                    
                    {/* Unrelated to beneficiaries checkbox */}
                    <div className="md:col-span-2 flex items-center space-x-2 space-x-reverse">
                      <Checkbox
                        id="unrelated_to_benef"
                        checked={unrelatedToBenef}
                        onCheckedChange={(checked) => {
                          form.setValue("unrelated_to_benef", checked as boolean)
                          if (checked) {
                            setActiveTab("payment")
                          }
                        }}
                      />
                      <Label htmlFor="unrelated_to_benef" className="text-sm font-normal cursor-pointer">
                        هذا المصروف غير مرتبط بالمستفيدين (مصروف إداري)
                      </Label>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Payment Method Tab */}
              <TabsContent value="payment" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>طريقة الدفع</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Payment Method Selection */}
                    <div className="space-y-2">
                      <Label>طريقة الدفع *</Label>
                      <Select 
                        value={form.watch("payment_method") || ""} 
                        onValueChange={(value) => form.setValue("payment_method", value as any)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="اختر طريقة الدفع" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Cash">نقدي</SelectItem>
                          <SelectItem value="Cheque">شيك</SelectItem>
                          <SelectItem value="BankWire">حوالة بنكية</SelectItem>
                        </SelectContent>
                      </Select>
                      {form.formState.errors.payment_method && (
                        <p className="text-sm text-red-600">{form.formState.errors.payment_method.message}</p>
                      )}
                    </div>
                    
                    {/* Bank Account (for Cheque and BankWire) */}
                    {(paymentMethod === "Cheque" || paymentMethod === "BankWire") && (
                      <div className="space-y-2">
                        <Label>الحساب البنكي *</Label>
                        <Select 
                          value={form.watch("bank_account_id")?.toString() || ""} 
                          onValueChange={(value) => setNumericField("bank_account_id", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="اختر الحساب البنكي" />
                          </SelectTrigger>
                          <SelectContent>
                            {bankAccounts.map(account => (
                              <SelectItem key={account.id} value={account.id.toString()}>
                                {account.label || account.name} - {account.bank_name} (رصيد: {Number(account.balance).toLocaleString()} DH)
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {form.formState.errors.bank_account_id && (
                          <p className="text-sm text-red-600">{form.formState.errors.bank_account_id.message}</p>
                        )}
                      </div>
                    )}
                    
                    {/* Cheque Number (for Cheque) */}
                    {paymentMethod === "Cheque" && (
                      <div className="space-y-2">
                        <Label>رقم الشيك *</Label>
                        <Input
                          placeholder="أدخل رقم الشيك"
                          {...form.register("cheque_number")}
                        />
                        {form.formState.errors.cheque_number && (
                          <p className="text-sm text-red-600">{form.formState.errors.cheque_number.message}</p>
                        )}
                      </div>
                    )}
                    
                    {/* Receipt Number */}
                    <div className="space-y-2">
                      <Label>رقم الإيصال</Label>
                      <Input
                        placeholder="أدخل رقم الإيصال (اختياري)"
                        {...form.register("receipt_number")}
                      />
                    </div>
                    
                    {/* Remarks */}
                    <div className="space-y-2">
                      <Label>ملاحظات</Label>
                      <Textarea
                        placeholder="أدخل أي ملاحظات إضافية..."
                        {...form.register("remarks")}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Beneficiaries Tab */}
              <TabsContent value="beneficiaries" className="space-y-4">
                {!unrelatedToBenef && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        المستفيدون من المصروف
                        <Badge variant="outline">
                          {beneficiaryFields.length} محدد
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Beneficiary groups - the saved lists of people who
                          receive the same recurring expense together. Picking
                          one adds all of its members at once, which is the
                          whole reason the groups exist. */}
                      <div className="rounded-xl border border-border bg-muted/40 p-4 space-y-3">
                        <div className="flex items-center gap-2">
                          <UsersRound className="h-4 w-4 text-primary" />
                          <h4 className="font-semibold text-sm">إضافة مجموعة مستفيدين</h4>
                        </div>
                        {beneficiaryGroups.length === 0 ? (
                          <p className="text-xs text-muted-foreground">
                            لا توجد مجموعات مستفيدين بعد. يمكن إنشاؤها من صفحة «مجموعات المستفيدين» لتسهيل تسجيل المصاريف المتكررة.
                          </p>
                        ) : (
                          <>
                          <div className="flex flex-col gap-2 sm:flex-row">
                            <div className="flex-1">
                              <SingleSelectRS
                                options={beneficiaryGroups.map(group => ({
                                  label: `${group.label}${group.members_count ? ` (${group.members_count} مستفيد)` : ''}`,
                                  value: String(group.id),
                                }))}
                                value={selectedGroupId}
                                onChange={(value) => setSelectedGroupId(value || "")}
                                placeholder="اختر مجموعة..."
                              />
                            </div>
                            <Button
                              type="button"
                              variant="secondary"
                              onClick={addGroupMembers}
                              disabled={!selectedGroupId || groupLoading}
                            >
                              <Plus className="h-4 w-4 ml-1" />
                              {groupLoading ? "جاري الإضافة..." : "إضافة الأعضاء"}
                            </Button>
                          </div>
                          {selectedGroupId && (
                            <p className="text-xs text-muted-foreground">
                              {beneficiaryGroups.find(g => String(g.id) === selectedGroupId)?.description || ''}
                            </p>
                          )}
                          </>
                        )}
                      </div>

                      {/* Search Section */}
                      <div className="space-y-3">
                        <div className="flex gap-2">
                          <div className="flex-1">
                            <Input
                              type="text"
                              placeholder="ابحث عن المستفيدين بالاسم..."
                              value={beneficiarySearchTerm}
                              onChange={(e) => setBeneficiarySearchTerm(e.target.value)}
                              onKeyPress={(e) => e.key === 'Enter' && searchBeneficiaries()}
                            />
                          </div>
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={searchBeneficiaries}
                            disabled={beneficiarySearchLoading}
                          >
                            {beneficiarySearchLoading ? "جاري البحث..." : "بحث"}
                          </Button>
                        </div>
                        
                        {/* Type Filter */}
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant={beneficiaryTypeFilter === 'all' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setBeneficiaryTypeFilter('all')}
                          >
                            الكل
                          </Button>
                          <Button
                            type="button"
                            variant={beneficiaryTypeFilter === 'Widow' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setBeneficiaryTypeFilter('Widow')}
                          >
                            الأرامل
                          </Button>
                          <Button
                            type="button"
                            variant={beneficiaryTypeFilter === 'Orphan' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setBeneficiaryTypeFilter('Orphan')}
                          >
                            الأيتام
                          </Button>
                        </div>
                      </div>

                      {/* Search Results */}
                      {beneficiaries.length === 0 && !beneficiarySearchLoading ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <p>ابحث عن المستفيدين لإضافتهم</p>
                        </div>
                      ) : (
                        <div className="space-y-4 max-h-80 overflow-y-auto">
                          {beneficiaries.map(beneficiary => {
                            const isSelected = selectedBeneficiaryIds.has(beneficiary.id)
                            const isOrphan = beneficiary.type === 'Orphan'
                            const isWidow = beneficiary.type === 'Widow'
                            const motherName = isOrphan ? findMotherName(beneficiary) : null
                            const age = isOrphan && beneficiary.orphan?.birth_date ? calculateAge(beneficiary.orphan.birth_date) : null
                            const hasDisability = isWidow && beneficiary.widow?.disability_flag
                            const disabilityType = isWidow ? beneficiary.widow?.disability_type : null
                            
                            return (
                              <div
                                key={beneficiary.id}
                                className={cn(
                                  "relative p-4 rounded-xl border-2 transition-all duration-200 hover:shadow-md",
                                  isSelected 
                                    ? "border-blue-400 bg-blue-50 shadow-lg dark:border-blue-600 dark:bg-blue-950/40"
                                    : "border-border hover:border-primary/40 bg-card"
                                )}
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex items-start justify-start">
                                    <Checkbox
                                      checked={isSelected}
                                      onCheckedChange={(checked) => handleBeneficiarySelect(beneficiary.id, checked as boolean)}
                                      className="mt-1 ml-4"
                                    />
                                  </div>
                                  
                                  <div className="flex-1 space-y-2 text-right">
                                    <div className="flex items-center justify-end space-x-2 space-x-reverse">
                                      <h4 className="font-semibold text-foreground text-lg">
                                        {beneficiary.full_name || `${beneficiary.first_name} ${beneficiary.last_name}`}
                                      </h4>
                                      <Badge variant={isWidow ? 'secondary' : 'outline'} className="text-xs">
                                        {isWidow ? 'أرملة' : 'يتيم'}
                                      </Badge>
                                      {age && (
                                        <Badge variant="outline" className="text-xs bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400">
                                          {age} سنة
                                        </Badge>
                                      )}
                                    </div>
                                    
                                    {isOrphan && motherName && (
                                      <div className="flex items-center justify-end space-x-2 space-x-reverse text-sm text-muted-foreground">
                                        <span className="font-medium">{motherName}</span>
                                        <span className="text-muted-foreground">:الأم</span>
                                      </div>
                                    )}
                                    
                                    {isOrphan && beneficiary.orphan?.education_level?.name_ar && (
                                      <div className="flex items-center justify-end space-x-2 space-x-reverse text-sm text-muted-foreground">
                                        <span>{beneficiary.orphan.education_level.name_ar}</span>
                                        <span className="text-muted-foreground">:التعليم</span>
                                      </div>
                                    )}
                                    
                                    {isWidow && hasDisability && (
                                      <div className="flex items-center justify-end space-x-2 space-x-reverse text-sm">
                                        <Badge variant="destructive" className="text-xs">
                                          إعاقة
                                        </Badge>
                                        {disabilityType && (
                                          <span className="text-red-600 font-medium">{disabilityType}</span>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                  
                                  {/* The amount is edited in the selected
                                      list below, which is the one place that
                                      shows every chosen beneficiary. A second
                                      box for the same figure here would only
                                      appear while the person happened to be
                                      in the current search results. */}
                                  {isSelected && (
                                    <Badge variant="secondary" className="mr-4 shrink-0">مضاف</Badge>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}

                      {/* Everybody on this expense.
                          The amount boxes used to live inside the search
                          results, which meant that searching for somebody
                          else hid the rows already chosen - they stayed
                          selected and counted towards the total, with no way
                          left to see or edit them. A group of twenty would
                          have been unusable for the same reason. */}
                      {beneficiaryFields.length > 0 && (
                        <div className="space-y-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <h4 className="font-semibold text-sm flex items-center gap-2">
                              <Users className="h-4 w-4 text-primary" />
                              المستفيدون المختارون ({beneficiaryFields.length})
                            </h4>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={distributeEqually}
                              disabled={!totalAmount || Number(totalAmount) <= 0}
                              title="توزيع مبلغ المصروف بالتساوي على المستفيدين المختارين"
                            >
                              <Split className="h-4 w-4 ml-1" />
                              توزيع بالتساوي
                            </Button>
                          </div>

                          <div className="space-y-2 max-h-72 overflow-y-auto rounded-xl border border-border p-2">
                            {beneficiaryFields.map((field, index) => {
                              const beneficiary = selectedBeneficiaries[field.beneficiary_id]
                              const family = familyByBeneficiary[field.beneficiary_id]
                              const isOrphan = beneficiary?.type === 'Orphan'

                              return (
                                <div
                                  key={field.id}
                                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card p-3"
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                                      onClick={() => deselectBeneficiary(field.beneficiary_id)}
                                      aria-label="إزالة المستفيد"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                    <div className="min-w-0">
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium truncate">
                                          {beneficiary ? displayName(beneficiary) : `مستفيد #${field.beneficiary_id}`}
                                        </span>
                                        {beneficiary && (
                                          <Badge variant={isOrphan ? 'outline' : 'secondary'} className="text-xs shrink-0">
                                            {isOrphan ? 'يتيم' : 'أرملة'}
                                          </Badge>
                                        )}
                                      </div>
                                      {isOrphan && family?.widowName && (
                                        <p className="text-xs text-muted-foreground truncate">
                                          الأم: {family.widowName}
                                        </p>
                                      )}
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <Input
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      className="w-28 text-center font-semibold"
                                      placeholder="0.00"
                                      {...form.register(`beneficiaries.${index}.amount`, { valueAsNumber: true })}
                                    />
                                    <span className="text-sm font-medium text-muted-foreground">DH</span>
                                  </div>
                                </div>
                              )
                            })}
                          </div>

                          {/* The server rejects a mismatch, so the gap is
                              named here rather than discovered on save. */}
                          {(() => {
                            const allocated = (watchedBeneficiaries || []).reduce(
                              (sum: number, row: any) => sum + (Number(row?.amount) || 0), 0,
                            )
                            const gap = (Number(totalAmount) || 0) - allocated
                            if (Math.abs(gap) <= 0.01) return null

                            return (
                              <p className="text-sm text-destructive">
                                {gap > 0
                                  ? `متبقي ${gap.toFixed(2)} DH غير موزع على المستفيدين`
                                  : `الموزع يتجاوز مبلغ المصروف بـ ${Math.abs(gap).toFixed(2)} DH`}
                              </p>
                            )
                          })()}
                        </div>
                      )}

                      {/* Kafala chamila coverage - only renders for those budgets */}
                      <KafalaCoveragePanel budgetId={budgetId} allocations={familyAllocations} />

                      {/* Selected Beneficiaries Summary */}
                      {beneficiaryFields.length > 0 && (
                        <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-6 dark:border-blue-900 dark:bg-blue-950/30">
                          <div className="flex items-center space-x-2 space-x-reverse mb-4">
                            <Users className="h-5 w-5 text-blue-600" />
                            <h4 className="font-semibold text-blue-900 dark:text-blue-400">ملخص المستفيدين المحددين</h4>
                          </div>
                          <div className="grid grid-cols-3 gap-4 text-center">
                            <div className="bg-card p-3 rounded-lg border border-blue-100 dark:border-blue-900">
                              <p className="text-2xl font-bold text-blue-600">{beneficiaryFields.length}</p>
                              <p className="text-xs text-muted-foreground">مستفيد</p>
                            </div>
                            <div className="bg-card p-3 rounded-lg border border-green-100 dark:border-green-900">
                              <p className="text-2xl font-bold text-green-600">
                                {beneficiaryFields.reduce((sum, field) => sum + (parseFloat(field.amount) || 0), 0).toFixed(0)}
                              </p>
                              <p className="text-xs text-muted-foreground">DH موزع</p>
                            </div>
                            <div className="bg-card p-3 rounded-lg border border-orange-100 dark:border-orange-900">
                              <p className="text-2xl font-bold text-orange-600">{(parseFloat(totalAmount) || 0).toFixed(0)}</p>
                              <p className="text-xs text-muted-foreground">DH إجمالي</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
            
            {/* Form Actions */}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                إلغاء
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    جاري الحفظ...
                  </>
                ) : (
                  "حفظ المصروف"
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

// Export the dialog for use in pages
export function NewExpenseForm(props: NewExpenseFormProps) {
  return <NewExpenseDialog {...props} />
}