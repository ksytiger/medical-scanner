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

"use server";

import { createServerSupabaseClient } from "@/utils/supabase/server";
import type { MedicalFacility, HospitalData, FilterState } from "./types";

/**
 * business_type을 3가지 주요 카테고리로 매핑하는 함수
 */
function mapBusinessTypeToCategory(
  businessType: string,
  businessName?: string,
): string {
  // 약국 우선 확인 (business_name에서 약국 포함 여부 체크)
  if (businessName?.includes("약국") || businessType?.includes("약국")) {
    return "약국";
  }

  // 병원 관련
  if (businessType?.includes("병원")) {
    return "병원";
  }

  // 의원 관련 (치과의원, 한의원 포함)
  if (businessType?.includes("의원") || businessType?.includes("한의원")) {
    return "의원";
  }

  // 보건 관련 시설들은 의원으로 분류
  if (businessType?.includes("보건")) {
    return "의원";
  }

  // 조산원 등 기타는 의원으로 분류
  if (businessType?.includes("조산원")) {
    return "의원";
  }

  // business_type이 null이고 business_name에 특정 키워드가 있는 경우
  if (!businessType || businessType === "") {
    if (businessName?.includes("병원")) {
      return "병원";
    }
    if (businessName?.includes("의원") || businessName?.includes("한의원")) {
      return "의원";
    }
  }

  // 기본값: 원래 값 반환 또는 '기타'
  return businessType || "기타";
}

/**
 * Supabase MedicalFacility 데이터를 프론트엔드 HospitalData 형태로 변환
 */
function transformMedicalFacility(facility: MedicalFacility): HospitalData {
  console.log("🔄 Transforming facility:", facility.name);

  // 주소에서 시도, 구군 정보 추출
  const address = facility.road_address || "";
  const addressParts = address.split(" ");
  const sido = addressParts[0] || "";
  const gugun = addressParts[1] || "";

  return {
    id: facility.id,
    name: facility.name,
    category: mapBusinessTypeToCategory(facility.service_type, facility.name), // business_name도 전달
    address: address,
    phone: facility.phone,
    openDate: facility.license_date,
    specialistCount: facility.num_doctors,
    sido: sido
      .replace("특별시", "")
      .replace("광역시", "")
      .replace("특별자치시", ""),
    gugun: gugun.replace("구", "").replace("시", "").replace("군", ""),
  };
}

// 페이지네이션 응답 타입 추가
export interface PaginatedResponse<T> {
  data: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * 의료기관 목록을 조회합니다 (서버사이드 페이지네이션)
 */
export async function getMedicalFacilities(
  filters?: Partial<FilterState>,
  page: number = 1,
  pageSize: number = 50,
): Promise<PaginatedResponse<HospitalData>> {
  console.group("🏥 Medical Facilities API Call with Pagination");
  console.log("Filters:", filters);
  console.log("Page:", page, "PageSize:", pageSize);

  const startTime = Date.now(); // 성능 측정 시작

  try {
    const supabase = await createServerSupabaseClient();

    // 기본 쿼리 구성
    let countQuery = supabase
      .from("medical_facilities")
      .select("*", { count: "exact", head: true });

    // 성능 최적화: 필요한 필드만 선택하여 데이터 전송량 감소
    let dataQuery = supabase
      .from("medical_facilities")
      .select(
        `
        id,
        business_name,
        business_type,
        license_date,
        location_phone,
        road_full_address
      `,
      )
      .order("license_date", { ascending: false });

    // 필터 적용 함수
    const applyFilters = (query: any) => {
      // 날짜 범위 필터
      if (filters?.dateRange?.from && filters?.dateRange?.to) {
        console.log("📅 Date range filter:", filters.dateRange);
        query = query
          .gte(
            "license_date",
            filters.dateRange.from.toISOString().split("T")[0],
          )
          .lte(
            "license_date",
            filters.dateRange.to.toISOString().split("T")[0],
          );
      }

      // 연락처 유무 필터
      if (filters?.hasContact) {
        console.log("📞 Contact filter: only with phone numbers");
        query = query.not("location_phone", "is", null);
      }

      // 단일 카테고리 필터
      if (filters?.selectedCategory) {
        console.log("🏷️ Category filter:", filters.selectedCategory);

        const category = filters.selectedCategory;

        // 기본 분류 (의원, 병원, 약국)
        if (category === "병원") {
          query = query.in("business_type", [
            "병원",
            "한방병원",
            "요양병원(일반요양병원)",
            "치과병원",
            "정신병원",
            "종합병원",
          ]);
        } else if (category === "의원") {
          query = query.in("business_type", [
            "의원",
            "치과의원",
            "한의원",
            "보건지소",
            "보건진료소",
            "보건소",
            "조산원",
          ]);
        } else if (category === "약국") {
          query = query.ilike("business_name", "%약국%");
        }
        // 전문 진료과 및 세부 분류
        else if (category === "치과의원") {
          query = query.eq("business_type", "치과의원");
        } else if (category === "한의원") {
          query = query.eq("business_type", "한의원");
        } else if (category === "종합병원") {
          query = query.eq("business_type", "종합병원");
        } else if (category === "요양병원") {
          query = query.eq("business_type", "요양병원(일반요양병원)");
        } else if (category === "한방병원") {
          query = query.eq("business_type", "한방병원");
        } else if (category === "치과병원") {
          query = query.eq("business_type", "치과병원");
        } else if (category === "정신병원") {
          query = query.eq("business_type", "정신병원");
        } else if (category === "보건기관") {
          query = query.in("business_type", [
            "보건소",
            "보건지소",
            "보건진료소",
          ]);
        } else if (category === "기타의원") {
          query = query.eq("business_type", "조산원");
        }
        // 전문 진료과는 medical_subject_names에서 검색
        else {
          query = query.ilike("medical_subject_names", `%${category}%`);
        }
      }

      // 지역 필터
      if (filters?.region?.sido && filters.region.sido !== "전체") {
        console.log("🌍 Region filter:", filters.region);
        query = query.ilike("road_full_address", `%${filters.region.sido}%`);

        if (filters.region.gugun && filters.region.gugun !== "전체") {
          query = query.ilike("road_full_address", `%${filters.region.gugun}%`);
        }
      }

      // 키워드 검색
      if (filters?.keyword && filters.keyword.trim()) {
        console.log("🔍 Keyword filter:", filters.keyword);
        query = query.ilike("business_name", `%${filters.keyword.trim()}%`);
      }

      return query;
    };

    // 필터 적용
    countQuery = applyFilters(countQuery);
    dataQuery = applyFilters(dataQuery);

    // 총 개수 조회 (캐시 고려)
    const countStartTime = Date.now();
    const { count, error: countError } = await countQuery;
    console.log(`⏱️ Count query took: ${Date.now() - countStartTime}ms`);

    if (countError) {
      console.error("❌ Count query error:", countError);
      throw new Error(`개수 조회 실패: ${countError.message}`);
    }

    const totalCount = count || 0;
    const totalPages = Math.ceil(totalCount / pageSize);

    // 페이지 범위 검증
    if (page < 1 || page > totalPages) {
      console.log(`📄 Invalid page ${page}, returning empty result`);
      return {
        data: [],
        totalCount,
        page,
        pageSize,
        totalPages,
      };
    }

    // 페이지네이션 적용
    const offset = (page - 1) * pageSize;
    dataQuery = dataQuery.range(offset, offset + pageSize - 1);

    // 데이터 조회
    const dataStartTime = Date.now();
    const { data, error } = await dataQuery;
    console.log(`⏱️ Data query took: ${Date.now() - dataStartTime}ms`);

    if (error) {
      console.error("❌ Medical facilities query error:", error);
      throw new Error(`의료기관 조회 실패: ${error.message}`);
    }

    if (!data) {
      console.log("📄 No data found");
      return {
        data: [],
        totalCount: 0,
        page,
        pageSize,
        totalPages: 0,
      };
    }

    console.log(`✅ Successfully fetched ${data.length} medical facilities`);

    // 데이터 변환
    const transformedData = data.map((facility) =>
      transformMedicalFacility({
        id: facility.id,
        name: facility.business_name,
        service_type: facility.business_type,
        license_date: facility.license_date,
        phone: facility.location_phone,
        healthcare_type: null, // 최적화를 위해 제거
        num_doctors: null, // 최적화를 위해 제거
        num_rooms: null, // 최적화를 위해 제거
        num_beds: null, // 최적화를 위해 제거
        total_area: null, // 최적화를 위해 제거
        address_id: 0, // 사용하지 않음
        subject_count: 0, // 사용하지 않음
        road_address: facility.road_full_address,
        road_postcode: null, // 최적화를 위해 제거
      }),
    );

    const totalTime = Date.now() - startTime;
    console.log(`⏱️ Total API call took: ${totalTime}ms`);
    console.log("🔄 Data transformation completed");

    return {
      data: transformedData,
      totalCount,
      page,
      pageSize,
      totalPages,
    };
  } catch (error) {
    console.error("❌ Failed to fetch medical facilities:", error);
    throw error;
  } finally {
    console.groupEnd();
  }
}

/**
 * 필터링에 사용할 옵션들을 조회합니다
 */
export async function getFilterOptions() {
  console.group("⚙️ Filter Options API Call");

  try {
    const supabase = await createServerSupabaseClient();

    // 서비스 타입 목록 조회
    const { data: serviceTypes, error: serviceError } = await supabase
      .from("medical_facilities")
      .select("business_type")
      .not("business_type", "is", null);

    if (serviceError) {
      throw new Error(`서비스 타입 조회 실패: ${serviceError.message}`);
    }

    // 헬스케어 타입 목록 조회
    const { data: healthcareTypes, error: healthcareError } = await supabase
      .from("medical_facilities")
      .select("medical_institution_type")
      .not("medical_institution_type", "is", null);

    if (healthcareError) {
      throw new Error(`헬스케어 타입 조회 실패: ${healthcareError.message}`);
    }

    // 고유값 추출 및 정렬
    const uniqueServiceTypes = [
      ...new Set(serviceTypes?.map((item) => item.business_type) || []),
    ].sort();
    const uniqueHealthcareTypes = [
      ...new Set(
        healthcareTypes?.map((item) => item.medical_institution_type) || [],
      ),
    ].sort();

    console.log("✅ Filter options retrieved successfully");
    console.log("Service types:", uniqueServiceTypes);
    console.log("Healthcare types:", uniqueHealthcareTypes);
    console.groupEnd();

    return {
      serviceTypes: uniqueServiceTypes,
      healthcareTypes: uniqueHealthcareTypes,
      regions: {
        sido: [
          "전체",
          "서울",
          "부산",
          "대구",
          "인천",
          "광주",
          "대전",
          "울산",
          "세종",
          "경기",
          "강원",
          "충북",
          "충남",
          "전북",
          "전남",
          "경북",
          "경남",
          "제주",
        ],
        gugun: {}, // 필요시 동적으로 구현
      },
    };
  } catch (error) {
    console.error("❌ Failed to fetch filter options:", error);
    console.groupEnd();
    throw error;
  }
}

/**
 * 의료과목 목록을 Supabase에서 조회합니다
 */
export async function getMedicalSubjects(): Promise<string[]> {
  console.group("🩺 Medical Subjects API Call");

  try {
    const supabase = await createServerSupabaseClient();

    const { data, error } = await supabase
      .from("specialties")
      .select("name_ko")
      .order("name_ko");

    if (error) {
      console.error("❌ Medical subjects query error:", error);
      throw new Error(`의료과목 조회 실패: ${error.message}`);
    }

    if (!data) {
      console.warn("⚠️ No medical subjects found");
      return [];
    }

    const subjects = data.map((item) => item.name_ko).filter(Boolean);
    console.log(`✅ Successfully fetched ${subjects.length} medical subjects`);
    console.log("Medical subjects:", subjects);
    console.groupEnd();

    return subjects;
  } catch (error) {
    console.error("❌ Failed to fetch medical subjects:", error);
    console.groupEnd();
    throw error;
  }
}

/**
 * 의료기관과 진료과목 관계를 기반으로 진료과목 필터링된 의료기관을 조회합니다 - 서버사이드 페이지네이션
 */
export async function getMedicalFacilitiesWithSubjectFilter(
  filters?: Partial<FilterState>,
  page: number = 1,
  pageSize: number = 50,
): Promise<PaginatedResponse<HospitalData>> {
  console.group("🏥 Medical Facilities with Subject Filter API Call");
  console.log("Filters:", filters);
  console.log("Page:", page, "PageSize:", pageSize);

  // 진료과목 필터가 있는 경우에는 동일한 getMedicalFacilities 사용
  // (이미 medical_subject_names 필드에서 검색하도록 구현되어 있음)
  const result = await getMedicalFacilities(filters, page, pageSize);

  console.groupEnd();
  return result;
}

/**
 * 의료기관 총 개수를 조회합니다
 */
export async function getMedicalFacilitiesCount(): Promise<number> {
  console.group("📊 Medical Facilities Count API Call");

  try {
    const supabase = await createServerSupabaseClient();

    const { count, error } = await supabase
      .from("medical_facilities")
      .select("*", { count: "exact", head: true });

    if (error) {
      console.error("❌ Medical facilities count error:", error);
      throw new Error(`의료기관 개수 조회 실패: ${error.message}`);
    }

    console.log(`✅ Total medical facilities count: ${count}`);
    console.groupEnd();

    return count || 0;
  } catch (error) {
    console.error("❌ Failed to fetch medical facilities count:", error);
    console.groupEnd();
    throw error;
  }
}
