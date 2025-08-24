import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function WidowFilters() {
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
        <Label htmlFor="status">الحالة</Label>
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="اختر الحالة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع الحالات</SelectItem>
            <SelectItem value="active">نشط</SelectItem>
            <SelectItem value="pending">معلق</SelectItem>
            <SelectItem value="inactive">غير نشط</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="aid-range">نطاق المساعدة</Label>
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="اختر النطاق" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع النطاقات</SelectItem>
            <SelectItem value="low">أقل من ₪ 400</SelectItem>
            <SelectItem value="medium">₪ 400 - ₪ 600</SelectItem>
            <SelectItem value="high">أكثر من ₪ 600</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="kafil">الكفيل</Label>
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="اختر الكفيل" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع الكفلاء</SelectItem>
            <SelectItem value="with-kafil">لديه كفيل</SelectItem>
            <SelectItem value="without-kafil">بدون كفيل</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
