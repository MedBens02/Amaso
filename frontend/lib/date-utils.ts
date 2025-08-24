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
 * Formats a date for display in Arabic with Western numerals
 * Common format patterns:
 * - "PPP" - Full date (e.g., "1 يناير 2024")
 * - "dd/MM/yyyy" - Short date (e.g., "01/01/2024")  
 * - "dd/MM/yyyy - HH:mm" - Date with time
 */
export function formatDateArabic(date: Date, formatString: string = "PPP"): string {
  return formatDateArabicWesternNumerals(date, formatString)
}