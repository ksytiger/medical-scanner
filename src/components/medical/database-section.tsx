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
 * 
 * @dependencies
 * - @/lib/medical/api: Supabase 데이터 조회 함수들
 */

"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import FilterBar from "@/components/medical/filter-bar"
import DataTable from "@/components/medical/data-table"
import { FileSpreadsheet, FileText, Loader2 } from "lucide-react"
import { getMedicalFacilities, getMedicalFacilitiesWithSubjectFilter } from "@/lib/medical/api"
import type { HospitalData, FilterState } from "@/lib/medical/types"

export default function DatabaseSection() {
  const [filteredData, setFilteredData] = useState<HospitalData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [filters, setFilters] = useState<FilterState>({
    dateRange: { from: new Date("1900-01-01"), to: new Date() },
    specialties: [],
    region: { sido: "", gugun: "" },
    hasContact: false,
    keyword: "",
  })

  const itemsPerPage = 50
  const totalPages = Math.ceil(filteredData.length / itemsPerPage)
  const currentData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  // 데이터 로딩 함수
  const loadData = useCallback(async (currentFilters: FilterState) => {
    console.group("🔄 Loading medical facilities data")
    console.log("Applied filters:", currentFilters)
    
    setIsLoading(true)
    setError(null)
    
    try {
      // 진료과목 필터가 있으면 전용 API 사용, 없으면 기존 API 사용
      const hasSpecialtyFilter = currentFilters.specialties && currentFilters.specialties.length > 0
      console.log("🏷️ Has specialty filter:", hasSpecialtyFilter)
      
      const data = hasSpecialtyFilter 
        ? await getMedicalFacilitiesWithSubjectFilter(currentFilters)
        : await getMedicalFacilities(currentFilters)
        
      console.log(`✅ Successfully loaded ${data.length} facilities using ${hasSpecialtyFilter ? 'subject filter' : 'standard'} API`)
      setFilteredData(data)
      setCurrentPage(1) // 새 데이터 로드 시 첫 페이지로 이동
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "데이터 조회에 실패했습니다."
      console.error("❌ Failed to load data:", errorMessage)
      setError(errorMessage)
      setFilteredData([])
    } finally {
      setIsLoading(false)
      console.groupEnd()
    }
  }, [])

  // 컴포넌트 마운트 시 초기 데이터 로드
  useEffect(() => {
    console.log("🚀 DatabaseSection mounted, loading initial data")
    loadData(filters)
  }, [loadData, filters])

  const handleFilterChange = (newFilters: FilterState) => {
    console.group("🔍 Filter Change")
    console.log("Previous filters:", filters)
    console.log("New filters:", newFilters)
    
    setFilters(newFilters)
    // loadData는 useEffect에서 filters 변경을 감지하여 자동 실행됩니다
    
    console.groupEnd()
  }

  const handleExportExcel = () => {
    console.log("📄 Excel 다운로드 요청")
    alert("Excel 다운로드 기능이 구현될 예정입니다.")
  }

  const handleExportPDF = () => {
    console.log("📄 PDF 다운로드 요청")
    alert("PDF 다운로드 기능이 구현될 예정입니다.")
  }

  // 에러 재시도 함수
  const handleRetry = () => {
    console.log("🔄 Retrying data load")
    loadData(filters)
  }

  return (
    <section id="database" className="py-12 sm:py-16 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-xl sm:text-2xl font-bold mb-6 sm:mb-8 text-gray-900 text-center sm:text-left">의료기관 찾기</h2>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <FilterBar filters={filters} onFilterChange={handleFilterChange} />

            {/* 검색 결과 및 다운로드 영역 - 모바일 최적화 */}
            <div className="my-6 space-y-4">
              {/* 검색 결과 정보 */}
              <div className="text-sm font-medium text-gray-500">
                {isLoading ? (
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
                  <div className="text-center sm:text-left">
                    총 <span className="text-[#1B59FA] font-bold text-base">{filteredData.length.toLocaleString()}</span>건의
                    의료기관이 검색되었습니다.
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
                  <p className="text-lg font-semibold">데이터를 불러올 수 없습니다</p>
                  <p className="text-sm">{error}</p>
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
                isLoading={isLoading}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  )
}