export interface ManagedUser {
  id: number
  name: string
  email: string
  role: string
  phone: string | null
  address: string | null
  is_active: boolean
  last_login_at: string | null
  created_at: string | null
}
