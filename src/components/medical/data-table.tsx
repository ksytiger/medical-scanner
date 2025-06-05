/**
 * @file data-table.tsx
 * @description 의료기관 데이터 테이블 컴포넌트
 * 
 * 의료기관 데이터를 테이블 형태로 표시하고 페이지네이션을 제공하는 컴포넌트
 * 
 * 수정사항:
 * - table-fixed 레이아웃으로 컬럼 너비 고정
 * - 각 컬럼별 고정 너비 설정
 * - 긴 텍스트에 대한 줄임표 처리
 * - 주소 컬럼 툴팁 기능 추가
 * - 모바일 반응형 레이아웃 개선
 */

"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
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

export default function DataTable({ data, currentPage, totalPages, onPageChange, isLoading = false }: DataTableProps) {
  return (
    <TooltipProvider>
      <div>
        <div className="rounded-md border overflow-hidden">
          <div className="overflow-x-auto">
            <Table className="table-fixed w-full min-w-[600px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[90px] min-w-[90px] text-center">분류</TableHead>
                  <TableHead className="w-[140px] min-w-[140px]">병의원명</TableHead>
                  <TableHead className="hidden md:table-cell w-[280px] min-w-[280px]">주소</TableHead>
                  <TableHead className="hidden md:table-cell w-[130px] min-w-[130px]">연락처</TableHead>
                  <TableHead className="w-[110px] min-w-[110px] text-center">개원일</TableHead>
                  <TableHead className="hidden md:table-cell w-[110px] min-w-[110px] text-center">전문의 수</TableHead>
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
                      <TableCell className="hidden md:table-cell text-[#1B59FA] font-medium">
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
                      <TableCell className="hidden md:table-cell">
                        <div className="truncate" title={hospital.phone || "-"}>
                          {hospital.phone || "-"}
                        </div>
                      </TableCell>
                      <TableCell className="text-center text-sm">
                        {format(new Date(hospital.openDate), "yyyy-MM-dd")}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-center">
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

        {!isLoading && data.length > 0 && totalPages > 1 && (
          <div className="flex items-center justify-center space-x-2 py-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum = i + 1

              // Adjust page numbers if current page is near the end
              if (currentPage > 3 && totalPages > 5) {
                pageNum = Math.min(currentPage - 2 + i, totalPages)
                if (pageNum > totalPages - 4 && i < 4) {
                  pageNum = totalPages - 4 + i
                }
              }

              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? "default" : "outline"}
                  className={`min-w-[40px] w-10 h-9 p-0 flex items-center justify-center ${currentPage === pageNum ? "bg-[#1B59FA] hover:bg-blue-700" : ""}`}
                  onClick={() => onPageChange(pageNum)}
                >
                  {pageNum}
                </Button>
              )
            })}
            <Button
              variant="outline"
              size="icon"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </TooltipProvider>
  )
} 