/**
 * @file data-table.tsx
 * @description 의료기관 데이터 테이블 컴포넌트
 * 
 * 의료기관 데이터를 테이블 형태로 표시하고 페이지네이션을 제공하는 컴포넌트
 */

"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import type { HospitalData } from "@/lib/medical/types"
import { format } from "date-fns"

interface DataTableProps {
  data: HospitalData[]
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

export default function DataTable({ data, currentPage, totalPages, onPageChange }: DataTableProps) {
  return (
    <div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">분류</TableHead>
              <TableHead>병의원명</TableHead>
              <TableHead className="hidden md:table-cell">주소</TableHead>
              <TableHead className="hidden md:table-cell">연락처</TableHead>
              <TableHead>개원일</TableHead>
              <TableHead className="hidden md:table-cell">전문의 수</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length > 0 ? (
              data.map((hospital) => (
                <TableRow key={hospital.id}>
                  <TableCell className="font-medium">
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
                  </TableCell>
                  <TableCell>{hospital.name}</TableCell>
                  <TableCell className="hidden md:table-cell text-[#1B59FA] font-medium">{hospital.address}</TableCell>
                  <TableCell className="hidden md:table-cell">{hospital.phone || "-"}</TableCell>
                  <TableCell>{format(new Date(hospital.openDate), "yyyy-MM-dd")}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    {hospital.specialistCount ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
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

      {data.length > 0 && (
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
                className={currentPage === pageNum ? "bg-[#1B59FA] hover:bg-blue-700" : ""}
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
  )
} 