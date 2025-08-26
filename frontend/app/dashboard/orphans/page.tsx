"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, Filter, Users, Info } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { OrphansTable } from "@/components/orphans/orphans-table"
import { OrphanFilters } from "@/components/orphans/orphan-filters"

export default function OrphansPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({})

  const handleFiltersChange = (newFilters: any) => {
    setFilters(newFilters)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="h-8 w-8" />
            إدارة الأيتام
          </h1>
          <p className="text-gray-600 mt-2">عرض وتتبع بيانات الأيتام مجمعة حسب الأسر</p>
        </div>
        
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            لإضافة أو تعديل بيانات الأيتام، يرجى استخدام صفحة إدارة الأرامل. الأيتام مرتبطون بسجلات أمهاتهم الأرامل.
          </AlertDescription>
        </Alert>
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
            <OrphanFilters onFiltersChange={handleFiltersChange} />
          </CardContent>
        )}
      </Card>

      {/* Orphans Table */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة الأيتام</CardTitle>
        </CardHeader>
        <CardContent>
          <OrphansTable searchTerm={searchTerm} filters={filters} />
        </CardContent>
      </Card>
    </div>
  )
}
