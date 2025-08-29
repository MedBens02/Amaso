"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Search, ArrowLeftRight, Banknote, Filter, Calendar, DollarSign } from "lucide-react"
import { TransfersTable } from "@/components/transfers/transfers-table"
import { NewTransferDialog } from "@/components/forms/NewTransferForm"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

interface BankAccount {
  id: number
  label: string
  bank_name: string
  account_number: string
  balance: number
  notes?: string
}

interface FilterState {
  search: string
  from_account_id: string
  to_account_id: string
  month: string
  year: string
  min_amount: string
  max_amount: string
  status: string
  from_date: string
  to_date: string
}

export default function TransfersPage() {
  const [showNewDialog, setShowNewDialog] = useState(false)
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const { toast } = useToast()

  const [filters, setFilters] = useState<FilterState>({
    search: "",
    from_account_id: "all",
    to_account_id: "all",
    month: "all",
    year: new Date().getFullYear().toString(),
    min_amount: "",
    max_amount: "",
    status: "all",
    from_date: "",
    to_date: ""
  })

  // Fetch bank accounts
  useEffect(() => {
    fetchBankAccounts()
  }, [])

  const fetchBankAccounts = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/v1/bank-accounts')
      const data = await response.json()
      
      if (data.data) {
        setBankAccounts(data.data)
      } else {
        toast({
          title: "خطأ في تحميل البيانات",
          description: "فشل في تحميل بيانات الحسابات المصرفية",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "خطأ في الاتصال",
        description: "فشل في الاتصال بالخادم",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const updateFilter = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const clearFilters = () => {
    setFilters({
      search: "",
      from_account_id: "all",
      to_account_id: "all",
      month: "all",
      year: new Date().getFullYear().toString(),
      min_amount: "",
      max_amount: "",
      status: "all",
      from_date: "",
      to_date: ""
    })
  }

  const monthOptions = [
    { value: "1", label: "يناير" },
    { value: "2", label: "فبراير" },
    { value: "3", label: "مارس" },
    { value: "4", label: "أبريل" },
    { value: "5", label: "مايو" },
    { value: "6", label: "يونيو" },
    { value: "7", label: "يوليو" },
    { value: "8", label: "أغسطس" },
    { value: "9", label: "سبتمبر" },
    { value: "10", label: "أكتوبر" },
    { value: "11", label: "نوفمبر" },
    { value: "12", label: "ديسمبر" }
  ]

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-center items-center min-h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">جاري تحميل البيانات...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <ArrowLeftRight className="h-8 w-8" />
            إدارة التحويلات
          </h1>
          <p className="text-gray-600 mt-2">إدارة التحويلات بين الحسابات المصرفية</p>
        </div>
        <Button onClick={() => setShowNewDialog(true)}>
          <Plus className="h-4 w-4 ml-2" />
          تحويل جديد
        </Button>
      </div>

      {/* Real Account Balances */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {bankAccounts.map((account, index) => (
          <Card key={account.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium truncate">{account.label}</CardTitle>
              <Banknote className={`h-4 w-4 ${
                index === 0 ? 'text-blue-500' : 
                index === 1 ? 'text-green-500' : 'text-purple-500'
              }`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${
                index === 0 ? 'text-blue-600' : 
                index === 1 ? 'text-green-600' : 'text-purple-600'
              }`}>
                DH {account.balance.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">{account.bank_name}</p>
              <p className="text-xs text-gray-400">{account.account_number}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Advanced Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Filter className="h-5 w-5" />
              البحث والتصفية
            </h3>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 ml-1" />
                {showFilters ? 'إخفاء الفلاتر' : 'إظهار الفلاتر'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
              >
                مسح الفلاتر
              </Button>
            </div>
          </div>
          
          {/* Basic Search */}
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="البحث في التحويلات أو الحسابات..."
              value={filters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
              className="pr-10"
            />
          </div>
        </CardHeader>
        
        {showFilters && (
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Account Filters */}
              <div className="space-y-2">
                <Label>من حساب</Label>
                <Select value={filters.from_account_id} onValueChange={(value) => updateFilter('from_account_id', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="جميع الحسابات" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الحسابات</SelectItem>
                    {bankAccounts.map((account) => (
                      <SelectItem key={account.id} value={account.id.toString()}>
                        {account.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>إلى حساب</Label>
                <Select value={filters.to_account_id} onValueChange={(value) => updateFilter('to_account_id', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="جميع الحسابات" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الحسابات</SelectItem>
                    {bankAccounts.map((account) => (
                      <SelectItem key={account.id} value={account.id.toString()}>
                        {account.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date Filters */}
              <div className="space-y-2">
                <Label>الشهر</Label>
                <Select value={filters.month} onValueChange={(value) => updateFilter('month', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="جميع الشهور" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الشهور</SelectItem>
                    {monthOptions.map((month) => (
                      <SelectItem key={month.value} value={month.value}>
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>السنة</Label>
                <Select value={filters.year} onValueChange={(value) => updateFilter('year', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر السنة" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 5 }, (_, i) => {
                      const year = new Date().getFullYear() - i
                      return (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>

              {/* Amount Range */}
              <div className="space-y-2">
                <Label>الحد الأدنى للمبلغ</Label>
                <div className="relative">
                  <DollarSign className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    type="number"
                    placeholder="0"
                    value={filters.min_amount}
                    onChange={(e) => updateFilter('min_amount', e.target.value)}
                    className="pr-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>الحد الأقصى للمبلغ</Label>
                <div className="relative">
                  <DollarSign className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    type="number"
                    placeholder="∞"
                    value={filters.max_amount}
                    onChange={(e) => updateFilter('max_amount', e.target.value)}
                    className="pr-10"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div className="space-y-2">
                <Label>الحالة</Label>
                <Select value={filters.status} onValueChange={(value) => updateFilter('status', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="جميع الحالات" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الحالات</SelectItem>
                    <SelectItem value="Draft">مسودة</SelectItem>
                    <SelectItem value="Approved">معتمد</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Date Range */}
              <div className="space-y-2">
                <Label>من تاريخ</Label>
                <div className="relative">
                  <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    type="date"
                    value={filters.from_date}
                    onChange={(e) => updateFilter('from_date', e.target.value)}
                    className="pr-10"
                  />
                </div>
              </div>

            </div>
          </CardContent>
        )}
      </Card>

      {/* Transfers Table */}
      <Card>
        <CardHeader>
          <CardTitle>سجل التحويلات</CardTitle>
        </CardHeader>
        <CardContent>
          <TransfersTable filters={filters} onBalanceUpdate={fetchBankAccounts} />
        </CardContent>
      </Card>

      <NewTransferDialog 
        open={showNewDialog} 
        onOpenChange={setShowNewDialog} 
        onTransferCreated={() => {
          fetchBankAccounts() // Refresh account balances
          window.location.reload() // Refresh the transfers table
        }}
      />
    </div>
  )
}
