"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Search, Filter } from "lucide-react"
import { WidowsTable } from "@/components/widows/widows-table"
import { WidowFilters } from "@/components/widows/widow-filters"
import { AddWidowDialog } from "@/components/widows/add-widow-dialog"
import { ExportWidows } from "@/components/widows/export-widows"
import { useToast } from "@/hooks/use-toast"
import api from "@/lib/api"

export default function WidowsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [filters, setFilters] = useState({})
  const [allWidows, setAllWidows] = useState<any[]>([])
  const [loadingExport, setLoadingExport] = useState(false)
  const { toast } = useToast()

  // Fetch all widows for export purposes
  useEffect(() => {
    const fetchAllWidows = async () => {
      try {
        setLoadingExport(true)
        const response = await api.getWidows({
          search: searchTerm || undefined,
          per_page: 1000, // Fetch large number for export
          ...filters
        })
        setAllWidows(response.data || [])
      } catch (error: any) {
        console.error('Error fetching widows for export:', error)
      } finally {
        setLoadingExport(false)
      }
    }

    fetchAllWidows()
  }, [searchTerm, filters, refreshTrigger])

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">إدارة الأرامل</h1>
          <p className="text-gray-600 mt-2">إدارة وتتبع بيانات الأرامل والمساعدات</p>
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
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
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

      {/* Widows Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>قائمة الأرامل</CardTitle>
            <ExportWidows
              widows={allWidows}
              filters={filters}
              searchTerm={searchTerm}
            />
          </div>
        </CardHeader>
        <CardContent>
          <WidowsTable searchTerm={searchTerm} filters={filters} refreshTrigger={refreshTrigger} />
        </CardContent>
      </Card>

      <AddWidowDialog 
        open={showAddDialog} 
        onOpenChange={setShowAddDialog} 
        onSuccess={() => setRefreshTrigger(prev => prev + 1)}
      />
    </div>
  )
}
