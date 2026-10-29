/**
 * The shape of GET /dashboard - mirrors App\Services\DashboardService.
 *
 * Every section is optional because which ones arrive depends on the
 * signed-in account's role; a dashboard reads only the ones it renders.
 */

export interface Money {
  count: number
  amount: number
}

export interface FinanceSection {
  period: { from: string; to: string }
  fiscal_year: { id: number; year: number } | null
  totals: {
    income: number
    expense: number
    balance: number
    income_count: number
    expense_count: number
  }
  monthly: Array<{ label: string; income: number; expense: number }>
  top_expense_categories: Array<{ label: string; total: number; count: number }>
  cash: {
    total: number
    accounts: Array<{ id: number; label: string; bank_name: string | null; balance: number }>
  }
  pending: { incomes: Money; expenses: Money; transfers: Money }
  untransferred: Money
  queue: Array<{
    type: "income" | "expense"
    id: number
    date: string | null
    amount: number
    label: string
    party: string | null
    created_by: string | null
  }>
}

export interface FamiliesSection {
  counts: {
    families: number
    orphans: number
    sponsored: number
    coverage: number
    idda_active: number
    idda_awaiting: number
  }
  sponsorship: {
    target: number
    totals: { families_with_gap: number; unsponsored: number; orphans_affected: number; total_shortfall: number }
    families: Array<{
      widow_id: number
      full_name: string
      neighborhood: string | null
      orphans_count: number
      covered: number
      shortfall: number
    }>
  }
  idda: Array<{ id: number; full_name: string; neighborhood: string | null; end_date: string; ended: boolean; days: number }>
  my_drafts: Money & {
    items: Array<{ id: number; date: string | null; amount: number; label: string; details: string | null }>
  }
  recent_families: Array<{ id: number; full_name: string; neighborhood: string | null; admission_date: string | null }>
}

export interface EducationSection {
  year: { id: number; label: string } | null
  enrollments: {
    total: number
    by_status: { enrolled: number; passed: number; failed: number; left: number }
    ungraded: number
  }
  unenrolled: {
    count: number
    items: Array<{ id: number; full_name: string; age: number | null; family: string | null; widow_id: number }>
  }
  previous_year: { label: string; passed: number; failed: number; pass_rate: number | null } | null
  transport: {
    riders: { bus: number; allowance: number }
    months: Array<{ id: number; label: string; status: "draft" | "partial" | "closed"; status_label: string; overdue: boolean }>
    current_month_opened: boolean
  }
}

export interface AccountsSection {
  counts: {
    total: number
    active: number
    inactive: number
    two_factor_off: number
    password_expiring: number
    password_due: number
    never_signed_in: number
  }
  by_role: Record<string, number>
  two_factor_off: Array<{ id: number; name: string; role: string }>
  recent_activity: Array<{
    id: number
    user_name: string | null
    action: string
    action_label: string
    entity_type: string | null
    entity_type_label: string | null
    entity_label: string | null
    created_at: string | null
  }>
}

export interface DashboardData {
  role: string
  generated_at: string
  sections: {
    finance?: FinanceSection
    families?: FamiliesSection
    education?: EducationSection
    accounts?: AccountsSection
  }
}
