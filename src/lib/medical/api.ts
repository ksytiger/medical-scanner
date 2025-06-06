/**
 * @file api.ts
 * @description 의료기관 스캐너 API 함수들
 * 
 * 이 파일은 Supabase에서 의료기관 데이터를 가져오고 처리하는 서버 액션들을 포함합니다.
 * 
 * 주요 기능:
 * 1. 의료기관 목록 조회 (필터링 지원)
 * 2. Supabase 데이터를 프론트엔드 호환 형태로 변환
 * 3. 지역 정보 파싱 및 필터링 옵션 제공
 * 
 * 핵심 구현 로직:
 * - createServerSupabaseClient를 사용한 서버사이드 데이터 페칭
 * - JOIN 쿼리로 주소 정보 포함
 * - 날짜, 키워드, 연락처 등 다양한 필터 조건 지원
 * - 에러 핸들링 및 로깅
 * 
 * @dependencies
 * - @/utils/supabase/server: 서버사이드 Supabase 클라이언트
 * - @/lib/medical/types: 의료기관 관련 타입 정의
 * 
 * @see {@link /src/components/medical/database-section.tsx} - 데이터를 사용하는 컴포넌트
 */

"use server"

import { createServerSupabaseClient } from "@/utils/supabase/server"
import type { MedicalFacility, HospitalData, FilterState } from "./types"

/**
 * Supabase MedicalFacility 데이터를 프론트엔드 HospitalData 형태로 변환
 */
function transformMedicalFacility(facility: MedicalFacility): HospitalData {
  console.log("🔄 Transforming facility:", facility.name)
  
  // 주소에서 시도, 구군 정보 추출
  const address = facility.road_address || ""
  const addressParts = address.split(" ")
  const sido = addressParts[0] || ""
  const gugun = addressParts[1] || ""

  return {
    id: facility.id,
    name: facility.name,
    category: facility.service_type,
    address: address,
    phone: facility.phone,
    openDate: facility.license_date,
    specialistCount: facility.num_doctors,
    sido: sido.replace("특별시", "").replace("광역시", "").replace("특별자치시", ""),
    gugun: gugun.replace("구", "").replace("시", "").replace("군", ""),
  }
}

/**
 * 의료기관 목록을 조회합니다 (필터링 지원)
 */
export async function getMedicalFacilities(filters?: Partial<FilterState>): Promise<HospitalData[]> {
  console.group("🏥 Medical Facilities API Call")
  console.log("Filters:", filters)
  
  try {
    const supabase = await createServerSupabaseClient()
    
    // 기본 쿼리: 의료기관과 주소 정보를 JOIN
    let query = supabase
      .from("medical_facility")
      .select(`
        id,
        name,
        service_type,
        license_date,
        phone,
        healthcare_type,
        num_doctors,
        num_rooms,
        num_beds,
        total_area,
        address_id,
        subject_count,
        address:address_id (
          road_address,
          road_postcode
        )
      `)
    
    // 날짜 범위 필터
    if (filters?.dateRange) {
      const fromDate = filters.dateRange.from.toISOString().split('T')[0]
      const toDate = filters.dateRange.to.toISOString().split('T')[0]
      
      console.log(`📅 Date filter: ${fromDate} ~ ${toDate}`)
      query = query
        .gte('license_date', fromDate)
        .lte('license_date', toDate)
    }
    
    // 키워드 검색 (병원명)
    if (filters?.keyword && filters.keyword.trim()) {
      console.log(`🔍 Keyword filter: ${filters.keyword}`)
      query = query.ilike('name', `%${filters.keyword.trim()}%`)
    }
    
    // 연락처 유무 필터
    if (filters?.hasContact) {
      console.log("📞 Contact filter: only with phone numbers")
      query = query.not('phone', 'is', null)
    }
    
    // 카테고리 필터 (specialties를 service_type으로 매핑)
    if (filters?.specialties && filters.specialties.length > 0) {
      console.log("🏷️ Category filter:", filters.specialties)
      query = query.in('service_type', filters.specialties)
    }
    
    // 전체 데이터 개수 먼저 조회
    const { count: totalCount, error: countError } = await supabase
      .from("medical_facility")
      .select('*', { count: 'exact', head: true })
    
    if (countError) {
      console.error("❌ Count query error:", countError)
    } else {
      console.log(`📊 Total records in database: ${totalCount}`)
    }
    
    // 데이터 실행 (전체 데이터 가져오기)
    // 첫 번째 시도: 일반 쿼리로 모든 데이터 가져오기
    const { data: initialData, error } = await query
      .order('license_date', { ascending: false })
    let data = initialData
    
    // 만약 데이터가 1000개이고 전체 개수가 더 많다면, 페이지네이션으로 나머지 가져오기
    if (data && totalCount && data.length === 1000 && totalCount > 1000) {
      console.log("🔄 Detected 1000-item limit, fetching remaining data...")
      
      const remainingData = []
      let offset = 1000
      
      while (offset < totalCount) {
        const batchSize = Math.min(1000, totalCount - offset)
        console.log(`📦 Fetching batch: ${offset} to ${offset + batchSize - 1}`)
        
        const { data: batchData, error: batchError } = await supabase
          .from("medical_facility")
          .select(`
            id,
            name,
            service_type,
            license_date,
            phone,
            healthcare_type,
            num_doctors,
            num_rooms,
            num_beds,
            total_area,
            address_id,
            subject_count,
            address:address_id (
              road_address,
              road_postcode
            )
          `)
          .order('license_date', { ascending: false })
          .range(offset, offset + batchSize - 1)
        
        if (batchError) {
          console.error(`❌ Batch query error at offset ${offset}:`, batchError)
          break
        }
        
        if (batchData && batchData.length > 0) {
          remainingData.push(...batchData)
          console.log(`✅ Fetched ${batchData.length} items in this batch`)
        }
        
        offset += batchSize
      }
      
      // 모든 데이터 합치기
      data = [...data, ...remainingData]
      console.log(`🎯 Total data after pagination: ${data.length} items`)
    }
    
    if (error) {
      console.error("❌ Supabase query error:", error)
      throw new Error(`데이터베이스 조회 실패: ${error.message}`)
    }
    
    if (!data) {
      console.warn("⚠️ No data returned from query")
      return []
    }
    
    console.log(`✅ Query successful: ${data.length} facilities found out of ${totalCount || 'unknown'} total`)
    if (totalCount) {
      console.log(`📈 Data completeness: ${((data.length / totalCount) * 100).toFixed(1)}%`)
    }
    
    // 데이터 변환
    const transformedData = data.map((facility) => {
      // address가 배열 형태로 올 수 있으므로 처리
      const addressData = Array.isArray(facility.address) ? facility.address[0] : facility.address
      
      const facilityWithAddress: MedicalFacility = {
        ...facility,
        road_address: addressData?.road_address,
        road_postcode: addressData?.road_postcode,
      }
      
      return transformMedicalFacility(facilityWithAddress)
    })
    
    // 지역 필터링 (주소 기반, 서버에서 후처리)
    let filteredData = transformedData
    
    if (filters?.region?.sido && filters.region.sido !== "전체") {
      console.log(`🗺️ Region filter - Sido: ${filters.region.sido}`)
      filteredData = filteredData.filter(item => 
        item.sido.includes(filters.region.sido) || 
        item.address.includes(filters.region.sido)
      )
    }
    
    if (filters?.region?.gugun && filters.region.gugun !== "전체") {
      console.log(`🗺️ Region filter - Gugun: ${filters.region.gugun}`)
      filteredData = filteredData.filter(item => 
        item.gugun.includes(filters.region.gugun) || 
        item.address.includes(filters.region.gugun)
      )
    }
    
    console.log(`🎯 Final filtered results: ${filteredData.length} facilities`)
    console.groupEnd()
    
    return filteredData
    
  } catch (error) {
    console.error("❌ Failed to fetch medical facilities:", error)
    console.groupEnd()
    throw error
  }
}

/**
 * 필터링에 사용할 옵션들을 조회합니다
 */
export async function getFilterOptions() {
  console.group("⚙️ Filter Options API Call")
  
  try {
    const supabase = await createServerSupabaseClient()
    
    // 서비스 타입 목록 조회
    const { data: serviceTypes, error: serviceError } = await supabase
      .from("medical_facility")
      .select("service_type")
      .not("service_type", "is", null)
    
    if (serviceError) {
      throw new Error(`서비스 타입 조회 실패: ${serviceError.message}`)
    }
    
    // 헬스케어 타입 목록 조회
    const { data: healthcareTypes, error: healthcareError } = await supabase
      .from("medical_facility")
      .select("healthcare_type")
      .not("healthcare_type", "is", null)
    
    if (healthcareError) {
      throw new Error(`헬스케어 타입 조회 실패: ${healthcareError.message}`)
    }
    
    // 고유값 추출 및 정렬
    const uniqueServiceTypes = [...new Set(serviceTypes?.map(item => item.service_type) || [])].sort()
    const uniqueHealthcareTypes = [...new Set(healthcareTypes?.map(item => item.healthcare_type) || [])].sort()
    
    console.log("✅ Filter options retrieved successfully")
    console.log("Service types:", uniqueServiceTypes)
    console.log("Healthcare types:", uniqueHealthcareTypes)
    console.groupEnd()
    
    return {
      serviceTypes: uniqueServiceTypes,
      healthcareTypes: uniqueHealthcareTypes,
      regions: {
        sido: ["전체", "서울", "부산", "대구", "인천", "광주", "대전", "울산", "세종", "경기", "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주"],
        gugun: {} // 필요시 동적으로 구현
      }
    }
    
  } catch (error) {
    console.error("❌ Failed to fetch filter options:", error)
    console.groupEnd()
    throw error
  }
}

/**
 * 의료과목 목록을 Supabase에서 조회합니다
 */
export async function getMedicalSubjects(): Promise<string[]> {
  console.group("🩺 Medical Subjects API Call")
  
  try {
    const supabase = await createServerSupabaseClient()
    
    const { data, error } = await supabase
      .from("medical_subject")
      .select("subject_name")
      .order("subject_name")
    
    if (error) {
      console.error("❌ Medical subjects query error:", error)
      throw new Error(`의료과목 조회 실패: ${error.message}`)
    }
    
    if (!data) {
      console.warn("⚠️ No medical subjects found")
      return []
    }
    
    const subjects = data.map(item => item.subject_name).filter(Boolean)
    console.log(`✅ Successfully fetched ${subjects.length} medical subjects`)
    console.log("Medical subjects:", subjects)
    console.groupEnd()
    
    return subjects
    
  } catch (error) {
    console.error("❌ Failed to fetch medical subjects:", error)
    console.groupEnd()
    throw error
  }
}

/**
 * 의료기관과 진료과목 관계를 기반으로 진료과목 필터링된 의료기관을 조회합니다
 */
export async function getMedicalFacilitiesWithSubjectFilter(filters?: Partial<FilterState>): Promise<HospitalData[]> {
  console.group("🏥 Medical Facilities with Subject Filter API Call")
  console.log("Filters:", filters)
  
  try {
    const supabase = await createServerSupabaseClient()
    
    let query = supabase
      .from("medical_facility")
      .select(`
        id,
        name,
        service_type,
        license_date,
        phone,
        healthcare_type,
        num_doctors,
        num_rooms,
        num_beds,
        total_area,
        address_id,
        subject_count,
        address:address_id (
          road_address,
          road_postcode
        ),
        facility_medical_subject!inner (
          subject_id,
          medical_subject!inner (
            subject_name
          )
        )
      `)
    
    // 진료과목 필터 (JOIN을 통한 필터링)
    if (filters?.specialties && filters.specialties.length > 0) {
      console.log("🏷️ Subject filter:", filters.specialties)
      // facility_medical_subject와 medical_subject를 JOIN하여 필터링
      query = query.in('facility_medical_subject.medical_subject.subject_name', filters.specialties)
    }
    
    // 날짜 범위 필터
    if (filters?.dateRange) {
      const fromDate = filters.dateRange.from.toISOString().split('T')[0]
      const toDate = filters.dateRange.to.toISOString().split('T')[0]
      
      console.log(`📅 Date filter: ${fromDate} ~ ${toDate}`)
      query = query
        .gte('license_date', fromDate)
        .lte('license_date', toDate)
    }
    
    // 키워드 검색 (병원명)
    if (filters?.keyword && filters.keyword.trim()) {
      console.log(`🔍 Keyword filter: ${filters.keyword}`)
      query = query.ilike('name', `%${filters.keyword.trim()}%`)
    }
    
    // 연락처 유무 필터
    if (filters?.hasContact) {
      console.log("📞 Contact filter: only with phone numbers")
      query = query.not('phone', 'is', null)
    }
    
    const { data, error } = await query.order('license_date', { ascending: false })
    
    if (error) {
      console.error("❌ Supabase query error:", error)
      throw new Error(`데이터베이스 조회 실패: ${error.message}`)
    }
    
    if (!data) {
      console.warn("⚠️ No data returned from query")
      return []
    }
    
    console.log(`✅ Query successful: ${data.length} facilities found`)
    
    // 중복 제거 (한 의료기관이 여러 진료과목을 가질 수 있으므로)
    const uniqueFacilities = data.reduce((acc: any[], current) => {
      const existing = acc.find(item => item.id === current.id)
      if (!existing) {
        acc.push(current)
      }
      return acc
    }, [])
    
    console.log(`🎯 Unique facilities after deduplication: ${uniqueFacilities.length}`)
    
    // 데이터 변환
    const transformedData = uniqueFacilities.map((facility) => {
      // address가 배열 형태로 올 수 있으므로 처리
      const addressData = Array.isArray(facility.address) ? facility.address[0] : facility.address
      
      const facilityWithAddress: MedicalFacility = {
        ...facility,
        road_address: addressData?.road_address,
        road_postcode: addressData?.road_postcode,
      }
      
      return transformMedicalFacility(facilityWithAddress)
    })
    
    // 지역 필터링 (주소 기반, 서버에서 후처리)
    let filteredData = transformedData
    
    if (filters?.region?.sido && filters.region.sido !== "전체") {
      console.log(`🗺️ Region filter - Sido: ${filters.region.sido}`)
      filteredData = filteredData.filter(item => 
        item.sido.includes(filters.region.sido) || 
        item.address.includes(filters.region.sido)
      )
    }
    
    if (filters?.region?.gugun && filters.region.gugun !== "전체") {
      console.log(`🗺️ Region filter - Gugun: ${filters.region.gugun}`)
      filteredData = filteredData.filter(item => 
        item.gugun.includes(filters.region.gugun) || 
        item.address.includes(filters.region.gugun)
      )
    }
    
    console.log(`🎯 Final filtered results: ${filteredData.length} facilities`)
    console.groupEnd()
    
    return filteredData
    
  } catch (error) {
    console.error("❌ Failed to fetch medical facilities with subject filter:", error)
    console.groupEnd()
    throw error
  }
} 