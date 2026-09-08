"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { Archive, Loader2 } from "lucide-react"
import api from "@/lib/api"

interface ArchiveWidowDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  widowId: number | null
  widowName: string
  onArchived: () => void
}

/**
 * Archiving replaces deletion: the family is soft-deleted with a leaving
 * date and reason, disappears from the active list, and stays viewable
 * (and restorable) from the archived list.
 */
export function ArchiveWidowDialog({ open, onOpenChange, widowId, widowName, onArchived }: ArchiveWidowDialogProps) {
  const [leavingDate, setLeavingDate] = useState<string>(new Date().toISOString().split("T")[0])
  const [reason, setReason] = useState<string>("")
  const [details, setDetails] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleArchive = async () => {
    if (!widowId) return
    if (!leavingDate || !reason) {
      toast({
        title: "بيانات ناقصة",
        description: "تاريخ المغادرة وسبب المغادرة مطلوبان",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const response = await api.archiveWidow(widowId, {
        leaving_date: leavingDate,
        leaving_reason: reason,
        leaving_details: details || undefined,
      })

      toast({
        title: "تمت الأرشفة",
        description: response.message || `تمت أرشفة ملف "${widowName}" بنجاح`,
      })
      onOpenChange(false)
      setReason("")
      setDetails("")
      setLeavingDate(new Date().toISOString().split("T")[0])
      onArchived()
    } catch (error: any) {
      toast({
        title: "خطأ في الأرشفة",
        description: error.message || "فشل في أرشفة الملف",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Archive className="h-5 w-5" />
            أرشفة ملف "{widowName}"
          </DialogTitle>
          <DialogDescription>
            لن يتم حذف البيانات نهائياً — سيُنقل الملف إلى الأرشيف مع تسجيل تاريخ وسبب المغادرة،
            ويمكن الاطلاع عليه أو استعادته لاحقاً.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>تاريخ المغادرة *</Label>
            <Input type="date" value={leavingDate} onChange={(e) => setLeavingDate(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>سبب المغادرة *</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue placeholder="اختر السبب" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="graduated">تخرج — أنهى الأبناء دراستهم بنجاح</SelectItem>
                <SelectItem value="removed">إزالة — مغادرة المدينة، انقطاع عن الدراسة، أو سبب آخر</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>تفاصيل إضافية</Label>
            <Textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="مثال: غادرت العائلة إلى مدينة أخرى..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            إلغاء
          </Button>
          <Button type="button" variant="destructive" onClick={handleArchive} disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <Archive className="h-4 w-4 ml-2" />}
            أرشفة الملف
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
