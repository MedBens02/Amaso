/**
 * Mirrors the role values in App\Models\User::ROLES on the backend.
 * Keep in sync if a role is added/renamed there.
 */
export const ROLE_LABELS: Record<string, string> = {
  superuser: "مستخدم أعلى",
  admin: "مدير النظام",
  accountant: "محاسب",
  social_worker: "أخصائي اجتماعي",
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
