"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Eye, Edit, Trash2, Phone, Mail, Loader2, Users, ChevronUp, ChevronDown, ChevronsUpDown, Printer, Archive, ArchiveRestore, FileText } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import api from "@/lib/api"
import { ViewWidowDialog } from "./view-widow-dialog"
import { EditWidowDialog } from "./edit-widow-dialog"
import { WidowCardPrintDialog } from "./print-widow-pdf"
import { ArchiveWidowDialog } from "./archive-widow-dialog"

interface Widow {
  id: number
  first_name: string
  last_name: string
  full_name: string
  phone: string
  email: string
  address?: string
  neighborhood?: string
  admission_date: string
  national_id: string
  birth_date: string
  age: number
  marital_status: string
  education_level?: string
  disability_flag: boolean
  disability_type?: string
  created_at: string
  updated_at: string
  orphans?: Array<{
    id: number
    first_name: string
    last_name: string
    birth_date: string
    age: number
  }>
  sponsorships?: Array<{
    id: number
    amount: number
    kafil?: {
      id: number
      first_name: string
      last_name: string
      phone: string
      monthly_pledge: number
      donor?: {
        id: number
        first_name: string
        last_name: string
      }
    }
  }>
  orphans_count?: number
  sponsorships_count?: number
  total_sponsorship_amount?: number
}

interface WidowsTableProps {
  searchTerm: string
  filters?: any
  refreshTrigger?: number
  archived?: boolean
}


export function WidowsTable({ 
  searchTerm, 
  filters = {}, 
  refreshTrigger,
  archived = false,
}: WidowsTableProps) {
  const [widows, setWidows] = useState<Widow[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [selectedWidow, setSelectedWidow] = useState<Widow | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [archiveTarget, setArchiveTarget] = useState<{ id: number; name: string } | null>(null)
  const [printWidow, setPrintWidow] = useState<any | null>(null)
  const [sortBy, setSortBy] = useState<string>('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const itemsPerPage = 10
  const { toast } = useToast()

  const fetchWidows = async () => {
    try {
      setLoading(true)
      // Prepare query parameters, filtering out empty values
      const queryParams = {
        search: searchTerm || undefined,
        per_page: itemsPerPage,
        page: currentPage,
        sort_by: sortBy,
        sort_order: sortOrder,
        archived: archived || undefined,
        // Add all filter parameters, converting boolean strings to actual booleans
        ...(filters.has_disability && filters.has_disability !== "all" && { has_disability: filters.has_disability === "true" }),
        ...(filters.education_level && filters.education_level !== "all" && { education_level: filters.education_level }),
        ...(filters.illness_id && filters.illness_id !== "all" && { illness_id: parseInt(filters.illness_id) }),
        ...(filters.aid_type_id && filters.aid_type_id !== "all" && { aid_type_id: parseInt(filters.aid_type_id) }),
        ...(filters.skill_id && filters.skill_id !== "all" && { skill_id: parseInt(filters.skill_id) }),
        ...(filters.has_kafil && filters.has_kafil !== "all" && { has_kafil: filters.has_kafil === "true" }),
        ...(filters.has_chronic_illness && filters.has_chronic_illness !== "all" && { has_chronic_illness: filters.has_chronic_illness === "true" }),
        ...(filters.has_active_maouna && filters.has_active_maouna !== "all" && { has_active_maouna: filters.has_active_maouna === "true" }),
        ...(filters.maouna_partner_id && filters.maouna_partner_id !== "all" && { maouna_partner_id: parseInt(filters.maouna_partner_id) }),
      }

      const response = await api.getWidows(queryParams)

      setWidows(response.data)
      if (response.meta) {
        setTotalPages(response.meta.last_page)
        setTotal(response.meta.total)
      }
    } catch (error: any) {
      toast({
        title: "خطأ في تحميل البيانات",
        description: error.message || "فشل في تحميل بيانات الأرامل",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWidows()
  }, [currentPage, searchTerm, filters, refreshTrigger, sortBy, sortOrder, archived])

  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1)
    }
  }, [searchTerm, filters])

  const handleView = async (widow: Widow) => {
    try {
      // Fetch detailed widow data with all relationships
      const response = await api.getWidow(widow.id)
      setSelectedWidow(response.data)
      setIsViewDialogOpen(true)
    } catch (error: any) {
      toast({
        title: "خطأ في تحميل البيانات",
        description: error.message || "فشل في تحميل تفاصيل الأرملة",
        variant: "destructive",
      })
    }
  }

  /** Everything the association has done for this family, over the current year. */
  const handleFamilyReport = async (widow: Widow) => {
    try {
      await api.downloadPdf(`/reports/families/${widow.id}/financial.pdf`)
      toast({ title: "تم تحميل التقرير المالي للأسرة" })
    } catch (error: any) {
      toast({
        title: "خطأ في إنشاء التقرير",
        description: error?.message || "حدث خطأ أثناء إنشاء الملف",
        variant: "destructive",
      })
    }
  }

  const handleEdit = async (widow: Widow) => {
    try {
      // Fetch detailed widow data with all relationships for editing
      const response = await api.getWidow(widow.id)
      setSelectedWidow(response.data)
      setIsEditDialogOpen(true)
    } catch (error: any) {
      toast({
        title: "خطأ في تحميل البيانات",
        description: error.message || "فشل في تحميل تفاصيل الأرملة للتعديل",
        variant: "destructive",
      })
    }
  }

  const handlePrint = async (widow: Widow) => {
    try {
      // Fetch detailed widow data, then open the print dialog where the
      // user picks which sections to include in the card.
      const response = await api.getWidow(widow.id)
      setPrintWidow(response.data)
    } catch (error: any) {
      toast({
        title: "خطأ في الطباعة",
        description: error.message || "فشل في طباعة بطاقة الأرملة",
        variant: "destructive",
      })
    }
  }

  const handleRestore = async (id: number, name: string) => {
    if (!confirm(`استعادة ملف "${name}" إلى القائمة النشطة؟`)) {
      return
    }

    try {
      const response = await api.restoreWidow(id)
      toast({
        title: "تمت الاستعادة",
        description: response.message || `تمت استعادة ملف "${name}" بنجاح`,
      })
      fetchWidows()
    } catch (error: any) {
      toast({
        title: "خطأ في الاستعادة",
        description: error.message || "فشل في استعادة الملف",
        variant: "destructive",
      })
    }
  }

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortOrder('asc')
    }
  }

  const getSortIcon = (column: string) => {
    if (sortBy !== column) {
      return <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />
    }
    return sortOrder === 'asc' 
      ? <ChevronUp className="h-4 w-4" />
      : <ChevronDown className="h-4 w-4" />
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin ml-2" />
        <span>جاري تحميل بيانات الأرامل...</span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          عرض {widows.length} من أصل {total} أرملة
        </p>
      </div>

      <div className="rounded-md border overflow-x-auto">
        <Table className="min-w-full">
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">
                <Button
                  variant="ghost"
                  onClick={() => handleSort('first_name')}
                  className="h-auto p-0 font-medium hover:bg-transparent"
                >
                  <span className="ml-2">الاسم</span>
                  {getSortIcon('first_name')}
                </Button>
              </TableHead>
              <TableHead className="text-right">
                <Button
                  variant="ghost"
                  onClick={() => handleSort('birth_date')}
                  className="h-auto p-0 font-medium hover:bg-transparent"
                >
                  <span className="ml-2">العمر</span>
                  {getSortIcon('birth_date')}
                </Button>
              </TableHead>
              <TableHead className="text-right">
                <Button
                  variant="ghost"
                  onClick={() => handleSort('neighborhood')}
                  className="h-auto p-0 font-medium hover:bg-transparent"
                >
                  <span className="ml-2">الحي</span>
                  {getSortIcon('neighborhood')}
                </Button>
              </TableHead>
              <TableHead className="text-right">عدد الأيتام</TableHead>
              <TableHead className="text-right">الهاتف</TableHead>
              <TableHead className="text-right">
                <Button
                  variant="ghost"
                  onClick={() => handleSort('education_level')}
                  className="h-auto p-0 font-medium hover:bg-transparent"
                >
                  <span className="ml-2">الحالة التعليمية</span>
                  {getSortIcon('education_level')}
                </Button>
              </TableHead>
              <TableHead className="text-right">
                <Button
                  variant="ghost"
                  onClick={() => handleSort('disability_flag')}
                  className="h-auto p-0 font-medium hover:bg-transparent"
                >
                  <span className="ml-2">الإعاقة</span>
                  {getSortIcon('disability_flag')}
                </Button>
              </TableHead>
              <TableHead className="text-center w-[180px] min-w-[180px]">الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {widows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  <div className="text-muted-foreground">
                    لا توجد بيانات أرامل
                    {searchTerm && (
                      <p className="text-sm mt-1">
                        لم يتم العثور على نتائج للبحث: "{searchTerm}"
                      </p>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              widows.map((widow) => (
                <TableRow key={widow.id}>
                  <TableCell className="font-medium text-right">
                    {widow.full_name}
                    <br />
                    <span className="text-xs text-muted-foreground">
                      رقم البطاقة الوطنية: {widow.national_id}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">{Math.floor(widow.age)} سنة</TableCell>
                  <TableCell className="text-right">
                    {widow.neighborhood || "غير محدد"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center gap-1 justify-end">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{widow.orphans_count || 0}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {widow.phone ? (
                      <div className="flex items-center justify-end gap-2">
                        <span>{widow.phone}</span>
                        <Phone className="h-4 w-4 text-muted-foreground" />
                      </div>
                    ) : (
                      <span className="text-muted-foreground">غير محدد</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {widow.education_level ? (
                      <Badge variant="outline">{widow.education_level}</Badge>
                    ) : (
                      <span className="text-muted-foreground">غير محدد</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {widow.disability_flag ? (
                      <Badge variant="destructive">
                        {widow.disability_type || "إعاقة"}
                      </Badge>
                    ) : (
                      <Badge variant="secondary">لا توجد</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-center w-[180px] min-w-[180px]">
                    <div className="flex items-center justify-center gap-1 px-1 whitespace-nowrap">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-7 w-7 p-0 flex-shrink-0" 
                        onClick={() => handleView(widow)}
                        title="عرض التفاصيل"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      {!archived && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-7 w-7 p-0 flex-shrink-0" 
                          onClick={() => handleEdit(widow)}
                          title="تحرير البيانات"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-7 w-7 p-0 flex-shrink-0 hover:bg-blue-50 hover:text-blue-600"
                        onClick={() => handlePrint(widow)}
                        title="طباعة بطاقة الأرملة"
                      >
                        <Printer className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 w-7 p-0 flex-shrink-0 hover:bg-teal-50 hover:text-teal-700"
                        onClick={() => handleFamilyReport(widow)}
                        title="التقرير المالي للأسرة"
                      >
                        <FileText className="h-3.5 w-3.5" />
                      </Button>
                      {archived ? (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-7 w-7 p-0 flex-shrink-0 hover:bg-green-50 hover:text-green-600"
                          onClick={() => handleRestore(widow.id, widow.full_name)}
                          title="استعادة الملف"
                        >
                          <ArchiveRestore className="h-3.5 w-3.5" />
                        </Button>
                      ) : (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-7 w-7 p-0 flex-shrink-0 hover:bg-destructive hover:text-destructive-foreground"
                          onClick={() => setArchiveTarget({ id: widow.id, name: widow.full_name })}
                          title="أرشفة الملف (بدل الحذف)"
                        >
                          <Archive className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

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
      <ViewWidowDialog
        widow={selectedWidow}
        open={isViewDialogOpen}
        onOpenChange={setIsViewDialogOpen}
      />

      {/* Edit Dialog */}
      <WidowCardPrintDialog
        widow={printWidow}
        open={printWidow !== null}
        onOpenChange={(open) => !open && setPrintWidow(null)}
      />

      <ArchiveWidowDialog
        open={archiveTarget !== null}
        onOpenChange={(open) => !open && setArchiveTarget(null)}
        widowId={archiveTarget?.id ?? null}
        widowName={archiveTarget?.name ?? ""}
        onArchived={fetchWidows}
      />

      <EditWidowDialog
        widow={selectedWidow}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSuccess={() => {
          fetchWidows()
          setIsEditDialogOpen(false)
        }}
      />
    </div>
  )
}
