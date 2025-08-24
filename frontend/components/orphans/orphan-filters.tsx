import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function OrphanFilters() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="space-y-2">
        <Label htmlFor="neighborhood">الحي</Label>
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="اختر الحي" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع الأحياء</SelectItem>
            <SelectItem value="zahra">حي الزهراء</SelectItem>
            <SelectItem value="noor">حي النور</SelectItem>
            <SelectItem value="salam">حي السلام</SelectItem>
            <SelectItem value="amal">حي الأمل</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="gender">الجنس</Label>
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="اختر الجنس" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">الكل</SelectItem>
            <SelectItem value="male">ذكر</SelectItem>
            <SelectItem value="female">أنثى</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="age-range">الفئة العمرية</Label>
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="اختر الفئة العمرية" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع الأعمار</SelectItem>
            <SelectItem value="child">6-12 سنة</SelectItem>
            <SelectItem value="teen">13-18 سنة</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="status">الحالة</Label>
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="اختر الحالة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع الحالات</SelectItem>
            <SelectItem value="registered">مسجل</SelectItem>
            <SelectItem value="pending">معلق</SelectItem>
            <SelectItem value="graduated">متخرج</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
