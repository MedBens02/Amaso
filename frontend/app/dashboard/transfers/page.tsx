"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Search, ArrowLeftRight, Banknote } from "lucide-react"
import { TransfersTable } from "@/components/transfers/transfers-table"
import { NewTransferDialog } from "@/components/forms/NewTransferForm"

export default function TransfersPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [showNewDialog, setShowNewDialog] = useState(false)

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

      {/* Account Balances */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الحساب الجاري</CardTitle>
            <Banknote className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">DH 125,680</div>
            <p className="text-xs text-muted-foreground">البنك الأهلي</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">حساب الطوارئ</CardTitle>
            <Banknote className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">DH 45,230</div>
            <p className="text-xs text-muted-foreground">بنك فلسطين</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">حساب التوفير</CardTitle>
            <Banknote className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">DH 89,450</div>
            <p className="text-xs text-muted-foreground">البنك الإسلامي</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="البحث في التحويلات..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10"
            />
          </div>
        </CardHeader>
      </Card>

      {/* Transfers Table */}
      <Card>
        <CardHeader>
          <CardTitle>سجل التحويلات</CardTitle>
        </CardHeader>
        <CardContent>
          <TransfersTable searchTerm={searchTerm} />
        </CardContent>
      </Card>

      <NewTransferDialog open={showNewDialog} onOpenChange={setShowNewDialog} />
    </div>
  )
}
