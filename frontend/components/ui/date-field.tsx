"use client"

import * as React from "react"
import { CalendarDays } from "lucide-react"

import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"

/**
 * A date field that reads the way everyone here writes a date: 19/09/2026.
 *
 * `<input type="date">` looks like a good answer - the browser draws the
 * picker, validates the value and hands back a tidy "2026-09-19" - but it
 * renders the date in the *browser's* locale, not the page's. On a machine
 * whose Chrome is set to English that is 09/19/2026, on the same screen as
 * an Arabic form, and there is no attribute, no CSS and no `lang` that
 * changes it. Staff reading 12/31/2026 as the 12th of a 31st month is not a
 * cosmetic problem.
 *
 * So the part people read and type is an ordinary text box we control, and
 * the native control stays for what it is genuinely good at: the calendar
 * popup, which the button opens through `showPicker()`. The value handed in
 * and out is still "yyyy-MM-dd", the same string `<input type="date">` uses
 * and the same string the API wants, so this drops into the call sites
 * unchanged.
 */

/**
 * "2026-09-19" -> "19/09/2026"
 *
 * Exported because it is the application's one dd/mm/yyyy formatter, and a
 * screen that shows a stored date outside a field needs the same answer this
 * field gives. Re-deriving it per screen is how half the app ends up
 * disagreeing about which number is the month.
 */
export function toDisplay(iso: string | undefined | null): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso ?? "")

  return match ? `${match[3]}/${match[2]}/${match[1]}` : ""
}

/**
 * "19/09/2026" -> "2026-09-19", and null for anything that is not a real
 * date. Building the Date and reading it back is what rejects 31/02: the
 * constructor rolls that forward to the 3rd of March rather than failing.
 */
function toIso(display: string): string | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(display)

  if (!match) return null

  const [, day, month, year] = match
  const probe = new Date(Number(year), Number(month) - 1, Number(day))

  if (
    probe.getFullYear() !== Number(year) ||
    probe.getMonth() !== Number(month) - 1 ||
    probe.getDate() !== Number(day)
  ) {
    return null
  }

  return `${year}-${month}-${day}`
}

/**
 * Digits in, slashes placed for you. Typing "19092026" gives 19/09/2026
 * without ever having to reach for the slash key, and deleting back through
 * one does not leave the field wedged.
 */
function withSlashes(input: string): string {
  const digits = input.replace(/\D/g, "").slice(0, 8)

  if (digits.length <= 2) return digits
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`

  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
}

export interface DateFieldProps {
  /** "yyyy-MM-dd", or "" for no date. */
  value?: string | null
  /** Called with "yyyy-MM-dd", or "" when the field is cleared. */
  onChange: (value: string) => void
  id?: string
  /** Both "yyyy-MM-dd"; passed to the native picker. */
  min?: string
  max?: string
  disabled?: boolean
  className?: string
  placeholder?: string
  name?: string
  onBlur?: () => void
}

export function DateField({
  value,
  onChange,
  id,
  min,
  max,
  disabled,
  className,
  placeholder = "يوم/شهر/سنة",
  name,
  onBlur,
}: DateFieldProps) {
  const [text, setText] = React.useState(() => toDisplay(value))
  const pickerRef = React.useRef<HTMLInputElement>(null)

  // Follow the value when it is changed from outside - a form reset, a
  // filter cleared, a record loaded into the dialog - without fighting
  // whoever is typing, whose half-written date does not parse yet.
  React.useEffect(() => {
    const current = toIso(text)
    const incoming = value ? toDisplay(value) : ""

    if (current !== (value || null) && text !== incoming) {
      setText(incoming)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  const handleText = (next: string) => {
    const formatted = withSlashes(next)
    setText(formatted)

    if (formatted === "") {
      onChange("")

      return
    }

    const iso = toIso(formatted)
    if (iso) onChange(iso)
  }

  // Half a date is not a date. Rather than leave "19/0" sitting in the box
  // next to a value that is still last week's, put back whatever the value
  // actually is.
  const handleBlur = () => {
    if (toIso(text) === null && text !== "") setText(toDisplay(value))
    onBlur?.()
  }

  const openPicker = () => {
    const picker = pickerRef.current
    if (!picker || disabled) return

    if (typeof picker.showPicker === "function") {
      try {
        picker.showPicker()

        return
      } catch {
        // Browsers refuse showPicker() without a user gesture, and Firefox
        // refused it entirely until recently. Falling through leaves the
        // field typeable, which is the part that matters.
      }
    }

    picker.focus()
    picker.click()
  }

  return (
    <div className="relative">
      <Input
        id={id}
        name={name}
        dir="ltr"
        inputMode="numeric"
        autoComplete="off"
        placeholder={placeholder}
        value={text}
        disabled={disabled}
        onChange={(event) => handleText(event.target.value)}
        onBlur={handleBlur}
        className={cn("pl-10 text-left", className)}
      />

      <button
        type="button"
        tabIndex={-1}
        aria-label="اختيار التاريخ من التقويم"
        onClick={openPicker}
        disabled={disabled}
        className="absolute inset-y-0 left-0 flex w-10 items-center justify-center text-muted-foreground transition-colors hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
      >
        <CalendarDays className="h-4 w-4" />
      </button>

      {/* The calendar itself. It is never read from - the text box above is
          the value - it is only here to be opened. */}
      <input
        ref={pickerRef}
        type="date"
        tabIndex={-1}
        aria-hidden="true"
        value={value ?? ""}
        min={min}
        max={max}
        disabled={disabled}
        onChange={(event) => {
          const picked = event.target.value
          setText(toDisplay(picked))
          onChange(picked)
        }}
        className="pointer-events-none absolute bottom-0 left-0 h-0 w-0 border-0 p-0 opacity-0"
      />
    </div>
  )
}
