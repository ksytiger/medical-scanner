export interface HospitalData {
  id: number
  name: string
  category: string
  address: string
  phone: string | null
  openDate: string
  specialistCount: number | null
  sido: string
  gugun: string
}

export interface FilterState {
  dateRange: {
    from: Date
    to: Date
  }
  specialties: string[]
  categories?: string[]
  region: {
    sido: string
    gugun: string
  }
  hasContact: boolean
  keyword: string
}
