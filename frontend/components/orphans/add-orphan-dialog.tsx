"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface AddOrphanDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddOrphanDialog({ open, onOpenChange }: AddOrphanDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    gender: "",
    motherName: "",
    school: "",
    grade: "",
    neighborhood: "",
    healthStatus: "",
    notes: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Form submitted:", formData)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>إضافة يتيم جديد</DialogTitle>
          <DialogDescription>أدخل المعلومات الأساسية لليتيم الجديد</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">اسم اليتيم</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="أدخل اسم اليتيم"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="age">العمر</Label>
              <Input
                id="age"
                type="number"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                placeholder="أدخل العمر"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="gender">الجنس</Label>
              <Select onValueChange={(value) => setFormData({ ...formData, gender: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الجنس" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">ذكر</SelectItem>
                  <SelectItem value="female">أنثى</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="motherName">اسم الأم</Label>
              <Input
                id="motherName"
                value={formData.motherName}
                onChange={(e) => setFormData({ ...formData, motherName: e.target.value })}
                placeholder="أدخل ا��م الأم"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="school">المدرسة</Label>
              <Input
                id="school"
                value={formData.school}
                onChange={(e) => setFormData({ ...formData, school: e.target.value })}
                placeholder="أدخل اسم المؤسسة "
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="grade">الصف الدراسي</Label>
              <Input
                id="grade"
                value={formData.grade}
                onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                placeholder="أدخل الصف الدراسي"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="neighborhood">الحي</Label>
            <Select onValueChange={(value) => setFormData({ ...formData, neighborhood: value })}>
              <SelectTrigger>
                <SelectValue placeholder="اختر الحي" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="zahra">حي الزهراء</SelectItem>
                <SelectItem value="noor">حي النور</SelectItem>
                <SelectItem value="salam">حي السلام</SelectItem>
                <SelectItem value="amal">حي الأمل</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="healthStatus">الحالة الصحية</Label>
            <Textarea
              id="healthStatus"
              value={formData.healthStatus}
              onChange={(e) => setFormData({ ...formData, healthStatus: e.target.value })}
              placeholder="اذكر الحالة الصحية إن وجدت"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">ملاحظات إضافية</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="أي ملاحظات إضافية"
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              إلغاء
            </Button>
            <Button type="submit">حفظ البيانات</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
