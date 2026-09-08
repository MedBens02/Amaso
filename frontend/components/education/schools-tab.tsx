"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { School as SchoolIcon, Plus, Edit, Trash2, Loader2, Search } from "lucide-react"
import api from "@/lib/api"

interface School {
  id: number
  name: string
  type: "school" | "university"
  is_private: boolean
  is_amaso_linked: boolean
  notes?: string
  enrollments_count?: number
}

export function SchoolsTab() {
  const [schools, setSchools] = useState<School[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<School | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  // form state
  const [name, setName] = useState("")
  const [type, setType] = useState<"school" | "university">("school")
  const [isPrivate, setIsPrivate] = useState(false)
  const [isAmasoLinked, setIsAmasoLinked] = useState(false)
  const [notes, setNotes] = useState("")

  const fetchSchools = async () => {
    try {
      setLoading(true)
      const response = await api.getSchools({ search: search || undefined })
      setSchools(response.data || [])
    } catch (error: any) {
      toast({ title: "خطأ", description: error.message || "فشل في تحميل المؤسسات", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSchools()
  }, [search])

  const openDialog = (school?: School) => {
    setEditing(school || null)
    setName(school?.name || "")
    setType(school?.type || "school")
    setIsPrivate(school?.is_private || false)
    setIsAmasoLinked(school?.is_amaso_linked || false)
    setNotes(school?.notes || "")
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!name.trim()) {
      toast({ title: "خطأ", description: "اسم المؤسسة مطلوب", variant: "destructive" })
      return
    }

    setIsSubmitting(true)
    try {
      const payload = {
        name: name.trim(),
        type,
        is_private: isPrivate,
        is_amaso_linked: isPrivate && isAmasoLinked,
        notes: notes || undefined,
      }
      const response = editing
        ? await api.updateSchool(editing.id, payload)
        : await api.createSchool(payload)

      toast({ title: "تم الحفظ", description: response.message })
      setDialogOpen(false)
      fetchSchools()
    } catch (error: any) {
      toast({ title: "خطأ", description: error.message || "فشل في حفظ المؤسسة", variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (school: School) => {
    if (!confirm(`حذف المؤسسة "${school.name}"؟`)) return
    try {
      const response = await api.deleteSchool(school.id)
      toast({ title: "تم الحذف", description: response.message })
      fetchSchools()
    } catch (error: any) {
      toast({ title: "خطأ", description: error.message || "فشل في حذف المؤسسة", variant: "destructive" })
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <SchoolIcon className="h-5 w-5" />
            المؤسسات التعليمية
          </CardTitle>
          <Button size="sm" onClick={() => openDialog()}>
            <Plus className="h-4 w-4 ml-2" />
            إضافة مؤسسة
          </Button>
        </div>
        <div className="relative mt-2">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input placeholder="البحث في المؤسسات..." value={search} onChange={(e) => setSearch(e.target.value)} className="pr-10" />
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin ml-2" />
            <span>جاري التحميل...</span>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">الاسم</TableHead>
                <TableHead className="text-right">النوع</TableHead>
                <TableHead className="text-right">القطاع</TableHead>
                <TableHead className="text-right">شراكة AMASO</TableHead>
                <TableHead className="text-right">التسجيلات</TableHead>
                <TableHead className="text-center">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {schools.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                    لا توجد مؤسسات. أضف أول مؤسسة تعليمية.
                  </TableCell>
                </TableRow>
              ) : (
                schools.map((school) => (
                  <TableRow key={school.id}>
                    <TableCell className="font-medium">{school.name}</TableCell>
                    <TableCell>{school.type === "university" ? "جامعة / معهد عالي" : "مدرسة"}</TableCell>
                    <TableCell>
                      <Badge variant={school.is_private ? "default" : "secondary"}>
                        {school.is_private ? "خاصة" : "عمومية"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {school.is_amaso_linked ? (
                        <Badge className="bg-green-600 hover:bg-green-600">شريكة AMASO</Badge>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </TableCell>
                    <TableCell>{school.enrollments_count ?? 0}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button size="sm" variant="outline" className="h-7 w-7 p-0" onClick={() => openDialog(school)} title="تعديل">
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="sm" variant="outline" className="h-7 w-7 p-0 hover:bg-destructive hover:text-destructive-foreground" onClick={() => handleDelete(school)} title="حذف">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>{editing ? "تعديل مؤسسة" : "إضافة مؤسسة"}</DialogTitle>
            <DialogDescription>مدرسة أو جامعة يدرس بها الأيتام</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>اسم المؤسسة *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="مثال: مدرسة النور الخاصة" />
            </div>

            <div className="space-y-2">
              <Label>النوع *</Label>
              <Select value={type} onValueChange={(v) => setType(v as "school" | "university")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="school">مدرسة</SelectItem>
                  <SelectItem value="university">جامعة / معهد عالي</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Switch checked={isPrivate} onCheckedChange={setIsPrivate} id="is_private" />
              <Label htmlFor="is_private">مؤسسة خاصة</Label>
            </div>

            {isPrivate && (
              <div className="flex items-center gap-2">
                <Switch checked={isAmasoLinked} onCheckedChange={setIsAmasoLinked} id="is_amaso" />
                <Label htmlFor="is_amaso">مرتبطة بشراكة مع AMASO</Label>
              </div>
            )}

            <div className="space-y-2">
              <Label>ملاحظات</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>إلغاء</Button>
            <Button type="button" onClick={handleSave} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
              {editing ? "تحديث" : "إضافة"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
