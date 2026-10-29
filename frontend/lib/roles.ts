/**
 * Mirrors the role values in App\Models\User::ROLES on the backend.
 * Keep in sync if a role is added/renamed there.
 */
export const ROLE_LABELS: Record<string, string> = {
  superuser: "مستخدم أعلى",
  admin: "مدير النظام",
  accountant: "محاسب",
  social_worker: "أخصائي اجتماعي",
  education_officer: "مسؤول التعليم",
}

/**
 * Who may write what, mirroring App\Support\Roles on the backend.
 *
 * Reading is open to anyone with an account, so nothing here hides a
 * record - these decide which menu entries and buttons are worth showing.
 * The endpoints carry the same lists themselves, because a hidden button
 * stops nobody calling the API.
 */
export const ROLE_GROUPS = {
  /** The books: income, expenses, transfers, accounts, the fiscal year. */
  finance: ["admin", "superuser", "accountant"],
  /** The families, the children, and the social file's reference lists. */
  families: ["admin", "superuser", "social_worker"],
  /** Enrollments, marks, schools, transport. */
  education: ["admin", "superuser", "education_officer", "social_worker"],
  /** Writing down what was spent, before anyone approves it. */
  expenseEntry: ["admin", "superuser", "accountant", "social_worker"],
} as const

export function currentUserIn(group: keyof typeof ROLE_GROUPS): boolean {
  const role = getCurrentUser()?.role
  return !!role && (ROLE_GROUPS[group] as readonly string[]).includes(role)
}

export function getRoleLabel(role: string): string {
  return ROLE_LABELS[role] || role
}

/** The cached profile written by ApiClient.login / the dashboard layout's getMe() refresh. */
export function getCurrentUser(): { id: number; name: string; email: string; role: string } | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.localStorage.getItem("user")
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

/**
 * Has admin powers - which a superuser does too.
 *
 * Mirrors User::isAdmin() on the backend. Every caller asks this to decide
 * whether to show an admin-only control, so answering only for the literal
 * role would hide the ordinary admin screens from the two highest accounts.
 */
export function isCurrentUserAdmin(): boolean {
  const role = getCurrentUser()?.role
  return role === "admin" || role === "superuser"
}

/**
 * May turn a recorded figure into money the books count.
 *
 * Presentation only, like the others here: the endpoints carry
 * `role:admin,superuser,accountant` themselves, because a hidden button
 * stops nobody calling them.
 */
export function isCurrentUserApprover(): boolean {
  const role = getCurrentUser()?.role
  return role === "admin" || role === "superuser" || role === "accountant"
}

/**
 * May manage accounts and read the activity log.
 *
 * Presentation only - the backend gates both on `role:superuser`, because
 * hiding a menu entry does not stop anyone calling the endpoint.
 */
export function isCurrentUserSuperuser(): boolean {
  return getCurrentUser()?.role === "superuser"
}
