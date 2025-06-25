/**
 * @file data-masking.ts
 * @description 인증되지 않은 사용자를 위한 데이터 마스킹 유틸리티
 *
 * 이 파일은 의료기관 정보를 비회원에게 마스킹 처리하여 제공하는
 * 유틸리티 함수들을 포함합니다.
 *
 * 주요 기능:
 * 1. 병원명 마스킹 (앞 2글자만 표시, 나머지는 ***)
 * 2. 주소 마스킹 (상세 주소 일부 마스킹)
 * 3. 전화번호 마스킹 (국번과 뒷자리 마스킹)
 * 4. 의료기관 데이터 전체 마스킹 처리
 *
 * 마스킹 패턴:
 * - 병원명: "서울대병원" → "서울******"
 * - 주소: "서울시 강남구 삼성동 테헤란로 123-45" → "서울시 강남구 삼성동 ****로 ***-**"
 * - 전화번호: "02-1234-5678" → "02-****-****"
 *
 * @dependencies
 * - @/lib/medical/types
 */

import type { HospitalData, MedicalFacility } from "./types";

/**
 * 텍스트의 일부를 마스킹 처리하는 기본 함수
 * @param text 원본 텍스트
 * @param visibleStart 시작부터 보여줄 글자 수
 * @param visibleEnd 끝부터 보여줄 글자 수 (기본값: 0)
 * @param maskChar 마스킹에 사용할 문자 (기본값: '*')
 * @returns 마스킹 처리된 텍스트
 */
export function maskText(
  text: string,
  visibleStart: number,
  visibleEnd: number = 0,
  maskChar: string = "*",
): string {
  if (!text || text.length <= visibleStart + visibleEnd) {
    return text;
  }

  const start = text.substring(0, visibleStart);
  const end = visibleEnd > 0 ? text.substring(text.length - visibleEnd) : "";
  const maskLength = Math.max(3, text.length - visibleStart - visibleEnd);
  const mask = maskChar.repeat(maskLength);

  return start + mask + end;
}

/**
 * 병원명을 마스킹 처리
 * 앞 2글자만 표시하고 나머지는 적절한 길이의 *로 처리
 * @param name 병원명
 * @returns 마스킹된 병원명
 */
export function maskHospitalName(name: string): string {
  if (!name) return name;

  // 2글자 이하면 그대로 반환
  if (name.length <= 2) return name;

  // 앞 2글자만 보이고 나머지 마스킹 (최소 6개, 최대 15개 문자로 마스킹)
  const hiddenLength = name.length - 2;
  const maskLength = Math.min(Math.max(hiddenLength + 3, 6), 15);

  return name.substring(0, 2) + "*".repeat(maskLength);
}

/**
 * 주소를 마스킹 처리
 * 시/도, 구/군, 동까지 표시하고 상세 주소는 원래 글자 수와 띄어쓰기 구조에 맞게 마스킹
 * @param address 전체 주소
 * @returns 마스킹된 주소
 */
export function maskAddress(address: string): string {
  if (!address) return address;

  // 공백으로 주소 구분
  const parts = address.split(" ");

  if (parts.length <= 3) {
    // 시/도, 구/군, 동까지만 있는 경우 그대로 반환
    return address;
  }

  // 앞 3개 구역(시/도, 구/군, 동)은 보이고 나머지는 마스킹
  const visibleParts = parts.slice(0, 3);
  const hiddenParts = parts.slice(3);

  // 숨겨진 각 부분을 원래 글자 수에 맞게 마스킹
  const maskedParts = hiddenParts.map((part) => {
    // 각 문자를 개별적으로 마스킹하되, 특수문자는 구조 유지
    return part.replace(/./g, (char) => {
      // 하이픈, 괄호, 점 등 특수문자는 그대로 유지
      if (/[-().·,]/.test(char)) {
        return char;
      }
      // 나머지 문자(한글, 영어, 숫자)는 마스킹
      return "*";
    });
  });

  return `${visibleParts.join(" ")} ${maskedParts.join(" ")}`;
}

/**
 * 전화번호를 마스킹 처리
 * 지역번호는 보이고 나머지는 적절한 길이로 마스킹
 * @param phone 전화번호
 * @returns 마스킹된 전화번호
 */
export function maskPhoneNumber(phone: string | null): string {
  if (!phone) return "정보 없음";

  // 하이픈으로 구분된 전화번호 처리
  if (phone.includes("-")) {
    const parts = phone.split("-");
    if (parts.length >= 2) {
      const areaCode = parts[0];
      const maskedParts = parts.slice(1).map((part) => {
        // 각 부분의 길이에 맞게 마스킹 (최소 4개)
        const maskLength = Math.max(part.length, 4);
        return "*".repeat(maskLength);
      });
      return `${areaCode}-${maskedParts.join("-")}`;
    }
  }

  // 하이픈이 없는 경우, 앞 2-3글자만 보이고 나머지 마스킹
  if (phone.length > 4) {
    const visibleLength = phone.startsWith("02") ? 2 : 3;
    const hiddenLength = phone.length - visibleLength;
    const maskLength = Math.max(hiddenLength + 2, 6); // 최소 6개 문자로 마스킹
    return phone.substring(0, visibleLength) + "*".repeat(maskLength);
  }

  return phone;
}

/**
 * HospitalData 타입의 데이터를 마스킹 처리
 * @param hospital 원본 병원 데이터
 * @param isAuthenticated 사용자 인증 상태
 * @returns 마스킹 처리된 병원 데이터 (인증되지 않은 경우) 또는 원본 데이터 (인증된 경우)
 */
export function maskHospitalData(
  hospital: HospitalData,
  isAuthenticated: boolean,
): HospitalData {
  // 인증된 사용자에게는 원본 데이터 반환
  if (isAuthenticated) {
    return hospital;
  }

  // 비인증 사용자에게는 마스킹된 데이터 반환
  return {
    ...hospital,
    name: maskHospitalName(hospital.name),
    address: maskAddress(hospital.address),
    phone: maskPhoneNumber(hospital.phone),
  };
}

/**
 * MedicalFacility 타입의 데이터를 마스킹 처리
 * @param facility 원본 의료기관 데이터
 * @param isAuthenticated 사용자 인증 상태
 * @returns 마스킹 처리된 의료기관 데이터 (인증되지 않은 경우) 또는 원본 데이터 (인증된 경우)
 */
export function maskMedicalFacility(
  facility: MedicalFacility,
  isAuthenticated: boolean,
): MedicalFacility {
  // 인증된 사용자에게는 원본 데이터 반환
  if (isAuthenticated) {
    return facility;
  }

  // 비인증 사용자에게는 마스킹된 데이터 반환
  return {
    ...facility,
    name: maskHospitalName(facility.name),
    road_address: facility.road_address
      ? maskAddress(facility.road_address)
      : facility.road_address,
    phone: maskPhoneNumber(facility.phone),
  };
}

/**
 * 배열 형태의 병원 데이터를 일괄 마스킹 처리
 * @param hospitals 병원 데이터 배열
 * @param isAuthenticated 사용자 인증 상태
 * @returns 마스킹 처리된 병원 데이터 배열
 */
export function maskHospitalDataArray(
  hospitals: HospitalData[],
  isAuthenticated: boolean,
): HospitalData[] {
  return hospitals.map((hospital) =>
    maskHospitalData(hospital, isAuthenticated),
  );
}

/**
 * 배열 형태의 의료기관 데이터를 일괄 마스킹 처리
 * @param facilities 의료기관 데이터 배열
 * @param isAuthenticated 사용자 인증 상태
 * @returns 마스킹 처리된 의료기관 데이터 배열
 */
export function maskMedicalFacilityArray(
  facilities: MedicalFacility[],
  isAuthenticated: boolean,
): MedicalFacility[] {
  return facilities.map((facility) =>
    maskMedicalFacility(facility, isAuthenticated),
  );
}
