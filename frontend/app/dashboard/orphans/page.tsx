"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Search, Filter } from "lucide-react"
import { OrphansTable } from "@/components/orphans/orphans-table"
import { OrphanFilters } from "@/components/orphans/orphan-filters"
import { AddOrphanDialog } from "@/components/orphans/add-orphan-dialog"

export default function OrphansPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  const [showAddDialog, setShowAddDialog] = useState(false)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">إدارة الأيتام</h1>
          <p className="text-gray-600 mt-2">إدارة وتتبع بيانات الأيتام والرعاية</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4 ml-2" />
          إضافة يتيم جديد
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="البحث في الأيتام..."
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
            <OrphanFilters />
          </CardContent>
        )}
      </Card>

      {/* Orphans Table */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة الأيتام</CardTitle>
        </CardHeader>
        <CardContent>
          <OrphansTable searchTerm={searchTerm} />
        </CardContent>
      </Card>

      <AddOrphanDialog open={showAddDialog} onOpenChange={setShowAddDialog} />
    </div>
  )
}
