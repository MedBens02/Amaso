/**
 * Turns the ledger pages' filter state into API query parameters.
 *
 * The incomes and expenses pages each built this query in several places -
 * once for the table, once for the CSV, once for the PDF - and they had
 * drifted. The table mapped `fromDate` to `from_date`; the PDF export handed
 * the state over untouched, so the report endpoint saw `fromDate` and
 * `budgetId`, recognised neither, and quietly returned every row ever
 * recorded regardless of what the screen was showing. The "all" sentinel the
 * select boxes use for "no filter" went out as a literal value and the
 * endpoint rejected it outright. One builder, used everywhere, so the export
 * cannot disagree with the table again.
 */

export interface LedgerFilters {
  fromDate?: Date
  toDate?: Date
  budgetId?: string
  incomeCategoryId?: string
  expenseCategoryId?: string
  partnerId?: string
  paymentMethod?: string
  status?: string
  minAmount?: string
  maxAmount?: string
  fiscalYearId?: string
}

/** The value the select boxes carry when nothing is chosen. */
const NO_FILTER = "all"

const QUERY_KEYS: Record<keyof Omit<LedgerFilters, "fromDate" | "toDate">, string> = {
  budgetId: "budget_id",
  incomeCategoryId: "income_category_id",
  expenseCategoryId: "expense_category_id",
  partnerId: "partner_id",
  paymentMethod: "payment_method",
  status: "status",
  minAmount: "min_amount",
  maxAmount: "max_amount",
  fiscalYearId: "fiscal_year_id",
}

/**
 * A calendar day as the user picked it.
 *
 * toISOString() would convert to UTC first, moving the day by one for anyone
 * behind UTC - a range starting "1 January" would be sent as 31 December.
 */
function toIsoDay(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${date.getFullYear()}-${month}-${day}`
}

/** Query parameters for the list endpoints (/incomes, /expenses). */
export function ledgerFilterParams(filters: LedgerFilters = {}): Record<string, string> {
  const params: Record<string, string> = {}

  if (filters.fromDate) params.from_date = toIsoDay(filters.fromDate)
  if (filters.toDate) params.to_date = toIsoDay(filters.toDate)

  for (const [field, queryKey] of Object.entries(QUERY_KEYS) as [keyof LedgerFilters, string][]) {
    const value = filters[field]
    if (typeof value === "string" && value !== "" && value !== NO_FILTER) {
      params[queryKey] = value
    }
  }

  return params
}

/**
 * Query parameters for the report endpoints (/reports/*.pdf).
 *
 * Those take the period as `from`/`to` rather than `from_date`/`to_date`, and
 * accept only the subset of filters they can actually apply - anything else
 * is dropped here rather than sent and ignored.
 */
export function ledgerReportParams(filters: LedgerFilters = {}): Record<string, string> {
  const params: Record<string, string> = {}

  if (filters.fromDate) params.from = toIsoDay(filters.fromDate)
  if (filters.toDate) params.to = toIsoDay(filters.toDate)
  if (filters.budgetId && filters.budgetId !== NO_FILTER) params.budget_id = filters.budgetId
  if (filters.fiscalYearId && filters.fiscalYearId !== NO_FILTER) params.fiscal_year_id = filters.fiscalYearId
  if (filters.status && filters.status !== NO_FILTER) params.status = filters.status

  return params
}

/** The same thing as a URLSearchParams, for callers building a URL. */
export function toSearchParams(params: Record<string, string>): URLSearchParams {
  return new URLSearchParams(params)
}
