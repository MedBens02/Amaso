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
 * Converts a `Date` to and from the string a native `<input type="date">`
 * actually works with ("yyyy-MM-dd"), which is what replaced this app's
 * custom Popover+Calendar date pickers everywhere.
 *
 * Those were broken in a specific, self-inflicted way: the calendar's own
 * caption renders in the browser's default locale (English month names,
 * Sunday-first weekday order) while a hand-rolled month/year <Select> next
 * to it used a hardcoded French month list - "Septembre" beside "September
 * 2026" in the same popup, not a react-day-picker bug. The native input has
 * no locale of its own to mismatch; the browser renders whatever picker UI
 * it always renders for a date field, in the user's OS language.
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