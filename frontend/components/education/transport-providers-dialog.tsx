"use client"

import { useEffect, useState } from "react"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RowActions } from "@/components/ui/row-actions"
import { useToast } from "@/hooks/use-toast"
import { Bus, Plus, Loader2, Edit, Trash2 } from "lucide-react"
import api from "@/lib/api"

/**
 * Who carries the children.
 *
 * A dialog rather than a fifth tab on the education page: transporters are
 * set up once and then only picked from, so the screen that manages them
 * belongs next to the screen that uses them, not beside it.
 */

export const PROVIDER_TYPES: Record<string, string> = {
  association: "حافلة الجمعية",
  contractor: "ناقل متعاقد",
  school: "نقل المؤسسة",
  other: "أخرى",
}

export interface TransportProvider {
  id: number
  name: string
  type: string
  type_label?: string
  contact_name?: string | null
  phone?: string | null
  is_active: boolean
  notes?: string | null
  routes_count?: number
  subscriptions_count?: number
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Bumped by the caller so the transport screen reloads its provider list. */
  onChanged?: () => void
}

export function TransportProvidersDialog({ open, onOpenChange, onChanged }: Props) {
  const [providers, setProviders] = useState<TransportProvider[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<TransportProvider | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  const [name, setName] = useState("")
  const [type, setType] = useState("contractor")
  const [contactName, setContactName] = useState("")
  const [phone, setPhone] = useState("")
  const [isActive, setIsActive] = useState(true)
  const [notes, setNotes] = useState("")

  const load = async () => {
    try {
      setLoading(true)
      const response = await api.getTransportProviders()
      setProviders(response.data || [])
    } catch (error: any) {
      toast({ title: "خطأ", description: error.message || "فشل في تحميل الناقلين", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) {
      load()
      setShowForm(false)
    }
  }, [open])

  const openForm = (provider?: TransportProvider) => {
    setEditing(provider || null)
    setName(provider?.name || "")
    setType(provider?.type || "contractor")
    setContactName(provider?.contact_name || "")
    setPhone(provider?.phone || "")
    setIsActive(provider?.is_active ?? true)
    setNotes(provider?.notes || "")
    setShowForm(true)
  }

  const save = async () => {
    if (!name.trim()) {
      toast({ title: "خطأ", description: "اسم الناقل مطلوب", variant: "destructive" })
      return
    }

    setSaving(true)
    try {
      const payload = {
        name: name.trim(),
        type,
        contact_name: contactName.trim() || null,
        phone: phone.trim() || null,
        is_active: isActive,
        notes: notes.trim() || null,
      }

      const response = editing
        ? await api.updateTransportProvider(editing.id, payload)
        : await api.createTransportProvider(payload)

      toast({ title: "تم", description: (response as any).message })
      setShowForm(false)
      await load()
      onChanged?.()
    } catch (error: any) {
      toast({ title: "خطأ", description: error.message || "فشل في الحفظ", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const remove = async (provider: TransportProvider) => {
    try {
      const response = await api.deleteTransportProvider(provider.id)
      toast({ title: "تم", description: (response as any).message })
      await load()
      onChanged?.()
    } catch (error: any) {
      toast({ title: "تعذر الحذف", description: error.message, variant: "destructive" })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bus className="h-5 w-5" />
            الناقلون
          </DialogTitle>
          <DialogDescription>
            الجهات التي تتولى نقل المستفيدين: حافلة الجمعية، ناقل متعاقد، أو حافلة المؤسسة التعليمية
          </DialogDescription>
        </DialogHeader>

        {showForm ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>اسم الناقل *</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="نقل الأمل للنقل المدرسي" />
              </div>
              <div className="space-y-2">
                <Label>النوع *</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(PROVIDER_TYPES).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>الشخص المسؤول / السائق</Label>
                <Input value={contactName} onChange={(e) => setContactName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>الهاتف</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} dir="ltr" className="text-right" />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label>نشط</Label>
                <p className="text-xs text-muted-foreground">
                  الناقل غير النشط لا يظهر عند إنشاء مسار جديد، لكن سجلاته السابقة تبقى
                </p>
              </div>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>

            <div className="space-y-2">
              <Label>ملاحظات</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setShowForm(false)} disabled={saving}>إلغاء</Button>
              <Button onClick={save} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
                {editing ? "حفظ التعديلات" : "إضافة"}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button size="sm" onClick={() => openForm()}>
                <Plus className="h-4 w-4 ml-1" />
                ناقل جديد
              </Button>
            </div>

            {loading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
            ) : providers.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">لم يتم تسجيل أي ناقل بعد</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>الاسم</TableHead>
                      <TableHead>النوع</TableHead>
                      <TableHead>المسؤول</TableHead>
                      <TableHead>الهاتف</TableHead>
                      <TableHead>المسارات</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {providers.map((provider) => (
                      <TableRow key={provider.id} className={provider.is_active ? "" : "opacity-60"}>
                        <TableCell className="font-medium">
                          {provider.name}
                          {!provider.is_active && <Badge variant="outline" className="mr-2">غير نشط</Badge>}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{provider.type_label || PROVIDER_TYPES[provider.type]}</Badge>
                        </TableCell>
                        <TableCell>{provider.contact_name || "—"}</TableCell>
                        <TableCell dir="ltr" className="text-right">{provider.phone || "—"}</TableCell>
                        <TableCell>{provider.routes_count ?? 0}</TableCell>
                        <TableCell>
                          <RowActions
                            actions={[
                              { label: "تعديل", icon: Edit, onSelect: () => openForm(provider) },
                              { label: "حذف", icon: Trash2, onSelect: () => remove(provider), destructive: true },
                            ]}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
