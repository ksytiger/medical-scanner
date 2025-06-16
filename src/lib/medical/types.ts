/**
 * @file types.ts
 * @description 의료기관 스캐너 관련 타입 정의
 * 
 * 주요 타입:
 * - MedicalFacility: 의료기관 기본 정보 (Supabase 스키마 기반)
 * - HospitalData: 프론트엔드 표시용 데이터 (기존 호환성 유지)
 * - FilterState: 검색 필터 상태
 */

// Supabase 스키마 기반 타입 정의
export interface MedicalFacility {
  id: number
  name: string
  service_type: string
  license_date: string
  phone: string | null
  healthcare_type: string
  num_doctors: number | null
  num_rooms: number | null
  num_beds: number | null
  total_area: number | null
  address_id: number
  subject_count: number
  // JOIN으로 가져올 주소 정보
  road_address?: string
  road_postcode?: string
}

// 기존 프론트엔드 호환성을 위한 타입 (기존 유지)
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
  selectedCategory: string | null
  region: {
    sido: string
    gugun: string
  }
  hasContact: boolean
  keyword: string
}

// 의료과목 타입
export interface MedicalSubject {
  id: number
  subject_name: string
  subject_category: string | null
}

// 필터링 옵션을 위한 타입
export interface FilterOptions {
  serviceTypes: string[]
  healthcareTypes: string[]
  regions: {
    sido: string[]
    gugun: { [sido: string]: string[] }
  }
} 