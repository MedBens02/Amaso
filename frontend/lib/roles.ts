/**
 * Mirrors the role values in App\Models\User::ROLES on the backend.
 * Keep in sync if a role is added/renamed there.
 */
export const ROLE_LABELS: Record<string, string> = {
  admin: "مدير النظام",
  accountant: "محاسب",
  social_worker: "أخصائي اجتماعي",
}

export function getRoleLabel(role: string): string {
  return ROLE_LABELS[role] || role
}

export interface DemoAccount {
  email: string
  password: string
  role: string
  label: string
}

/** Shown as quick-fill options on the login page. */
export const DEMO_ACCOUNTS: DemoAccount[] = [
  { email: "admin@amaso.org", password: "password", role: "admin", label: ROLE_LABELS.admin },
  { email: "accountant@amaso.org", password: "password", role: "accountant", label: ROLE_LABELS.accountant },
  { email: "social@amaso.org", password: "password", role: "social_worker", label: ROLE_LABELS.social_worker },
]

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

export function isCurrentUserAdmin(): boolean {
  return getCurrentUser()?.role === "admin"
}
