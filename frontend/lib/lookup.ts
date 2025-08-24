// Lookup data helper functions
export interface LookupOption {
  id: string
  name: string
}

export interface LookupData {
  neighborhoods: LookupOption[]
  housingTypes: LookupOption[]
  incomeCategories: LookupOption[]
  expenseCategories: LookupOption[]
  skills: LookupOption[]
  illnesses: LookupOption[]
  aidTypes: LookupOption[]
  partners: LookupOption[]
  kafils: LookupOption[]
}

// Mock API functions - replace with actual API calls
export async function fetchNeighborhoods(): Promise<LookupOption[]> {
  // Simulate API call
  return [
    { id: "zahra", name: "حي الزهراء" },
    { id: "noor", name: "حي النور" },
    { id: "salam", name: "حي السلام" },
    { id: "amal", name: "حي الأمل" },
  ]
}

export async function fetchHousingTypes(): Promise<LookupOption[]> {
  return [
    { id: "apartment", name: "شقة" },
    { id: "house", name: "منزل" },
    { id: "room", name: "غرفة" },
  ]
}

export async function fetchIncomeCategories(): Promise<LookupOption[]> {
  return [
    { id: "salary", name: "راتب" },
    { id: "pension", name: "معاش" },
    { id: "aid", name: "مساعدة" },
    { id: "business", name: "تجارة" },
  ]
}

export async function fetchExpenseCategories(): Promise<LookupOption[]> {
  return [
    { id: "rent", name: "إيجار" },
    { id: "food", name: "طعام" },
    { id: "medicine", name: "دواء" },
    { id: "education", name: "تعليم" },
    { id: "utilities", name: "فواتير" },
  ]
}

export async function fetchSkills(): Promise<LookupOption[]> {
  return [
    { id: "sewing", name: "خياطة" },
    { id: "cooking", name: "طبخ" },
    { id: "cleaning", name: "تنظيف" },
    { id: "teaching", name: "تدريس" },
    { id: "handicrafts", name: "أشغال يدوية" },
  ]
}

export async function fetchIllnesses(): Promise<LookupOption[]> {
  return [
    { id: "diabetes", name: "سكري" },
    { id: "hypertension", name: "ضغط دم" },
    { id: "heart", name: "قلب" },
    { id: "kidney", name: "كلى" },
  ]
}

export async function fetchAidTypes(): Promise<LookupOption[]> {
  return [
    { id: "monthly", name: "مساعدة شهرية" },
    { id: "medical", name: "مساعدة طبية" },
    { id: "educational", name: "مساعدة تعليمية" },
    { id: "emergency", name: "مساعدة طارئة" },
  ]
}

export async function fetchPartners(): Promise<LookupOption[]> {
  return [
    { id: "partner1", name: "شريك المعونة الأول" },
    { id: "partner2", name: "شريك المعونة الثاني" },
  ]
}

export async function fetchKafils(): Promise<LookupOption[]> {
  return [
    { id: "kafil1", name: "محمد أحمد السيد" },
    { id: "kafil2", name: "علي محمود حسن" },
    { id: "kafil3", name: "فاطمة يوسف" },
  ]
}

// Main function to fetch all lookup data
export async function fetchAllLookupData(): Promise<LookupData> {
  const [
    neighborhoods,
    housingTypes,
    incomeCategories,
    expenseCategories,
    skills,
    illnesses,
    aidTypes,
    partners,
    kafils,
  ] = await Promise.all([
    fetchNeighborhoods(),
    fetchHousingTypes(),
    fetchIncomeCategories(),
    fetchExpenseCategories(),
    fetchSkills(),
    fetchIllnesses(),
    fetchAidTypes(),
    fetchPartners(),
    fetchKafils(),
  ])

  return {
    neighborhoods,
    housingTypes,
    incomeCategories,
    expenseCategories,
    skills,
    illnesses,
    aidTypes,
    partners,
    kafils,
  }
}
