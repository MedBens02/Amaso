"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Search, Filter, Users } from "lucide-react"
import { DonorsTable } from "@/components/donors/donors-table"
import { AddDonorSheet } from "@/components/donors/add-donor-sheet"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

export default function DonorsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  const [showAddSheet, setShowAddSheet] = useState(false)
  const [isKafilFilter, setIsKafilFilter] = useState<boolean | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [convertDonorData, setConvertDonorData] = useState<any>(null)

  useEffect(() => {
    const handleConvertToKafil = (event: CustomEvent) => {
      const { donor } = event.detail
      setConvertDonorData(donor)
      setShowAddSheet(true)
    }

    window.addEventListener('convertToKafil', handleConvertToKafil as EventListener)
    
    return () => {
      window.removeEventListener('convertToKafil', handleConvertToKafil as EventListener)
    }
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="h-8 w-8" />
            إدارة المتبرعين والكفلاء
          </h1>
          <p className="text-gray-600 mt-2">إدارة وتتبع المتبرعين والكفلاء ومساهماتهم</p>
        </div>
        <Button onClick={() => setShowAddSheet(true)}>
          <Plus className="h-4 w-4 ml-2" />
          إضافة متبرع جديد
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="البحث في المتبرعين (الاسم أو الهاتف)..."
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
            <div className="flex items-center space-x-4 space-x-reverse">
              <div className="flex items-center space-x-2 space-x-reverse">
                <Switch
                  id="kafil-filter"
                  checked={isKafilFilter === true}
                  onCheckedChange={(checked) => setIsKafilFilter(checked ? true : null)}
                />
                <Label htmlFor="kafil-filter">الكفلاء فقط</Label>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsKafilFilter(null)
                  setSearchTerm("")
                }}
              >
                إعادة تعيين
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Donors Table */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة المتبرعين والكفلاء</CardTitle>
        </CardHeader>
        <CardContent>
          <DonorsTable 
            searchTerm={searchTerm} 
            isKafilFilter={isKafilFilter} 
            refreshTrigger={refreshTrigger}
          />
        </CardContent>
      </Card>

      <AddDonorSheet 
        open={showAddSheet} 
        onOpenChange={(open) => {
          setShowAddSheet(open)
          if (!open) {
            setConvertDonorData(null) // Clear convert data when sheet closes
          }
        }}
        onSuccess={() => {
          setRefreshTrigger(prev => prev + 1)
          setConvertDonorData(null)
        }}
        convertDonorData={convertDonorData}
      />
    </div>
  )
}
