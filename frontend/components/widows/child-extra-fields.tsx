"use client"

import { Controller } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

interface ChildExtraFieldsProps {
  form: any // react-hook-form instance of the widow dialogs
  index: number
}

/**
 * Extra per-child fields shared by the add/edit widow dialogs:
 * contact (phone, CIN), work situation, marital status and the
 * education-tracking flags (schooled, Massar code, not interested, inactive).
 */
export function ChildExtraFields({ form, index }: ChildExtraFieldsProps) {
  const isWorking = form.watch(`children.${index}.isWorking`)
  const isSchooled = form.watch(`children.${index}.isSchooled`)

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
