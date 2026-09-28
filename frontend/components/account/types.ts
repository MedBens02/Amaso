export interface ManagedUser {
  id: number
  name: string
  email: string
  role: string
  phone: string | null
  address: string | null
  is_active: boolean
  /** Whether signing in needs the emailed code as well as the password. */
  two_factor_enabled: boolean
  last_login_at: string | null
  created_at: string | null
}
