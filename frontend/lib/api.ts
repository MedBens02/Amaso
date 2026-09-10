const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1'

interface ApiResponse<T> {
  data: T
  meta?: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
  message?: string
  errors?: Record<string, string[]>
}

export class ApiError extends Error {
  status: number
  errors?: Record<string, string[]>
  /** The failed response's `data` payload, for endpoints that report partial success. */
  data?: any

  constructor(response: Response, data?: any) {
    super(data?.message || `HTTP ${response.status}`)
    this.status = response.status
    this.errors = data?.errors
    this.data = data?.data
  }
}

const TOKEN_STORAGE_KEY = 'amaso_token'
const USER_STORAGE_KEY = 'user'

class ApiClient {
  private baseURL: string
  private token: string | null = null

  constructor() {
    this.baseURL = API_BASE_URL
    // localStorage isn't available during SSR/module init on the server -
    // pick the token back up once we're actually in the browser.
    if (typeof window !== 'undefined') {
      this.token = window.localStorage.getItem(TOKEN_STORAGE_KEY)
    }
  }

  setToken(token: string) {
    this.token = token
  }

  get isAuthenticated(): boolean {
    return this.token !== null
  }

  /** For the window.fetch patch below, which authenticates raw fetch() calls too. */
  getToken(): string | null {
    return this.token
  }

  /** Clears the token and cached user, in memory and in storage. */
  clearSession() {
    this.token = null
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(TOKEN_STORAGE_KEY)
      window.localStorage.removeItem(USER_STORAGE_KEY)
    }
  }

  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(this.token && { Authorization: `Bearer ${this.token}` }),
      ...options.headers,
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      })

      const data = await response.json()

      if (!response.ok) {
        // A 401 on the login attempt itself just means wrong credentials -
        // let the caller show that. A 401 on any other endpoint means the
        // stored token is gone/expired: drop it and send the user back to
        // the login page instead of leaving every page silently broken.
        if (response.status === 401 && endpoint !== '/auth/login' && typeof window !== 'undefined') {
          this.clearSession()
          window.location.href = '/login'
        }
        throw new ApiError(response, data)
      }

      return data
    } catch (error) {
      if (error instanceof ApiError) {
        throw error
      }
      throw new Error(`Network error: ${error}`)
    }
  }

  // Authentication
  async login(email: string, password: string) {
    const response = await this.request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })

    this.setToken(response.data.token)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(TOKEN_STORAGE_KEY, response.data.token)
      window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(response.data.user))
    }

    return response
  }

  async logout() {
    try {
      await this.request('/auth/logout', { method: 'POST' })
    } finally {
      // Always clear locally, even if the network call failed (offline,
      // token already expired, etc.) - the user still expects to be logged
      // out on this device.
      this.clearSession()
    }
  }

  async getMe() {
    return this.request<any>('/auth/me')
  }

  /** Update your own name/email/phone/address. Role is not editable here. */
  async updateProfile(data: {
    name: string
    email: string
    phone?: string | null
    address?: string | null
  }) {
    const response = await this.request<any>('/auth/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    })

    // The dashboard layout and every role check read this cached copy, so it
    // has to follow the server or the header keeps showing the old name.
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(response.data))
    }

    return response
  }

  /**
   * Change your own password. The backend revokes every token and issues a
   * fresh one, so we swap it in here - otherwise the user is silently
   * logged out the moment they succeed.
   */
  async changePassword(data: {
    current_password: string
    password: string
    password_confirmation: string
  }) {
    const response = await this.request<{ token: string; user: any }>('/auth/password', {
      method: 'POST',
      body: JSON.stringify(data),
    })

    this.setToken(response.data.token)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(TOKEN_STORAGE_KEY, response.data.token)
      window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(response.data.user))
    }

    return response
  }

  // Organization settings - readable by anyone signed in, writable by admins
  async getOrganizationSettings() {
    return this.request<{
      name: string
      address: string | null
      phone: string | null
      email: string | null
    }>('/settings/organization')
  }

  async updateOrganizationSettings(data: {
    name: string
    address?: string | null
    phone?: string | null
    email?: string | null
  }) {
    return this.request<any>('/settings/organization', {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  // Account management (admin only - the API returns 403 for anyone else)
  async getUsers(params?: { search?: string; role?: string; is_active?: boolean }) {
    const searchParams = new URLSearchParams()
    if (params?.search) searchParams.set('search', params.search)
    if (params?.role) searchParams.set('role', params.role)
    if (params?.is_active !== undefined) searchParams.set('is_active', params.is_active ? '1' : '0')

    const query = searchParams.toString()
    return this.request<any[]>(`/users${query ? `?${query}` : ''}`)
  }

  async createUser(data: {
    name: string
    email: string
    password: string
    password_confirmation: string
    role: string
    phone?: string | null
    address?: string | null
  }) {
    return this.request<any>('/users', { method: 'POST', body: JSON.stringify(data) })
  }

  async updateUser(id: number, data: {
    name: string
    email: string
    role: string
    phone?: string | null
    address?: string | null
  }) {
    return this.request<any>(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) })
  }

  async setUserActive(id: number, isActive: boolean) {
    return this.request<any>(`/users/${id}/active`, {
      method: 'PATCH',
      body: JSON.stringify({ is_active: isActive }),
    })
  }

  async resetUserPassword(id: number, password: string) {
    return this.request<any>(`/users/${id}/password`, {
      method: 'POST',
      body: JSON.stringify({ password, password_confirmation: password }),
    })
  }

  async deleteUser(id: number) {
    return this.request<any>(`/users/${id}`, { method: 'DELETE' })
  }

  // Donors API
  async getDonors(params?: {
    search?: string
    per_page?: number
    page?: number
  }) {
    const searchParams = new URLSearchParams()
    if (params?.search) searchParams.set('search', params.search)
    if (params?.per_page) searchParams.set('per_page', params.per_page.toString())
    if (params?.page) searchParams.set('page', params.page.toString())
    
    const query = searchParams.toString()
    return this.request<any[]>(`/donors${query ? `?${query}` : ''}`)
  }

  async createDonor(data: {
    first_name: string
    last_name: string
    phone?: string
    email?: string
    address?: string
    is_kafil?: boolean
    monthly_pledge?: number
    widow_id?: number
  }) {
    return this.request<any>('/donors', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateDonor(id: number, data: {
    first_name: string
    last_name: string
    phone?: string
    email?: string
    address?: string
    is_kafil?: boolean
    monthly_pledge?: number
    widow_id?: number
  }) {
    return this.request<any>(`/donors/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async getDonor(id: number) {
    return this.request<any>(`/donors/${id}`)
  }

  async deleteDonor(id: number) {
    return this.request<any>(`/donors/${id}`, {
      method: 'DELETE',
    })
  }

  // Incomes API
  async createIncome(data: {
    fiscal_year_id: number
    budget_id: number
    income_category_id: number
    donor_id?: number
    widow_id?: number
    kafil_id?: number
    income_date: string
    amount: number
    payment_method: 'Cash' | 'Cheque' | 'BankWire'
    cheque_number?: string
    receipt_number?: string
    bank_account_id?: number
    remarks?: string
    transferred_at?: string
  }) {
    return this.request<any>('/incomes', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateIncome(id: number, data: {
    fiscal_year_id: number
    budget_id: number
    income_category_id: number
    donor_id?: number
    widow_id?: number
    kafil_id?: number
    income_date: string
    amount: number
    payment_method: 'Cash' | 'Cheque' | 'BankWire'
    cheque_number?: string
    receipt_number?: string
    bank_account_id?: number
    remarks?: string
    transferred_at?: string
  }) {
    return this.request<any>(`/incomes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteIncome(id: number) {
    return this.request<any>(`/incomes/${id}`, {
      method: 'DELETE',
    })
  }

  async getIncomes(params?: any) {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : ''
    return this.request<any>(`/incomes${queryString}`)
  }

  async getIncome(id: number) {
    return this.request<any>(`/incomes/${id}`)
  }

  async transferIncomeToBank(id: number, data: {
    bank_account_id: number
    transferred_at: string
    remarks?: string
  }) {
    return this.request<any>(`/incomes/${id}/transfer-to-bank`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // Kafala Chamila (comprehensive sponsorship split)
  async getKafalaChamilaSplits() {
    return this.request<any>('/kafala-chamila/splits')
  }

  // Current balance of each part: approved income in minus approved expense
  // out. One shared pool per part across every kafil, not per-widow.
  async getKafalaChamilaBalances() {
    return this.request<any>('/kafala-chamila/balances')
  }

  // What each family brought into the pools and what has already been spent
  // on them out of it. Advisory - the money itself stays pooled.
  async getKafalaChamilaFamilyBalances(widowIds: number[]) {
    const params = new URLSearchParams()
    widowIds.forEach((id) => params.append('widow_ids[]', String(id)))
    return this.request<any>(`/kafala-chamila/family-balances?${params.toString()}`)
  }

  async updateKafalaChamilaSplits(splits: { id: number; percentage: number }[]) {
    return this.request<any>('/kafala-chamila/splits', {
      method: 'PUT',
      body: JSON.stringify({ splits }),
    })
  }

  async createKafalaChamilaIncome(data: {
    kafil_id: number
    widow_id?: number
    fiscal_year_id: number
    income_date: string
    payment_method: 'Cash' | 'Cheque' | 'BankWire'
    cheque_number?: string
    receipt_number?: string
    bank_account_id?: number
    remarks?: string
    transferred_at?: string
    splits: { split_id: number; amount: number }[]
  }) {
    return this.request<any>('/kafala-chamila/incomes', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // Reports
  async getKafilStatement(kafilId: number, params?: { from?: string; to?: string }) {
    const query = params && (params.from || params.to)
      ? '?' + new URLSearchParams(params as Record<string, string>).toString()
      : ''
    return this.request<any>(`/reports/kafils/${kafilId}/statement${query}`)
  }

  // Expenses API
  async createExpense(data: any) {
    // Transform the data for the API
    const formattedData = {
      ...data,
      expense_date: data.expense_date instanceof Date 
        ? data.expense_date.toISOString().split('T')[0] 
        : data.expense_date
    }
    
    return this.request<any>('/expenses', {
      method: 'POST',
      body: JSON.stringify(formattedData),
    })
  }

  async updateExpense(id: number, data: any) {
    return this.request<any>(`/expenses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async getExpenses(params?: any) {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : ''
    return this.request<any>(`/expenses${queryString}`)
  }

  async getExpense(id: number) {
    return this.request<any>(`/expenses/${id}`)
  }

  async deleteExpense(id: number) {
    return this.request<any>(`/expenses/${id}`, {
      method: 'DELETE',
    })
  }

  /**
   * bankAccountId is only needed for a cash expense that was recorded
   * without one - the approver is choosing, right now, which account the
   * cash came out of. It's ignored if the expense already has an account.
   */
  async approveExpense(id: number, bankAccountId?: number) {
    return this.request<any>(`/expenses/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ bank_account_id: bankAccountId ?? null }),
    })
  }

  async getBeneficiaryGroups() {
    return this.request<any[]>('/beneficiary-groups')
  }

  async getBeneficiaryGroupMembers(groupId: number) {
    return this.request<any[]>(`/beneficiary-groups/${groupId}/members`)
  }

  async getBeneficiaries() {
    return this.request<any[]>('/beneficiaries')
  }

  async getPartners() {
    return this.request<any[]>('/references/partners')
  }

  // Transfers API
  async createTransfer(data: {
    fiscal_year_id: number
    transfer_date: string
    from_account_id: number
    to_account_id: number
    amount: number
    remarks?: string
  }) {
    return this.request<any>('/transfers', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // Lookup data
  async getFiscalYears() {
    return this.request<any[]>('/fiscal-years')
  }

  async getActiveFiscalYear() {
    const response = await this.getFiscalYears()
    return response.data?.find((fy: any) => fy.isActive) || null
  }

  async getBankAccounts() {
    return this.request<any[]>('/bank-accounts')
  }

  async getKafils() {
    return this.request<any[]>('/kafils')
  }

  async getBudgets() {
    return this.request<any[]>('/budgets')
  }

  async getIncomeCategories() {
    return this.request<any[]>('/income-categories')
  }

  async getExpenseCategories() {
    return this.request<any[]>('/expense-categories')
  }

  async getWidowsReferenceData() {
    return this.request<any>('/widows-reference-data')
  }


  // Widows API
  async getWidows(params?: {
    search?: string
    widow_id?: number
    has_disability?: boolean
    education_level?: string
    illness_id?: number
    aid_type_id?: number
    skill_id?: number
    has_kafil?: boolean
    has_chronic_illness?: boolean
    has_active_maouna?: boolean
    maouna_partner_id?: number
    per_page?: number
    page?: number
    sort_by?: string
    sort_order?: 'asc' | 'desc'
    archived?: boolean
  }) {
    const searchParams = new URLSearchParams()
    if (params?.search) searchParams.set('search', params.search)
    if (params?.archived) searchParams.set('archived', '1')
    if (params?.widow_id) searchParams.set('widow_id', params.widow_id.toString())
    if (params?.has_disability !== undefined) searchParams.set('has_disability', params.has_disability.toString())
    if (params?.education_level) searchParams.set('education_level', params.education_level)
    if (params?.illness_id) searchParams.set('illness_id', params.illness_id.toString())
    if (params?.aid_type_id) searchParams.set('aid_type_id', params.aid_type_id.toString())
    if (params?.skill_id) searchParams.set('skill_id', params.skill_id.toString())
    if (params?.has_kafil !== undefined) searchParams.set('has_kafil', params.has_kafil.toString())
    if (params?.has_chronic_illness !== undefined) searchParams.set('has_chronic_illness', params.has_chronic_illness.toString())
    if (params?.has_active_maouna !== undefined) searchParams.set('has_active_maouna', params.has_active_maouna.toString())
    if (params?.maouna_partner_id) searchParams.set('maouna_partner_id', params.maouna_partner_id.toString())
    if (params?.per_page) searchParams.set('per_page', params.per_page.toString())
    if (params?.page) searchParams.set('page', params.page.toString())
    if (params?.sort_by) searchParams.set('sort_by', params.sort_by)
    if (params?.sort_order) searchParams.set('sort_order', params.sort_order)
    
    const query = searchParams.toString()
    return this.request<any[]>(`/widows${query ? `?${query}` : ''}`)
  }

  async createWidow(data: {
    widow_id: number
    first_name: string
    last_name: string
    phone?: string
    email?: string
    address?: string
    neighborhood?: string
    admission_date: string
    national_id: string
    birth_date: string
    marital_status: 'Widowed' | 'Divorced' | 'Single'
    education_level?: string
    disability_flag?: boolean
    disability_type?: string
  }) {
    return this.request<any>('/widows', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateWidow(id: number, data: {
    // Basic widow information
    first_name?: string
    last_name?: string
    phone?: string
    email?: string
    address?: string
    neighborhood?: string
    admission_date?: string
    national_id?: string
    birth_date?: string
    marital_status?: 'Widowed' | 'Divorced' | 'Single'
    education_level?: string
    disability_flag?: boolean
    disability_type?: string
    
    // Social information
    social_situation?: string
    has_chronic_disease?: boolean
    has_maouna?: boolean
    housing_type_id?: number
    housing_status?: string
    has_electricity?: boolean
    has_water?: boolean
    has_furniture?: number
    
    // Children/Orphans
    children?: Array<{
      first_name: string
      last_name: string
      birth_date: string
      gender: string
      education_level_id?: number | null
    }>
    
    // Skills, illnesses, aid types
    skills?: number[]
    new_skills?: string[]
    illnesses?: number[]
    aid_types?: number[]
    
    // Income and expenses
    income?: Array<{
      category_id: number
      amount: number
      description?: string
    }>
    expenses?: Array<{
      category_id: number
      amount: number
      description?: string
    }>
    
    // Maouna
    maouna?: Array<{
      partner_id: number
      amount: number
    }>
    
    // Kafils
    kafils?: Array<{
      kafil_id: string
      amount: number
    }>
  }) {
    return this.request<any>(`/widows/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async getWidow(id: number) {
    return this.request<any>(`/widows/${id}?include=orphans,widow_files,widow_social,skills,illnesses,aid_types,social_income,social_expenses,active_maouna,sponsorships`)
  }

  /** Archive a family (soft delete) with the leaving information. */
  async archiveWidow(id: number, leaving: {
    leaving_date: string
    leaving_reason: string
    leaving_details?: string
  }) {
    return this.request<any>(`/widows/${id}`, {
      method: 'DELETE',
      body: JSON.stringify(leaving),
    })
  }

  async restoreWidow(id: number) {
    return this.request<any>(`/widows/${id}/restore`, {
      method: 'POST',
    })
  }

  // Education API
  async getSchools(params?: { search?: string; type?: string }) {
    const searchParams = new URLSearchParams()
    if (params?.search) searchParams.set('search', params.search)
    if (params?.type) searchParams.set('type', params.type)
    const query = searchParams.toString()
    return this.request<any[]>(`/schools${query ? `?${query}` : ''}`)
  }

  async createSchool(data: { name: string; type: string; is_private: boolean; is_amaso_linked: boolean; notes?: string }) {
    return this.request<any>('/schools', { method: 'POST', body: JSON.stringify(data) })
  }

  async updateSchool(id: number, data: { name: string; type: string; is_private: boolean; is_amaso_linked: boolean; notes?: string }) {
    return this.request<any>(`/schools/${id}`, { method: 'PUT', body: JSON.stringify(data) })
  }

  async deleteSchool(id: number) {
    return this.request<any>(`/schools/${id}`, { method: 'DELETE' })
  }

  async getAcademicYears() {
    return this.request<any[]>('/academic-years')
  }

  async createAcademicYear(startYear: number) {
    return this.request<any>('/academic-years', { method: 'POST', body: JSON.stringify({ start_year: startYear }) })
  }

  async rolloverAcademicYear() {
    return this.request<any>('/academic-years/rollover', { method: 'POST' })
  }

  async getEnrollments(params?: {
    academic_year_id?: number
    school_id?: number
    education_level_id?: number
    status?: string
    search?: string
    page?: number
    per_page?: number
  }) {
    const searchParams = new URLSearchParams()
    Object.entries(params || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') searchParams.set(key, String(value))
    })
    const query = searchParams.toString()
    return this.request<any[]>(`/enrollments${query ? `?${query}` : ''}`)
  }

  async createEnrollment(data: {
    orphan_id: number
    academic_year_id: number
    education_level_id?: number | null
    school_id?: number | null
    specialty?: string | null
    notes?: string | null
  }) {
    return this.request<any>('/enrollments', { method: 'POST', body: JSON.stringify(data) })
  }

  async updateEnrollment(id: number, data: {
    education_level_id?: number | null
    school_id?: number | null
    specialty?: string | null
    status?: string
    notes?: string | null
    first_semester_grade?: number | null
    second_semester_grade?: number | null
    grade_scale?: number | null
  }) {
    return this.request<any>(`/enrollments/${id}`, { method: 'PUT', body: JSON.stringify(data) })
  }

  async deleteEnrollment(id: number) {
    return this.request<any>(`/enrollments/${id}`, { method: 'DELETE' })
  }

  /** Marks a whole class in one request; rows over their own scale come back rejected. */
  async saveEnrollmentGrades(grades: Array<{
    enrollment_id: number
    first_semester_grade?: number | null
    second_semester_grade?: number | null
    grade_scale?: number | null
  }>) {
    return this.request<any>('/enrollments/grades', { method: 'POST', body: JSON.stringify({ grades }) })
  }

  /**
   * Reports are rendered as real PDFs server-side (selectable, searchable text
   * rather than a screenshot), so downloading one is an authenticated fetch
   * whose blob is handed to the browser. The server names the file.
   */
  /** Authenticated download of a generated report (PDF or spreadsheet). */
  async downloadReport(
    endpoint: string,
    params?: Record<string, any>,
    fallbackName = 'report',
    accept = 'application/pdf',
  ) {
    const searchParams = new URLSearchParams()
    const put = (key: string, value: any) => {
      if (value === undefined || value === null || value === '') return
      searchParams.set(key, typeof value === 'boolean' ? (value ? '1' : '0') : String(value))
    }

    for (const [key, value] of Object.entries(params || {})) {
      // The report filter panel models a range as {from, to}. A date range is
      // the report's period and flattens to from/to; any other range keeps its
      // field name so two ranges in one report cannot collide.
      if (value && typeof value === 'object' && ('from' in value || 'to' in value)) {
        const prefix = key === 'date_range' || key === 'dateRange' || key === 'period' ? '' : `${key}_`
        put(`${prefix}from`, (value as any).from)
        put(`${prefix}to`, (value as any).to)
        continue
      }
      put(key, value)
    }
    const query = searchParams.toString()

    const response = await fetch(`${this.baseURL}${endpoint}${query ? `?${query}` : ''}`, {
      headers: {
        Accept: accept,
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
      },
    })

    if (!response.ok) {
      // The error usually comes back as JSON even though we asked for a file.
      // A 500 with Laravel's debug page is HTML, though, and swallowing that
      // left the toast saying only "HTTP 500" - so pull the exception line
      // out of it, which is what actually names a missing dependency or an
      // unreadable font.
      let data: any = {}
      const body = await response.text().catch(() => '')
      try {
        data = JSON.parse(body)
      } catch {
        const title = body.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim()
        if (title && title !== 'Laravel') data = { message: title }
      }
      throw new ApiError(response, data)
    }

    const disposition = response.headers.get('Content-Disposition') || ''
    const match = disposition.match(/filename="?([^"';]+)"?/)
    const filename = match ? match[1] : fallbackName

    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    link.remove()
    // Revoking immediately can cancel the download in some browsers.
    setTimeout(() => URL.revokeObjectURL(url), 10_000)

    return filename
  }

  downloadPdf(endpoint: string, params?: Record<string, any>, fallbackName = 'report.pdf') {
    return this.downloadReport(endpoint, params, fallbackName, 'application/pdf')
  }

  downloadExcel(endpoint: string, params?: Record<string, any>, fallbackName = 'report.xlsx') {
    return this.downloadReport(
      endpoint,
      params,
      fallbackName,
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    )
  }

  async getSchoolPerformance(params?: {
    academic_year_id?: number
    gender?: string
    education_level_id?: number
    school_id?: number
    school_type?: string
    is_private?: boolean
    is_amaso_linked?: boolean
    semester?: string
    group_by?: string
    top_n?: number
  }) {
    const searchParams = new URLSearchParams()
    for (const [key, value] of Object.entries(params || {})) {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.set(key, typeof value === 'boolean' ? (value ? '1' : '0') : String(value))
      }
    }
    const query = searchParams.toString()
    return this.request<any>(`/reports/school-performance${query ? `?${query}` : ''}`)
  }

  // Kafils API
  async getKafils(params?: {
    search?: string
    per_page?: number
    page?: number
  }) {
    const searchParams = new URLSearchParams()
    if (params?.search) searchParams.set('search', params.search)
    if (params?.per_page) searchParams.set('per_page', params.per_page.toString())
    if (params?.page) searchParams.set('page', params.page.toString())
    
    const query = searchParams.toString()
    return this.request<any[]>(`/kafils${query ? `?${query}` : ''}`)
  }

  async createKafil(data: {
    first_name: string
    last_name: string
    phone?: string
    email?: string
    address?: string
    donor_id: number
    monthly_pledge: number
    sponsorships: Array<{
      widow_id: number
      amount: number
    }>
  }) {
    return this.request<any>('/kafils', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateKafil(id: number, data: {
    first_name: string
    last_name: string
    phone?: string
    email?: string
    address?: string
    monthly_pledge: number
  }) {
    return this.request<any>(`/kafils/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async getKafil(id: number) {
    return this.request<any>(`/kafils/${id}`)
  }

  async deleteKafil(id: number) {
    return this.request<any>(`/kafils/${id}`, {
      method: 'DELETE',
    })
  }

  async addSponsorship(kafilId: number, data: {
    widow_id: number
    amount: number
  }) {
    return this.request<any>(`/kafils/${kafilId}/sponsorships`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateSponsorship(kafilId: number, sponsorshipId: number, data: {
    widow_id?: number
    amount?: number
  }) {
    return this.request<any>(`/kafils/${kafilId}/sponsorships/${sponsorshipId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async removeSponsorship(kafilId: number, sponsorshipId: number) {
    return this.request<any>(`/kafils/${kafilId}/sponsorships/${sponsorshipId}`, {
      method: 'DELETE',
    })
  }

  async removeKafilStatus(kafilId: number) {
    return this.request<any>(`/kafils/${kafilId}/remove-status`, {
      method: 'POST',
    })
  }

  async getKafilsForSponsorship(search?: string) {
    const query = search ? `?search=${encodeURIComponent(search)}` : ''
    return this.request<any[]>(`/kafils-for-sponsorship${query}`)
  }

  async createSponsorship(data: { kafil_id: string; widow_id: number; amount: number }) {
    return this.request<any>(`/sponsorships`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // Orphans API (read-only)
  async getOrphans(params?: {
    search?: string
    gender?: string
    education_level?: string
    min_age?: number
    max_age?: number
    per_page?: number
    page?: number
    sort_by?: string
    sort_order?: 'asc' | 'desc'
  }) {
    const searchParams = new URLSearchParams()
    if (params?.search) searchParams.set('search', params.search)
    if (params?.gender) searchParams.set('gender', params.gender)
    if (params?.education_level) searchParams.set('education_level', params.education_level)
    if (params?.min_age) searchParams.set('min_age', params.min_age.toString())
    if (params?.max_age) searchParams.set('max_age', params.max_age.toString())
    if (params?.per_page) searchParams.set('per_page', params.per_page.toString())
    if (params?.page) searchParams.set('page', params.page.toString())
    if (params?.sort_by) searchParams.set('sort_by', params.sort_by)
    if (params?.sort_order) searchParams.set('sort_order', params.sort_order)
    
    const query = searchParams.toString()
    return this.request<any[]>(`/orphans${query ? `?${query}` : ''}`)
  }

  async getOrphan(id: number) {
    return this.request<any>(`/orphans/${id}`)
  }

  // Education levels for orphans
  async getOrphansEducationLevels() {
    return this.request<any[]>('/orphans-education-levels')
  }
}

export const api = new ApiClient()

/**
 * Builds a URL against the API base, for the call sites that need a URL
 * object to assemble their query string.
 *
 * `new URL('/api/v1/incomes')` throws: a relative path needs a base. That
 * makes a relative NEXT_PUBLIC_API_BASE_URL - which is exactly what a
 * single-origin deployment sets, where one web server hosts the pages and
 * proxies /api to Laravel - break every such call site with an unhelpful
 * "Invalid URL". Resolving against the page's own origin makes an absolute
 * base and a relative one both work.
 */
export function apiUrl(path: string, base: string = API_BASE_URL): URL {
  const target = `${base.replace(/\/$/, '')}${path}`

  if (/^https?:\/\//i.test(target)) {
    return new URL(target)
  }

  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost'

  return new URL(target, origin)
}

/**
 * A large part of this codebase calls `fetch()` directly against the API
 * instead of going through ApiClient (relative `/api/v1/...` paths proxied
 * by next.config.mjs, or absolute NEXT_PUBLIC_API_BASE_URL calls). None of
 * those call sites can attach the bearer token themselves, and every v1
 * route now requires one. Patching window.fetch once, here, means every
 * such call - present and future - is authenticated and gets the same
 * "session expired -> back to /login" handling as requests made through
 * ApiClient, without having to hunt down and edit every call site.
 * Scoped to same-origin/`/api/v1/` requests only; anything else passes
 * through untouched.
 */
if (typeof window !== 'undefined' && !(window as any).__amasoFetchPatched) {
  (window as any).__amasoFetchPatched = true
  const originalFetch = window.fetch.bind(window)

  window.fetch = async (input: RequestInfo | URL, init: RequestInit = {}) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url
    const isApiRequest = url.includes('/api/v1/')

    if (isApiRequest) {
      const headers = new Headers(init.headers ?? (input instanceof Request ? input.headers : undefined))
      const token = api.getToken()
      if (token && !headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${token}`)
      }
      if (!headers.has('Accept')) {
        headers.set('Accept', 'application/json')
      }
      init = { ...init, headers }
    }

    const response = await originalFetch(input, init)

    if (isApiRequest && response.status === 401 && !url.includes('/auth/login')) {
      api.clearSession()
      window.location.href = '/login'
    }

    return response
  }
}

export default api