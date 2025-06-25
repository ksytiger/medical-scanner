/**
 * @file page.tsx
 * @description 의료기관 스캐너 메인 페이지 (홈페이지)
 *
 * 신규 개원 의료기관 정보를 검색하고 필터링할 수 있는 플랫폼
 *
 * 주요 기능:
 * - Hero Section: 서비스 소개
 * - Info Callout: 데이터 출처 및 특성 안내
 * - Database Section: 검색, 필터링, 데이터 테이블
 * - 서버사이드 초기 데이터 로딩으로 빠른 첫 화면 표시
 *
 * 성능 최적화:
 * - 서버에서 초기 데이터 미리 로드
 * - 클라이언트 하이드레이션으로 빠른 상호작용
 * - Suspense로 점진적 로딩
 *
 * 추후 개선사항:
 * - Supabase 실제 데이터베이스 연동
 * - 사용자 인증 연동
 * - 고급 필터 기능 추가
 */

import { Suspense } from "react";
import HeroSection from "@/components/medical/hero-section";
import InfoCallout from "@/components/medical/info-callout";
import DatabaseSection from "@/components/medical/database-section";
import DataTableSkeleton from "@/components/medical/data-table-skeleton";
import { getMedicalFacilities } from "@/lib/medical/api";

// 데이터베이스 섹션을 위한 래퍼 컴포넌트
async function DatabaseSectionWrapper() {
  // 서버에서 초기 데이터 로드 (20개만 로드하여 빠른 응답)
  const initialData = await getMedicalFacilities(
    {
      dateRange: { from: undefined, to: undefined },
      selectedCategory: null,
      region: { sido: "전체", gugun: "전체" },
      hasContact: false,
      keyword: "",
    },
    1,
    20, // 페이지 크기를 20으로 줄여서 빠르게 로드
  );

  return <DatabaseSection initialData={initialData} />;
}

// 로딩 폴백 컴포넌트
function DatabaseSectionFallback() {
  return (
    <section id="database" className="py-12 sm:py-16 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-xl sm:text-2xl font-bold mb-6 sm:mb-8 text-gray-900 text-center sm:text-left">
          의료기관 찾기
        </h2>
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <DataTableSkeleton rows={20} />
        </div>
      </div>
    </section>
  );
}

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <InfoCallout />
      <Suspense fallback={<DatabaseSectionFallback />}>
        <DatabaseSectionWrapper />
      </Suspense>
    </>
  );
}
