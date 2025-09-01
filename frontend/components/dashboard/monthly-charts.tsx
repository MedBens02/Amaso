"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Area, AreaChart } from "recharts"
import { TrendingUp, TrendingDown, DollarSign } from "lucide-react"

interface MonthlyData {
  month: string
  monthShort: string
  incomes: number
  expenses: number
  net: number
}

export function MonthlyCharts() {
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMonthlyData()
  }, [])

  const fetchMonthlyData = async () => {
    try {
      setLoading(true)
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1'
      
      // Get the last 6 months of data
      const months = []
      const currentDate = new Date()
      
      for (let i = 5; i >= 0; i--) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1)
        const startDate = new Date(date.getFullYear(), date.getMonth(), 1)
        const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0)
        
        months.push({
          month: date.toLocaleDateString('ar-MA', { month: 'long', year: 'numeric' }),
          monthShort: date.toLocaleDateString('ar-MA', { month: 'short' }),
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
        })
      }

      const monthlyResults = await Promise.all(
        months.map(async (monthInfo) => {
          try {
            const [incomesRes, expensesRes] = await Promise.all([
              fetch(`${baseUrl}/incomes?per_page=1000&from_date=${monthInfo.startDate}&to_date=${monthInfo.endDate}&status=Approved`).then(r => r.json()),
              fetch(`${baseUrl}/expenses?per_page=1000&from_date=${monthInfo.startDate}&to_date=${monthInfo.endDate}&status=Approved`).then(r => r.json()),
            ])

            const totalIncomes = incomesRes.data?.reduce((sum: number, income: any) => sum + parseFloat(income.amount), 0) || 0
            const totalExpenses = expensesRes.data?.reduce((sum: number, expense: any) => sum + parseFloat(expense.amount), 0) || 0

            return {
              month: monthInfo.month,
              monthShort: monthInfo.monthShort,
              incomes: totalIncomes,
              expenses: totalExpenses,
              net: totalIncomes - totalExpenses,
            }
          } catch (error) {
            console.error(`Error fetching data for ${monthInfo.month}:`, error)
            return {
              month: monthInfo.month,
              monthShort: monthInfo.monthShort,
              incomes: 0,
              expenses: 0,
              net: 0,
            }
          }
        })
      )

      setMonthlyData(monthlyResults)
    } catch (error) {
      console.error('Error fetching monthly data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return `${value.toLocaleString()} د.م`
  }

  const formatCompactCurrency = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}م د.م`
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}ك د.م`
    }
    return `${value} د.م`
  }

  // Calculate summary statistics
  const totalIncomes = monthlyData.reduce((sum, month) => sum + month.incomes, 0)
  const totalExpenses = monthlyData.reduce((sum, month) => sum + month.expenses, 0)
  const avgMonthlyNet = monthlyData.length > 0 ? monthlyData.reduce((sum, month) => sum + month.net, 0) / monthlyData.length : 0
  const trend = monthlyData.length >= 2 ? monthlyData[monthlyData.length - 1].net - monthlyData[monthlyData.length - 2].net : 0

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-64 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
          <Card className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-64 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">إجمالي الإيرادات (6 أشهر)</p>
                <p className="text-2xl font-bold text-green-800">{formatCurrency(totalIncomes)}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-red-50 to-rose-50 border-red-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-700">إجمالي المصروفات (6 أشهر)</p>
                <p className="text-2xl font-bold text-red-800">{formatCurrency(totalExpenses)}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <TrendingDown className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">متوسط الصافي الشهري</p>
                <p className="text-2xl font-bold text-blue-800">{formatCurrency(avgMonthlyNet)}</p>
                <div className="flex items-center mt-1">
                  {trend >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-500 ml-1" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500 ml-1" />
                  )}
                  <span className={`text-xs ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {trend >= 0 ? '+' : ''}{formatCurrency(trend)} من الشهر السابق
                  </span>
                </div>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Enhanced Bar Chart */}
        <Card className="shadow-lg">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">الإيرادات والمصروفات الشهرية</CardTitle>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-emerald-500"></div>
                  <span className="text-xs text-gray-600">الإيرادات</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-red-500"></div>
                  <span className="text-xs text-gray-600">المصروفات</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={monthlyData} margin={{ top: 20, right: 20, left: 20, bottom: 60 }}>
                <defs>
                  <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.8}/>
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0.3}/>
                  </linearGradient>
                  <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity={0.8}/>
                    <stop offset="100%" stopColor="#ef4444" stopOpacity={0.3}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis 
                  dataKey="monthShort" 
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tickLine={{ stroke: '#e2e8f0' }}
                />
                <YAxis 
                  tick={{ fontSize: 11, fill: '#64748b' }} 
                  tickFormatter={formatCompactCurrency}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tickLine={{ stroke: '#e2e8f0' }}
                />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    formatCurrency(value),
                    name === 'incomes' ? 'الإيرادات' : 'المصروفات'
                  ]}
                  labelFormatter={(label) => monthlyData.find(m => m.monthShort === label)?.month || label}
                  contentStyle={{ 
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Bar dataKey="incomes" fill="url(#incomeGradient)" name="incomes" radius={[6, 6, 0, 0]} maxBarSize={60} />
                <Bar dataKey="expenses" fill="url(#expenseGradient)" name="expenses" radius={[6, 6, 0, 0]} maxBarSize={60} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Enhanced Area Chart for Net Cash Flow */}
        <Card className="shadow-lg">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">صافي التدفق النقدي</CardTitle>
              <Badge variant={avgMonthlyNet >= 0 ? "default" : "destructive"} className="text-xs">
                {avgMonthlyNet >= 0 ? 'ربحي' : 'خاسر'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={monthlyData} margin={{ top: 20, right: 20, left: 20, bottom: 60 }}>
                <defs>
                  <linearGradient id="netGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.6}/>
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis 
                  dataKey="monthShort" 
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tickLine={{ stroke: '#e2e8f0' }}
                />
                <YAxis 
                  tick={{ fontSize: 11, fill: '#64748b' }} 
                  tickFormatter={formatCompactCurrency}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tickLine={{ stroke: '#e2e8f0' }}
                />
                <Tooltip 
                  formatter={(value: number) => [formatCurrency(value), 'صافي التدفق']}
                  labelFormatter={(label) => monthlyData.find(m => m.monthShort === label)?.month || label}
                  contentStyle={{ 
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="net" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  fill="url(#netGradient)"
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 5 }}
                  activeDot={{ r: 7, stroke: '#3b82f6', strokeWidth: 2, fill: '#ffffff' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}