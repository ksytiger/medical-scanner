/**
 * @file database-section.tsx
 * @description 의료기관 스캐너 데이터베이스 섹션 컴포넌트
 *
 * 필터링, 검색, 데이터 테이블, 다운로드 기능을 통합한 메인 섹션
 *
 * 핵심 구현 로직:
 * - Supabase에서 실시간 데이터 조회
 * - 필터 변경 시 자동 데이터 재조회
 * - 로딩 상태 및 에러 핸들링
 * - 디바운싱으로 검색 성능 최적화
 * - React Query로 데이터 캐싱 및 서버사이드 페이지네이션
 *
 * @dependencies
 * - @/lib/medical/api: Supabase 데이터 조회 함수들
 * - @tanstack/react-query: 데이터 캐싱 및 동기화
 */

"use client";

import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import FilterBar from "@/components/medical/filter-bar";
import DataTable from "@/components/medical/data-table";
import { FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import {
  getMedicalFacilities,
  getMedicalFacilitiesWithSubjectFilter,
} from "@/lib/medical/api";
import type { FilterState } from "@/lib/medical/types";

export default function DatabaseSection() {
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<FilterState>({
    dateRange: { from: undefined, to: undefined },
    selectedCategory: null,
    region: { sido: "전체", gugun: "전체" },
    hasContact: false,
    keyword: "",
  });

  // 모바일과 데스크톱에서 다른 페이지 사이즈 적용
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024); // lg breakpoint
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const itemsPerPage = isMobile ? 5 : 50;

  // 쿼리 키 생성 - 필터와 페이지를 기반으로 캐싱
  const queryKey = useMemo(
    () => ["medical-facilities", filters, currentPage, itemsPerPage],
    [filters, currentPage, itemsPerPage],
  );

  // React Query로 데이터 조회
  const {
    data: queryResult,
    isLoading,
    error,
    isFetching,
  } = useQuery({
    queryKey,
    queryFn: async () => {
      console.group("🔄 React Query: Fetching medical facilities");
      console.log("Filters:", filters);
      console.log("Page:", currentPage);

      const startTime = Date.now();

      try {
        // 카테고리 필터가 있으면 전용 API 사용
        const hasCategoryFilter = filters.selectedCategory !== null;
        const result = hasCategoryFilter
          ? await getMedicalFacilitiesWithSubjectFilter(
              filters,
              currentPage,
              itemsPerPage,
            )
          : await getMedicalFacilities(filters, currentPage, itemsPerPage);

        const elapsed = Date.now() - startTime;
        console.log(`⏱️ Query completed in ${elapsed}ms`);
        console.log(`📊 Fetched ${result.data.length} items`);

        return result;
      } finally {
        console.groupEnd();
      }
    },
    // 캐시 유지 시간 (5분)
    staleTime: 5 * 60 * 1000,
    // 백그라운드 재검증 비활성화
    refetchOnWindowFocus: false,
  });

  // 필터 변경 시 첫 페이지로 이동
  useEffect(() => {
    console.log("🔍 Filters changed, resetting to page 1");
    setCurrentPage(1);
  }, [filters]);

  const handleFilterChange = (newFilters: FilterState) => {
    console.group("🔍 Filter Change");
    console.log("Previous filters:", filters);
    console.log("New filters:", newFilters);

    setFilters(newFilters);

    console.groupEnd();
  };

  const handleExportExcel = () => {
    console.log("📄 Excel 다운로드 요청");
    alert("Excel 다운로드 기능이 구현될 예정입니다.");
  };

  const handleExportPDF = () => {
    console.log("📄 PDF 다운로드 요청");
    alert("PDF 다운로드 기능이 구현될 예정입니다.");
  };

  // 에러 재시도 함수
  const handleRetry = () => {
    console.log("🔄 Retrying data load");
    // React Query의 refetch 사용
    window.location.reload();
  };

  // 데이터 추출
  const currentData = queryResult?.data || [];
  const totalCount = queryResult?.totalCount || 0;
  const totalPages = queryResult?.totalPages || 0;

  return (
    <section id="database" className="py-12 sm:py-16 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-xl sm:text-2xl font-bold mb-6 sm:mb-8 text-gray-900 text-center sm:text-left">
          의료기관 찾기
        </h2>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <FilterBar filters={filters} onFilterChange={handleFilterChange} />

            {/* 검색 결과 및 다운로드 영역 - 모바일 최적화 */}
            <div className="my-6 space-y-4">
              {/* 검색 결과 정보 */}
              <div className="text-sm font-medium text-gray-500">
                {isLoading && !isFetching ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>데이터를 불러오는 중...</span>
                  </div>
                ) : error ? (
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 text-red-600">
                    <span>❌ 데이터 조회 실패</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRetry}
                      className="w-fit"
                    >
                      다시 시도
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    {isFetching && (
                      <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                    )}
                    <span className="text-center sm:text-left">
                      총{" "}
                      <span className="text-[#1B59FA] font-bold text-base">
                        {totalCount.toLocaleString()}
                      </span>
                      건의 의료기관이 검색되었습니다.
                    </span>
                  </div>
                )}
              </div>

              {/* 다운로드 버튼들 - 모바일에서는 풀 너비 스택 */}
              {!isLoading && !error && (
                <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
                  <Button
                    variant="outline"
                    className="flex items-center justify-center gap-2 h-11 w-full sm:w-auto"
                    onClick={handleExportExcel}
                  >
                    <FileSpreadsheet className="h-4 w-4" />
                    <span>Excel 다운로드</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="flex items-center justify-center gap-2 h-11 w-full sm:w-auto"
                    onClick={handleExportPDF}
                  >
                    <FileText className="h-4 w-4" />
                    <span>PDF 다운로드</span>
                  </Button>
                </div>
              )}
            </div>

            {error ? (
              <div className="text-center py-12">
                <div className="text-red-600 mb-4">
                  <p className="text-lg font-semibold">
                    데이터를 불러올 수 없습니다
                  </p>
                  <p className="text-sm">
                    {error instanceof Error
                      ? error.message
                      : "오류가 발생했습니다"}
                  </p>
                </div>
                <Button onClick={handleRetry} variant="outline">
                  다시 시도
                </Button>
              </div>
            ) : (
              <DataTable
                data={currentData}
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                isLoading={isLoading || isFetching}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
