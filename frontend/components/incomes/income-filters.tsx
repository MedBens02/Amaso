"use client"

import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { ar } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { useState } from "react"

export function IncomeFilters() {
  const [dateFrom, setDateFrom] = useState<Date>()
  const [dateTo, setDateTo] = useState<Date>()

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="space-y-2">
        <Label>من تاريخ</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn("w-full justify-start text-left font-normal", !dateFrom && "text-muted-foreground")}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateFrom ? format(dateFrom, "PPP", { locale: ar }) : "اختر التاريخ"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} initialFocus />
          </PopoverContent>
        </Popover>
      </div>

      <div className="space-y-2">
        <Label>إلى تاريخ</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn("w-full justify-start text-left font-normal", !dateTo && "text-muted-foreground")}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateTo ? format(dateTo, "PPP", { locale: ar }) : "اختر التاريخ"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="single" selected={dateTo} onSelect={setDateTo} initialFocus />
          </PopoverContent>
        </Popover>
      </div>

      <div className="space-y-2">
        <Label>الميزانية الفرعية</Label>
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="اختر الميزانية" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع الميزانيات</SelectItem>
            <SelectItem value="monthly-aid">المساعدات الشهرية</SelectItem>
            <SelectItem value="education">التعليم</SelectItem>
            <SelectItem value="emergency">الطوارئ</SelectItem>
            <SelectItem value="medical">الطبية</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>طريقة الدفع</Label>
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="اختر الطريقة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع الطرق</SelectItem>
            <SelectItem value="cash">نقدي</SelectItem>
            <SelectItem value="cheque">شيك</SelectItem>
            <SelectItem value="bank-wire">حوالة بنكية</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
