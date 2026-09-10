"use client"

import { Controller } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface School {
  id: number
  name: string
  type?: string
  is_private?: boolean
  is_amaso_linked?: boolean
}

interface ChildExtraFieldsProps {
  form: any // react-hook-form instance of the widow dialogs
  index: number
  /** Institutions from the education module - the family form writes the same records. */
  schools?: School[]
}

/**
 * Extra per-child fields shared by the add/edit widow dialogs:
 * contact (phone, CIN), work situation, marital status and the
 * education fields.
 *
 * The school and specialty here are not stored on the child: they open (or
 * update) that child's enrollment for the current academic year, which is
 * what the education page, the promotion rollover and the performance
 * reports all read. Keeping a second free-text school name on the orphan
 * would just be a copy that drifts.
 */
export function ChildExtraFields({ form, index, schools = [] }: ChildExtraFieldsProps) {
  const isWorking = form.watch(`children.${index}.isWorking`)
  const isSchooled = form.watch(`children.${index}.isSchooled`)
  const schoolId = form.watch(`children.${index}.school_id`)
  const selectedSchool = schools.find((school) => school.id.toString() === (schoolId || "").toString())
  const isHigherEducation = selectedSchool?.type === "university"

  return (
    <>
      {/* Contact & civil status */}
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>رقم الهاتف</Label>
          <Input {...form.register(`children.${index}.phone`)} placeholder="رقم هاتف الطفل" type="tel" />
        </div>
        <div className="space-y-2">
          <Label>رقم البطاقة الوطنية (CIN)</Label>
          <Input {...form.register(`children.${index}.cin`)} placeholder="CIN" />
        </div>
        <div className="flex items-center gap-2 pt-7">
          <Controller
            name={`children.${index}.isMarried`}
            control={form.control}
            render={({ field }) => (
              <Switch checked={field.value || false} onCheckedChange={field.onChange} />
            )}
          />
          <Label>متزوج/ة</Label>
        </div>
      </div>

      {/* Work situation */}
      <div className="grid grid-cols-3 gap-4 items-end">
        <div className="flex items-center gap-2 pb-2">
          <Controller
            name={`children.${index}.isWorking`}
            control={form.control}
            render={({ field }) => (
              <Switch checked={field.value || false} onCheckedChange={field.onChange} />
            )}
          />
          <Label>يعمل</Label>
        </div>
        {isWorking && (
          <>
            <div className="space-y-2">
              <Label>نوع العمل</Label>
              <Input {...form.register(`children.${index}.workType`)} placeholder="مثال: نجارة، تجارة..." />
            </div>
            <div className="flex items-center gap-2 pb-2">
              <Controller
                name={`children.${index}.isWorkPermanent`}
                control={form.control}
                render={({ field }) => (
                  <Switch checked={field.value || false} onCheckedChange={field.onChange} />
                )}
              />
              <Label>عمل قار</Label>
            </div>
          </>
        )}
      </div>

      {/* Education tracking */}
      <div className="border-t pt-3 space-y-3">
        <div className="grid grid-cols-3 gap-4 items-end">
          <div className="flex items-center gap-2 pb-2">
            <Controller
              name={`children.${index}.isSchooled`}
              control={form.control}
              render={({ field }) => (
                <Switch checked={field.value ?? true} onCheckedChange={field.onChange} />
              )}
            />
            <Label>متمدرس</Label>
          </div>
          {isSchooled && (
            <div className="space-y-2">
              <Label>رمز مسار</Label>
              <Input {...form.register(`children.${index}.masarCode`)} placeholder="الرمز الوطني للتلميذ" />
            </div>
          )}
          {isSchooled && (
            <div className="flex items-center gap-2 pb-2">
              <Controller
                name={`children.${index}.isInactive`}
                control={form.control}
                render={({ field }) => (
                  <Switch checked={field.value || false} onCheckedChange={field.onChange} />
                )}
              />
              <Label>مسجل لكن لا يدرس</Label>
            </div>
          )}
        </div>
        {isSchooled && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>المؤسسة التعليمية</Label>
              <Controller
                name={`children.${index}.school_id`}
                control={form.control}
                render={({ field }) => (
                  <Select
                    value={field.value ? field.value.toString() : "0"}
                    onValueChange={(value) => field.onChange(value === "0" ? "" : value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر المؤسسة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">غير محددة</SelectItem>
                      {schools.map((school) => (
                        <SelectItem key={school.id} value={school.id.toString()}>
                          {school.name}
                          {school.type === "university" ? " — تعليم عالٍ" : ""}
                          {school.is_private ? " (خاصة)" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <p className="text-[11px] text-muted-foreground">
                تُسجَّل ضمن السنة الدراسية الحالية وتظهر في صفحة التعليم وتقارير الأداء.
              </p>
            </div>
            {isHigherEducation && (
              <div className="space-y-2">
                <Label>التخصص</Label>
                <Input
                  {...form.register(`children.${index}.specialty`)}
                  placeholder="مثال: الإعلاميات، علوم الحياة والأرض"
                />
              </div>
            )}
          </div>
        )}
        {!isSchooled && (
          <div className="flex items-center gap-2">
            <Controller
              name={`children.${index}.isNotInterested`}
              control={form.control}
              render={({ field }) => (
                <Switch checked={field.value || false} onCheckedChange={field.onChange} />
              )}
            />
            <Label>غير مهتم بالدراسة</Label>
          </div>
        )}
      </div>
    </>
  )
}
