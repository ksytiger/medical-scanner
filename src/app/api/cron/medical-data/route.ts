import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// 의료기관 API 설정
const API_CONFIG = {
  BASE_URL: "http://apis.data.go.kr/B552657/HsptlAsembySearchService",
  SERVICE_KEY: process.env.MEDICAL_API_SERVICE_KEY || "", // 환경변수에서 가져오기
  SERVICE_IDS: {
    병원: "01_01_01_P",
    의원: "01_01_02_P",
    약국: "01_02_01_P",
  },
};

// 진료과목 매핑
const MEDICAL_SUBJECT_KEYWORDS = {
  내과: ["내과"],
  외과: ["외과"],
  정형외과: ["정형외과"],
  신경외과: ["신경외과"],
  성형외과: ["성형외과"],
  산부인과: ["산부인과", "부인과"],
  소아청소년과: ["소아청소년과", "소아과"],
  안과: ["안과"],
  이비인후과: ["이비인후과"],
  피부과: ["피부과"],
  비뇨의학과: ["비뇨의학과", "비뇨기과"],
  정신건강의학과: ["정신건강의학과", "정신과"],
  재활의학과: ["재활의학과"],
  치과: ["치과"],
  한의학: ["한의학", "한방"],
};

const FIXED_MEDICAL_SUBJECTS = {
  치과의원: "치과",
  한의원: "한의학",
  치과병원: "치과",
  한방병원: "한의학",
};

// 로그 저장 함수
async function saveLog(
  supabase: any,
  type: "INFO" | "ERROR" | "SUCCESS",
  message: string,
  details?: any,
) {
  try {
    await supabase.table("cron_logs").insert({
      job_name: "medical-data-sync",
      log_type: type,
      message,
      details: details ? JSON.stringify(details) : null,
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Failed to save log:", error);
  }
}

// 에러 알림 발송 함수
async function sendErrorNotification(error: string, details?: any) {
  // 여기에 이메일/Slack 알림 로직 추가
  console.error("Medical Data Sync Error:", error, details);

  // 예시: 이메일 알림 (실제 구현 시 nodemailer 등 사용)
  if (process.env.NOTIFICATION_EMAIL) {
    // TODO: 이메일 발송 로직
  }

  // 예시: Slack 알림 (실제 구현 시 Slack Webhook 사용)
  if (process.env.SLACK_WEBHOOK_URL) {
    try {
      await fetch(process.env.SLACK_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: `🚨 의료기관 데이터 동기화 실패\n에러: ${error}\n시간: ${new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })}`,
        }),
      });
    } catch (notifError) {
      console.error("Failed to send Slack notification:", notifError);
    }
  }
}

// 진료과목 추출 함수
function extractMedicalSubjects(
  businessName: string,
  businessType: string,
): string[] {
  const subjects: string[] = [];

  // 고정 매핑 확인
  if (FIXED_MEDICAL_SUBJECTS[businessType]) {
    subjects.push(FIXED_MEDICAL_SUBJECTS[businessType]);
    return subjects;
  }

  // 키워드 기반 추출
  for (const [subject, keywords] of Object.entries(MEDICAL_SUBJECT_KEYWORDS)) {
    for (const keyword of keywords) {
      if (businessName.includes(keyword)) {
        subjects.push(subject);
        break;
      }
    }
  }

  return subjects;
}

// API 호출 함수
async function fetchMedicalData(
  serviceId: string,
  startDate: string,
  endDate: string,
) {
  const url = new URL(`${API_CONFIG.BASE_URL}/getHsptlMdcncListInfoInqire`);
  url.searchParams.set("serviceKey", API_CONFIG.SERVICE_KEY);
  url.searchParams.set("_type", "json");
  url.searchParams.set("numOfRows", "1000");
  url.searchParams.set("pageNo", "1");
  url.searchParams.set("sidoCd", "");
  url.searchParams.set("sgguCd", "");
  url.searchParams.set("serviceId", serviceId);
  url.searchParams.set("bgnYmd", startDate);
  url.searchParams.set("endYmd", endDate);

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(
      `API call failed: ${response.status} ${response.statusText}`,
    );
  }

  const data = await response.json();
  return data.response?.body?.items || [];
}

// 데이터 변환 함수
function convertToMedicalFacilityFormat(facility: any, facilityType: string) {
  const serviceMapping = {
    병원: { service_name: "병원", service_id: "01_01_01_P" },
    의원: { service_name: "의원", service_id: "01_01_02_P" },
    약국: { service_name: "약국", service_id: "01_02_01_P" },
  };

  const serviceInfo = serviceMapping[facilityType] || {
    service_name: facilityType,
    service_id: "unknown",
  };

  // 진료과목 추출
  const medicalSubjects = extractMedicalSubjects(
    facility.bizplcNm || "",
    facility.bztpNm || "",
  );

  // 개원일 처리
  let licenseDate = null;
  if (facility.licensgDe) {
    const dateStr = facility.licensgDe.replace(/-/g, "");
    if (dateStr.length === 8) {
      licenseDate = `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
    }
  }

  return {
    service_name: serviceInfo.service_name,
    service_id: serviceInfo.service_id,
    management_number: facility.mgtNo || "",
    business_name: facility.bizplcNm || "",
    business_type: facility.bztpNm || "",
    license_date: licenseDate,
    road_full_address: facility.rdnmadr || "",
    location_phone: facility.siteTel || "",
    medical_subject_names: medicalSubjects.join(", ") || null,
    business_status: "영업/정상",
    business_status_code: "1",
    detailed_business_status: "영업중",
    detailed_business_status_code: "13",
    data_update_type: "I",
    data_update_date: new Date().toISOString(),
    last_modified_time: new Date().toISOString(),
  };
}

// 메인 데이터 수집 함수
async function collectAndSyncMedicalData() {
  const supabase = createClient();

  // 어제 날짜 계산 (전날 개원한 의료기관 수집)
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const dateString = yesterday.toISOString().slice(0, 10).replace(/-/g, "");

  await saveLog(
    supabase,
    "INFO",
    `의료기관 데이터 수집 시작 - 대상 날짜: ${dateString}`,
  );

  let totalProcessed = 0;
  let totalErrors = 0;

  try {
    for (const [facilityType, serviceId] of Object.entries(
      API_CONFIG.SERVICE_IDS,
    )) {
      try {
        console.log(`Fetching ${facilityType} data...`);

        // API 호출
        const rawData = await fetchMedicalData(
          serviceId,
          dateString,
          dateString,
        );

        if (!rawData || rawData.length === 0) {
          await saveLog(
            supabase,
            "INFO",
            `${facilityType}: 새로운 데이터 없음`,
          );
          continue;
        }

        // 데이터 변환
        const facilities = rawData.map((item) =>
          convertToMedicalFacilityFormat(item, facilityType),
        );

        // 유효한 데이터만 필터링 (관리번호가 있는 것)
        const validFacilities = facilities.filter((f) => f.management_number);

        if (validFacilities.length === 0) {
          await saveLog(
            supabase,
            "INFO",
            `${facilityType}: 유효한 데이터 없음`,
          );
          continue;
        }

        // Supabase에 업로드 (중복 제거)
        const { data, error } = await supabase
          .table("medical_facilities")
          .upsert(validFacilities, { onConflict: "management_number" });

        if (error) {
          throw new Error(`${facilityType} 업로드 실패: ${error.message}`);
        }

        const uploadedCount = data?.length || validFacilities.length;
        totalProcessed += uploadedCount;

        await saveLog(
          supabase,
          "SUCCESS",
          `${facilityType}: ${uploadedCount}개 처리 완료`,
        );

        console.log(`✅ ${facilityType}: ${uploadedCount}개 업로드 완료`);
      } catch (facilityError) {
        totalErrors++;
        const errorMessage = `${facilityType} 처리 실패: ${facilityError.message}`;
        await saveLog(supabase, "ERROR", errorMessage, {
          error: facilityError,
        });
        console.error(errorMessage);
      }
    }

    // 최종 결과 로깅
    const resultMessage = `데이터 동기화 완료 - 처리: ${totalProcessed}개, 오류: ${totalErrors}개`;
    await saveLog(supabase, "SUCCESS", resultMessage);

    return {
      success: true,
      processed: totalProcessed,
      errors: totalErrors,
      date: dateString,
    };
  } catch (error) {
    const errorMessage = `전체 프로세스 실패: ${error.message}`;
    await saveLog(supabase, "ERROR", errorMessage, { error });
    await sendErrorNotification(errorMessage, { error: error.message });
    throw error;
  }
}

// API Route 핸들러
export async function GET(request: NextRequest) {
  // Cron job 보안 검증
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    console.log("🚀 Medical data sync started at:", new Date().toISOString());

    const result = await collectAndSyncMedicalData();

    console.log("✅ Medical data sync completed:", result);

    return NextResponse.json({
      success: true,
      message: "의료기관 데이터 동기화 완료",
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Medical data sync failed:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}

// 수동 실행을 위한 POST 핸들러
export async function POST(request: NextRequest) {
  return GET(request);
}
