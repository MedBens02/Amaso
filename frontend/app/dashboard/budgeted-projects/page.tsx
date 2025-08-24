"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BudgetedProjectsTable } from "@/components/budgeted-projects/budgeted-projects-table"
import { NewBudgetedProjectDialog } from "@/components/forms/NewBudgetedProjectForm"
import { Plus, Search, FolderOpen } from "lucide-react"

export default function BudgetedProjectsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [showNewProjectDialog, setShowNewProjectDialog] = useState(false)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">المشاريع الممولة</h1>
          <p className="text-muted-foreground">إدارة المشاريع ذات الميزانيات المحددة مسبقاً</p>
        </div>
        <Button onClick={() => setShowNewProjectDialog(true)}>
          <Plus className="ml-2 h-4 w-4" />
          مشروع جديد
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المشاريع</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">+2 من ��لشهر الماضي</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">المشاريع النشطة</CardTitle>
            <FolderOpen className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">67% من إجمالي المشاريع</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الميزانيات</CardTitle>
            <FolderOpen className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₪ 450,000</div>
            <p className="text-xs text-muted-foreground">للمشاريع النشطة</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">المبلغ المستخدم</CardTitle>
            <FolderOpen className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₪ 287,500</div>
            <p className="text-xs text-muted-foreground">64% من إجمالي الميزانيات</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>البحث والتصفية</CardTitle>
          <CardDescription>ابحث عن المشاريع وقم بتصفيتها حسب الحالة والتاريخ</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 space-x-reverse">
            <div className="relative flex-1">
              <Search className="absolute right-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="البحث في المشاريع..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-8"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Projects Table */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة المشاريع</CardTitle>
          <CardDescription>جميع المشاريع الممولة مع تفاصيل الميزانيات والمصروفات</CardDescription>
        </CardHeader>
        <CardContent>
          <BudgetedProjectsTable searchTerm={searchTerm} />
        </CardContent>
      </Card>

      {/* New Project Dialog */}
      <NewBudgetedProjectDialog open={showNewProjectDialog} onOpenChange={setShowNewProjectDialog} />
    </div>
  )
}
