import { format } from "date-fns"

/**
 * Utility functions for exporting data to CSV and other formats
 * Maintains consistency with existing export patterns in the codebase
 */

// UTF-8 BOM for Excel Arabic compatibility
const BOM = '\uFEFF'

/**
 * Properly escapes a field for CSV format
 * Handles commas, newlines, quotes, and special characters
 */
export function escapeCSVField(field: any): string {
  if (field === null || field === undefined) return '""'
  const str = String(field)
  // If field contains comma, newline, or quote, wrap in quotes and escape internal quotes
  if (str.includes(',') || str.includes('\n') || str.includes('"') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return `"${str}"`
}

/**
 * Formats currency amount with Moroccan Dirham symbol
 */
export function formatCurrency(amount: number | string): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount
  if (isNaN(numAmount)) return '0 د.م'
  return `${numAmount.toFixed(2)} د.م`
}

/**
 * Formats date for export (DD/MM/YYYY format)
 */
export function formatDateForExport(date: Date | string): string {
  if (!date) return ''
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return format(dateObj, 'dd/MM/yyyy')
}

/**
 * Formats date with time for export (DD/MM/YYYY HH:mm format)
 */
export function formatDateTimeForExport(date: Date | string): string {
  if (!date) return ''
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return format(dateObj, 'dd/MM/yyyy HH:mm')
}

/**
 * Flattens nested objects for CSV export
 * Example: { user: { name: "John" } } => { "user.name": "John" }
 */
export function flattenNestedData(obj: any, prefix: string = ''): Record<string, any> {
  const flattened: Record<string, any> = {}

  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key]
      const newKey = prefix ? `${prefix}.${key}` : key

      if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
        // Recursively flatten nested objects
        Object.assign(flattened, flattenNestedData(value, newKey))
      } else if (Array.isArray(value)) {
        // Convert arrays to comma-separated strings
        flattened[newKey] = value.map(item =>
          typeof item === 'object' ? JSON.stringify(item) : String(item)
        ).join('; ')
      } else {
        flattened[newKey] = value
      }
    }
  }

  return flattened
}

/**
 * Generates CSV metadata header section
 * Includes export date, filters, search terms, and total count
 */
export function generateCSVMetadata(
  entityType: string,
  filters: Record<string, any>,
  searchTerm?: string,
  totalCount?: number
): string[] {
  const metadataRows: string[] = []

  // Export title and timestamp
  const entityTypeArabic: Record<string, string> = {
    'widows': 'الأرامل',
    'orphans': 'الأيتام',
    'donors': 'المتبرعين',
    'kafils': 'الكفلاء',
    'incomes': 'الإيرادات',
    'expenses': 'المصروفات',
    'transfers': 'التحويلات'
  }

  const arabicEntity = entityTypeArabic[entityType] || entityType
  metadataRows.push(`تقرير ${arabicEntity} - تم التصدير في: ${format(new Date(), 'dd/MM/yyyy HH:mm:ss')}`)

  // Search term
  if (searchTerm && searchTerm.trim()) {
    metadataRows.push(`كلمة البحث: ${searchTerm}`)
  }

  // Filters
  const filterDescriptions: string[] = []
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== '') {
      const filterLabel = getFilterLabel(key)
      if (value instanceof Date) {
        filterDescriptions.push(`${filterLabel}: ${format(value, 'dd/MM/yyyy')}`)
      } else {
        filterDescriptions.push(`${filterLabel}: ${value}`)
      }
    }
  }

  if (filterDescriptions.length > 0) {
    metadataRows.push(filterDescriptions.join(' | '))
  }

  // Total count
  if (totalCount !== undefined) {
    metadataRows.push(`الإجمالي: ${totalCount}`)
  }

  // Empty row before data
  metadataRows.push('')

  return metadataRows
}

/**
 * Gets Arabic label for filter keys
 */
function getFilterLabel(key: string): string {
  const labelMap: Record<string, string> = {
    'fromDate': 'من تاريخ',
    'toDate': 'إلى تاريخ',
    'subBudgetId': 'الميزانية الفرعية',
    'expenseCategoryId': 'فئة المصروف',
    'incomeCategoryId': 'فئة الإيراد',
    'partnerId': 'الشريك',
    'paymentMethod': 'طريقة الدفع',
    'status': 'الحالة',
    'minAmount': 'الحد الأدنى للمبلغ',
    'maxAmount': 'الحد الأعلى للمبلغ',
    'fiscalYearId': 'السنة المالية',
    'neighborhood': 'الحي',
    'maritalStatus': 'الحالة الاجتماعية',
    'educationLevel': 'المستوى التعليمي',
    'gender': 'الجنس',
    'ageRange': 'الفئة العمرية',
    'disabilityFlag': 'حالة الإعاقة',
    'isKafil': 'كافل'
  }

  return labelMap[key] || key
}

/**
 * Converts data to CSV format with proper headers and metadata
 */
export function exportToCSV(
  data: any[],
  filename: string,
  columnMapping: Record<string, string>,
  metadata?: {
    entityType?: string
    filters?: Record<string, any>
    searchTerm?: string
    totalCount?: number
  }
): string {
  // Generate metadata rows if provided
  const metadataRows = metadata
    ? generateCSVMetadata(
        metadata.entityType || 'data',
        metadata.filters || {},
        metadata.searchTerm,
        metadata.totalCount
      )
    : []

  // Generate header row
  const headers = Object.values(columnMapping)
  const headerRow = headers.map(header => escapeCSVField(header)).join(',')

  // Generate data rows
  const dataRows = data.map(item => {
    const row = Object.keys(columnMapping).map(key => {
      // Handle nested properties (e.g., 'user.name')
      const value = key.split('.').reduce((obj, prop) => obj?.[prop], item)
      return escapeCSVField(value ?? '')
    })
    return row.join(',')
  })

  // Combine all parts
  const csvParts = [
    ...metadataRows.map(row => escapeCSVField(row)),
    headerRow,
    ...dataRows
  ]

  return csvParts.join('\n')
}

/**
 * Downloads data as CSV file
 */
export function downloadCSV(
  csvContent: string,
  filename: string
): void {
  // Add BOM for Excel Arabic support
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })
  downloadFile(blob, filename)
}

/**
 * Generic file download function
 */
export function downloadFile(
  content: Blob | string,
  filename: string,
  mimeType: string = 'application/octet-stream'
): void {
  const blob = content instanceof Blob
    ? content
    : new Blob([content], { type: mimeType })

  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)

  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  // Clean up the URL object
  setTimeout(() => URL.revokeObjectURL(url), 100)
}

/**
 * Generates a filename with current date
 */
export function generateFilename(
  entityType: string,
  extension: string = 'csv',
  suffix?: string
): string {
  const currentDate = format(new Date(), 'yyyy-MM-dd')
  const suffixPart = suffix ? `_${suffix}` : ''
  return `${entityType}_export_${currentDate}${suffixPart}.${extension}`
}

/**
 * Converts data array to CSV and triggers download
 * This is the main high-level export function
 */
export function exportDataToCSV(
  data: any[],
  entityType: string,
  columnMapping: Record<string, string>,
  filters?: Record<string, any>,
  searchTerm?: string
): void {
  const csvContent = exportToCSV(data, entityType, columnMapping, {
    entityType,
    filters,
    searchTerm,
    totalCount: data.length
  })

  const filename = generateFilename(entityType)
  downloadCSV(csvContent, filename)
}

/**
 * Arabic payment method translations
 */
export const paymentMethodArabic: Record<string, string> = {
  'Cash': 'نقدي',
  'Cheque': 'شيك',
  'BankWire': 'حوالة بنكية'
}

/**
 * Arabic status translations
 */
export const statusArabic: Record<string, string> = {
  'Draft': 'مسودة',
  'Approved': 'معتمد',
  'Rejected': 'مرفوض',
  'Pending': 'قيد الانتظار'
}

/**
 * Arabic gender translations
 */
export const genderArabic: Record<string, string> = {
  'Male': 'ذكر',
  'Female': 'أنثى'
}

/**
 * Arabic marital status translations
 */
export const maritalStatusArabic: Record<string, string> = {
  'Widow': 'أرملة',
  'Divorced': 'مطلقة',
  'Married': 'متزوجة',
  'Single': 'عازبة'
}
