"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Search, Filter, Archive } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { WidowsTable } from "@/components/widows/widows-table"
import { WidowFilters } from "@/components/widows/widow-filters"
import { AddWidowDialog } from "@/components/widows/add-widow-dialog"
import { ReportExportButtons } from "@/components/reports/report-export-buttons"
import { useToast } from "@/hooks/use-toast"
import api from "@/lib/api"

export default function WidowsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [filters, setFilters] = useState({})
  const { toast } = useToast()


  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">إدارة الأرامل</h1>
          <p className="text-muted-foreground mt-2">إدارة وتتبع بيانات الأرامل والمساعدات</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4 ml-2" />
          إضافة أرملة جديدة
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="البحث في الأرامل..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>
            <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
              <Filter className="h-4 w-4 ml-2" />
              الفلاتر
            </Button>
          </div>
        </CardHeader>
        {showFilters && (
          <CardContent>
            <WidowFilters onFiltersChange={setFilters} initialFilters={filters} />
          </CardContent>
        )}
      </Card>

      {/* Widows Table: active families + archive */}
      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active">القائمة النشطة</TabsTrigger>
          <TabsTrigger value="archived" className="flex items-center gap-2">
            <Archive className="h-4 w-4" />
            المؤرشفات
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>قائمة الأرامل</CardTitle>
                <ReportExportButtons
                  endpoint="/reports/widows"
                  label="قائمة الأرامل"
                />
              </div>
            </CardHeader>
            <CardContent>
              <WidowsTable searchTerm={searchTerm} filters={filters} refreshTrigger={refreshTrigger} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="archived">
          <Card>
            <CardHeader>
              <CardTitle>الملفات المؤرشفة</CardTitle>
              <p className="text-sm text-muted-foreground">
                عائلات غادرت الجمعية (تخرج أو إزالة). تبقى بياناتها محفوظة للتقارير ويمكن استعادتها.
              </p>
            </CardHeader>
            <CardContent>
              <WidowsTable searchTerm={searchTerm} filters={filters} refreshTrigger={refreshTrigger} archived />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AddWidowDialog 
        open={showAddDialog} 
        onOpenChange={setShowAddDialog} 
        onSuccess={() => setRefreshTrigger(prev => prev + 1)}
      />
    </div>
  )
}
