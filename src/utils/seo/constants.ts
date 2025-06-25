/**
 * @file constants.ts
 * @description SEO 관련 상수 및 설정 파일
 *
 * 이 파일은 애플리케이션 전체에서 사용되는 SEO 관련 상수와 유틸리티 함수를 정의합니다.
 * 메타데이터, 오픈그래프, 트위터 카드 등에 사용되는 값들을 중앙 집중식으로 관리합니다.
 *
 * 주요 기능:
 * 1. 사이트 기본 정보 (이름, 설명, URL) 정의
 * 2. SEO 관련 메타 데이터 설정 (키워드, 로케일)
 * 3. 소셜 미디어 공유용 설정 (OG 이미지, 트위터 핸들)
 * 4. 경로 유틸리티 함수 제공
 *
 * 구현 로직:
 * - 환경 변수를 통한 사이트 URL 설정 (개발/프로덕션 환경 구분)
 * - 사이트 전반에 사용되는 메타데이터를 객체로 묶어 일관성 유지
 * - 상대 경로를 절대 URL로 변환하는 유틸리티 함수 제공 (getAbsoluteUrl)
 *
 * @dependencies
 * - 없음 (독립적인 상수 파일)
 */

export const siteConfig = {
  name: "개원스캐너 - 가장 빠른 병의원 개원정보",
  description:
    "개원스캐너는 병의원, 약국의 최신 개원일을 제공하는 플랫폼입니다. 3 영업일내 신규 개원 의료기관 정보를 가장 빠르게 제공합니다. 더 자세한 내용을 확인하려면 아래 링크를 클릭해 주세요.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  ogImage: "/lightning-icon.svg",
  locale: "ko_KR",
  keywords: [
    "개원스캐너",
    "개원예정병원",
    "신규개원병원",
    "의료기기영업",
    "제약영업",
    "병원리스트",
    "병원영업",
    "병원영업정보",
    "신규병원리스트",
    "의료영업",
  ],
  twitterHandle: "@medicalscanner",
};

export const getAbsoluteUrl = (path: string): string => {
  return `${siteConfig.url}${path.startsWith("/") ? path : `/${path}`}`;
};
