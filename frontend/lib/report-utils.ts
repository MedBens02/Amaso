/**
 * Report Utilities
 * Helper functions for data fetching, processing, filtering, and statistics calculation
 */

/**
 * Builds URL search params from filter object
 * Converts filter values to API query parameters
 */
export function buildFilterQuery(filters: Record<string, any>): URLSearchParams {
  const params = new URLSearchParams()

  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== '') {
      // Handle Date objects
      if (value instanceof Date) {
        params.append(key, value.toISOString().split('T')[0])
      }
      // Handle arrays
      else if (Array.isArray(value)) {
        value.forEach(item => params.append(key, String(item)))
      }
      // Handle all other values
      else {
        params.append(key, String(value))
      }
    }
  }

  return params
}

/**
 * Generic data fetcher for reports
 * Fetches data from API with filters applied
 */
export async function fetchReportData<T>(
  endpoint: string,
  filters: Record<string, any> = {},
  options: {
    baseUrl?: string
    perPage?: number
    additionalParams?: Record<string, any>
  } = {}
): Promise<T[]> {
  const {
    baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1',
    perPage = 10000,
    additionalParams = {}
  } = options

  const url = new URL(`${baseUrl}${endpoint}`)
  const params = buildFilterQuery({ ...filters, ...additionalParams, per_page: perPage })

  url.search = params.toString()

  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`)
  }

  const result = await response.json()
  return result.data || []
}

/**
 * Fetches statistics for an entity type
 * Can be customized per entity with different endpoints
 */
export async function fetchStatistics(
  entityType: string,
  filters: Record<string, any> = {}
): Promise<Record<string, any>> {
  // This is a placeholder that can be customized per entity
  // Each entity might have different stats endpoints or calculations
  const data = await fetchReportData(`/${entityType}`, filters)

  return {
    totalCount: data.length,
    // Add more calculations as needed
  }
}

/**
 * Metric definition for statistics calculation
 */
export interface MetricDefinition {
  name: string
  calculate: (data: any[]) => number | string
  format?: (value: number | string) => string
}

/**
 * Calculates aggregates based on metric definitions
 */
export function calculateAggregates(
  data: any[],
  metrics: MetricDefinition[]
): Record<string, any> {
  const results: Record<string, any> = {}

  for (const metric of metrics) {
    const value = metric.calculate(data)
    results[metric.name] = metric.format ? metric.format(value) : value
  }

  return results
}

/**
 * Common metric calculations
 */
export const commonMetrics = {
  /**
   * Calculate total count
   */
  count: (data: any[]): MetricDefinition => ({
    name: 'count',
    calculate: (data) => data.length,
    format: (value) => String(value)
  }),

  /**
   * Calculate sum of a numeric field
   */
  sum: (field: string): MetricDefinition => ({
    name: `sum_${field}`,
    calculate: (data) => data.reduce((sum, item) => {
      const value = getNestedProperty(item, field)
      return sum + (parseFloat(value) || 0)
    }, 0),
    format: (value) => `${(value as number).toFixed(2)} د.م`
  }),

  /**
   * Calculate average of a numeric field
   */
  average: (field: string): MetricDefinition => ({
    name: `avg_${field}`,
    calculate: (data) => {
      if (data.length === 0) return 0
      const sum = data.reduce((s, item) => {
        const value = getNestedProperty(item, field)
        return s + (parseFloat(value) || 0)
      }, 0)
      return sum / data.length
    },
    format: (value) => `${(value as number).toFixed(2)}`
  }),

  /**
   * Calculate minimum value
   */
  min: (field: string): MetricDefinition => ({
    name: `min_${field}`,
    calculate: (data) => {
      if (data.length === 0) return 0
      return Math.min(...data.map(item => parseFloat(getNestedProperty(item, field)) || 0))
    }
  }),

  /**
   * Calculate maximum value
   */
  max: (field: string): MetricDefinition => ({
    name: `max_${field}`,
    calculate: (data) => {
      if (data.length === 0) return 0
      return Math.max(...data.map(item => parseFloat(getNestedProperty(item, field)) || 0))
    }
  }),

  /**
   * Count items matching a condition
   */
  countWhere: (field: string, condition: (value: any) => boolean): MetricDefinition => ({
    name: `count_${field}`,
    calculate: (data) => data.filter(item => condition(getNestedProperty(item, field))).length
  }),

  /**
   * Calculate percentage
   */
  percentage: (numeratorMetric: string, denominatorMetric: string): MetricDefinition => ({
    name: `percentage_${numeratorMetric}_of_${denominatorMetric}`,
    calculate: (data, results?: Record<string, any>) => {
      if (!results) return 0
      const numerator = results[numeratorMetric] as number || 0
      const denominator = results[denominatorMetric] as number || 0
      if (denominator === 0) return 0
      return (numerator / denominator) * 100
    },
    format: (value) => `${(value as number).toFixed(1)}%`
  })
}

/**
 * Gets nested property value from object using dot notation
 * Example: getNestedProperty(obj, 'user.name')
 */
export function getNestedProperty(obj: any, path: string): any {
  return path.split('.').reduce((current, prop) => current?.[prop], obj)
}

/**
 * Groups data by a field value
 */
export function groupBy<T>(
  data: T[],
  keyGetter: ((item: T) => string | number) | string
): Record<string, T[]> {
  const grouped: Record<string, T[]> = {}

  const getKey = typeof keyGetter === 'function'
    ? keyGetter
    : (item: T) => getNestedProperty(item, keyGetter)

  for (const item of data) {
    const key = String(getKey(item))
    if (!grouped[key]) {
      grouped[key] = []
    }
    grouped[key].push(item)
  }

  return grouped
}

/**
 * Sorts data by a field
 */
export function sortBy<T>(
  data: T[],
  field: keyof T | string,
  direction: 'asc' | 'desc' = 'asc'
): T[] {
  const sorted = [...data]

  sorted.sort((a, b) => {
    const aValue = typeof field === 'string' && field.includes('.')
      ? getNestedProperty(a, field)
      : a[field as keyof T]

    const bValue = typeof field === 'string' && field.includes('.')
      ? getNestedProperty(b, field)
      : b[field as keyof T]

    // Handle different types
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return direction === 'asc' ? aValue - bValue : bValue - aValue
    }

    if (aValue instanceof Date && bValue instanceof Date) {
      return direction === 'asc'
        ? aValue.getTime() - bValue.getTime()
        : bValue.getTime() - aValue.getTime()
    }

    // String comparison
    const aStr = String(aValue || '')
    const bStr = String(bValue || '')

    return direction === 'asc'
      ? aStr.localeCompare(bStr, 'ar')
      : bStr.localeCompare(aStr, 'ar')
  })

  return sorted
}

/**
 * Filter function type
 */
export type FilterFunction<T> = (item: T, filterValue: any) => boolean

/**
 * Applies multiple filters to data
 */
export function applyFilters<T>(
  data: T[],
  filters: Record<string, any>,
  filterFunctions: Record<string, FilterFunction<T>>
): T[] {
  let filtered = [...data]

  for (const [filterKey, filterValue] of Object.entries(filters)) {
    if (filterValue === undefined || filterValue === null || filterValue === '') {
      continue
    }

    const filterFn = filterFunctions[filterKey]
    if (filterFn) {
      filtered = filtered.filter(item => filterFn(item, filterValue))
    }
  }

  return filtered
}

/**
 * Common filter functions for different field types
 */
export const commonFilters = {
  /**
   * Text search filter (case-insensitive, supports Arabic)
   */
  textSearch: <T>(fields: (keyof T | string)[]) => {
    return (item: T, searchTerm: string): boolean => {
      const searchLower = searchTerm.toLowerCase()
      return fields.some(field => {
        const value = typeof field === 'string' && field.includes('.')
          ? getNestedProperty(item, field)
          : item[field as keyof T]

        return String(value || '').toLowerCase().includes(searchLower)
      })
    }
  },

  /**
   * Exact match filter
   */
  exactMatch: <T>(field: keyof T | string) => {
    return (item: T, value: any): boolean => {
      const itemValue = typeof field === 'string' && field.includes('.')
        ? getNestedProperty(item, field)
        : item[field as keyof T]

      return itemValue === value
    }
  },

  /**
   * Date range filter
   */
  dateRange: <T>(field: keyof T | string) => {
    return (item: T, range: { from?: Date; to?: Date }): boolean => {
      const itemValue = typeof field === 'string' && field.includes('.')
        ? getNestedProperty(item, field)
        : item[field as keyof T]

      if (!itemValue) return false

      const date = new Date(itemValue)

      if (range.from && date < range.from) return false
      if (range.to && date > range.to) return false

      return true
    }
  },

  /**
   * Number range filter
   */
  numberRange: <T>(field: keyof T | string) => {
    return (item: T, range: { min?: number; max?: number }): boolean => {
      const itemValue = typeof field === 'string' && field.includes('.')
        ? getNestedProperty(item, field)
        : item[field as keyof T]

      const num = parseFloat(itemValue)
      if (isNaN(num)) return false

      if (range.min !== undefined && num < range.min) return false
      if (range.max !== undefined && num > range.max) return false

      return true
    }
  },

  /**
   * Boolean filter
   */
  boolean: <T>(field: keyof T | string) => {
    return (item: T, value: boolean): boolean => {
      const itemValue = typeof field === 'string' && field.includes('.')
        ? getNestedProperty(item, field)
        : item[field as keyof T]

      return Boolean(itemValue) === value
    }
  },

  /**
   * Array includes filter
   */
  arrayIncludes: <T>(field: keyof T | string) => {
    return (item: T, values: any[]): boolean => {
      const itemValue = typeof field === 'string' && field.includes('.')
        ? getNestedProperty(item, field)
        : item[field as keyof T]

      return values.includes(itemValue)
    }
  }
}

/**
 * Paginates data array
 */
export function paginateData<T>(
  data: T[],
  page: number,
  perPage: number
): {
  data: T[]
  totalPages: number
  currentPage: number
  totalItems: number
} {
  const totalPages = Math.ceil(data.length / perPage)
  const currentPage = Math.min(Math.max(1, page), totalPages)
  const startIndex = (currentPage - 1) * perPage
  const endIndex = startIndex + perPage

  return {
    data: data.slice(startIndex, endIndex),
    totalPages,
    currentPage,
    totalItems: data.length
  }
}

/**
 * Debounces a function call
 * Useful for search inputs
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout

  return function (...args: Parameters<T>) {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func(...args), delay)
  }
}

/**
 * Calculates age from birth date
 */
export function calculateAge(birthDate: Date | string): number {
  const birth = typeof birthDate === 'string' ? new Date(birthDate) : birthDate
  const today = new Date()

  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }

  return age
}

/**
 * Formats large numbers with Arabic thousands separator
 */
export function formatNumber(num: number, decimals: number = 0): string {
  return num.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

/**
 * Creates a summary statistics object from data
 */
export function createSummaryStatistics<T>(
  data: T[],
  config: {
    totalLabel?: string
    calculations?: Record<string, (data: T[]) => number | string>
  } = {}
): Record<string, any> {
  const summary: Record<string, any> = {
    [config.totalLabel || 'total']: data.length
  }

  if (config.calculations) {
    for (const [key, calc] of Object.entries(config.calculations)) {
      summary[key] = calc(data)
    }
  }

  return summary
}
