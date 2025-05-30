/**
 * @file types.ts
 * @description 의료기관 스캐너 관련 타입 정의
 * 
 * 주요 타입:
 * - HospitalData: 의료기관 기본 정보
 * - FilterState: 검색 필터 상태
 */

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