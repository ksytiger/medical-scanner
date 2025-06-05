"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import FilterBar from "@/components/filter-bar"
import DataTable from "@/components/data-table"
import { FileSpreadsheet, FileText } from "lucide-react"
import { mockHospitalData } from "@/lib/mock-data"
import type { HospitalData, FilterState } from "@/lib/types"

export default function DatabaseSection() {
  const [filteredData, setFilteredData] = useState<HospitalData[]>(mockHospitalData)
  const [currentPage, setCurrentPage] = useState(1)
  const [filters, setFilters] = useState<FilterState>({
    dateRange: { from: new Date("2023-01-01"), to: new Date() },
    specialties: [],
    region: { sido: "", gugun: "" },
    hasContact: false,
    keyword: "",
  })

  const itemsPerPage = 50
  const totalPages = Math.ceil(filteredData.length / itemsPerPage)
  const currentData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters)

    // Apply filters to data
    const results = mockHospitalData.filter((hospital) => {
      const openDate = new Date(hospital.openDate)
      const fromDate = newFilters.dateRange.from
      const toDate = newFilters.dateRange.to

      // Date range filter
      if (openDate < fromDate || openDate > toDate) return false

      // Specialty filter
      if (newFilters.specialties.length > 0 && !newFilters.specialties.includes(hospital.category)) return false

      // Region filter
      if (newFilters.region.sido && hospital.sido !== newFilters.region.sido) return false
      if (newFilters.region.gugun && hospital.gugun !== newFilters.region.gugun) return false

      // Contact filter
      if (newFilters.hasContact && !hospital.phone) return false

      // Keyword filter
      if (newFilters.keyword && !hospital.name.includes(newFilters.keyword)) return false

      return true
    })

    setFilteredData(results)
    setCurrentPage(1)
  }

  const handleExportExcel = () => {
    alert("Excel 다운로드 기능이 구현될 예정입니다.")
  }

  const handleExportPDF = () => {
    alert("PDF 다운로드 기능이 구현될 예정입니다.")
  }

  return (
    <section id="database" className="py-12 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl font-bold mb-6 text-gray-900">의료기관 찾기</h2>

        <Card>
          <CardContent className="p-6">
            <FilterBar filters={filters} onFilterChange={handleFilterChange} />

            <div className="flex items-center justify-between my-4">
              <div className="text-sm font-medium text-gray-500">
                총 <span className="text-[#1B59FA] font-bold">{filteredData.length.toLocaleString()}</span>건의
                의료기관이 검색되었습니다.
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex items-center gap-2" onClick={handleExportExcel}>
                  <FileSpreadsheet className="h-4 w-4" />
                  <span>Excel 다운로드</span>
                </Button>
                <Button variant="outline" className="flex items-center gap-2" onClick={handleExportPDF}>
                  <FileText className="h-4 w-4" />
                  <span>PDF 다운로드</span>
                </Button>
              </div>
            </div>

            <DataTable
              data={currentData}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
