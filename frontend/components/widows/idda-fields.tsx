"use client"

import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { DateField } from "@/components/ui/date-field"
import { Calculator } from "lucide-react"

/**
 * The عدة waiting period: four months and ten days from the husband's death.
 *
 * Offered, never imposed. The period is counted in lunar months, and a
 * pregnancy runs it to the birth instead - so the form does the ordinary
 * arithmetic for the ordinary case and lets whoever knows the case overwrite
 * it. Computing it and locking the field would be the application claiming
 * to know more about the ruling than the person entering the record.
 */
export function suggestIddaEnd(deathDate: string): string {
  if (!deathDate) return ""

  const date = new Date(`${deathDate}T00:00:00`)
  if (Number.isNaN(date.getTime())) return ""

  date.setMonth(date.getMonth() + 4)
  date.setDate(date.getDate() + 10)

  return date.toISOString().slice(0, 10)
}

/** Whole months between two dates, for the "how long is this" line. */
function monthsBetween(from: string, to: string): number | null {
  if (!from || !to) return null

  const start = new Date(`${from}T00:00:00`)
  const end = new Date(`${to}T00:00:00`)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return null

  let months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth())
  if (end.getDate() < start.getDate()) months--

  return Math.max(0, months)
}

interface IddaFieldsProps {
  husbandDeathDate: string
  isIddaCase: boolean
  iddaEndDate: string
  /** When the association took the case on - the allowance counts from here. */
  admissionDate: string
  onChange: (patch: {
    husbandDeathDate?: string
    isIddaCase?: boolean
    iddaEndDate?: string
  }) => void
}

/**
 * When she was widowed, and whether this is still a عدة case.
 *
 * The death date is asked of every family, because it is part of any widow's
 * record. The rest appears only once somebody says this is a يتيم جديد case -
 * a family being supported through her waiting period while the association
 * looks at it, kept off the beneficiary lists and the figures until they
 * decide.
 */
export function IddaFields({
  husbandDeathDate,
  isIddaCase,
  iddaEndDate,
  admissionDate,
  onChange,
}: IddaFieldsProps) {
  const suggestion = suggestIddaEnd(husbandDeathDate)
  const payableMonths = monthsBetween(admissionDate, iddaEndDate)

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>تاريخ وفاة الزوج</Label>
          <DateField
            max={new Date().toISOString().slice(0, 10)}
            value={husbandDeathDate}
            onChange={(value) => {
              // Setting the death date on a case with no end date yet fills
              // it in; one already entered is left alone, because somebody
              // put it there on purpose.
              const next = suggestIddaEnd(value)
              onChange({
                husbandDeathDate: value,
                ...(isIddaCase && !iddaEndDate && next ? { iddaEndDate: next } : {}),
              })
            }}
          />
        </div>

        <div className="space-y-2">
          <Label className="flex h-5 items-center">حالة يتيم جديد</Label>
          <div className="flex h-10 items-center gap-3 rounded-md border px-3">
            <Switch
              checked={isIddaCase}
              onCheckedChange={(checked) =>
                onChange({
                  isIddaCase: checked,
                  ...(checked && !iddaEndDate && suggestion ? { iddaEndDate: suggestion } : {}),
                })
              }
            />
            <span className="text-sm text-muted-foreground">
              {isIddaCase ? "في العدة — خارج قوائم المستفيدين" : "أسرة مكفولة عادية"}
            </span>
          </div>
        </div>
      </div>

      {isIddaCase && (
        <div className="space-y-3 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950/30">
          <p className="text-xs text-amber-900 dark:text-amber-300">
            لن تظهر هذه الأسرة في قوائم المستفيدين ولا في الإحصائيات، ولا يمكن الصرف عليها إلا من
            ميزانية العدّة. المنحة الشهرية تُحتسب من تاريخ الانتساب، لا من تاريخ الوفاة.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>تاريخ انتهاء العدّة *</Label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <DateField
                    value={iddaEndDate}
                    onChange={(value) => onChange({ iddaEndDate: value })}
                  />
                </div>
                {suggestion && suggestion !== iddaEndDate && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-10 whitespace-nowrap"
                    onClick={() => onChange({ iddaEndDate: suggestion })}
                    title="أربعة أشهر وعشرة أيام من تاريخ الوفاة"
                  >
                    <Calculator className="h-4 w-4 ml-1" />
                    4 أشهر و10 أيام
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex h-5 items-center">مدة الاستحقاق</Label>
              <div className="flex h-10 items-center rounded-md border bg-background px-3 text-sm">
                {payableMonths === null
                  ? "—"
                  : `${payableMonths} ${payableMonths === 1 ? "شهر" : "أشهر"} من تاريخ الانتساب`}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
