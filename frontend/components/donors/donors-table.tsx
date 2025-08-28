"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Eye, Edit, Trash2, Phone, Mail, Loader2 } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import api from "@/lib/api"
import { ViewDonorDialog } from "./view-donor-dialog"
import { EditDonorDialog } from "./edit-donor-dialog"
import { EditKafilSheet } from "../kafils/edit-kafil-sheet"
import { ViewKafilDialog } from "../kafils/view-kafil-dialog"

interface Donor {
  id: number
  first_name: string
  last_name: string
  phone: string
  email: string
  address?: string
  is_kafil: boolean
  total_given: number
  kafil?: {
    id: number
    monthly_pledge: number
    sponsorships: Array<{
      id: number
      widow: {
        id: number
        first_name: string
        last_name: string
        full_name: string
      }
    }>
  }
  created_at: string
  updated_at: string
}

interface DonorsTableProps {
  searchTerm: string
  isKafilFilter: boolean | null
  refreshTrigger?: number
}

export function DonorsTable({ searchTerm, isKafilFilter, refreshTrigger }: DonorsTableProps) {
  const [donors, setDonors] = useState<Donor[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [selectedDonor, setSelectedDonor] = useState<Donor | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isViewKafilDialogOpen, setIsViewKafilDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isEditKafilSheetOpen, setIsEditKafilSheetOpen] = useState(false)
  const itemsPerPage = 10
  const { toast } = useToast()

  const fetchDonors = async () => {
    try {
      setLoading(true)
      const response = await api.getDonors({
        search: searchTerm || undefined,
        per_page: itemsPerPage,
        page: currentPage,
      })

      setDonors(response.data)
      if (response.meta) {
        setTotalPages(response.meta.last_page)
        setTotal(response.meta.total)
      }
    } catch (error: any) {
      toast({
        title: "خطأ في تحميل البيانات",
        description: error.message || "فشل في تحميل بيانات المتبرعين",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDonors()
  }, [currentPage, searchTerm, refreshTrigger])

  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1)
    }
  }, [searchTerm])

  const handleView = (donor: Donor) => {
    setSelectedDonor(donor)
    if (donor.is_kafil && donor.kafil) {
      // Use kafil view dialog for kafils
      setIsViewKafilDialogOpen(true)
    } else {
      // Use donor view dialog for regular donors
      setIsViewDialogOpen(true)
    }
  }

  const handleEdit = (donor: Donor) => {
    setSelectedDonor(donor)
    if (donor.is_kafil && donor.kafil) {
      // Use kafil edit sheet for kafils
      setIsEditKafilSheetOpen(true)
    } else {
      // Use donor edit dialog for regular donors
      setIsEditDialogOpen(true)
    }
  }

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`هل أنت متأكد من حذف المتبرع "${name}"؟`)) {
      return
    }

    try {
      await api.deleteDonor(id)
      toast({
        title: "تم الحذف بنجاح",
        description: `تم حذف المتبرع "${name}" بنجاح`,
      })
      fetchDonors()
    } catch (error: any) {
      toast({
        title: "خطأ في الحذف",
        description: error.message || "فشل في حذف المتبرع",
        variant: "destructive",
      })
    }
  }

  // Filter donors client-side for Kafil filter if needed
  const filteredDonors = donors.filter((donor) => {
    if (isKafilFilter === null) return true
    return donor.is_kafil === isKafilFilter
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin ml-2" />
        <span>جاري تحميل بيانات المتبرعين...</span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          عرض {filteredDonors.length} من أصل {total} متبرع
        </p>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">الاسم</TableHead>
              <TableHead className="text-right">الهاتف</TableHead>
              <TableHead className="text-right">البريد الإلكتروني</TableHead>
              <TableHead className="text-right">كفيل</TableHead>
              <TableHead className="text-right">إجمالي التبرعات</TableHead>
              <TableHead className="text-right">التعهد الشهري</TableHead>
              <TableHead className="text-center">الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredDonors.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <div className="text-muted-foreground">
                    لا توجد بيانات متبرعين
                    {searchTerm && (
                      <p className="text-sm mt-1">
                        لم يتم العثور على نتائج للبحث: "{searchTerm}"
                      </p>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredDonors.map((donor) => (
                <TableRow key={donor.id}>
                  <TableCell className="font-medium text-right">
                    {donor.first_name} {donor.last_name}
                  </TableCell>
                  <TableCell className="text-right">
                    {donor.phone && (
                      <div className="flex items-center justify-end gap-2">
                        <span>{donor.phone}</span>
                        <Phone className="h-4 w-4 text-gray-400" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {donor.email ? (
                      <div className="flex items-center justify-end gap-2">
                        <span>{donor.email}</span>
                        <Mail className="h-4 w-4 text-gray-400" />
                      </div>
                    ) : (
                      <span className="text-gray-400">غير محدد</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center gap-2 justify-end">
                      {donor.is_kafil && <Badge variant="secondary">كفيل</Badge>}
                      <Checkbox checked={donor.is_kafil} disabled />
                    </div>
                  </TableCell>
                  <TableCell className="font-bold text-green-600 text-right">
                    DH {donor.total_given?.toLocaleString() || '0'}
                  </TableCell>
                  <TableCell className="text-right">
                    {donor.kafil?.monthly_pledge ? (
                      <span className="text-blue-600 font-medium">DH {donor.kafil.monthly_pledge}</span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Button size="sm" variant="outline" className="h-8 w-8 p-0" onClick={() => handleView(donor)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" className="h-8 w-8 p-0" onClick={() => handleEdit(donor)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-8 w-8 p-0 hover:bg-destructive hover:text-destructive-foreground"
                        onClick={() => handleDelete(donor.id, `${donor.first_name} ${donor.last_name}`)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
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
      <ViewDonorDialog
        donor={selectedDonor}
        open={isViewDialogOpen}
        onOpenChange={setIsViewDialogOpen}
      />

      {/* View Kafil Dialog */}
      <ViewKafilDialog
        kafilId={selectedDonor?.kafil?.id}
        open={isViewKafilDialogOpen}
        onOpenChange={setIsViewKafilDialogOpen}
        onEdit={(kafilId) => {
          setIsViewKafilDialogOpen(false)
          setIsEditKafilSheetOpen(true)
        }}
      />

      {/* Edit Dialog */}
      <EditDonorDialog
        donor={selectedDonor}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSuccess={() => {
          fetchDonors()
          setIsEditDialogOpen(false)
        }}
      />

      {/* Edit Kafil Sheet */}
      <EditKafilSheet
        kafilId={selectedDonor?.kafil?.id}
        open={isEditKafilSheetOpen}
        onOpenChange={setIsEditKafilSheetOpen}
        onSuccess={() => {
          fetchDonors()
          setIsEditKafilSheetOpen(false)
        }}
      />
    </div>
  )
}