"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Eye, ChevronDown, ChevronRight, Users, Phone, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import api from "@/lib/api"
import { ViewOrphanDialog } from "./view-orphan-dialog"

interface Orphan {
  id: number
  full_name: string
  first_name: string
  last_name: string
  age: number
  gender: string
  birth_date: string
  education_level: string
  health_status: string
  created_at: string
  updated_at: string
}

interface WidowGroup {
  widow: {
    id: number
    full_name: string
    phone: string
    neighborhood: string
  }
  orphans: Orphan[]
}

interface OrphansTableProps {
  searchTerm: string
  filters?: any
}

export function OrphansTable({ searchTerm, filters = {} }: OrphansTableProps) {
  const [orphanGroups, setOrphanGroups] = useState<WidowGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalGroups, setTotalGroups] = useState(0)
  const [selectedOrphan, setSelectedOrphan] = useState<any>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [expandedGroups, setExpandedGroups] = useState<Set<number>>(new Set())
  const { toast } = useToast()
  
  const itemsPerPage = 15

  const fetchOrphans = async () => {
    try {
      setLoading(true)
      const queryParams = {
        search: searchTerm || undefined,
        per_page: itemsPerPage,
        page: currentPage,
        ...filters,
      }

      const response = await api.getOrphans(queryParams)
      
      setOrphanGroups(response.data || [])
      if (response.meta) {
        setTotalPages(response.meta.last_page)
        setTotal(response.meta.total)
        setTotalGroups(response.meta.total_groups || 0)
      }
    } catch (error: any) {
      toast({
        title: "خطأ في تحميل البيانات",
        description: error.message || "فشل في تحميل بيانات الأيتام",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrphans()
  }, [currentPage, searchTerm, filters])

  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1)
    }
  }, [searchTerm, filters])

  const handleView = async (orphan: Orphan, widowInfo: any) => {
    try {
      const response = await api.getOrphan(orphan.id)
      setSelectedOrphan(response.data)
      setIsViewDialogOpen(true)
    } catch (error: any) {
      toast({
        title: "خطأ في تحميل البيانات",
        description: error.message || "فشل في تحميل تفاصيل اليتيم",
        variant: "destructive",
      })
    }
  }

  const toggleGroup = (widowId: number) => {
    const newExpanded = new Set(expandedGroups)
    if (newExpanded.has(widowId)) {
      newExpanded.delete(widowId)
    } else {
      newExpanded.add(widowId)
    }
    setExpandedGroups(newExpanded)
  }

  const expandAll = () => {
    const allWidowIds = new Set(orphanGroups.map(group => group.widow.id))
    setExpandedGroups(allWidowIds)
  }

  const collapseAll = () => {
    setExpandedGroups(new Set())
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin ml-2" />
        <span>جاري تحميل بيانات الأيتام...</span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <p className="text-sm text-muted-foreground">
            {totalGroups} أسرة تضم {total} يتيم
          </p>
        </div>
        
        {orphanGroups.length > 0 && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={expandAll}>
              توسيع الكل
            </Button>
            <Button variant="outline" size="sm" onClick={collapseAll}>
              طي الكل
            </Button>
          </div>
        )}
      </div>

      {orphanGroups.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <div className="flex flex-col items-center gap-2">
            <Users className="h-12 w-12 text-muted-foreground/50" />
            <p>لا توجد بيانات أيتام</p>
            {searchTerm && (
              <p className="text-sm">
                لم يتم العثور على نتائج للبحث: "{searchTerm}"
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {orphanGroups.map((group) => (
            <Card key={group.widow.id}>
              <Collapsible 
                open={expandedGroups.has(group.widow.id)}
                onOpenChange={() => toggleGroup(group.widow.id)}
              >
                <CollapsibleTrigger asChild>
                  <CardHeader className="hover:bg-muted/50 cursor-pointer transition-colors">
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {expandedGroups.has(group.widow.id) ? (
                          <ChevronDown className="h-5 w-5" />
                        ) : (
                          <ChevronRight className="h-5 w-5" />
                        )}
                        <Users className="h-5 w-5" />
                        <div>
                          <div className="text-right">{group.widow.full_name}</div>
                          <div className="text-sm text-muted-foreground font-normal flex items-center gap-2">
                            {group.widow.phone && (
                              <>
                                <Phone className="h-4 w-4" />
                                {group.widow.phone}
                              </>
                            )}
                            {group.widow.neighborhood && (
                              <>
                                {group.widow.phone && <span>•</span>}
                                {group.widow.neighborhood}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">
                          {group.orphans.length} {group.orphans.length === 1 ? 'يتيم' : 'أيتام'}
                        </Badge>
                      </div>
                    </CardTitle>
                  </CardHeader>
                </CollapsibleTrigger>
                
                <CollapsibleContent>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-right">اسم اليتيم</TableHead>
                          <TableHead className="text-right">العمر</TableHead>
                          <TableHead className="text-right">الجنس</TableHead>
                          <TableHead className="text-right">المستوى التعليمي</TableHead>
                          <TableHead className="text-right">الحالة الصحية</TableHead>
                          <TableHead className="text-center">الإجراءات</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {group.orphans.map((orphan) => (
                          <TableRow key={orphan.id}>
                            <TableCell className="font-medium text-right">
                              {orphan.full_name}
                            </TableCell>
                            <TableCell className="text-right">
                              {orphan.age} سنة
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge variant={orphan.gender === 'male' ? 'default' : 'secondary'}>
                                {orphan.gender === 'male' ? 'ذكر' : 'أنثى'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              {orphan.education_level || 'غير محدد'}
                            </TableCell>
                            <TableCell className="text-right">
                              {orphan.health_status || 'لا يوجد'}
                            </TableCell>
                            <TableCell className="text-center">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleView(orphan, group.widow)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2 space-x-reverse">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage <= 1}
          >
            السابق
          </Button>
          
          <div className="flex items-center space-x-2 space-x-reverse">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const page = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i
              return (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                  className="w-8"
                >
                  {page}
                </Button>
              )
            })}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage >= totalPages}
          >
            التالي
          </Button>
        </div>
      )}

      {/* View Dialog */}
      <ViewOrphanDialog
        orphan={selectedOrphan}
        open={isViewDialogOpen}
        onOpenChange={setIsViewDialogOpen}
      />
    </div>
  )
}