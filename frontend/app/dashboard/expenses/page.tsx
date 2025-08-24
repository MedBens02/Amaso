"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Search, Filter, Download, Wallet } from "lucide-react"
import { ExpensesTable } from "@/components/expenses/expenses-table"
import { NewExpenseDialog } from "@/components/forms/NewExpenseForm"
import { ExpenseFilters } from "@/components/expenses/expense-filters"

export default function ExpensesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  const [showNewDialog, setShowNewDialog] = useState(false)

  const handleExportCSV = () => {
    console.log("Exporting expenses CSV...")
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Wallet className="h-8 w-8" />
            إدارة المصروفات
          </h1>
          <p className="text-gray-600 mt-2">إدارة وتتبع جميع المصروفات والمساعدات</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="h-4 w-4 ml-2" />
            تصدير CSV
          </Button>
          <Button onClick={() => setShowNewDialog(true)}>
            <Plus className="h-4 w-4 ml-2" />
            مصروف جديد
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="البحث في المصروفات..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>
            <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
              <Filter className="h-4 w-4 ml-2" />
              الفلاتر المتقدمة
            </Button>
          </div>
        </CardHeader>
        {showFilters && (
          <CardContent>
            <ExpenseFilters />
          </CardContent>
        )}
      </Card>

      {/* Expenses Table */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة المصروفات</CardTitle>
        </CardHeader>
        <CardContent>
          <ExpensesTable searchTerm={searchTerm} />
        </CardContent>
      </Card>

      <NewExpenseDialog open={showNewDialog} onOpenChange={setShowNewDialog} />
    </div>
  )
}
