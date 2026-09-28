import { format } from "date-fns"
import { ar } from "date-fns/locale"

/**
 * Formats a date with Arabic text but Western numerals
 * @param date - The date to format
 * @param formatString - The format string (e.g., "PPP", "dd/MM/yyyy")
 * @returns Formatted date string with Arabic text but Western numerals
 */
export function formatDateArabicWesternNumerals(date: Date, formatString: string): string {
  // Format the date with Arabic locale
  const arabicFormatted = format(date, formatString, { locale: ar })
  
  // Convert Arabic numerals (٠١٢٣٤٥٦٧٨٩) to Western numerals (0123456789)
  const arabicNumerals = '٠١٢٣٤٥٦٧٨٩'
  const westernNumerals = '0123456789'
  
  let result = arabicFormatted
  for (let i = 0; i < arabicNumerals.length; i++) {
    const arabicDigit = arabicNumerals[i]
    const westernDigit = westernNumerals[i]
    result = result.replace(new RegExp(arabicDigit, 'g'), westernDigit)
  }
  
  return result
}

/**
 * Formats a date for display in Arabic with Western numerals and better formatting
 * Common format patterns:
 * - "PPP" - Full date (e.g., "1 Janvier, 2024")
 * - "dd/MM/yyyy" - Short date (e.g., "01/01/2024")
 * - "dd/MM/yyyy - HH:mm" - Date with time
 */
export function formatDateArabic(date: Date, formatString: string = "PPP"): string {
  // For PPP format, use French month names to avoid RTL issues
  if (formatString === "PPP") {
    const day = date.getDate()
    const monthNames = [
      "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
      "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
    ]
    const month = monthNames[date.getMonth()]
    const year = date.getFullYear()
    return `${day} ${month}, ${year}`
  }

  return formatDateArabicWesternNumerals(date, formatString)
}

/**
 * Converts a `Date` to and from "yyyy-MM-dd", the string every date field in
 * this app passes around - once the native `<input type="date">`, now
 * `<DateField>` (components/ui/date-field.tsx).
 *
 * The history is worth keeping, because each step fixed the previous one's
 * mistake. First there were Popover+Calendar pickers whose caption rendered
 * in the browser's locale (English month names, Sunday-first) beside a
 * hand-rolled month <Select> with a hardcoded French month list - "Septembre"
 * next to "September 2026" in the same popup. Those were replaced by the
 * native date input, on the reasoning that it has no locale of its own to
 * mismatch. It does: it renders the date in the *browser's* locale, so an
 * English Chrome showed 12/31/2026 in an Arabic form. DateField draws the
 * part people read itself and keeps the native control for its calendar.
 */
export function toDateInputValue(date?: Date | null): string {
  if (!date || Number.isNaN(date.getTime())) return ""
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${date.getFullYear()}-${month}-${day}`
}

/**
 * `new Date("2026-01-01")` parses as UTC midnight, which prints as
 * 2025-12-31 anywhere behind UTC - the day the user picked isn't the day
 * they get. Parsing the parts and constructing a local date sidesteps that.
 */
export function fromDateInputValue(value: string): Date | undefined {
  if (!value) return undefined
  const [year, month, day] = value.split("-").map(Number)
  if (!year || !month || !day) return undefined
  return new Date(year, month - 1, day)
}