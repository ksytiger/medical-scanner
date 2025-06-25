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

"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  MapPin,
  Phone,
  Calendar,
} from "lucide-react";
import type { HospitalData } from "@/lib/medical/types";
import { format } from "date-fns";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { differenceInDays } from "date-fns";
import { Badge } from "@/components/ui/badge";

interface DataTableProps {
  data: HospitalData[];
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
}

// 모바일 카드 컴포넌트
function MobileCard({ hospital }: { hospital: HospitalData }) {
  return (
    <Card className="mb-2 border border-gray-200 bg-white shadow-sm hover:shadow-lg hover:border-[#1B59FA]/30 transition-all duration-200 overflow-hidden">
      <CardContent className="p-4">
        {/* 상단 헤더 영역 */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-[17px] text-gray-900 leading-tight">
              {hospital.name}
            </h3>
          </div>
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-[12px] font-medium flex-shrink-0 ${
              hospital.category === "의원"
                ? "bg-blue-50 text-blue-700"
                : hospital.category === "병원"
                  ? "bg-emerald-50 text-emerald-700"
                  : hospital.category === "약국"
                    ? "bg-amber-50 text-amber-700"
                    : "bg-gray-50 text-gray-700"
            }`}
          >
            {hospital.category}
          </span>
        </div>

        {/* 정보 영역 - 세로 배치 */}
        <div className="space-y-2.5">
          {/* 주소 - 전체 표시, 최소 높이 설정 */}
          <div className="bg-gray-50 rounded-lg p-3 min-h-[60px] flex items-center">
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-[#1B59FA] mt-0.5 flex-shrink-0" />
              <span className="text-[14px] text-gray-700 leading-relaxed">
                {hospital.address}
              </span>
            </div>
          </div>

          {/* 개원일 */}
          <div className="flex items-center gap-3 py-1">
            <Calendar className="h-4 w-4 text-[#1B59FA] flex-shrink-0" />
            <span className="text-[13px] text-gray-500 font-medium min-w-[50px]">
              개원일
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[14px] text-gray-800 font-medium">
                {format(new Date(hospital.openDate), "yyyy년 MM월 dd일")}
              </span>
              {isNewFacility(hospital.openDate) && (
                <Badge className="bg-red-500 hover:bg-red-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold shadow-md animate-pulse">
                  NEW
                </Badge>
              )}
            </div>
          </div>

          {/* 연락처 */}
          <div className="flex items-center gap-3 py-1">
            <Phone className="h-4 w-4 text-[#1B59FA] flex-shrink-0" />
            <span className="text-[13px] text-gray-500 font-medium min-w-[50px]">
              연락처
            </span>
            <span
              className={`text-[14px] ${hospital.phone ? "text-gray-800" : "text-gray-400"}`}
            >
              {hospital.phone || "정보 없음"}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// 개원일이 최근 3일 이내인지 확인하는 함수
function isNewFacility(openDate: string): boolean {
  const today = new Date();
  const facilityOpenDate = new Date(openDate);
  const daysDifference = differenceInDays(today, facilityOpenDate);
  return daysDifference >= 0 && daysDifference <= 3;
}

export default function DataTable({
  data,
  currentPage,
  totalPages,
  onPageChange,
  isLoading = false,
}: DataTableProps) {
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
            <div>
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
                    <TableHead className="w-[90px] min-w-[90px] text-center">
                      분류
                    </TableHead>
                    <TableHead className="w-[140px] min-w-[140px]">
                      병의원명
                    </TableHead>
                    <TableHead className="w-[400px] min-w-[400px]">
                      주소
                    </TableHead>
                    <TableHead className="w-[130px] min-w-[130px]">
                      연락처
                    </TableHead>
                    <TableHead className="w-[110px] min-w-[110px] text-center">
                      개원일
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="h-5 w-5 animate-spin text-[#1B59FA]" />
                          <span className="text-gray-500">
                            데이터를 불러오는 중...
                          </span>
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
                            <TooltipContent
                              side="top"
                              className="max-w-[300px] whitespace-normal"
                            >
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
                            <TooltipContent
                              side="top"
                              className="max-w-[500px] whitespace-normal"
                            >
                              <p>{hospital.address}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                          <div
                            className="truncate"
                            title={hospital.phone || "-"}
                          >
                            {hospital.phone || "-"}
                          </div>
                        </TableCell>
                        <TableCell className="text-center text-sm">
                          <div className="flex items-center justify-center gap-2">
                            <span>
                              {format(
                                new Date(hospital.openDate),
                                "yyyy-MM-dd",
                              )}
                            </span>
                            {isNewFacility(hospital.openDate) && (
                              <Badge className="bg-red-500 hover:bg-red-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold shadow-md animate-pulse">
                                NEW
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
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

            {/* 페이지 번호 버튼들 - 항상 5개 페이지 표시 */}
            <div className="flex space-x-2">
              {(() => {
                const getPageNumbers = () => {
                  const maxVisiblePages = 5; // 표시할 최대 페이지 수
                  const range = [];

                  if (totalPages <= maxVisiblePages) {
                    // 총 페이지가 5개 이하면 모든 페이지 표시
                    for (let i = 1; i <= totalPages; i++) {
                      range.push(i);
                    }
                  } else {
                    // 총 페이지가 5개 초과일 때
                    let start = Math.max(1, currentPage - 2);
                    const end = Math.min(
                      totalPages,
                      start + maxVisiblePages - 1,
                    );

                    // 끝부분에서 5개를 채우지 못할 때 시작점 조정
                    if (end - start + 1 < maxVisiblePages) {
                      start = Math.max(1, end - maxVisiblePages + 1);
                    }

                    // 페이지 번호 배열 생성
                    for (let i = start; i <= end; i++) {
                      range.push(i);
                    }
                  }

                  return range;
                };

                return getPageNumbers().map((pageNum) => (
                  <Button
                    key={`page-${pageNum}`}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    className={`min-w-[40px] w-10 h-10 p-0 flex items-center justify-center ${
                      currentPage === pageNum
                        ? "bg-[#1B59FA] hover:bg-blue-700"
                        : ""
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
  );
}
