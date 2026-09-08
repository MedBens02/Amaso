"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Trash2 } from "lucide-react"

interface ExtraPhonesFieldProps {
  value: string[]
  onChange: (phones: string[]) => void
}

/**
 * Editable list of additional phone numbers for a widow
 * (the primary number stays in the main phone field).
 */
export function ExtraPhonesField({ value, onChange }: ExtraPhonesFieldProps) {
  const phones = value || []

  const updateAt = (index: number, phone: string) => {
    const next = [...phones]
    next[index] = phone
    onChange(next)
  }

  const removeAt = (index: number) => {
    const next = [...phones]
    next.splice(index, 1)
    onChange(next)
  }

  return (
    <div className="space-y-2">
      <Label>أرقام هاتف إضافية</Label>
      {phones.map((phone, index) => (
        <div key={index} className="flex gap-2">
          <Input
            value={phone}
            onChange={(e) => updateAt(index, e.target.value)}
            placeholder="أدخل رقم هاتف إضافي"
            type="tel"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => removeAt(index)}
            className="text-red-600 hover:text-red-700 shrink-0"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={() => onChange([...phones, ""])}>
        <Plus className="h-4 w-4 ml-2" />
        إضافة رقم آخر
      </Button>
    </div>
  )
}
