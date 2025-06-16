/**
 * @file data-table.tsx
 * @description 의료기관 데이터 테이블 컴포넌트
 * 
 * 의료기관 데이터를 반응형으로 표시하는 컴포넌트
 * - 모바일: 카드 레이아웃으로 가독성 향상
 * - 데스크톱: 테이블 레이아웃으로 정보 밀도 최적화
 * 
 * 개선사항:
 * - 모바일 우선 반응형 디자인
 * - 터치 친화적인 인터페이스
 * - 가독성 향상을 위한 카드 레이아웃
 * - 페이지네이션 모바일 최적화
 */

"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ChevronLeft, ChevronRight, Loader2, MapPin, Phone, Calendar, Users } from "lucide-react"
import type { HospitalData } from "@/lib/medical/types"
import { format } from "date-fns"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface DataTableProps {
  data: HospitalData[]
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  isLoading?: boolean
}

// 모바일 카드 컴포넌트
function MobileCard({ hospital }: { hospital: HospitalData }) {
  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg text-gray-900 mb-1 break-words">
              {hospital.name}
            </h3>
            <span
              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                hospital.category === "의원"
                  ? "bg-blue-100 text-[#1B59FA]"
                  : hospital.category === "병원"
                    ? "bg-green-100 text-green-700"
                    : hospital.category === "약국"
                      ? "bg-orange-100 text-orange-700"
                      : "bg-gray-100 text-gray-700"
              }`}
            >
              {hospital.category}
            </span>
          </div>
        </div>

        <div className="space-y-3">
          {/* 주소 - 메인 컬러와 볼드체로 강조 */}
          <div className="flex items-start gap-3">
            <MapPin className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
            <span className="text-sm text-[#1B59FA] font-bold break-words">{hospital.address}</span>
          </div>

          {/* 개원일 */}
          <div className="flex items-center gap-3">
            <Calendar className="h-4 w-4 text-gray-500 flex-shrink-0" />
            <span className="text-sm text-gray-700">
              개원일: {format(new Date(hospital.openDate), "yyyy-MM-dd")}
            </span>
          </div>

          {/* 연락처 - 이모지는 항상 표시, 데이터 없으면 "-" 표시 */}
          <div className="flex items-center gap-3">
            <Phone className="h-4 w-4 text-gray-500 flex-shrink-0" />
            <span className="text-sm text-gray-700">
              {hospital.phone || "-"}
            </span>
          </div>

          {/* 전문의 수 - 이모지는 항상 표시, 데이터 없으면 "-" 표시 */}
          <div className="flex items-center gap-3">
            <Users className="h-4 w-4 text-gray-500 flex-shrink-0" />
            <span className="text-sm text-gray-700">
              {hospital.specialistCount ? `전문의 ${hospital.specialistCount}명` : "-"}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function DataTable({ data, currentPage, totalPages, onPageChange, isLoading = false }: DataTableProps) {
  return (
    <TooltipProvider>
      <div>
        {/* 모바일 카드 레이아웃 */}
        <div className="block lg:hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin text-[#1B59FA]" />
                <span className="text-gray-500">데이터를 불러오는 중...</span>
              </div>
            </div>
          ) : data.length > 0 ? (
            <div className="space-y-0">
              {data.map((hospital) => (
                <MobileCard key={hospital.id} hospital={hospital} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">검색 결과가 없습니다.</p>
            </div>
          )}
        </div>

        {/* 데스크톱 테이블 레이아웃 */}
        <div className="hidden lg:block">
          <div className="rounded-md border overflow-hidden">
            <div className="overflow-x-auto">
              <Table className="table-fixed w-full min-w-[600px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[90px] min-w-[90px] text-center">분류</TableHead>
                    <TableHead className="w-[140px] min-w-[140px]">병의원명</TableHead>
                    <TableHead className="w-[280px] min-w-[280px]">주소</TableHead>
                    <TableHead className="w-[130px] min-w-[130px]">연락처</TableHead>
                    <TableHead className="w-[110px] min-w-[110px] text-center">개원일</TableHead>
                    <TableHead className="w-[110px] min-w-[110px] text-center">전문의 수</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="h-5 w-5 animate-spin text-[#1B59FA]" />
                          <span className="text-gray-500">데이터를 불러오는 중...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : data.length > 0 ? (
                    data.map((hospital) => (
                      <TableRow key={hospital.id}>
                        <TableCell className="text-center">
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                              hospital.category === "의원"
                                ? "bg-blue-100 text-[#1B59FA]"
                                : hospital.category === "병원"
                                  ? "bg-green-100 text-green-700"
                                  : hospital.category === "약국"
                                    ? "bg-orange-100 text-orange-700"
                                    : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {hospital.category}
                          </span>
                        </TableCell>
                        <TableCell className="font-medium">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="truncate cursor-help">
                                {hospital.name}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-[300px] whitespace-normal">
                              <p>{hospital.name}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TableCell>
                        <TableCell className="text-[#1B59FA] font-medium">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="truncate cursor-help">
                                {hospital.address}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-[400px] whitespace-normal">
                              <p>{hospital.address}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                          <div className="truncate" title={hospital.phone || "-"}>
                            {hospital.phone || "-"}
                          </div>
                        </TableCell>
                        <TableCell className="text-center text-sm">
                          {format(new Date(hospital.openDate), "yyyy-MM-dd")}
                        </TableCell>
                        <TableCell className="text-center">
                          {hospital.specialistCount ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 whitespace-nowrap">
                              {hospital.specialistCount}명
                            </span>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        검색 결과가 없습니다.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>

        {/* 페이지네이션 */}
        {!isLoading && data.length > 0 && totalPages > 1 && (
          <div className="flex items-center justify-center space-x-2 py-6">
            <Button
              variant="outline"
              size="icon"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="h-10 w-10"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            {/* 페이지 번호 버튼들 - 모바일에서는 더 적게 표시 */}
            <div className="flex space-x-2">
              {(() => {
                const getPageNumbers = () => {
                  const delta = 2; // 현재 페이지 양쪽으로 보여줄 페이지 수
                  const range = [];
                  const rangeWithDots = [];

                  // 시작과 끝 페이지 계산
                  const start = Math.max(1, currentPage - delta);
                  const end = Math.min(totalPages, currentPage + delta);

                  // 페이지 번호 배열 생성
                  for (let i = start; i <= end; i++) {
                    range.push(i);
                  }

                  // 최대 5개만 표시하도록 제한
                  return range.slice(0, 5);
                };

                return getPageNumbers().map((pageNum) => (
                  <Button
                    key={`page-${pageNum}`}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    className={`min-w-[40px] w-10 h-10 p-0 flex items-center justify-center ${
                      currentPage === pageNum ? "bg-[#1B59FA] hover:bg-blue-700" : ""
                    }`}
                    onClick={() => onPageChange(pageNum)}
                  >
                    {pageNum}
                  </Button>
                ));
              })()}
            </div>
            
            <Button
              variant="outline"
              size="icon"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="h-10 w-10"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </TooltipProvider>
  )
} 